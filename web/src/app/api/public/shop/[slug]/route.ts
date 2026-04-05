import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, context: RouteParams) {
  const { slug } = await context.params;

  const shop = await prisma.shop.findUnique({
    where: { slug: slug.toLowerCase() },
    select: {
      slug: true,
      name: true,
      logoUrl: true,
      coverUrl: true,
      description: true,
      city: true,
      whatsappNumber: true,
      category: true,
      address: true,
      openingHours: true,
      isPublished: true,
      userId: true,
    },
  });

  if (!shop || !shop.isPublished) {
    return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
  }

  const productsCount = await prisma.product.count({
    where: { userId: shop.userId, isActive: true },
  });

  return NextResponse.json({
    data: {
      slug: shop.slug,
      name: shop.name,
      logoUrl: shop.logoUrl,
      coverUrl: shop.coverUrl,
      description: shop.description,
      city: shop.city,
      whatsappNumber: shop.whatsappNumber,
      category: shop.category,
      address: shop.address,
      openingHours: shop.openingHours,
      productsCount,
    },
  });
}
