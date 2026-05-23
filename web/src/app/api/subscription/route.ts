import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

const PLAN_ORDER = ["starter", "business", "premium"];

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { planName } = body as { planName?: string };
  if (!planName) return NextResponse.json({ error: "planName requis" }, { status: 400 });

  const [targetPlan, currentSub] = await Promise.all([
    prisma.plan.findFirst({ where: { name: planName, isActive: true } }),
    prisma.subscription.findUnique({
      where: { userId: session.userId },
      include: { plan: true },
    }),
  ]);

  if (!targetPlan) return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });

  const currentPlanName = currentSub?.plan.name ?? "starter";
  const currentIdx = PLAN_ORDER.indexOf(currentPlanName);
  const targetIdx  = PLAN_ORDER.indexOf(planName);

  if (targetIdx <= currentIdx) {
    return NextResponse.json({ error: "Ce plan est inférieur ou identique à votre plan actuel" }, { status: 400 });
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const sub = await prisma.subscription.upsert({
    where:  { userId: session.userId },
    create: { userId: session.userId, planId: targetPlan.id, status: "active", expiresAt },
    update: { planId: targetPlan.id, status: "active", expiresAt },
    include: { plan: true },
  });

  return NextResponse.json({
    success: true,
    plan: {
      name:         sub.plan.name,
      displayName:  sub.plan.displayName,
      maxShops:     sub.plan.maxShops,
      maxProducts:  sub.plan.maxProducts,
      priceMonthly: Number(sub.plan.priceMonthly),
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const shopId = request.nextUrl.searchParams.get("shopId")?.trim();

  const [sub, shopCount, allPlans] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: session.userId },
      include: { plan: true },
    }),
    prisma.shop.count({ where: { userId: session.userId } }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  // Plan actif (fallback sur starter si pas de subscription)
  const starterPlan = allPlans.find(p => p.name === "starter") ?? allPlans[0];
  const currentPlan = sub?.plan ?? starterPlan;

  if (!currentPlan) {
    return NextResponse.json({ error: "Plans introuvables" }, { status: 500 });
  }

  // Produits dans la boutique active (si shopId fourni)
  let productCount = 0;
  if (shopId) {
    const shop = await prisma.shop.findFirst({ where: { id: shopId, userId: session.userId } });
    if (shop) {
      productCount = await prisma.product.count({ where: { shopId: shop.id } });
    }
  }

  // Plan suivant
  const currentIndex = PLAN_ORDER.indexOf(currentPlan.name);
  const nextPlanName = currentIndex < PLAN_ORDER.length - 1 ? PLAN_ORDER[currentIndex + 1] : null;
  const nextPlan = nextPlanName ? allPlans.find(p => p.name === nextPlanName) ?? null : null;

  return NextResponse.json({
    plan: {
      name:         currentPlan.name,
      displayName:  currentPlan.displayName,
      maxShops:     currentPlan.maxShops,
      maxProducts:  currentPlan.maxProducts,
      priceMonthly: Number(currentPlan.priceMonthly),
    },
    usage: {
      shops:    shopCount,
      products: productCount,
    },
    nextPlan: nextPlan ? {
      name:         nextPlan.name,
      displayName:  nextPlan.displayName,
      priceMonthly: Number(nextPlan.priceMonthly),
    } : null,
  });
}
