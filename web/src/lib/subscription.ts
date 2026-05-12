import { prisma } from "@/lib/prisma";

const DEFAULT_PLANS = [
  {
    name: "starter",
    displayName: "Starter",
    maxShops: 1,
    maxProducts: 20,
    priceMonthly: "0.00",
    features: ["1 boutique", "20 produits max", "Support standard"],
  },
  {
    name: "business",
    displayName: "Business",
    maxShops: 3,
    maxProducts: 500,
    priceMonthly: "4500.00",
    features: ["3 boutiques", "500 produits max", "Support prioritaire"],
  },
  {
    name: "premium",
    displayName: "Premium",
    maxShops: 10,
    maxProducts: -1,
    priceMonthly: "10000.00",
    features: ["10 boutiques", "Produits illimités", "Support premium"],
  },
] as const;

export async function ensureDefaultPlans() {
  await Promise.all(
    DEFAULT_PLANS.map((plan) =>
      prisma.plan.upsert({
        where: { name: plan.name },
        update: {
          displayName: plan.displayName,
          maxShops: plan.maxShops,
          maxProducts: plan.maxProducts,
          priceMonthly: plan.priceMonthly,
          features: plan.features,
          isActive: true,
        },
        create: {
          name: plan.name,
          displayName: plan.displayName,
          maxShops: plan.maxShops,
          maxProducts: plan.maxProducts,
          priceMonthly: plan.priceMonthly,
          features: plan.features,
          isActive: true,
        },
      }),
    ),
  );
}

export async function resolvePlan(planName?: string | null) {
  await ensureDefaultPlans();

  if (planName) {
    const preferred = await prisma.plan.findUnique({ where: { name: planName } });
    if (preferred) return preferred;
  }

  const starter = await prisma.plan.findUnique({ where: { name: "starter" } });
  if (!starter) {
    throw new Error("Plan starter introuvable");
  }

  return starter;
}

export async function ensureUserSubscription(userId: string, preferredPlanName?: string | null) {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) return existing;

  const plan = await resolvePlan(preferredPlanName);

  return prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: "active",
    },
  });
}
