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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "BizManager - Gestion Commerciale",
  description: "Plateforme de gestion commerciale pour petits commerçants et entrepreneurs",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BizManager",
  },
  formatDetection: {
    telephone: false,
  },
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      url: "/apple-touch-icon.png",
      sizes: "180x180",
    },
    {
      rel: "image_src",
      url: "/icon-512.png",
    },
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://bizmanager.app",
    title: "BizManager - Gestion Commerciale",
    description: "Plateforme de gestion commerciale pour petits commerçants",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "BizManager Logo",
      },
    ],
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
    <html lang="fr" className={`${appSans.variable} ${appMono.variable}`}>
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
        {children}
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
      </body>
    </html>
  );
}
