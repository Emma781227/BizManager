import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { resolveShop, checkProductQuota } from "@/lib/shop";
import { hasPermission } from "@/lib/permissions";
import { uploadMedia } from "@/lib/cloudinary";
import { parsePaginationParams, buildPaginatedResponse } from "@/lib/pagination";

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

const PRODUCT_SORT_ORDERS = {
  name_asc:     { name:       "asc"  as const },
  name_desc:    { name:       "desc" as const },
  price_asc:    { unitPrice:  "asc"  as const },
  price_desc:   { unitPrice:  "desc" as const },
  stock_asc:    { stock:      "asc"  as const },
  stock_desc:   { stock:      "desc" as const },
  created_asc:  { createdAt:  "asc"  as const },
  created_desc: { createdAt:  "desc" as const },
} as const;
type ProductSortKey = keyof typeof PRODUCT_SORT_ORDERS;

// GET /api/products?shopId=xxx&q=...&category=...&stock=...&status=...&sort=...&page=...&limit=...
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const sp          = request.nextUrl.searchParams;
  const shopId      = sp.get("shopId")?.trim();
  const search      = sp.get("q")?.trim() ?? "";
  const category    = sp.get("category")?.trim() ?? "";
  const stockStatus = sp.get("stock")?.trim() ?? "";
  const statusParam = sp.get("status")?.trim() ?? "";
  const rawSort     = sp.get("sort")?.trim() ?? "created_desc";
  const { page, limit, skip } = parsePaginationParams(sp);

  const shop = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  const sortKey: ProductSortKey = (rawSort in PRODUCT_SORT_ORDERS) ? rawSort as ProductSortKey : "created_desc";
  const orderBy = PRODUCT_SORT_ORDERS[sortKey];

  let stockCondition: { gt: number; lte?: number } | { equals: number } | undefined;
  if (stockStatus === "low")           stockCondition = { gt: 0, lte: 8 };
  else if (stockStatus === "in_stock")      stockCondition = { gt: 8 };
  else if (stockStatus === "out_of_stock")  stockCondition = { equals: 0 };

  const andClauses: object[] = [];
  if (category) {
    andClauses.push({ OR: [
      { category: { equals: category, mode: "insensitive" } },
      { categories: { has: category } },
    ]});
  }
  if (search) {
    andClauses.push({ OR: [
      { name:       { contains: search, mode: "insensitive" } },
      { sku:        { contains: search, mode: "insensitive" } },
      { category:   { contains: search, mode: "insensitive" } },
      { categories: { has: search } },
    ]});
  }

  const where = {
    shopId: shop.id,
    ...(stockCondition           ? { stock:    stockCondition } : {}),
    ...(statusParam === "active" ? { isActive: true  }         : {}),
    ...(statusParam === "draft"  ? { isActive: false }         : {}),
    ...(andClauses.length > 0   ? { AND: andClauses }          : {}),
  };

  const [items, total, allProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { variants: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where: { shopId: shop.id },
      select: { isActive: true, stock: true, lowStockThreshold: true, category: true, categories: true },
    }),
  ]);

  const stats = {
    total:      allProducts.length,
    active:     allProducts.filter(p => p.isActive).length,
    outOfStock: allProducts.filter(p => p.stock === 0).length,
    lowStock:   allProducts.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5)).length,
    draft:      allProducts.filter(p => !p.isActive).length,
  };

  const availableCategories = Array.from(new Set(
    allProducts.flatMap(p => [...(p.categories ?? []), p.category ?? ""])
      .map(v => v.trim()).filter(Boolean),
  )).sort((a, b) => a.localeCompare(b, "fr"));

  return NextResponse.json({
    ...buildPaginatedResponse(items, page, limit, total),
    meta: { shopId: shop.id, categories: availableCategories, stats },
  });
}

// POST /api/products
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const shopId = request.nextUrl.searchParams.get("shopId")?.trim();
  const shop   = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  if (!hasPermission(shop._staffRole, "canManageProducts")) {
    return NextResponse.json({ error: "Accès refusé — droits insuffisants" }, { status: 403 });
  }

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
