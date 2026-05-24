import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { initiatePayment } from "@/lib/geniuspay";

const PLAN_ORDER = ["starter", "business", "premium"];

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as {
    planName?: string;
    billingCycle?: "monthly" | "yearly";
  };

  const { planName, billingCycle = "monthly" } = body;
  if (!planName) return NextResponse.json({ error: "planName requis" }, { status: 400 });

  const [targetPlan, currentSub, user] = await Promise.all([
    prisma.plan.findFirst({ where: { name: planName, isActive: true } }),
    prisma.subscription.findUnique({
      where: { userId: session.userId },
      include: { plan: true },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, email: true, phone: true },
    }),
  ]);

  if (!targetPlan) return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const currentPlanName = currentSub?.plan.name ?? "starter";
  const currentIdx = PLAN_ORDER.indexOf(currentPlanName);
  const targetIdx  = PLAN_ORDER.indexOf(planName);

  if (targetIdx <= currentIdx) {
    return NextResponse.json({ error: "Ce plan est inférieur ou identique à votre plan actuel" }, { status: 400 });
  }

  const priceMonthly = Number(targetPlan.priceMonthly);
  const amount = billingCycle === "yearly" ? Math.round(priceMonthly * 12 * 0.85) : priceMonthly;

  if (amount <= 0) {
    return NextResponse.json({ error: "Ce plan est gratuit, aucun paiement requis" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://bizmanager.africa";

  // Crée la transaction en pending pour obtenir son ID
  const transaction = await prisma.paymentTransaction.create({
    data: {
      userId:      session.userId,
      planId:      targetPlan.id,
      billingCycle,
      amount,
      currency:    "XAF",
      status:      "pending",
      provider:    "geniuspay",
    },
  });

  try {
    const result = await initiatePayment({
      amount,
      currency:    "XAF",
      description: `Abonnement BizManager ${targetPlan.displayName} (${billingCycle === "yearly" ? "annuel" : "mensuel"})`,
      customer: {
        name:  user.fullName,
        email: user.email,
        phone: user.phone ?? undefined,
      },
      successUrl: `${appUrl}/billing/success?txId=${transaction.id}`,
      errorUrl:   `${appUrl}/billing/success?txId=${transaction.id}&error=1`,
      metadata: {
        transactionId: transaction.id,
        userId:        session.userId,
        planName,
        billingCycle,
      },
    });

    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        providerReference: result.providerReference || null,
        providerPaymentId: result.providerPaymentId || null,
        checkoutUrl:       result.checkoutUrl || null,
      },
    });

    return NextResponse.json({ checkoutUrl: result.checkoutUrl, transactionId: transaction.id });
  } catch (err) {
    console.error("[create-checkout] GeniusPay error:", err);
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status: "failed" },
    });
    const msg = err instanceof Error ? err.message : "Erreur lors de l'initiation du paiement";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
