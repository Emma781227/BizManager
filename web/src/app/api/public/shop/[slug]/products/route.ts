import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteParams) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim() ?? "";
  const inStock = url.searchParams.get("inStock") === "1";
  const stockStatus = url.searchParams.get("stockStatus") ?? "all";
  const minPriceParam = url.searchParams.get("minPrice")?.trim() ?? "";
  const maxPriceParam = url.searchParams.get("maxPrice")?.trim() ?? "";
  const sort = url.searchParams.get("sort") ?? "newest";
  const limit  = parseInt(url.searchParams.get("limit")  ?? "0", 10);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const selectedCategories = url.searchParams
    .getAll("category")
    .map((item) => item.trim())
    .filter(Boolean);

  const parsedMinPrice = minPriceParam
    ? Number(minPriceParam.replace(/\s+/g, "").replace(",", "."))
    : NaN;
  const parsedMaxPrice = maxPriceParam
    ? Number(maxPriceParam.replace(/\s+/g, "").replace(",", "."))
    : NaN;

  const hasMinPrice = Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0;
  const hasMaxPrice = Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0;

  let shop = await prisma.shop.findUnique({
    where: { slug: slug.toLowerCase() },
    select: {
      id: true,
      isPublished: true,
    },
  });

  if (!shop || !shop.isPublished) {
    const altSlug = `${slug}a`.toLowerCase();
    const alt = await prisma.shop.findUnique({
      where: { slug: altSlug },
      select: { id: true, isPublished: true },
    });
    if (alt && alt.isPublished) {
      shop = alt;
    } else {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }
  }

  const stockFilter =
    stockStatus === "in"
      ? { gt: 0 }
      : stockStatus === "low"
        ? { gt: 0, lte: 8 }
        : stockStatus === "out"
          ? 0
          : inStock
            ? { gt: 0 }
            : undefined;

  const products = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      isActive: true,
      ...(stockFilter !== undefined
        ? {
            stock:
              typeof stockFilter === "number"
                ? stockFilter
                : { ...stockFilter },
          }
        : {}),
      ...(hasMinPrice || hasMaxPrice
        ? {
            unitPrice: {
              ...(hasMinPrice ? { gte: parsedMinPrice } : {}),
              ...(hasMaxPrice ? { lte: parsedMaxPrice } : {}),
            },
          }
        : {}),
      ...(selectedCategories.length > 0
        ? {
            OR: [{ categories: { hasSome: selectedCategories } }, { category: { in: selectedCategories } }],
          }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      sku: true,
      unitPrice: true,
      stock: true,
      imageUrl: true,
      imageVariants: true,
      category: true,
      categories: true,
      createdAt: true,
    },
    orderBy:
      sort === "price_asc"
        ? { unitPrice: "asc" }
        : sort === "price_desc"
          ? { unitPrice: "desc" }
          : sort === "name_asc"
            ? { name: "asc" }
            : { createdAt: "desc" },
    ...(limit > 0 ? { take: limit, skip: offset } : {}),
  });

  const categoryRows = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      isActive: true,
    },
    select: {
      category: true,
      categories: true,
    },
  });

  const allCategories = Array.from(
    new Set(
      categoryRows
        .flatMap((row) => [row.category ?? "", ...row.categories])
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json({
    data: products,
    meta: {
      categories: allCategories,
      hasMore: limit > 0 ? products.length === limit : false,
    },
  });
}
