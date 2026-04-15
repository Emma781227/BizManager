import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ slug: string; productId: string }>;
};

export async function GET(_: Request, context: RouteParams) {
  const { slug, productId } = await context.params;

  const shop = await prisma.shop.findUnique({
    where: { slug: slug.toLowerCase() },
    select: {
      userId: true,
      isPublished: true,
      name: true,
      whatsappNumber: true,
    },
  });

  if (!shop || !shop.isPublished) {
    return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId: shop.userId,
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
