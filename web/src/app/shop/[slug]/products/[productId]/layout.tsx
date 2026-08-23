import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmanager.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}): Promise<Metadata> {
  const { slug, productId } = await params;

  const product = await prisma.product.findFirst({
    where: { id: productId, shop: { slug } },
    select: {
      name: true,
      description: true,
      imageUrl: true,
      unitPrice: true,
      stock: true,
      shop: { select: { name: true } },
    },
  });

  if (!product) {
    return { title: "Produit introuvable", robots: { index: false } };
  }

  const title = product.name;
  const price = parseFloat(String(product.unitPrice)).toLocaleString("fr-FR");
  const description =
    product.description ||
    `${product.name}, ${price} FCFA. Disponible dans la boutique ${product.shop.name}. Commandez via WhatsApp.`;
  const image = product.imageUrl || `${appUrl}/icon-512.png`;
  const url = `${appUrl}/shop/${slug}/products/${productId}`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url,
      title: `${title} | ${product.shop.name}`,
      description,
      siteName: "BizManager",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${product.shop.name}`,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  const product = await prisma.product.findFirst({
    where: { id: productId, shop: { slug } },
    select: {
      name: true,
      description: true,
      imageUrl: true,
      imageVariants: true,
      unitPrice: true,
      stock: true,
      category: true,
      shop: { select: { name: true } },
    },
  });

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        ...(product.description && { description: product.description }),
        ...(product.imageUrl && {
          image: [product.imageUrl, ...(product.imageVariants ?? [])].filter(Boolean),
        }),
        ...(product.category && { category: product.category }),
        offers: {
          "@type": "Offer",
          price: parseFloat(String(product.unitPrice)).toFixed(0),
          priceCurrency: "XAF",
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url: `${appUrl}/shop/${slug}/products/${productId}`,
        },
        brand: {
          "@type": "Brand",
          name: product.shop.name,
        },
      }
    : null;

  const breadcrumb = product
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: product.shop.name,
            item: `${appUrl}/shop/${slug}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: product.name,
            item: `${appUrl}/shop/${slug}/products/${productId}`,
          },
        ],
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
      {breadcrumb && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
      )}
      {children}
    </>
  );
}
