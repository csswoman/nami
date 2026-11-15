import type { Metadata } from "next";
import Script from "next/script";
import { CartProvider } from "@/components/cart/CartProvider";
import { getSiteUrl, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/seo";
import { figtree, nunito } from "./fonts";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: SITE_TITLE,
    template: "%s",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Karla" }],
  creator: "Karla",
  keywords: [
    "Ñami",
    "delivery Venezuela",
    "delivery Caracas",
    "comida a domicilio",
    "supermercado online",
    "farmacia delivery",
    "portafolio Next.js",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: "/brand/app-icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/brand/app-icon.png", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: siteUrl.origin,
  applicationCategory: "ShoppingApplication",
  operatingSystem: "Web",
  inLanguage: "es-VE",
  image: `${siteUrl.origin}${OG_IMAGE.url}`,
  author: {
    "@type": "Person",
    name: "Karla",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE" data-theme="light" suppressHydrationWarning className={`${nunito.variable} ${figtree.variable}`}>
      <body>
        {/* Aplica el tema guardado antes de hidratar. Sin elección previa, claro (no sigue al sistema). */}
        <Script id="nami-theme" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem("nami-theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){}`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CartProvider />
        {children}
      </body>
    </html>
  );
}
