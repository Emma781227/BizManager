import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { updateOrderSchema } from "@/lib/validators";

type RouteParams = {
  params: Promise<{ orderId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { orderId } = await context.params;
  const body = await request.json().catch(() => null);
  const result = updateOrderSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const existing = await prisma.order.findFirst({
    where: { id: orderId, userId: session.userId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...(result.data.status ? { status: result.data.status } : {}),
      ...(result.data.paymentStatus
        ? { paymentStatus: result.data.paymentStatus }
        : {}),
      ...(result.data.paymentMethod
        ? { paymentMethod: result.data.paymentMethod }
        : {}),
      ...(result.data.paidAmount !== undefined
        ? { paidAmount: String(result.data.paidAmount) }
        : {}),
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

  return NextResponse.json({ data: updated });
}
