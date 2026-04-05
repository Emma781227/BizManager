import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

const PERIOD_IN_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const periodKey = request.nextUrl.searchParams.get("period") ?? "30d";
  const days = PERIOD_IN_DAYS[periodKey] ?? PERIOD_IN_DAYS["30d"];
  const since = new Date();
  since.setDate(since.getDate() - days);

  const wherePeriod = {
    userId: session.userId,
    createdAt: { gte: since },
  };

  const [ordersCount, customersCount, salesAgg, statusRows, topRows] = await Promise.all([
    prisma.order.count({ where: wherePeriod }),
    prisma.customer.count({ where: { userId: session.userId } }),
    prisma.order.aggregate({
      where: {
        ...wherePeriod,
        status: { not: "cancelled" },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: wherePeriod,
      _count: { _all: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          userId: session.userId,
          createdAt: { gte: since },
          status: { not: "cancelled" },
        },
      },
      _sum: {
        quantity: true,
        lineTotal: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    }),
  ]);

  const statusCounts: Record<string, number> = {
    pending: 0,
    new: 0,
    confirmed: 0,
    in_progress: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const row of statusRows) {
    statusCounts[row.status] = row._count._all;
  }

  const productIds = topRows.map((row) => row.productId);
  const products =
    productIds.length === 0
      ? []
      : await prisma.product.findMany({
          where: {
            userId: session.userId,
            id: { in: productIds },
          },
          select: {
            id: true,
            name: true,
          },
        });

  const productNameById = new Map(products.map((product) => [product.id, product.name]));
  const topProducts = topRows.map((row) => ({
    productId: row.productId,
    name: productNameById.get(row.productId) ?? "Produit supprime",
    quantity: row._sum.quantity ?? 0,
    amount: Number(row._sum.lineTotal ?? 0),
  }));

  return NextResponse.json({
    period: periodKey,
    sales: Number(salesAgg._sum.totalAmount ?? 0),
    ordersCount,
    customersCount,
    statusCounts,
    topProducts,
  });
}
