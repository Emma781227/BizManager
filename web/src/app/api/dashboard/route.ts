import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { resolveShop } from "@/lib/shop";

const PERIOD_IN_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const shopId    = request.nextUrl.searchParams.get("shopId")?.trim();
  const periodKey = request.nextUrl.searchParams.get("period") ?? "30d";
  const days      = PERIOD_IN_DAYS[periodKey] ?? 30;
  const since     = new Date();
  since.setDate(since.getDate() - days);

  // Résoudre la boutique active
  const shop = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  const whereShop   = { shopId: shop.id };
  const wherePeriod = { shopId: shop.id, createdAt: { gte: since } };

  const confirmedWhere = {
    ...wherePeriod,
    OR: [{ status: "delivered" as const }, { paymentStatus: "paid" as const }],
  };

  const [ordersCount, customersCount, salesAgg, confirmedSalesAgg, trendOrders, statusRows, channelRows, topRows] =
    await Promise.all([
      prisma.order.count({ where: wherePeriod }),
      prisma.customer.count({ where: whereShop }),
      prisma.order.aggregate({
        where: { ...wherePeriod, status: { not: "cancelled" } },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: confirmedWhere,
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: confirmedWhere,
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: wherePeriod,
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ["channel"],
        where: wherePeriod,
        _count: { _all: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { ...wherePeriod, status: { not: "cancelled" } } },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  const statusCounts: Record<string, number> = {
    pending: 0, new: 0, confirmed: 0, in_progress: 0, ready: 0, delivered: 0, cancelled: 0,
  };
  for (const row of statusRows) statusCounts[row.status] = row._count._all;

  const channelCounts: Record<string, number> = { whatsapp: 0, online: 0, manual: 0 };
  for (const row of channelRows) channelCounts[row.channel] = row._count._all;

  const productIds = topRows.map(r => r.productId);
  const products   = productIds.length === 0 ? [] : await prisma.product.findMany({
    where: { shopId: shop.id, id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productNameById = new Map(products.map(p => [p.id, p.name]));
  const topProducts = topRows.map(row => ({
    productId: row.productId,
    name:      productNameById.get(row.productId) ?? "Produit supprime",
    quantity:  row._sum.quantity  ?? 0,
    amount:    Number(row._sum.lineTotal ?? 0),
  }));

  // Tendance journalière (ventes confirmées)
  const trendByDay = new Map<string, number>();
  for (const o of trendOrders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    trendByDay.set(day, (trendByDay.get(day) ?? 0) + Number(o.totalAmount));
  }
  const trend: { date: string; amount: number }[] = [];
  const cursor = new Date(since);
  const now = new Date();
  while (cursor <= now) {
    const day = cursor.toISOString().slice(0, 10);
    trend.push({ date: day, amount: Math.round(trendByDay.get(day) ?? 0) });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Produits en stock faible / rupture
  const [lowStockCount, outOfStockCount] = await Promise.all([
    prisma.product.count({ where: { shopId: shop.id, stock: { gt: 0, lte: 8 } } }),
    prisma.product.count({ where: { shopId: shop.id, stock: { equals: 0 } } }),
  ]);

  return NextResponse.json({
    period:          periodKey,
    shopId:          shop.id,
    shopName:        shop.name,
    sales:           Number(salesAgg._sum.totalAmount ?? 0),
    confirmedSales:  Number(confirmedSalesAgg._sum.totalAmount ?? 0),
    trend,
    ordersCount,
    customersCount,
    statusCounts,
    channelCounts,
    topProducts,
    lowStockCount,
    outOfStockCount,
  });
}
