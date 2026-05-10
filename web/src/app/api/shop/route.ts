import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { shopSchema } from "@/lib/validators";
import { resolveShop, checkShopQuota } from "@/lib/shop";

// GET /api/shop → première boutique (rétrocompatibilité) ou toutes via ?all=1
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const all = request.nextUrl.searchParams.get("all") === "1";

    if (all) {
      const shops = await prisma.shop.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { products: true, orders: true, customers: true } } },
      });
      return NextResponse.json({ data: shops });
    }

    // Rétrocompatibilité : retourne la première boutique
    const shop = await prisma.shop.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ data: shop });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/shop → met à jour la première boutique ou la crée (rétrocompatibilité)
// Pour mettre à jour une boutique spécifique, passer ?shopId=xxx
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const targetShopId = request.nextUrl.searchParams.get("shopId");
    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, unknown> | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const logoFile = formData.get("logoFile");
      const coverFile = formData.get("coverFile");

      body = {
        slug:              String(formData.get("slug")              ?? ""),
        name:              String(formData.get("name")              ?? ""),
        notificationEmail: String(formData.get("notificationEmail") ?? ""),
        logoUrl:           String(formData.get("logoUrl")           ?? "").trim(),
        coverUrl:          String(formData.get("coverUrl")          ?? "").trim(),
        description:       String(formData.get("description")       ?? ""),
        city:              String(formData.get("city")              ?? ""),
        postalCode:        String(formData.get("postalCode")        ?? ""),
        regionCountry:     String(formData.get("regionCountry")     ?? ""),
        whatsappNumber:    String(formData.get("whatsappNumber")    ?? ""),
        category:          String(formData.get("category")          ?? ""),
        address:           String(formData.get("address")           ?? ""),
        openingHours:      String(formData.get("openingHours")      ?? ""),
        isPublished:       String(formData.get("isPublished") ?? "true") === "true",
      };

      async function saveImage(file: File) {
        if (!file.type.startsWith("image/")) throw new Error("Le fichier doit etre une image");
        if (file.size > 5 * 1024 * 1024) throw new Error("Image trop lourde (max 5MB)");
        const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
        return `data:${file.type};base64,${base64}`;
      }

      if (logoFile instanceof File && logoFile.size > 0) body.logoUrl = await saveImage(logoFile);
      if (coverFile instanceof File && coverFile.size > 0) body.coverUrl = await saveImage(coverFile);
    } else {
      body = await request.json().catch(() => null);
    }

    const normalizedBody = body
      ? { ...body, slug: String(body.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") }
      : body;

    const result = shopSchema.safeParse(normalizedBody);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
    }

    const data = result.data;
    const slug = data.slug.toLowerCase().trim();

    // Vérif slug unique (pas pris par une autre boutique)
    const existingBySlug = await prisma.shop.findUnique({ where: { slug }, select: { id: true, userId: true } });
    if (existingBySlug && existingBySlug.userId !== session.userId) {
      return NextResponse.json({ error: "Ce slug est deja pris" }, { status: 409 });
    }

    const updateData = {
      slug,
      name:              data.name.trim(),
      notificationEmail: data.notificationEmail?.trim() || session.email,
      logoUrl:           data.logoUrl?.trim()        || null,
      coverUrl:          data.coverUrl?.trim()       || null,
      description:       data.description?.trim()    || null,
      city:              data.city?.trim()            || null,
      postalCode:        data.postalCode?.trim()      || null,
      regionCountry:     data.regionCountry?.trim()   || null,
      whatsappNumber:    data.whatsappNumber.trim(),
      category:          data.category?.trim()        || null,
      address:           data.address?.trim()         || null,
      openingHours:      data.openingHours?.trim()    || null,
      isPublished:       data.isPublished ?? true,
    };

    let shop;

    if (targetShopId) {
      // Mise à jour boutique spécifique avec vérification ownership
      const existing = await resolveShop(session.userId, targetShopId);
      if (!existing) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

      shop = await prisma.shop.update({ where: { id: targetShopId }, data: updateData });
    } else {
      // Rétrocompatibilité : upsert sur la première boutique
      const primary = await prisma.shop.findFirst({
        where: { userId: session.userId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (primary) {
        shop = await prisma.shop.update({ where: { id: primary.id }, data: updateData });
      } else {
        const quotaError = await checkShopQuota(session.userId);
        if (quotaError) return NextResponse.json({ error: quotaError }, { status: 403 });
        shop = await prisma.shop.create({ data: { userId: session.userId, ...updateData, whatsappNumber: data.whatsappNumber.trim() } });
      }
    }

    return NextResponse.json({ data: shop });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}
