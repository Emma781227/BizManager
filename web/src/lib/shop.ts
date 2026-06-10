import { prisma } from "./prisma";
import type { Shop } from "@prisma/client";
import { getPermissions } from "./permissions";
import type { Permission } from "./permissions";
import { ensureDefaultPlans } from "./subscription";

export type ResolvedShop = Shop & {
  _staffRole: "owner" | "manager" | "staff";
  _ownerUserId: string;
};

/**
 * Résout la boutique active pour un utilisateur (owner ou team member).
 * Retourne null si l'utilisateur n'a pas accès à la boutique.
 */
export async function resolveShop(userId: string, shopId?: string | null): Promise<ResolvedShop | null> {
  if (shopId) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return null;

    if (shop.userId === userId) {
      return { ...shop, _staffRole: "owner", _ownerUserId: userId };
    }

    const membership = await prisma.teamMembership.findFirst({
      where: {
        userId,
        ownerUserId: shop.userId,
        status: "active",
        shopAccess: { some: { shopId } },
      },
    });
    if (membership) {
      return {
        ...shop,
        _staffRole: membership.role as "owner" | "manager" | "staff",
        _ownerUserId: shop.userId,
      };
    }
    return null;
  }

  // Pas de shopId : première boutique possédée
  const ownedShop = await prisma.shop.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (ownedShop) return { ...ownedShop, _staffRole: "owner", _ownerUserId: userId };

  // Ou première boutique accessible via membership
  const membership = await prisma.teamMembership.findFirst({
    where: { userId, status: "active" },
    include: {
      shopAccess: {
        include: { shop: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const firstShop = membership?.shopAccess[0]?.shop;
  if (firstShop) {
    return {
      ...firstShop,
      _staffRole: membership!.role as "owner" | "manager" | "staff",
      _ownerUserId: firstShop.userId,
    };
  }

  return null;
}

/**
 * Retourne toutes les boutiques accessibles par un utilisateur.
 * Owner → ses boutiques. Staff/Manager → boutiques de son membership.
 */
export async function getUserShops(userId: string) {
  const [ownedShops, memberships] = await Promise.all([
    prisma.shop.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { products: true, orders: true, customers: true } } },
    }),
    prisma.teamMembership.findMany({
      where: { userId, status: "active" },
      include: {
        shopAccess: {
          include: {
            shop: { include: { _count: { select: { products: true, orders: true, customers: true } } } },
          },
        },
      },
    }),
  ]);

  const teamShops = memberships.flatMap(m => m.shopAccess.map(sa => sa.shop));

  if (ownedShops.length === 0) return teamShops;

  // Ajoute les boutiques d'équipe non déjà possédées (évite les doublons)
  const ownedIds = new Set(ownedShops.map(s => s.id));
  return [...ownedShops, ...teamShops.filter(s => !ownedIds.has(s.id))];
}

/**
 * Retourne les permissions effectives d'un utilisateur sur une boutique.
 */
export async function getShopPermissions(userId: string, shopId: string): Promise<Permission[]> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { userId: true } });
  if (!shop) return [];
  if (shop.userId === userId) return getPermissions("owner");

  const membership = await prisma.teamMembership.findFirst({
    where: { userId, ownerUserId: shop.userId, status: "active", shopAccess: { some: { shopId } } },
    select: { role: true },
  });
  return membership ? getPermissions(membership.role) : [];
}

/**
 * Vérifie les quotas du plan pour créer une boutique supplémentaire.
 */
export async function checkShopQuota(userId: string): Promise<string | null> {
  let sub: { plan?: { maxShops: number; displayName: string } } | null = null;
  try {
    sub = await prisma.subscription.findUnique({ where: { userId }, include: { plan: true } });
  } catch (error) {
    if ((error as { code?: string })?.code !== "P2021") throw error;
  }
  const maxShops = sub?.plan?.maxShops ?? 1;
  const currentCount = await prisma.shop.count({ where: { userId } });
  if (currentCount >= maxShops) {
    return `Quota atteint : votre plan ${sub?.plan?.displayName ?? "Starter"} permet ${maxShops} boutique${maxShops > 1 ? "s" : ""} au maximum.`;
  }
  return null;
}

/**
 * Vérifie les quotas du plan pour créer un produit supplémentaire.
 */
export async function checkProductQuota(shopId: string): Promise<string | null> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { userId: true } });
  if (!shop) return "Boutique introuvable";
  let sub: { plan?: { maxProducts: number; displayName: string } } | null = null;
  try {
    sub = await prisma.subscription.findUnique({ where: { userId: shop.userId }, include: { plan: true } });
  } catch (error) {
    if ((error as { code?: string })?.code !== "P2021") throw error;
  }
  const maxProducts = sub?.plan?.maxProducts ?? 50;
  if (maxProducts === -1) return null;
  const currentCount = await prisma.product.count({ where: { shopId } });
  if (currentCount >= maxProducts) {
    return `Quota atteint : votre plan ${sub?.plan?.displayName ?? "Starter"} permet ${maxProducts} produits par boutique.`;
  }
  return null;
}

/**
 * Vérifie les quotas du plan pour inviter un collaborateur.
 */
export async function checkTeamQuota(ownerUserId: string): Promise<string | null> {
  await ensureDefaultPlans();
  let sub: { plan?: { maxTeamMembers: number; displayName: string } } | null = null;
  try {
    sub = await prisma.subscription.findUnique({ where: { userId: ownerUserId }, include: { plan: true } });
  } catch (error) {
    if ((error as { code?: string })?.code !== "P2021") throw error;
  }
  const maxTeamMembers = sub?.plan?.maxTeamMembers ?? 0;
  if (maxTeamMembers === -1) return null;
  if (maxTeamMembers === 0) {
    return `Votre plan ${sub?.plan?.displayName ?? "Starter"} ne permet pas d'inviter des collaborateurs. Passez au plan Business ou Premium.`;
  }
  const currentCount = await prisma.teamMembership.count({
    where: { ownerUserId, status: { in: ["active", "invited", "suspended"] } },
  });
  if (currentCount >= maxTeamMembers) {
    return `Quota atteint : votre plan permet ${maxTeamMembers} collaborateur${maxTeamMembers > 1 ? "s" : ""} au maximum.`;
  }
  return null;
}
