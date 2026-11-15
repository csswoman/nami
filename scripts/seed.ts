/**
 * Carga los datos de demo (tiendas, productos y tasa) en Postgres.
 * Uso: npm run db:seed
 * Por defecto lee .env.development.local (Postgres local). Se niega a escribir en un host remoto
 * salvo que lo pidas: SEED_ALLOW_REMOTE=1 npm run db:seed
 * Es repetible: actualiza las tiendas por slug y reemplaza sus productos (con sus opciones).
 */
import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { exchangeRates, productOptionGroups, productOptions, products, storeHours, stores } from "../src/server/db/schema";
import { RESTAURANTS, STORES } from "../src/lib/demo/catalog";
import { DEMO_RATE } from "../src/lib/demo/home";
import { MARKETS } from "../src/lib/demo/mercado";
import { BAKERY_SLUGS } from "../src/lib/demo/tiendas";
import { optionGroupsFor, type OptionGroup } from "../src/lib/demo/producto";
loadEnvConfig(process.cwd(), true);
const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL");
const host = new URL(url).hostname;
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
if (!isLocal && process.env.SEED_ALLOW_REMOTE !== "1") {
  throw new Error(`DATABASE_URL apunta a ${host}, que no es local. Si es intencional: SEED_ALLOW_REMOTE=1`);
}
/** "3:00 p. m." (o "Abre mañana a las 6:00 a. m.") → minutos desde la medianoche; null si no hay hora. */
function clockMinutes(text: string): number | null {
  const m = text.match(/(\d{1,2}):(\d{2})\s*([ap])\. m\./);
  if (!m) return null;
  return (Number(m[1]) % 12) * 60 + Number(m[2]) + (m[3] === "p" ? 720 : 0);
}
/** Horario a partir de los textos de demo. Si cierra antes de abrir, cierra después de medianoche (> 1440). */
function hoursOf(opensText: string | null, closesText: string | null): { opensAt: number | null; closesAt: number | null } {
  const opensAt = opensText ? clockMinutes(opensText) : null;
  let closesAt = closesText ? clockMinutes(closesText) : null;
  if (closesAt !== null && closesAt <= (opensAt ?? 0)) closesAt += 1440;
  return { opensAt, closesAt };
}
/** "20–30 min" → [20, 30]. */
function etaOf(text: string): { etaMin: number | null; etaMax: number | null } {
  const m = text.match(/(\d+)\D+(\d+)/);
  return m ? { etaMin: Number(m[1]), etaMax: Number(m[2]) } : { etaMin: null, etaMax: null };
}
/** Mañana a las 7:00 a. m. de Caracas (UTC-4): el "Vuelve mañana" de los agotados de demo. */
function tomorrowSevenCaracas(): Date {
  const c = new Date(Date.now() - 4 * 3_600_000);
  return new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate() + 1, 11));
}
const soldOutUntil = tomorrowSevenCaracas();
type SeedProduct = {
  slug: string; name: string; description: string; priceCents: number; imageUrl: string | null; icon: string | null;
  section: string; sectionTitle: string; sortOrder: number; unit: string | null; oldPriceCents: number | null; stock: number | null; isAvailable: boolean; soldOutUntil: Date | null;
  groups: OptionGroup[];
};
type SeedStore = {
  slug: string; name: string; category: "comida" | "mercado" | "farmacia" | "tienda"; description: string;
  imageUrl: string | null; deliveryFeeCents: number; isOpen: boolean;
  kind: "restaurante" | "mercado"; minOrderCents: number; initials: string; color: string;
  opensAt: number | null; closesAt: number | null; rating: string | null; reviews: string | null;
  etaMin: number | null; etaMax: number | null; plusFree: boolean; area: string | null; tags: string[]; verticals: number[];
  products: SeedProduct[];
};
// Restaurantes del listado y el resto de tiendas con menú (panaderías, tiendas cerradas).
const rank = (slug: string) => { const i = RESTAURANTS.findIndex((r) => r.slug === slug); return i < 0 ? 99 : i; };
const restaurants: SeedStore[] = Object.values(STORES).sort((a, b) => rank(a.slug) - rank(b.slug)).map((d) => ({
  slug: d.slug, name: d.name, category: "comida", description: d.kind, imageUrl: `/brand/food/${d.heroImage}.jpg`,
  deliveryFeeCents: d.feeCents, isOpen: d.open,
  kind: "restaurante", minOrderCents: d.minOrderCents, initials: d.initials, color: d.color,
  ...hoursOf(d.opensAt, d.openUntil), rating: d.rating.replace(",", "."), reviews: d.reviews,
  ...etaOf(d.time), area: d.kind.split(" · ").at(-1) ?? null,
  plusFree: RESTAURANTS.find((r) => r.slug === d.slug)?.plusFree ?? false,
  tags: RESTAURANTS.find((r) => r.slug === d.slug)?.tags ?? [],
  verticals: [...(RESTAURANTS.some((r) => r.slug === d.slug) ? [0] : []), ...(BAKERY_SLUGS.includes(d.slug) ? [4] : [])],
  products: d.menu.flatMap((s) => s.items.map((i) => ({
    slug: i.id, name: i.name, description: i.desc, priceCents: i.priceCents, imageUrl: i.image ?? null, icon: i.icon,
    section: s.id, sectionTitle: s.title, sortOrder: 0, unit: null, oldPriceCents: null, stock: i.low ?? null, isAvailable: !i.soldOut, soldOutUntil: i.soldOut ? soldOutUntil : null,
    groups: optionGroupsFor(s.id),
  }))),
}));
const markets: SeedStore[] = Object.values(MARKETS).map((m) => ({
  slug: m.slug, name: m.name, category: m.kind === "Farmacia" ? "farmacia" : m.kind === "Tienda" ? "tienda" : "mercado", description: m.kind,
  imageUrl: null, deliveryFeeCents: m.feeCents, isOpen: true,
  kind: "mercado", minOrderCents: m.minOrderCents, initials: m.initials, color: m.color,
  // "Abierto todo el día" / "24 horas" → sin horario; "Hasta las 9:00 p. m." → solo hora de cierre.
  ...(m.hours === "Abierto 24 horas" ? { opensAt: 0, closesAt: 1440 } : hoursOf(null, m.hours)), rating: null, reviews: null,
  ...etaOf(m.time), area: m.area, plusFree: false, tags: [], verticals: [m.vertical],
  products: m.sections.flatMap((s) => s.products.map((p) => ({
    slug: p.id, name: p.name, description: p.unit, priceCents: p.priceCents, imageUrl: p.image ?? null, icon: null,
    section: s.id, sectionTitle: s.title, sortOrder: 0, unit: p.unit, oldPriceCents: p.oldPriceCents ?? null, stock: p.stock ?? null, isAvailable: !p.soldOut, soldOutUntil: p.soldOut ? soldOutUntil : null,
    groups: [],
  }))),
}));
const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle(pool);

async function main() {
  try {
    await db.transaction(async (tx) => {
      for (const [si, s] of [...restaurants, ...markets].entries()) {
        const { products: items, ...rest } = s;
        const row = { ...rest, sortOrder: si };
        const [st] = await tx.insert(stores).values(row).onConflictDoUpdate({ target: stores.slug, set: row }).returning({ id: stores.id });
        // Borrar los productos arrastra sus grupos y opciones (cascade).
        await tx.delete(products).where(eq(products.storeId, st.id));
        // Horario semanal: el mismo turno todos los días (se edita después desde el panel de la tienda).
        await tx.delete(storeHours).where(eq(storeHours.storeId, st.id));
        await tx.insert(storeHours).values(Array.from({ length: 7 }, (_, day) => ({ storeId: st.id, day, opensAt: rest.opensAt ?? 0, closesAt: rest.closesAt ?? 1440 })));
        const rows = await tx
          .insert(products)
          .values(items.map((p, i) => ({ ...p, sortOrder: i, storeId: st.id })))
          .returning({ id: products.id, slug: products.slug });
        const idOf = new Map(rows.map((r) => [r.slug, r.id]));
        for (const p of items) {
          for (const [gi, g] of p.groups.entries()) {
            const [grp] = await tx
              .insert(productOptionGroups)
              .values({ productId: idOf.get(p.slug)!, slug: g.id, title: g.title, hint: g.hint, kind: g.kind, required: g.required, maxSelect: g.max ?? null, sortOrder: gi })
              .returning({ id: productOptionGroups.id });
            await tx.insert(productOptions).values(
              g.options.map((o, oi) => ({ groupId: grp.id, slug: o.id, label: o.label, priceCents: o.priceCents, isDefault: g.defaults.includes(o.id), sortOrder: oi })),
            );
          }
        }
      }
      await tx.insert(exchangeRates).values({ bsPerUsd: String(DEMO_RATE), source: "demo" });
    });
    console.log(`Listo en ${host}: ${restaurants.length + markets.length} tiendas, ${[...restaurants, ...markets].reduce((n, s) => n + s.products.length, 0)} productos.`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
