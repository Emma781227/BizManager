import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { shopSchema } from "@/lib/validators";
import { checkShopQuota } from "@/lib/shop";

// GET /api/shops → toutes les boutiques du marchand avec comptages
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const shops = await prisma.shop.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { products: true, orders: true, customers: true } },
      },
    });

    // Abonnement + plan
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.userId },
      include: { plan: { select: { name: true, displayName: true, maxShops: true, maxProducts: true } } },
    });

    return NextResponse.json({
      data: shops,
      total: shops.length,
      subscription: subscription ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/shops → crée une nouvelle boutique
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    // Vérification quota
    const quotaError = await checkShopQuota(session.userId);
    if (quotaError) return NextResponse.json({ error: quotaError }, { status: 403 });

    const body = await request.json().catch(() => null);
    const result = shopSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
    }

    const data = result.data;
    const slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");

    const existing = await prisma.shop.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Ce slug est deja pris" }, { status: 409 });

    const shop = await prisma.shop.create({
      data: {
        userId:            session.userId,
        slug,
        name:              data.name.trim(),
        notificationEmail: data.notificationEmail?.trim() || session.email,
        description:       data.description?.trim()    || null,
        city:              data.city?.trim()            || null,
        postalCode:        data.postalCode?.trim()      || null,
        regionCountry:     data.regionCountry?.trim()   || null,
        whatsappNumber:    data.whatsappNumber.trim(),
        category:          data.category?.trim()        || null,
        address:           data.address?.trim()         || null,
        isPublished:       data.isPublished ?? true,
      },
    });

    return NextResponse.json({ data: shop }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}
