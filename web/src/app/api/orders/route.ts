import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { orderSchema } from "@/lib/validators";

const allowedStatuses = [
  "pending",
  "new",
  "confirmed",
  "in_progress",
  "ready",
  "delivered",
  "cancelled",
] as const;
type AllowedOrderStatus = (typeof allowedStatuses)[number];

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const statusFilter = request.nextUrl.searchParams.get("status")?.trim();
  const parsedStatus: AllowedOrderStatus | null =
    statusFilter && (allowedStatuses as readonly string[]).includes(statusFilter)
      ? (statusFilter as AllowedOrderStatus)
      : null;

  const orders = await prisma.order.findMany({
    where: {
      userId: session.userId,
      ...(parsedStatus ? { status: parsedStatus } : {}),
    },
    include: {
      customer: {
        select: { id: true, fullName: true, phone: true },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: orders });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = orderSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: result.data.customerId, userId: session.userId },
    select: { id: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const productIds = [...new Set(result.data.items.map((item) => item.productId))];

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      userId: session.userId,
      isActive: true,
    },
    select: { id: true, name: true, unitPrice: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "Un ou plusieurs produits sont invalides" },
      { status: 400 },
    );
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  const itemsData = result.data.items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new Error("Produit invalide");
    }

    const unitPrice = Number(product.unitPrice);
    const lineTotal = Number((unitPrice * item.quantity).toFixed(2));

    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    };
  });

  const totalAmount = Number(
    itemsData.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
  );

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: session.userId,
        customerId: customer.id,
        paymentMethod: result.data.paymentMethod,
        totalAmount: String(totalAmount),
        items: {
          create: itemsData.map(item => ({
            ...item,
            unitPrice: String(item.unitPrice),
            lineTotal: String(item.lineTotal),
          })),
        },
      },
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    return created;
  });

  return NextResponse.json({ data: order }, { status: 201 });
}
