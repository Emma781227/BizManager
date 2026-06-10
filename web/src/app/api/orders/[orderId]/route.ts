import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { updateOrderSchema } from "@/lib/validators";
import { resolveShop } from "@/lib/shop";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

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

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, shopId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const shop = await resolveShop(session.userId, existing.shopId);
  if (!shop) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Staff can update order status only (canUpdateStock covers operational updates);
  // full payment fields require canManageOrders (manager+)
  const updatingPayment =
    result.data.paymentStatus !== undefined ||
    result.data.paymentMethod !== undefined ||
    result.data.paidAmount !== undefined;

  if (updatingPayment && !hasPermission(shop._staffRole, "canManageOrders")) {
    return NextResponse.json({ error: "Accès refusé — droits insuffisants pour modifier le paiement" }, { status: 403 });
  }

  if (!hasPermission(shop._staffRole, "canUpdateStock") && !hasPermission(shop._staffRole, "canManageOrders")) {
    return NextResponse.json({ error: "Accès refusé — droits insuffisants" }, { status: 403 });
  }

  const updated = await prisma.$transaction(async tx => {
    const order = await tx.order.update({
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
        statusHistory: { orderBy: { changedAt: "asc" } },
      },
    });

    if (result.data.status && result.data.status !== existing.status) {
      await tx.orderStatusHistory.create({
        data: { orderId, status: result.data.status },
      });
    }

    return order;
  });

  await logAudit({
    actorUserId: session.userId,
    ownerUserId: shop._ownerUserId,
    shopId:      existing.shopId,
    action:      "order.update",
    entityType:  "order",
    entityId:    orderId,
    metadata:    { changes: result.data },
  });

  return NextResponse.json({ data: updated });
}
