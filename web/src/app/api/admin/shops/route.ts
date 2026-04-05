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
        },
      },
    },
    take: 200,
  });

  const [productsPerUser, ordersPerUser] = await Promise.all([
    prisma.product.groupBy({
      by: ["userId"],
      where: { userId: { in: shops.map((shop) => shop.userId) } },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { in: shops.map((shop) => shop.userId) } },
      _count: { _all: true },
    }),
  ]);

  const productsMap = new Map(productsPerUser.map((row) => [row.userId, row._count._all]));
  const ordersMap = new Map(ordersPerUser.map((row) => [row.userId, row._count._all]));

  return NextResponse.json({
    data: shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      city: shop.city,
      isPublished: shop.isPublished,
      whatsappNumber: shop.whatsappNumber,
      createdAt: shop.createdAt,
      owner: shop.user,
      productsCount: productsMap.get(shop.userId) ?? 0,
      ordersCount: ordersMap.get(shop.userId) ?? 0,
    })),
    total: shops.length,
  });
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
