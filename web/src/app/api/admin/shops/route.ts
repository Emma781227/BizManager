import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, isPlatformAdmin } from "@/lib/auth";

const updateShopSchema = z.object({
  shopId: z.string().min(1),
  isPublished: z.boolean(),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  if (!isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  const shops = await prisma.shop.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          subscription: {
            select: {
              plan: {
                select: {
                  name: true,
                  displayName: true,
                },
              },
            },
          },
        },
      },
    },
    take: 200,
  });

  const shopIds = shops.map((shop) => shop.id);
  const [productsPerShop, ordersPerShop] = await Promise.all([
    prisma.product.groupBy({
      by: ["shopId"],
      where: { shopId: { in: shopIds } },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["shopId"],
      where: { shopId: { in: shopIds } },
      _count: { _all: true },
    }),
  ]);

  const productsMap = new Map(productsPerShop.map((row) => [row.shopId, row._count._all]));
  const ordersMap = new Map(ordersPerShop.map((row) => [row.shopId, row._count._all]));

  return NextResponse.json({
    data: shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      city: shop.city,
      isPublished: shop.isPublished,
      whatsappNumber: shop.whatsappNumber,
      createdAt: shop.createdAt,
      owner: {
        id: shop.user.id,
        fullName: shop.user.fullName,
        email: shop.user.email,
        phone: shop.user.phone,
      },
      plan: shop.user.subscription?.plan
        ? {
            name: shop.user.subscription.plan.name,
            displayName: shop.user.subscription.plan.displayName,
          }
        : {
            name: "starter",
            displayName: "Starter",
          },
      productsCount: productsMap.get(shop.id) ?? 0,
      ordersCount: ordersMap.get(shop.id) ?? 0,
    })),
    total: shops.length,
  });
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  if (!isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const shopId = request.nextUrl.searchParams.get("shopId");
  if (!shopId) {
    return NextResponse.json({ error: "shopId requis" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
  if (!shop) {
    return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.whatsappLog.deleteMany({ where: { shopId } });

      const orders = await tx.order.findMany({ where: { shopId }, select: { id: true } });
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length > 0) {
        await tx.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      }
      await tx.order.deleteMany({ where: { shopId } });

      const products = await tx.product.findMany({ where: { shopId }, select: { id: true } });
      const productIds = products.map((p) => p.id);
      if (productIds.length > 0) {
        await tx.productVariant.deleteMany({ where: { productId: { in: productIds } } });
      }
      await tx.product.deleteMany({ where: { shopId } });
      await tx.customer.deleteMany({ where: { shopId } });
      await tx.shop.delete({ where: { id: shopId } });
    }, { timeout: 15000 });
  } catch (err) {
    console.error("[admin] deleteShop error:", err);
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: `Erreur lors de la suppression : ${msg}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  if (!isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateShopSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const shop = await prisma.shop.update({
    where: { id: parsed.data.shopId },
    data: { isPublished: parsed.data.isPublished },
    select: {
      id: true,
      isPublished: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json({ data: shop });
}
