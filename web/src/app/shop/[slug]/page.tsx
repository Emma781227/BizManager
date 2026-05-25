import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ShopPageClient from "./ShopPageClient";

type Props = { params: Promise<{ slug: string }> };

export default async function ShopPage({ params }: Props) {
  const { slug } = await params;
  const normalized = slug.toLowerCase();

  let shopRecord = await prisma.shop.findUnique({
    where: { slug: normalized },
    select: {
      id: true, slug: true, name: true,
      logoUrl: true, coverUrl: true, description: true,
      city: true, whatsappNumber: true, category: true,
      address: true, openingHours: true, paymentMethods: true,
      isPublished: true,
    },
  });

  // Fallback slug (même logique que l'API publique)
  if (!shopRecord?.isPublished) {
    const alt = await prisma.shop.findUnique({
      where: { slug: `${normalized}a` },
      select: {
        id: true, slug: true, name: true,
        logoUrl: true, coverUrl: true, description: true,
        city: true, whatsappNumber: true, category: true,
        address: true, openingHours: true, paymentMethods: true,
        isPublished: true,
      },
    });
    if (alt?.isPublished) shopRecord = alt;
    else notFound();
  }

  const [rawProducts, categoryRows, productsCount] = await Promise.all([
    prisma.product.findMany({
      where: { shopId: shopRecord.id, isActive: true },
      select: {
        id: true, name: true, description: true,
        unitPrice: true, stock: true, imageUrl: true,
        imageVariants: true, category: true, categories: true,
        hasVariants: true,
      },
      orderBy: { createdAt: "desc" },
      take: 16,
    }),
    prisma.product.findMany({
      where: { shopId: shopRecord.id, isActive: true },
      select: { category: true, categories: true },
    }),
    prisma.product.count({ where: { shopId: shopRecord.id, isActive: true } }),
  ]);

  const categories = Array.from(
    new Set(
      categoryRows
        .flatMap((r) => [r.category ?? "", ...r.categories])
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, "fr"));

  const initialShop = {
    id: shopRecord.id,
    slug: shopRecord.slug,
    name: shopRecord.name,
    logoUrl: shopRecord.logoUrl,
    coverUrl: shopRecord.coverUrl,
    description: shopRecord.description,
    city: shopRecord.city,
    whatsappNumber: shopRecord.whatsappNumber ?? undefined,
    category: shopRecord.category,
    address: shopRecord.address,
    openingHours: shopRecord.openingHours ?? undefined,
    paymentMethods: shopRecord.paymentMethods as string[],
    productsCount,
  };

  const initialProducts = {
    data: rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      unitPrice: p.unitPrice.toString(),
      stock: p.stock,
      imageUrl: p.imageUrl,
      imageVariants: p.imageVariants,
      category: p.category,
      categories: p.categories,
      hasVariants: p.hasVariants,
    })),
    meta: { categories },
  };

  return <ShopPageClient initialShop={initialShop} initialProducts={initialProducts} />;
}
