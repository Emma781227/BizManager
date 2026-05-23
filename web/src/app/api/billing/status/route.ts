import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const txId = request.nextUrl.searchParams.get("txId");
  if (!txId) return NextResponse.json({ error: "txId requis" }, { status: 400 });

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: txId },
    select: {
      id: true,
      userId: true,
      status: true,
      amount: true,
      currency: true,
      billingCycle: true,
      plan: { select: { name: true, displayName: true } },
      subscription: { select: { id: true, status: true, expiresAt: true } },
    },
  });

  if (!transaction) return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
  if (transaction.userId !== session.userId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  return NextResponse.json({
    status: transaction.status,
    plan: transaction.plan,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    billingCycle: transaction.billingCycle,
    subscription: transaction.subscription,
  });
}
