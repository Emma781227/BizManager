import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { resolveShop, checkProductQuota } from "@/lib/shop";
import { uploadMedia } from "@/lib/cloudinary";

export const runtime = "nodejs";

function normalizeCategory(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
function normalizeCategories(values: string[]) {
  return Array.from(new Set(values.map(normalizeCategory).filter(Boolean))).slice(0, 10);
}
function parseCategoriesInput(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return normalizeCategories(parsed.filter((v): v is string => typeof v === "string"));
  } catch { /* fallback */ }
  return normalizeCategories(value.split(","));
}
function parseNumberInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return Number.NaN;
  return Number(value.replace(/\s+/g, "").replace(",", ".").trim());
}
function parseIntegerInput(value: FormDataEntryValue | null) {
  const n = parseNumberInput(value);
  return Number.isFinite(n) ? Math.trunc(n) : Number.NaN;
}
function parseImageVariantsInput(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === "string").map(v => v.trim()).filter(Boolean);
  } catch { /* fallback */ }
  return value.split(",").map(v => v.trim()).filter(Boolean);
}
async function saveProductMedia(file: File): Promise<string | null> {
  return uploadMedia(file);
}

// GET /api/products?shopId=xxx&q=...&category=...&stock=...
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const shopId   = request.nextUrl.searchParams.get("shopId")?.trim();
  const search   = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = request.nextUrl.searchParams.get("category")?.trim() ?? "";
  const stockStatus = request.nextUrl.searchParams.get("stock")?.trim() ?? "";

  // Résoudre la boutique (propriétaire vérifié)
  const shop = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  let stockCondition: { gt: number; lte?: number } | { equals: number } | undefined;
  if (stockStatus === "low")          stockCondition = { gt: 0, lte: 8 };
  else if (stockStatus === "in_stock")     stockCondition = { gt: 8 };
  else if (stockStatus === "out_of_stock") stockCondition = { equals: 0 };

  const products = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      ...(category ? { OR: [{ category: { equals: category, mode: "insensitive" } }, { categories: { has: category } }] } : {}),
      ...(stockCondition ? { stock: stockCondition } : {}),
      ...(search ? { OR: [
        { name:       { contains: search, mode: "insensitive" } },
        { sku:        { contains: search, mode: "insensitive" } },
        { category:   { contains: search, mode: "insensitive" } },
        { categories: { has: search } },
      ]} : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { variants: { orderBy: { createdAt: "asc" } } },
  });

  const categorySource = await prisma.product.findMany({
    where: { shopId: shop.id },
    select: { category: true, categories: true },
  });
  const availableCategories = Array.from(new Set(
    categorySource.flatMap(p => [...(p.categories ?? []), p.category ?? ""])
      .map(v => v.trim()).filter(Boolean),
  )).sort((a, b) => a.localeCompare(b, "fr"));

  return NextResponse.json({ data: products, meta: { categories: availableCategories, shopId: shop.id } });
}

// POST /api/products
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const shopId = request.nextUrl.searchParams.get("shopId")?.trim();
  const shop   = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  // Vérification quota produits
  const quotaError = await checkProductQuota(shop.id);
  if (quotaError) return NextResponse.json({ error: quotaError }, { status: 403 });

  const contentType = request.headers.get("content-type") ?? "";
  let body: unknown;

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const fileField        = formData.get("imageFile");
      const variantFileFields = formData.getAll("imageVariantFiles");

      let uploadedImageUrl: string | null = null;
      if (fileField instanceof File && fileField.size > 0) {
        try { uploadedImageUrl = await saveProductMedia(fileField); }
        catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Media invalide" }, { status: 400 }); }
      }

      const uploadedVariants: string[] = [];
      for (const field of variantFileFields) {
        if (!(field instanceof File) || field.size === 0 || uploadedVariants.length >= 3) continue;
        try {
          const url = await saveProductMedia(field);
          if (url) uploadedVariants.push(url);
        } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Media variante invalide" }, { status: 400 }); }
      }

      const categoryValue   = normalizeCategory(String(formData.get("category")   ?? ""));
      const categoriesValue = parseCategoriesInput(formData.get("categories"));
      const mergedCategories = normalizeCategories([categoryValue, ...categoriesValue]);
      const imageVariantUrls = parseImageVariantsInput(formData.get("imageVariants"));
      const mergedVariants   = Array.from(new Set([...imageVariantUrls, ...uploadedVariants].filter(Boolean))).slice(0, 3);

      const hasVariantsRaw = formData.get("hasVariants");
      const variantsRaw    = formData.get("variants");
      let parsedVariants: unknown[] = [];
      if (typeof variantsRaw === "string" && variantsRaw.trim()) {
        try { parsedVariants = JSON.parse(variantsRaw) as unknown[]; } catch { /* ignore */ }
      }

      const lowStockRaw = parseIntegerInput(formData.get("lowStockThreshold"));
      body = {
        name:              String(formData.get("name")        ?? "").trim(),
        category:          mergedCategories[0] || undefined,
        categories:        mergedCategories,
        description:       String(formData.get("description") ?? "").trim() || undefined,
        sku:               String(formData.get("sku")         ?? "").trim() || undefined,
        unitPrice:         parseNumberInput(formData.get("unitPrice")),
        stock:             parseIntegerInput(formData.get("stock")),
        lowStockThreshold: Number.isFinite(lowStockRaw) ? lowStockRaw : 5,
        hasVariants:       hasVariantsRaw === "true" || hasVariantsRaw === "1",
        variants:          parsedVariants,
        imageUrl:          uploadedImageUrl || String(formData.get("imageUrl") ?? "").trim() || undefined,
        imageVariants:     mergedVariants,
      };
    } catch {
      return NextResponse.json({ error: "Erreur lors du traitement du formulaire" }, { status: 400 });
    }
  } else {
    body = await request.json().catch(() => null);
  }

  const result = productSchema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    return NextResponse.json({ error: `Donnees invalides (${issue?.path?.join(".") || "champ"}: ${issue?.message || "Valeur invalide"})` }, { status: 400 });
  }

  try {
    const hasVariants = result.data.hasVariants ?? false;
    const variants    = result.data.variants ?? [];

    const product = await prisma.product.create({
      data: {
        shopId:       shop.id,
        name:         result.data.name.trim(),
        category:     result.data.category?.trim()  || null,
        categories:   normalizeCategories(result.data.categories ?? []),
        description:  result.data.description?.trim() || null,
        sku:          result.data.sku?.trim()        || null,
        unitPrice:    String(result.data.unitPrice),
        stock:             result.data.stock,
        lowStockThreshold: result.data.lowStockThreshold ?? 5,
        hasVariants,
        imageUrl:     result.data.imageUrl           || null,
        imageVariants: result.data.imageVariants     ?? [],
        ...(hasVariants && variants.length > 0 ? {
          variants: {
            create: variants.map(v => ({
              label:         v.label.trim(),
              sku:           v.sku?.trim() || null,
              stock:         v.stock,
              priceOverride: v.priceOverride != null ? String(v.priceOverride) : null,
            })),
          },
        } : {}),
      },
      include: { variants: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la creation du produit" }, { status: 500 });
  }
}
