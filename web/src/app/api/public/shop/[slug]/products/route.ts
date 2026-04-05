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

  const shop = await prisma.shop.findUnique({
    where: { slug: slug.toLowerCase() },
    select: {
      userId: true,
      isPublished: true,
    },
  });

  if (!shop || !shop.isPublished) {
    return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: {
      userId: shop.userId,
      isActive: true,
      ...(inStock ? { stock: { gt: 0 } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
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
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: products });
}
