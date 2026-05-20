import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ slug: string; productId: string }>;
};

export async function GET(_: Request, context: RouteParams) {
  const { slug, productId } = await context.params;

  let shop = await prisma.shop.findUnique({
    where: { slug: slug.toLowerCase() },
    select: {
      id: true,
      isPublished: true,
      name: true,
      whatsappNumber: true,
    },
  });

  if (!shop || !shop.isPublished) {
    const altSlug = `${slug}a`.toLowerCase();
    const alt = await prisma.shop.findUnique({
      where: { slug: altSlug },
      select: { id: true, isPublished: true, name: true, whatsappNumber: true },
    });
    if (alt && alt.isPublished) {
      shop = alt;
    } else {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      shopId: shop.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      sku: true,
      category: true,
      categories: true,
      unitPrice: true,
      stock: true,
      imageUrl: true,
      imageVariants: true,
      createdAt: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...product,
      shopName: shop.name,
      whatsappNumber: shop.whatsappNumber,
    },
  });
}
