/**
 * Carga los datos de demo (tiendas, productos y tasa) en Postgres.
 * Uso: npm run db:seed
 * Por defecto lee .env.development.local (Postgres local). Se niega a escribir en un host remoto
 * salvo que lo pidas: SEED_ALLOW_REMOTE=1 npm run db:seed
 * Es repetible: actualiza las tiendas por slug y reemplaza sus productos.
 */
import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { exchangeRates, products, stores } from "../src/server/db/schema";
import { STORES } from "../src/lib/demo/catalog";
import { DEMO_RATE } from "../src/lib/demo/home";
import { MARKETS } from "../src/lib/demo/mercado";

loadEnvConfig(process.cwd(), true);

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL");
const host = new URL(url).hostname;
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
if (!isLocal && process.env.SEED_ALLOW_REMOTE !== "1") {
  throw new Error(`DATABASE_URL apunta a ${host}, que no es local. Si es intencional: SEED_ALLOW_REMOTE=1`);
}

type SeedStore = {
  slug: string; name: string; category: "comida" | "mercado" | "farmacia" | "tienda"; description: string;
  imageUrl: string | null; deliveryFeeCents: number; isOpen: boolean;
  products: { name: string; description: string; priceCents: number; isAvailable: boolean }[];
};

// Restaurantes del listado y el resto de tiendas con menú (panaderías, tiendas cerradas).
const restaurants: SeedStore[] = Object.values(STORES).map((d) => ({
  slug: d.slug, name: d.name, category: "comida", description: d.kind, imageUrl: `/brand/food/${d.heroImage}.svg`,
  deliveryFeeCents: d.feeCents, isOpen: d.open,
  products: d.menu.flatMap((s) => s.items.map((i) => ({ name: i.name, description: i.desc, priceCents: i.priceCents, isAvailable: !i.soldOut }))),
}));

const markets: SeedStore[] = Object.values(MARKETS).map((m) => ({
  slug: m.slug, name: m.name, category: m.kind === "Farmacia" ? "farmacia" : m.kind === "Tienda" ? "tienda" : "mercado", description: `${m.kind} · ${m.area}`,
  imageUrl: null, deliveryFeeCents: m.feeCents, isOpen: true,
  products: m.sections.flatMap((s) => s.products.map((p) => ({ name: p.name, description: p.unit, priceCents: p.priceCents, isAvailable: !p.soldOut }))),
}));

const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle(pool);

async function main() {
  try {
    await db.transaction(async (tx) => {
      for (const s of [...restaurants, ...markets]) {
        const { products: items, ...row } = s;
        const [st] = await tx.insert(stores).values(row).onConflictDoUpdate({ target: stores.slug, set: row }).returning({ id: stores.id });
        await tx.delete(products).where(eq(products.storeId, st.id));
        await tx.insert(products).values(items.map((p) => ({ ...p, storeId: st.id })));
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
