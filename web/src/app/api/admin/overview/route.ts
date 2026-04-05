import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, isPlatformAdmin } from "@/lib/auth";

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  if (!isPlatformAdmin(session)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const [shopsCount, publishedShopsCount, usersCount, ordersCount, stockLowCount, revenue] =
    await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { isPublished: true } }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count({ where: { stock: { lte: 5 } } }),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

  return NextResponse.json({
    shopsCount,
    publishedShopsCount,
    usersCount,
    ordersCount,
    stockLowCount,
    revenue: asNumber(revenue._sum.totalAmount),
  });
}
