import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const appSans = Manrope({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

const appMono = IBM_Plex_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bizmanager.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "BizManager — Créez votre boutique en ligne",
    template: "%s | BizManager",
  },
  description:
    "BizManager est la plateforme e-commerce pour commerçants africains. Créez votre boutique, gérez vos produits et recevez des commandes via WhatsApp.",
  keywords: ["boutique en ligne", "e-commerce Afrique", "commande WhatsApp", "gestion commerciale", "BizManager"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BizManager",
  },
  formatDetection: { telephone: false },
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
    { rel: "image_src", url: "/icon-512.png" },
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: APP_URL,
    siteName: "BizManager",
    title: "BizManager — Créez votre boutique en ligne",
    description:
      "Plateforme e-commerce pour commerçants africains. Boutique en ligne, gestion des commandes et communication via WhatsApp.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "BizManager" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BizManager — Créez votre boutique en ligne",
    description:
      "Plateforme e-commerce pour commerçants africains. Boutique en ligne, gestion des commandes et communication via WhatsApp.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f7d5f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${appSans.variable} ${appMono.variable}`} data-scroll-behavior="smooth">
      <head>
        <meta name="description" content="Plateforme de gestion commerciale pour petits commerçants" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BizManager" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "BizManager",
              url: APP_URL,
              logo: `${APP_URL}/icon-512.png`,
              description:
                "Plateforme e-commerce multi-tenant pour commerçants africains",
              sameAs: [],
            }),
          }}
        />
        {children}
        {process.env.NODE_ENV === "production" ? (
          <Script
            id="register-sw"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' })
                      .then((registration) => {
                        console.log('[PWA] Service Worker enregistré:', registration);
                      })
                      .catch((error) => {
                        console.log('[PWA] Erreur enregistrement Service Worker:', error);
                      });
                  });
                }
              `,
            }}
          />
        ) : (
          <Script
            id="unregister-sw-dev"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations()
                    .then((registrations) => {
                      registrations.forEach((registration) => registration.unregister());
                    })
                    .catch(() => undefined);

                  if (window.caches) {
                    caches.keys()
                      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
                      .catch(() => undefined);
                  }
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
