import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { orderSchema } from "@/lib/validators";
import { resolveShop } from "@/lib/shop";
import { sendNewOrderNotification } from "@/lib/notifications";

const allowedStatuses = ["pending","new","confirmed","in_progress","ready","delivered","cancelled"] as const;
type AllowedOrderStatus = (typeof allowedStatuses)[number];

const allowedChannels = ["whatsapp","online","manual"] as const;
type AllowedChannel = (typeof allowedChannels)[number];

// GET /api/orders?shopId=xxx&status=...&channel=...
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const shopId    = request.nextUrl.searchParams.get("shopId")?.trim();
  const shop      = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  const statusFilter  = request.nextUrl.searchParams.get("status")?.trim();
  const channelFilter = request.nextUrl.searchParams.get("channel")?.trim();

  const parsedStatus: AllowedOrderStatus | null =
    statusFilter && (allowedStatuses as readonly string[]).includes(statusFilter)
      ? (statusFilter as AllowedOrderStatus) : null;

  const parsedChannel: AllowedChannel | null =
    channelFilter && (allowedChannels as readonly string[]).includes(channelFilter)
      ? (channelFilter as AllowedChannel) : null;

  const orders = await prisma.order.findMany({
    where: {
      shopId: shop.id,
      ...(parsedStatus  ? { status:  parsedStatus  } : {}),
      ...(parsedChannel ? { channel: parsedChannel } : {}),
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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: orders });
}

// POST /api/orders
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const shopId = request.nextUrl.searchParams.get("shopId")?.trim();
  const shop   = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

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
    return tx.order.create({
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
