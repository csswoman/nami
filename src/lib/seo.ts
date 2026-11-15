export const SITE_NAME = "Ñami";
export const SITE_TITLE = "Ñami · Tu delivery, en un solo lugar";
export const SITE_DESCRIPTION =
  "App venezolana de delivery: comida, mercado, farmacia y tiendas en un solo lugar. Proyecto de portafolio con compra simulada y seguimiento en vivo, sin registro.";

export const OG_IMAGE = {
  url: "/brand/og-image.png",
  width: 1200,
  height: 630,
  alt: "Ñami — Tu delivery, en un solo lugar",
} as const;

export function getSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "http://localhost:3000";

  return new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
}
