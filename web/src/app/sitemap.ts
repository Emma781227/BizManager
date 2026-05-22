import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmanager.app";

  const shops = await prisma.shop.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      updatedAt: true,
      products: {
        select: { id: true, updatedAt: true },
        take: 200,
      },
    },
    take: 500,
  });

  const shopUrls: MetadataRoute.Sitemap = shops.map((shop) => ({
    url: `${appUrl}/shop/${shop.slug}`,
    lastModified: shop.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productUrls: MetadataRoute.Sitemap = shops.flatMap((shop) =>
    shop.products.map((product) => ({
      url: `${appUrl}/shop/${shop.slug}/products/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }))
  );

  return [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...shopUrls,
    ...productUrls,
  ];
}
