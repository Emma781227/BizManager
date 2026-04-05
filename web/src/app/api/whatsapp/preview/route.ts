import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

type PreviewPayload = {
  orderId?: string;
};

function cleanPhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^00/, "");
}

function toMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  let payload: PreviewPayload;

  try {
    payload = (await request.json()) as PreviewPayload;
  } catch {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const orderId = payload.orderId?.trim();

  if (!orderId) {
    return NextResponse.json({ error: "orderId requis" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: session.userId,
    },
    include: {
      customer: {
        select: {
          fullName: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const lines = order.items.map((item) => {
    const amount = Number(item.lineTotal);
    return `- ${item.product.name} x${item.quantity} (${toMoney(amount)})`;
  });

  const bodyLines = [
    `Bonjour ${order.customer.fullName},`,
    "Voici le recapitulatif de votre commande:",
    ...lines,
    `Total: ${toMoney(Number(order.totalAmount))}`,
    `Statut: ${order.status}`,
    "Merci pour votre confiance.",
  ];

  const message = bodyLines.join("\n");
  const phone = cleanPhone(order.customer.phone);
  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : "";

  return NextResponse.json({
    orderId: order.id,
    customerName: order.customer.fullName,
    customerPhone: order.customer.phone,
    message,
    whatsappUrl,
  });
}
