/* eslint-disable @next/next/no-img-element -- ImageResponse (next/og) solo entiende <img>. */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import tokens from "../../design/tokens.json";
import { getStore } from "./catalog";

/**
 * Imagen para compartir (Open Graph) de cada tienda: foto, nombre, calificación y tiempo de entrega.
 * Así un enlace a una tienda en WhatsApp o LinkedIn muestra esa tienda, no la imagen genérica de la app.
 * Los colores salen de design/tokens.json (el sistema de diseño), no de valores sueltos.
 */
export const OG_SIZE = { width: 1200, height: 630 };

type Token = { name: string; value: string | { light: string; dark: string } };
const color = (name: string): string => {
  const t = (tokens.color.tokens as Token[]).find((x) => x.name === name);
  if (!t) throw new Error(`Falta el token ${name}`);
  return typeof t.value === "string" ? t.value : t.value.light;
};

async function dataUrl(path: string, type: string): Promise<string | null> {
  try {
    const buf = await readFile(join(process.cwd(), "public", path));
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
/** Nunito (la tipografía de títulos de Ñami) desde Google Fonts; si no hay red, la imagen usa la fuente por defecto. */
async function nunito(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Nunito:wght@${weight}`)).text();
    const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function storeOgImage(slug: string): Promise<ImageResponse> {
  const store = await getStore(slug);
  const [photo, logo, bird, font] = await Promise.all([
    dataUrl(`brand/stores/${slug}.jpg`, "image/jpeg"),
    dataUrl("brand/nami-logo.png", "image/png"),
    dataUrl("brand/guacamaya-moto.png", "image/png"),
    nunito(800),
  ]);
  const ink = color("ink");
  const surface = color("surface");
  const name = store?.name ?? "Ñami";
  const meta = store ? [store.rating ? `${store.rating} de 5` : null, store.time, store.area].filter(Boolean).join("  ·  ") : "Tu delivery, en un solo lugar";
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: color("brand-cream"), fontFamily: font ? "Nunito" : undefined }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640, padding: 64 }}>
          {logo ? <img src={logo} alt="" height={56} style={{ alignSelf: "flex-start" }} /> : <span style={{ fontSize: 48, color: color("primary-text") }}>Ñami</span>}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 800, color: ink }}>{name}</span>
            {store?.description ? <span style={{ fontSize: 28, color: color("ink-muted") }}>{store.description}</span> : null}
            <span style={{ fontSize: 28, color: ink }}>{meta}</span>
          </div>
          <span style={{ display: "flex", alignSelf: "flex-start", padding: "12px 24px", borderRadius: 999, background: color("primary"), color: color("on-primary"), fontSize: 26, fontWeight: 800 }}>
            Pide en Ñami · Demo sin registro
          </span>
        </div>
        <div style={{ display: "flex", position: "relative", width: 560, height: "100%", background: color("brand") }}>
          {photo ? <img src={photo} alt="" width={560} height={630} style={{ objectFit: "cover" }} /> : null}
          {bird ? <img src={bird} alt="" height={260} style={{ position: "absolute", right: 24, bottom: 16 }} /> : null}
          <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: 8, height: "100%", background: surface }} />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: font ? [{ name: "Nunito", data: font, weight: 800, style: "normal" }] : undefined },
  );
}
