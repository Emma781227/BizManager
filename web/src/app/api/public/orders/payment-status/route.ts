import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const txId = request.nextUrl.searchParams.get("txId") ?? "";

  if (!txId) {
    return NextResponse.json({ error: "txId requis" }, { status: 400 });
  }

  const tx = await prisma.orderPaymentTransaction.findUnique({
    where: { id: txId },
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      orderId: true,
      order: {
        select: {
          shop: { select: { slug: true, name: true } },
        },
      },
    },
  });

  if (!tx) {
    return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      txId:     tx.id,
      status:   tx.status,
      amount:   Number(tx.amount),
      currency: tx.currency,
      orderId:  tx.orderId,
      shopSlug: tx.order.shop.slug,
      shopName: tx.order.shop.name,
    },
  });
}
