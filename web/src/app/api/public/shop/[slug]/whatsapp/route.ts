import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicWhatsAppOrderSchema } from "@/lib/validators";
import { sendStockZeroNotifications } from "@/lib/notifications";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

function formatPhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

export async function POST(request: Request, context: RouteParams) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => null);
  const result = publicWhatsAppOrderSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue?.path?.join(".") ?? "payload";
    const message = firstIssue?.message ?? "Donnees invalides";
    return NextResponse.json({ error: `${path}: ${message}` }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({
    where: { slug: slug.toLowerCase() },
    select: {
      userId: true,
      isPublished: true,
      name: true,
      whatsappNumber: true,
      notificationEmail: true,
    },
  });

  if (!shop || !shop.isPublished) {
    return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
  }

  const phone = formatPhone(shop.whatsappNumber);

  const customerPhone = result.data.customerPhone.trim();
  const customerName = result.data.customerName.trim();
  const address = result.data.address?.trim() || null;
  const note = result.data.note?.trim() || null;

  const quantity = result.data.quantity;

  let orderOutcome:
    | {
        orderId: string;
        productId: string;
        productName: string;
        unitPrice: number;
        total: number;
        remainingStock: number;
      }
    | null = null;

  try {
    orderOutcome = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: result.data.productId,
          userId: shop.userId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          unitPrice: true,
          stock: true,
        },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (product.stock <= 0) {
        throw new Error("OUT_OF_STOCK");
      }

      const decremented = await tx.product.updateMany({
        where: {
          id: product.id,
          stock: { gte: quantity },
        },
        data: {
          stock: { decrement: quantity },
        },
      });

      if (decremented.count === 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const updatedProduct = await tx.product.findUnique({
        where: { id: product.id },
        select: { stock: true },
      });

      const unitPrice = Number(product.unitPrice);
      const total = unitPrice * quantity;

      const existingCustomer = await tx.customer.findFirst({
        where: {
          userId: shop.userId,
          phone: customerPhone,
        },
        select: { id: true },
      });

      const customer = existingCustomer
        ? await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              fullName: customerName,
              address: address ?? undefined,
              notes: note ?? undefined,
            },
            select: { id: true },
          })
        : await tx.customer.create({
            data: {
              userId: shop.userId,
              fullName: customerName,
              phone: customerPhone,
              address,
              notes: note,
            },
            select: { id: true },
          });

      const order = await tx.order.create({
        data: {
          userId: shop.userId,
          customerId: customer.id,
          status: "new",
          paymentStatus: "unpaid",
          paymentMethod: "cod",
          totalAmount: String(total),
          paidAmount: "0",
          items: {
            create: [
              {
                productId: product.id,
                quantity,
                unitPrice: String(unitPrice),
                lineTotal: String(total),
              },
            ],
          },
        },
      });

      return {
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        unitPrice,
        total,
        remainingStock: updatedProduct?.stock ?? 0,
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";

    if (message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    if (message === "OUT_OF_STOCK") {
      return NextResponse.json({ error: "Produit indisponible" }, { status: 409 });
    }

    if (message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Quantite indisponible. Le stock vient de changer." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Impossible de creer la commande" }, { status: 500 });
  }

  if (!orderOutcome) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  if (orderOutcome.remainingStock === 0) {
    void sendStockZeroNotifications({
      shopName: shop.name,
      productName: orderOutcome.productName,
      productId: orderOutcome.productId,
      merchantPhone: shop.whatsappNumber,
      merchantEmail: shop.notificationEmail,
    });
  }

  const messageLines = [
    `Bonjour ${shop.name},`,
    "",
    `📋 Reference commande: ${orderOutcome.orderId}`,
    "",
    "Je souhaite commander:",
    `- Produit: ${orderOutcome.productName}`,
    `- Prix: ${orderOutcome.unitPrice.toFixed(0)} CFA`,
    `- Quantite: ${quantity}`,
    `- Total estime: ${orderOutcome.total.toFixed(0)} CFA`,
    "",
    "Mes informations:",
    `- Nom: ${customerName}`,
    `- Telephone: ${customerPhone}`,
  ];

  if (address) {
    messageLines.push(`- Adresse: ${address}`);
  }

  if (note) {
    messageLines.push(`- Remarque: ${note}`);
  }

  messageLines.push("", "Merci.");

  const text = messageLines.join("\n");
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  return NextResponse.json({
    data: {
      orderId: orderOutcome.orderId,
      text,
      whatsappUrl,
      phone,
    },
  });
}
