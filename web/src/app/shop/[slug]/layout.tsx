import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmanager.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      logoUrl: true,
      coverUrl: true,
      city: true,
      isPublished: true,
    },
  });

  if (!shop || !shop.isPublished) {
    return { title: "Boutique introuvable", robots: { index: false } };
  }

  const title = `${shop.name} — Boutique en ligne`;
  const description =
    shop.description ||
    `Découvrez les produits de ${shop.name}${shop.city ? ` à ${shop.city}` : ""}. Commandez facilement via WhatsApp.`;
  const image = shop.coverUrl || shop.logoUrl || `${appUrl}/icon-512.png`;
  const url = `${appUrl}/shop/${slug}`;

  return {
    title: {
      default: title,
      template: `%s | ${shop.name}`,
    },
    description,
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url,
      title,
      description,
      siteName: "BizManager",
      images: [{ url: image, alt: shop.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  };
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug, isPublished: true },
    select: {
      name: true,
      description: true,
      logoUrl: true,
      city: true,
      regionCountry: true,
      address: true,
      whatsappNumber: true,
    },
  });

  const jsonLd = shop
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: shop.name,
        ...(shop.description && { description: shop.description }),
        url: `${appUrl}/shop/${slug}`,
        telephone: shop.whatsappNumber,
        ...(shop.logoUrl && { image: shop.logoUrl }),
        ...(shop.city || shop.address
          ? {
              address: {
                "@type": "PostalAddress",
                ...(shop.address && { streetAddress: shop.address }),
                ...(shop.city && { addressLocality: shop.city }),
                ...(shop.regionCountry && { addressRegion: shop.regionCountry }),
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
