import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, getClientIp, logAbuse } from "@/lib/ratelimit";
import { sendNewOrderNotification, sendStockZeroNotifications, sendLowStockNotification, LOW_STOCK_THRESHOLD } from "@/lib/notifications";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

const publicOrderSchema = z.object({
  customerName: z.string().min(2, "Nom trop court").max(100, "Nom trop long"),
  customerPhone: z.string().min(8, "Numéro trop court").max(20, "Numéro trop long"),
  customerAddress: z.string().max(300, "Adresse trop longue").optional(),
  paymentMethod: z.enum(["cash", "mobile_money", "bank_transfer", "cod"], {
    message: "Mode de paiement invalide",
  }),
  notes: z.string().max(500, "Note trop longue").optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Identifiant produit requis"),
        variantId: z.string().optional(),
        quantity: z
          .number()
          .int("La quantité doit être un entier")
          .min(1, "Quantité minimale : 1")
          .max(100, "Quantité maximale : 100"),
      }),
    )
    .min(1, "Au moins un article est requis"),
});

export async function POST(request: NextRequest, context: RouteParams) {
  const { slug } = await context.params;
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") ?? undefined;

  // 1. Rate limit: 3 req/min by IP (burst protection)
  const rl1 = checkRateLimit(`order:ip:${ip}:min`, 3, 60_000);
  if (!rl1.allowed) {
    logAbuse({ ip, slug, reason: "rate_limit_ip_min", ua });
    return NextResponse.json(
      { error: "Trop de tentatives. Veuillez patienter avant de réessayer." },
      { status: 429, headers: { "Retry-After": String(rl1.retryAfter) } },
    );
  }

  // 2. Rate limit: 10 req/hour by IP
  const rl2 = checkRateLimit(`order:ip:${ip}:hour`, 10, 3_600_000);
  if (!rl2.allowed) {
    logAbuse({ ip, slug, reason: "rate_limit_ip_hour", ua });
    return NextResponse.json(
      { error: "Limite horaire atteinte. Veuillez réessayer dans une heure." },
      { status: 429, headers: { "Retry-After": String(rl2.retryAfter) } },
    );
  }

  // 3. Rate limit: 5 req/hour by IP+shop
  const rl3 = checkRateLimit(`order:ip:${ip}:shop:${slug}`, 5, 3_600_000);
  if (!rl3.allowed) {
    logAbuse({ ip, slug, reason: "rate_limit_ip_shop_hour", ua });
    return NextResponse.json(
      { error: "Limite atteinte pour cette boutique. Veuillez réessayer plus tard." },
      { status: 429, headers: { "Retry-After": String(rl3.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);

  // 4. Honeypot check - bots fill hidden fields, humans don't
  if (body && typeof body._hp === "string" && body._hp.length > 0) {
    logAbuse({ ip, slug, reason: "honeypot_triggered", ua });
    // Fake success to avoid tipping off bots
    return NextResponse.json(
      { data: { orderId: "00000000", totalAmount: 0, shopName: "", whatsappNumber: null } },
      { status: 200 },
    );
  }

  // 5. Validate payload
  const result = publicOrderSchema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue?.path?.join(".") ?? "payload";
    const message = firstIssue?.message ?? "Données invalides";
    return NextResponse.json({ error: `${path}: ${message}` }, { status: 400 });
  }

  const { customerName, customerPhone, customerAddress, paymentMethod, notes, items } = result.data;

  // 6. Anti double-submit: same phone + shop within 30s
  const dedupKey = `order:dedup:${slug}:${customerPhone.replace(/\D/g, "")}`;
  const dedup = checkRateLimit(dedupKey, 1, 30_000);
  if (!dedup.allowed) {
    return NextResponse.json(
      { error: "Une commande similaire vient d'être envoyée. Veuillez patienter avant de réessayer." },
      { status: 429, headers: { "Retry-After": String(dedup.retryAfter) } },
    );
  }

  // 7. Resolve shop (with altSlug fallback)
  let shop = await prisma.shop.findUnique({
    where: { slug: slug.toLowerCase() },
    select: {
      id: true,
      name: true,
      isPublished: true,
      status: true,
      whatsappNumber: true,
      notificationEmail: true,
    },
  });

  if (!shop || !shop.isPublished) {
    const altSlug = `${slug}a`.toLowerCase();
    const alt = await prisma.shop.findUnique({
      where: { slug: altSlug },
      select: { id: true, name: true, isPublished: true, status: true, whatsappNumber: true, notificationEmail: true },
    });
    if (alt && alt.isPublished) {
      shop = alt;
    } else {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }
  }

  // 8. Check shop is operational
  if (shop.status !== "active") {
    return NextResponse.json(
      { error: "Cette boutique n'accepte pas de commandes pour le moment." },
      { status: 403 },
    );
  }

  const productIds = items.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      shopId: shop.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      unitPrice: true,
      stock: true,
      hasVariants: true,
      variants: { select: { id: true, label: true, stock: true, priceOverride: true } },
    },
  });

  // 9. Validate products, variants, and stock; resolve unit prices
  const resolvedItems: Array<{ productId: string; variantId?: string; variantLabel?: string; quantity: number; unitPrice: number }> = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Produit introuvable : ${item.productId}` },
        { status: 404 },
      );
    }

    if (product.hasVariants) {
      if (!item.variantId) {
        return NextResponse.json(
          { error: `Veuillez sélectionner une variante pour "${product.name}"` },
          { status: 400 },
        );
      }
      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) {
        return NextResponse.json(
          { error: `Variante introuvable pour "${product.name}"` },
          { status: 404 },
        );
      }
      if (variant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour "${product.name} (${variant.label})". Disponible : ${variant.stock}, demandé : ${item.quantity}` },
          { status: 409 },
        );
      }
      const unitPrice = variant.priceOverride != null ? Number(variant.priceOverride) : Number(product.unitPrice);
      resolvedItems.push({ productId: item.productId, variantId: variant.id, variantLabel: variant.label, quantity: item.quantity, unitPrice });
    } else {
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour "${product.name}". Disponible : ${product.stock}, demandé : ${item.quantity}` },
          { status: 409 },
        );
      }
      resolvedItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: Number(product.unitPrice) });
    }
  }

  let totalAmount = 0;
  for (const item of resolvedItems) {
    totalAmount += item.unitPrice * item.quantity;
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const item of resolvedItems) {
        const product = products.find((p) => p.id === item.productId)!;

        if (item.variantId) {
          const decremented = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (decremented.count === 0) throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        } else {
          const decremented = await tx.product.updateMany({
            where: { id: product.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (decremented.count === 0) throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }
      }

      const existingCustomer = await tx.customer.findFirst({
        where: { shopId: shop.id, phone: customerPhone },
        select: { id: true },
      });

      const customer = existingCustomer
        ? await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              fullName: customerName,
              address: customerAddress ?? undefined,
            },
            select: { id: true },
          })
        : await tx.customer.create({
            data: {
              shopId: shop.id,
              fullName: customerName,
              phone: customerPhone,
              address: customerAddress ?? null,
            },
            select: { id: true },
          });

      const createdOrder = await tx.order.create({
        data: {
          shopId: shop.id,
          customerId: customer.id,
          channel: "online",
          status: "new",
          paymentStatus: "unpaid",
          paymentMethod,
          totalAmount: String(totalAmount),
          paidAmount: "0",
          notes: notes ?? null,
          items: {
            create: resolvedItems.map((item) => ({
              productId:    item.productId,
              variantId:    item.variantId ?? null,
              variantLabel: item.variantLabel ?? null,
              quantity:     item.quantity,
              unitPrice:    String(item.unitPrice),
              lineTotal:    String(item.unitPrice * item.quantity),
            })),
          },
        },
        select: { id: true },
      });

      return createdOrder;
    });

    for (const item of resolvedItems) {
      const product = products.find(p => p.id === item.productId)!;
      if (!item.variantId) {
        const remainingStock = product.stock - item.quantity;
        if (remainingStock === 0) {
          void sendStockZeroNotifications({
            shopName:      shop.name,
            productName:   product.name,
            productId:     product.id,
            merchantPhone: shop.whatsappNumber,
            merchantEmail: shop.notificationEmail,
          });
        } else if (remainingStock <= LOW_STOCK_THRESHOLD) {
          void sendLowStockNotification({
            shopName:       shop.name,
            merchantEmail:  shop.notificationEmail,
            productName:    product.name,
            productId:      product.id,
            remainingStock,
          });
        }
      }
    }

    void sendNewOrderNotification({
      shopName:      shop.name,
      merchantEmail: shop.notificationEmail,
      orderId:       order.id,
      customerName,
      customerPhone,
      address:       customerAddress ?? null,
      note:          notes ?? null,
      items: resolvedItems.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        const label = item.variantLabel ? `${product.name} (${item.variantLabel})` : product.name;
        return {
          productName: label,
          quantity:    item.quantity,
          unitPrice:   item.unitPrice,
          lineTotal:   item.unitPrice * item.quantity,
        };
      }),
      totalAmount,
    });

    return NextResponse.json(
      {
        data: {
          orderId: order.id,
          totalAmount,
          shopName: shop.name,
          whatsappNumber: shop.whatsappNumber,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";

    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      const productName = message.split(":")[1] ?? "produit";
      return NextResponse.json(
        { error: `Stock insuffisant pour "${productName}". Le stock vient de changer.` },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Impossible de créer la commande" }, { status: 500 });
  }
}
