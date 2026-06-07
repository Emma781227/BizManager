import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { orderSchema } from "@/lib/validators";
import { resolveShop } from "@/lib/shop";
import { hasPermission } from "@/lib/permissions";
import { sendNewOrderNotification } from "@/lib/notifications";
import { parsePaginationParams, buildPaginatedResponse } from "@/lib/pagination";

const allowedStatuses = ["pending","new","confirmed","in_progress","ready","delivered","cancelled"] as const;
type AllowedOrderStatus = (typeof allowedStatuses)[number];

const allowedChannels = ["whatsapp","online","manual"] as const;
type AllowedChannel = (typeof allowedChannels)[number];

const allowedPaymentStatuses = ["unpaid","partial","paid","refunded"] as const;
type AllowedPaymentStatus = (typeof allowedPaymentStatuses)[number];

const ORDER_SORT_ORDERS = {
  created_asc:  { createdAt:   "asc"  as const },
  created_desc: { createdAt:   "desc" as const },
  amount_asc:   { totalAmount: "asc"  as const },
  amount_desc:  { totalAmount: "desc" as const },
} as const;
type OrderSortKey = keyof typeof ORDER_SORT_ORDERS;

// GET /api/orders?shopId=xxx&status=...&channel=...&paymentStatus=...&dateFrom=...&dateTo=...&sort=...&page=...&limit=...
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const shopId    = sp.get("shopId")?.trim();
  const shop      = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  const statusFilter        = sp.get("status")?.trim();
  const channelFilter       = sp.get("channel")?.trim();
  const paymentStatusFilter = sp.get("paymentStatus")?.trim();
  const searchQuery         = sp.get("q")?.trim() ?? "";
  const dateFrom            = sp.get("dateFrom")?.trim() ?? "";
  const dateTo              = sp.get("dateTo")?.trim() ?? "";
  const rawSort             = sp.get("sort")?.trim() ?? "created_desc";
  const { page, limit, skip } = parsePaginationParams(sp);

  const parsedStatus: AllowedOrderStatus | null =
    statusFilter && (allowedStatuses as readonly string[]).includes(statusFilter)
      ? (statusFilter as AllowedOrderStatus) : null;

  const parsedChannel: AllowedChannel | null =
    channelFilter && (allowedChannels as readonly string[]).includes(channelFilter)
      ? (channelFilter as AllowedChannel) : null;

  const parsedPaymentStatus: AllowedPaymentStatus | null =
    paymentStatusFilter && (allowedPaymentStatuses as readonly string[]).includes(paymentStatusFilter)
      ? (paymentStatusFilter as AllowedPaymentStatus) : null;

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (dateFrom) { const d = new Date(dateFrom); if (!isNaN(d.getTime())) dateFilter.gte = d; }
  if (dateTo)   { const d = new Date(dateTo);   if (!isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); dateFilter.lte = d; } }

  const sortKey: OrderSortKey = (rawSort in ORDER_SORT_ORDERS) ? rawSort as OrderSortKey : "created_desc";
  const orderBy = ORDER_SORT_ORDERS[sortKey];

  const where = {
    shopId: shop.id,
    ...(parsedStatus        ? { status:        parsedStatus        } : {}),
    ...(parsedChannel       ? { channel:       parsedChannel       } : {}),
    ...(parsedPaymentStatus ? { paymentStatus: parsedPaymentStatus } : {}),
    ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    ...(searchQuery ? { OR: [
      { id:       { contains: searchQuery, mode: "insensitive" as const } },
      { customer: { fullName: { contains: searchQuery, mode: "insensitive" as const } } },
      { customer: { phone:    { contains: searchQuery } } },
    ]} : {}),
  };

  const [items, total, allOrders] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        items: {
          select: {
            id: true, quantity: true, unitPrice: true, lineTotal: true,
            product: { select: { id: true, name: true } },
          },
        },
        statusHistory: { orderBy: { changedAt: "asc" } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.findMany({
      where: { shopId: shop.id },
      select: { status: true, paymentStatus: true, channel: true, totalAmount: true },
    }),
  ]);

  const stats = {
    total:     allOrders.length,
    pending:   allOrders.filter(o => o.status === "pending" || o.status === "new").length,
    delivered: allOrders.filter(o => o.status === "delivered").length,
    revenue:   allOrders.filter(o => o.paymentStatus === "paid").reduce((s, o) => s + Number(o.totalAmount), 0),
    unpaid:    allOrders.filter(o => o.paymentStatus === "unpaid").length,
  };

  const channelCounts = {
    whatsapp: allOrders.filter(o => o.channel === "whatsapp").length,
    online:   allOrders.filter(o => o.channel === "online").length,
    manual:   allOrders.filter(o => o.channel === "manual").length,
  };

  return NextResponse.json({
    ...buildPaginatedResponse(items, page, limit, total),
    meta: { stats, channelCounts },
  });
}

// POST /api/orders
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const shopId = request.nextUrl.searchParams.get("shopId")?.trim();
  const shop   = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  if (!hasPermission(shop._staffRole, "canManageOrders")) {
    return NextResponse.json({ error: "Accès refusé — droits insuffisants" }, { status: 403 });
  }

  const body   = await request.json().catch(() => null);
  const result = orderSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Payload invalide" }, { status: 400 });

  // Vérifier que le client appartient à cette boutique
  const customer = await prisma.customer.findFirst({
    where: { id: result.data.customerId, shopId: shop.id },
    select: { id: true },
  });
  if (!customer) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Vérifier que les produits appartiennent à cette boutique
  const productIds = [...new Set(result.data.items.map(i => i.productId))];
  const products   = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId: shop.id, isActive: true },
    select: { id: true, unitPrice: true },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Un ou plusieurs produits sont invalides" }, { status: 400 });
  }

  const productMap = new Map(products.map(p => [p.id, p]));
  const itemsData  = result.data.items.map(item => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.unitPrice);
    const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
    return { productId: product.id, quantity: item.quantity, unitPrice, lineTotal };
  });
  const totalAmount = Number(itemsData.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));

  // Canal optionnel dans le body
  const channel: AllowedChannel =
    (allowedChannels as readonly string[]).includes(body?.channel)
      ? (body.channel as AllowedChannel)
      : "manual";

  const order = await prisma.$transaction(async tx => {
    const created = await tx.order.create({
      data: {
        shopId:        shop.id,
        customerId:    customer.id,
        channel,
        paymentMethod: result.data.paymentMethod,
        totalAmount:   String(totalAmount),
        items: {
          create: itemsData.map(i => ({
            ...i,
            unitPrice: String(i.unitPrice),
            lineTotal: String(i.lineTotal),
          })),
        },
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        items: {
          select: {
            id: true, quantity: true, unitPrice: true, lineTotal: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    });
    await tx.orderStatusHistory.create({
      data: { orderId: created.id, status: "new" },
    });
    return created;
  });

  void sendNewOrderNotification({
    shopName:      shop.name,
    merchantEmail: shop.notificationEmail ?? null,
    orderId:       order.id,
    customerName:  order.customer.fullName,
    customerPhone: order.customer.phone,
    items: order.items.map(i => ({
      productName: i.product?.name ?? "Produit",
      quantity:    i.quantity,
      unitPrice:   Number(i.unitPrice),
      lineTotal:   Number(i.lineTotal),
    })),
    totalAmount: Number(order.totalAmount ?? totalAmount),
  });

  return NextResponse.json({ data: order }, { status: 201 });
}
