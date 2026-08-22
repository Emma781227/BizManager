import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { initiatePayment } from "@/lib/geniuspay";
import { checkRateLimit, getClientIp, logAbuse } from "@/lib/ratelimit";
import { sendNewOrderNotification, sendStockZeroNotifications, sendLowStockNotification, LOW_STOCK_THRESHOLD } from "@/lib/notifications";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

const paySchema = z.object({
  customerName:    z.string().min(2).max(100),
  customerPhone:   z.string().min(8).max(20),
  customerEmail:   z.string().email("Email invalide").max(200),
  customerAddress: z.string().max(300).optional(),
  notes:           z.string().max(500).optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variantId: z.string().optional(),
      quantity:  z.number().int().min(1).max(100),
    }),
  ).min(1),
});

export async function POST(request: NextRequest, context: RouteParams) {
  const { slug } = await context.params;
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") ?? undefined;

  const rl1 = checkRateLimit(`pay:ip:${ip}:min`, 3, 60_000);
  if (!rl1.allowed) {
    logAbuse({ ip, slug, reason: "rate_limit_pay_min", ua });
    return NextResponse.json({ error: "Trop de tentatives. Veuillez patienter." }, { status: 429 });
  }

  const rl2 = checkRateLimit(`pay:ip:${ip}:hour`, 10, 3_600_000);
  if (!rl2.allowed) {
    logAbuse({ ip, slug, reason: "rate_limit_pay_hour", ua });
    return NextResponse.json({ error: "Limite horaire atteinte. Veuillez réessayer dans une heure." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);

  if (body && typeof body._hp === "string" && body._hp.length > 0) {
    logAbuse({ ip, slug, reason: "honeypot_pay", ua });
    return NextResponse.json({ data: { checkoutUrl: "", txId: "", orderId: "" } });
  }

  const result = paySchema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    return NextResponse.json({ error: `${first?.path?.join(".") ?? "payload"}: ${first?.message ?? "Données invalides"}` }, { status: 400 });
  }

  const { customerName, customerPhone, customerEmail, customerAddress, notes, items } = result.data;

  const dedupKey = `pay:dedup:${slug}:${customerPhone.replace(/\D/g, "")}`;
  const dedup = checkRateLimit(dedupKey, 1, 60_000);
  if (!dedup.allowed) {
    return NextResponse.json({ error: "Un paiement similaire vient d'être initié. Veuillez patienter." }, { status: 429 });
  }

  // Resolve shop
  let shop = await prisma.shop.findUnique({
    where: { slug: slug.toLowerCase() },
    select: { id: true, name: true, isPublished: true, status: true, whatsappNumber: true, notificationEmail: true },
  });

  if (!shop || !shop.isPublished) {
    const alt = await prisma.shop.findUnique({
      where: { slug: `${slug}a`.toLowerCase() },
      select: { id: true, name: true, isPublished: true, status: true, whatsappNumber: true, notificationEmail: true },
    });
    if (alt?.isPublished) shop = alt;
    else return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
  }

  if (shop.status !== "active") {
    return NextResponse.json({ error: "Cette boutique n'accepte pas de commandes pour le moment." }, { status: 403 });
  }

  const productIds = items.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId: shop.id, isActive: true },
    select: {
      id: true, name: true, unitPrice: true, stock: true, hasVariants: true,
      variants: { select: { id: true, label: true, stock: true, priceOverride: true } },
    },
  });

  type ResolvedItem = { productId: string; variantId?: string; variantLabel?: string; quantity: number; unitPrice: number };
  const resolvedItems: ResolvedItem[] = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) return NextResponse.json({ error: `Produit introuvable : ${item.productId}` }, { status: 404 });

    if (product.hasVariants) {
      if (!item.variantId) return NextResponse.json({ error: `Veuillez sélectionner une variante pour "${product.name}"` }, { status: 400 });
      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) return NextResponse.json({ error: `Variante introuvable pour "${product.name}"` }, { status: 404 });
      if (variant.stock < item.quantity) return NextResponse.json({ error: `Stock insuffisant pour "${product.name} (${variant.label})".` }, { status: 409 });
      const unitPrice = variant.priceOverride != null ? Number(variant.priceOverride) : Number(product.unitPrice);
      resolvedItems.push({ productId: item.productId, variantId: variant.id, variantLabel: variant.label, quantity: item.quantity, unitPrice });
    } else {
      if (product.stock < item.quantity) return NextResponse.json({ error: `Stock insuffisant pour "${product.name}".` }, { status: 409 });
      resolvedItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: Number(product.unitPrice) });
    }
  }

  let totalAmount = 0;
  for (const item of resolvedItems) totalAmount += item.unitPrice * item.quantity;

  let orderId = "";
  let txId    = "";

  try {
    const created = await prisma.$transaction(async (tx) => {
      for (const item of resolvedItems) {
        const product = products.find(p => p.id === item.productId)!;
        if (item.variantId) {
          const dec = await tx.productVariant.updateMany({ where: { id: item.variantId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
          if (dec.count === 0) throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        } else {
          const dec = await tx.product.updateMany({ where: { id: product.id, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
          if (dec.count === 0) throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }
      }

      const existing = await tx.customer.findFirst({ where: { shopId: shop.id, phone: customerPhone }, select: { id: true } });
      const customer = existing
        ? await tx.customer.update({ where: { id: existing.id }, data: { fullName: customerName, email: customerEmail, address: customerAddress ?? undefined }, select: { id: true } })
        : await tx.customer.create({ data: { shopId: shop.id, fullName: customerName, phone: customerPhone, email: customerEmail, address: customerAddress ?? null }, select: { id: true } });

      const order = await tx.order.create({
        data: {
          shopId: shop.id,
          customerId: customer.id,
          channel: "online",
          status: "new",
          paymentStatus: "unpaid",
          paymentMethod: "online",
          totalAmount: String(totalAmount),
          paidAmount: "0",
          notes: notes ?? null,
          items: {
            create: resolvedItems.map(item => ({
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

      const orderTx = await tx.orderPaymentTransaction.create({
        data: { orderId: order.id, shopId: shop.id, amount: String(totalAmount), currency: "XOF", status: "pending" },
        select: { id: true },
      });

      return { order, orderTx };
    });

    orderId = created.order.id;
    txId    = created.orderTx.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("INSUFFICIENT_STOCK:")) {
      return NextResponse.json({ error: `Stock insuffisant pour "${msg.split(":")[1]}". Le stock vient de changer.` }, { status: 409 });
    }
    return NextResponse.json({ error: "Impossible de créer la commande" }, { status: 500 });
  }

  // Initiate GeniusPay payment
  const origin      = new URL(request.url).origin;
  const statusBase  = `${origin}/shop/${slug}/payment-status?txId=${txId}`;

  let checkoutUrl = "";
  try {
    const payment = await initiatePayment({
      amount:      totalAmount,
      currency:    "XOF",
      description: `Commande ${shop.name} · ${resolvedItems.length} article(s)`,
      customer:    { name: customerName, email: customerEmail, phone: customerPhone },
      successUrl:  `${statusBase}&result=success`,
      errorUrl:    `${statusBase}&result=error`,
      metadata:    { type: "order", orderTransactionId: txId, orderId, shopSlug: slug },
    });
    checkoutUrl = payment.checkoutUrl;

    await prisma.orderPaymentTransaction.update({
      where: { id: txId },
      data: { providerReference: payment.providerReference || null, providerPaymentId: payment.providerPaymentId || null, checkoutUrl },
    });
  } catch (err) {
    await prisma.orderPaymentTransaction.update({ where: { id: txId }, data: { status: "failed" } }).catch(() => null);
    const msg = err instanceof Error ? err.message : "Erreur GeniusPay";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Notifications async
  for (const item of resolvedItems) {
    const product = products.find(p => p.id === item.productId)!;
    if (!item.variantId) {
      const remaining = product.stock - item.quantity;
      if (remaining === 0) void sendStockZeroNotifications({ shopName: shop.name, productName: product.name, productId: product.id, merchantPhone: shop.whatsappNumber, merchantEmail: shop.notificationEmail });
      else if (remaining <= LOW_STOCK_THRESHOLD) void sendLowStockNotification({ shopName: shop.name, merchantEmail: shop.notificationEmail, productName: product.name, productId: product.id, remainingStock: remaining });
    }
  }

  void sendNewOrderNotification({
    shopName: shop.name, merchantEmail: shop.notificationEmail, orderId,
    customerName, customerPhone, address: customerAddress ?? null, note: notes ?? null,
    items: resolvedItems.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      return { productName: item.variantLabel ? `${product.name} (${item.variantLabel})` : product.name, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.unitPrice * item.quantity };
    }),
    totalAmount,
  });

  return NextResponse.json({ data: { checkoutUrl, txId, orderId } }, { status: 201 });
}
