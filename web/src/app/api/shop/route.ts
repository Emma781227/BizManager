import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { shopSchema, createShopSchema } from "@/lib/validators";
import { z } from "zod";
import { resolveShop, checkShopQuota, getUserShops } from "@/lib/shop";
import { uploadMedia } from "@/lib/cloudinary";

export const runtime = "nodejs";

// GET /api/shop → première boutique (rétrocompatibilité) ou toutes via ?all=1
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const all = request.nextUrl.searchParams.get("all") === "1";

    if (all) {
      const shops = await getUserShops(session.userId);
      // Indique si l'utilisateur accède à ces boutiques en tant que membre d'équipe
      const isTeamMember = shops.length > 0 && shops.every(s => s.userId !== session.userId);
      return NextResponse.json({ data: shops, isTeamMember });
    }

    // Rétrocompatibilité : retourne la première boutique accessible (owned ou via membership)
    const shop = await prisma.shop.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: "asc" },
    });
    if (shop) return NextResponse.json({ data: shop });

    // Fallback membre d'équipe : première boutique accessible
    const membership = await prisma.teamMembership.findFirst({
      where: { userId: session.userId, status: "active" },
      include: { shopAccess: { include: { shop: true }, take: 1, orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ data: membership?.shopAccess[0]?.shop ?? null });
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

      const rawPaymentMethods = String(formData.get("paymentMethods") ?? "[]");
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
        paymentMethods:    JSON.parse(rawPaymentMethods),
        isPublished:       String(formData.get("isPublished") ?? "true") === "true",
      };

      if (logoFile instanceof File && logoFile.size > 0) {
        try {
          const uploaded = await uploadMedia(logoFile, "bizmanager/shops");
          if (uploaded) body.logoUrl = uploaded;
        } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur upload logo" }, { status: 400 }); }
      }
      if (coverFile instanceof File && coverFile.size > 0) {
        try {
          const uploaded = await uploadMedia(coverFile, "bizmanager/shops");
          if (uploaded) body.coverUrl = uploaded;
        } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur upload couverture" }, { status: 400 }); }
      }
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
      paymentMethods:    data.paymentMethods ?? [],
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

// POST /api/shop → crée une nouvelle boutique
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const quotaError = await checkShopQuota(session.userId);
    if (quotaError) return NextResponse.json({ error: quotaError }, { status: 403 });

    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, unknown> | null = null;

    if (contentType.includes("multipart/form-data")) {
      const fd = await request.formData();
      const coverFile = fd.get("coverFile");
      const logoFile  = fd.get("logoFile");

      let logoUrl  = String(fd.get("logoUrl")  ?? "").trim();
      let coverUrl = String(fd.get("coverUrl") ?? "").trim();

      if (logoFile instanceof File && logoFile.size > 0) {
        try {
          const uploaded = await uploadMedia(logoFile, "bizmanager/shops");
          if (uploaded) logoUrl = uploaded;
        } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur upload logo" }, { status: 400 }); }
      }
      if (coverFile instanceof File && coverFile.size > 0) {
        try {
          const uploaded = await uploadMedia(coverFile, "bizmanager/shops");
          if (uploaded) coverUrl = uploaded;
        } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur upload couverture" }, { status: 400 }); }
      }

      body = {
        name:              String(fd.get("name")              ?? ""),
        slug:              String(fd.get("slug")              ?? ""),
        category:          String(fd.get("category")          ?? ""),
        whatsappNumber:    String(fd.get("whatsappNumber")    ?? ""),
        notificationEmail: String(fd.get("notificationEmail") ?? "").trim(),
        city:              String(fd.get("city")              ?? ""),
        regionCountry:     String(fd.get("regionCountry")     ?? ""),
        address:           String(fd.get("address")           ?? ""),
        description:       String(fd.get("description")       ?? ""),
        logoUrl,
        coverUrl,
        openingHours:      String(fd.get("openingHours")      ?? ""),
        paymentMethods:    JSON.parse(String(fd.get("paymentMethods") ?? "[]")),
        isPublished:       String(fd.get("isPublished") ?? "false") === "true",
      };
    } else {
      body = await request.json().catch(() => null);
    }

    if (!body) return NextResponse.json({ error: "Payload invalide" }, { status: 400 });

    const normalizedBody = {
      ...body,
      slug: String(body.slug ?? "").trim().toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
        .replace(/^-+|-+$/g, ""),
    };

    const result = createShopSchema.safeParse(normalizedBody);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
    }

    const data = result.data;
    const slug = data.slug;

    const slugTaken = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (slugTaken) return NextResponse.json({ error: "Ce slug est déjà pris, choisissez-en un autre." }, { status: 409 });

    const shop = await prisma.shop.create({
      data: {
        userId:            session.userId,
        slug,
        name:              data.name.trim(),
        category:          data.category,
        whatsappNumber:    data.whatsappNumber,
        notificationEmail: data.notificationEmail?.trim() || session.email,
        city:              data.city,
        regionCountry:     data.regionCountry,
        address:           data.address?.trim()     || null,
        description:       data.description?.trim() || null,
        logoUrl:           data.logoUrl?.trim()      || null,
        coverUrl:          data.coverUrl?.trim()     || null,
        openingHours:      data.openingHours?.trim() || null,
        paymentMethods:    data.paymentMethods ?? [],
        isPublished:       data.isPublished ?? false,
      },
    });

    return NextResponse.json({ data: shop }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/shop?shopId={id} → mise à jour partielle (isPublished, name)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const shopId = request.nextUrl.searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ error: "shopId requis" }, { status: 400 });

    const shop = await resolveShop(session.userId, shopId);
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Payload invalide" }, { status: 400 });

    const patchSchema = z.object({
      isPublished: z.boolean().optional(),
      name: z.string().min(2, "Nom trop court").max(100, "Nom trop long").optional(),
    }).strict();

    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
    }

    const updated = await prisma.shop.update({
      where: { id: shopId },
      data: result.data,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}
