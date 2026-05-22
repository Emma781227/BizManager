import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmanager.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shop/"],
        disallow: [
          "/dashboard",
          "/admin",
          "/api/",
          "/orders",
          "/products",
          "/customers",
          "/settings",
          "/whatsapp",
          "/shops",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
