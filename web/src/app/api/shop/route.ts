import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { shopSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const shop = await prisma.shop.findUnique({
      where: { userId: session.userId },
    });

    return NextResponse.json({ data: shop });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, unknown> | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const logoFile = formData.get("logoFile");
      const coverFile = formData.get("coverFile");

      const rawLogoUrl = String(formData.get("logoUrl") ?? "").trim();
      const rawCoverUrl = String(formData.get("coverUrl") ?? "").trim();

      body = {
        slug: String(formData.get("slug") ?? ""),
        name: String(formData.get("name") ?? ""),
        notificationEmail: String(formData.get("notificationEmail") ?? ""),
        logoUrl: rawLogoUrl,
        coverUrl: rawCoverUrl,
        description: String(formData.get("description") ?? ""),
        city: String(formData.get("city") ?? ""),
        whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
        category: String(formData.get("category") ?? ""),
        address: String(formData.get("address") ?? ""),
        openingHours: String(formData.get("openingHours") ?? ""),
        isPublished: String(formData.get("isPublished") ?? "true") === "true",
      };

      async function saveImage(file: File, prefix: string) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Le fichier doit etre une image");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Image trop lourde (max 5MB)");
        }

        const ext = path.extname(file.name) || ".jpg";
        const safeSlug = String(body?.slug ?? "shop")
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .slice(0, 50);
        const filename = `${prefix}-${safeSlug}-${Date.now()}-${randomUUID()}${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "shops");
        await mkdir(uploadDir, { recursive: true });

        const bytes = await file.arrayBuffer();
        await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

        return `/uploads/shops/${filename}`;
      }

      if (logoFile instanceof File && logoFile.size > 0) {
        body.logoUrl = await saveImage(logoFile, "logo");
      }

      if (coverFile instanceof File && coverFile.size > 0) {
        body.coverUrl = await saveImage(coverFile, "cover");
      }
    } else {
      body = await request.json().catch(() => null);
    }

    const normalizedBody = body
      ? {
          ...body,
          slug: String(body.slug ?? "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-"),
        }
      : body;

    const result = shopSchema.safeParse(normalizedBody);

    if (!result.success) {
      const firstIssue = result.error.issues[0]?.message ?? "Payload invalide";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const data = result.data;

    const existingBySlug = await prisma.shop.findUnique({
      where: { slug: data.slug.toLowerCase().trim() },
      select: { id: true, userId: true },
    });

    if (existingBySlug && existingBySlug.userId !== session.userId) {
      return NextResponse.json({ error: "Ce slug est deja pris" }, { status: 409 });
    }

    const shop = await prisma.shop.upsert({
      where: { userId: session.userId },
      update: {
        slug: data.slug.toLowerCase().trim(),
        name: data.name.trim(),
        notificationEmail: data.notificationEmail?.trim() || null,
        logoUrl: data.logoUrl?.trim() || null,
        coverUrl: data.coverUrl?.trim() || null,
        description: data.description?.trim() || null,
        city: data.city?.trim() || null,
        whatsappNumber: data.whatsappNumber.trim(),
        category: data.category?.trim() || null,
        address: data.address?.trim() || null,
        openingHours: data.openingHours?.trim() || null,
        isPublished: data.isPublished ?? true,
      },
      create: {
        userId: session.userId,
        slug: data.slug.toLowerCase().trim(),
        name: data.name.trim(),
        notificationEmail: data.notificationEmail?.trim() || null,
        logoUrl: data.logoUrl?.trim() || null,
        coverUrl: data.coverUrl?.trim() || null,
        description: data.description?.trim() || null,
        city: data.city?.trim() || null,
        whatsappNumber: data.whatsappNumber.trim(),
        category: data.category?.trim() || null,
        address: data.address?.trim() || null,
        openingHours: data.openingHours?.trim() || null,
        isPublished: data.isPublished ?? true,
      },
    });

    return NextResponse.json({ data: shop });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
