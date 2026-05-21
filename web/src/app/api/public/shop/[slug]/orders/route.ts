import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
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

  const body = await request.json().catch(() => null);
  const result = publicOrderSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue?.path?.join(".") ?? "payload";
    const message = firstIssue?.message ?? "Données invalides";
    return NextResponse.json({ error: `${path}: ${message}` }, { status: 400 });
  }

  let shop = await prisma.shop.findUnique({
    where: { slug: slug.toLowerCase() },
    select: {
      id: true,
      name: true,
      isPublished: true,
      whatsappNumber: true,
      notificationEmail: true,
    },
  });

  if (!shop || !shop.isPublished) {
    const altSlug = `${slug}a`.toLowerCase();
    const alt = await prisma.shop.findUnique({
      where: { slug: altSlug },
      select: { id: true, name: true, isPublished: true, whatsappNumber: true, notificationEmail: true },
    });
    if (alt && alt.isPublished) {
      shop = alt;
    } else {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }
  }

  const { customerName, customerPhone, customerAddress, paymentMethod, notes, items } = result.data;

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
    },
  });

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Produit introuvable : ${item.productId}` },
        { status: 404 },
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        {
          error: `Stock insuffisant pour "${product.name}". Disponible : ${product.stock}, demandé : ${item.quantity}`,
        },
        { status: 409 },
      );
    }
  }

  let totalAmount = 0;
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)!;
    totalAmount += Number(product.unitPrice) * item.quantity;
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        const decremented = await tx.product.updateMany({
          where: {
            id: product.id,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });
        if (decremented.count === 0) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
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
            create: items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              const unitPrice = Number(product.unitPrice);
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: String(unitPrice),
                lineTotal: String(unitPrice * item.quantity),
              };
            }),
          },
        },
        select: { id: true },
      });

      return createdOrder;
    });

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!;
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

    void sendNewOrderNotification({
      shopName:      shop.name,
      merchantEmail: shop.notificationEmail,
      orderId:       order.id,
      customerName,
      customerPhone,
      address:       customerAddress ?? null,
      note:          notes ?? null,
      items: items.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        const unitPrice = Number(product.unitPrice);
        return {
          productName: product.name,
          quantity:    item.quantity,
          unitPrice,
          lineTotal:   unitPrice * item.quantity,
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
