import { prisma } from "./prisma";

/**
 * Résout la boutique active pour un utilisateur.
 * Si shopId est fourni, vérifie que la boutique appartient bien à userId.
 * Sinon, retourne la première boutique (ordre de création).
 */
export async function resolveShop(userId: string, shopId?: string | null) {
  if (shopId) {
    return prisma.shop.findFirst({ where: { id: shopId, userId } });
  }
  return prisma.shop.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
}

/**
 * Retourne toutes les boutiques d'un utilisateur avec comptages.
 */
export async function getUserShops(userId: string) {
  return prisma.shop.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { products: true, orders: true, customers: true } },
    },
  });
}

/**
 * Vérifie les quotas du plan pour créer une boutique supplémentaire.
 * Retourne null si la création est autorisée, un message d'erreur sinon.
 */
export async function checkShopQuota(userId: string): Promise<string | null> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
  const maxShops = sub?.plan.maxShops ?? 1;
  const currentCount = await prisma.shop.count({ where: { userId } });
  if (currentCount >= maxShops) {
    return `Quota atteint : votre plan ${sub?.plan.displayName ?? "Starter"} permet ${maxShops} boutique${maxShops > 1 ? "s" : ""} au maximum.`;
  }
  return null;
}

/**
 * Vérifie les quotas du plan pour créer un produit supplémentaire.
 */
export async function checkProductQuota(shopId: string): Promise<string | null> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { userId: true } });
  if (!shop) return "Boutique introuvable";
  const sub = await prisma.subscription.findUnique({
    where: { userId: shop.userId },
    include: { plan: true },
  });
  const maxProducts = sub?.plan.maxProducts ?? 50;
  if (maxProducts === -1) return null; // unlimited
  const currentCount = await prisma.product.count({ where: { shopId } });
  if (currentCount >= maxProducts) {
    return `Quota atteint : votre plan ${sub?.plan.displayName ?? "Starter"} permet ${maxProducts} produits par boutique.`;
  }
  return null;
}
