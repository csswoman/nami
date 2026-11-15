/**
 * Carga los datos de demo (tiendas, productos y tasa) en Postgres.
 * Uso: npm run db:seed
 * Por defecto lee .env.development.local (Postgres local). Se niega a escribir en un host remoto
 * salvo que lo pidas: SEED_ALLOW_REMOTE=1 npm run db:seed
 * Es repetible: actualiza las tiendas por slug y reemplaza sus productos (con sus opciones).
 */
import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { exchangeRates } from "../src/server/db/schema";
import { writeFileSync } from "node:fs";
import { ZONES, storeLocation } from "../src/lib/geo";
import { ROUTE_CACHE, buildSeedStores, resetSeedStores } from "../src/server/db/seed-data";
import { completeRouteCache } from "../src/server/db/seed-routes";
import { DEMO_RATE } from "../src/lib/demo/home";
loadEnvConfig(process.cwd(), true);
const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL");
const host = new URL(url).hostname;
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
if (!isLocal && process.env.SEED_ALLOW_REMOTE !== "1") {
  throw new Error(`DATABASE_URL apunta a ${host}, que no es local. Si es intencional: SEED_ALLOW_REMOTE=1`);
}
const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle(pool);
async function main() {
  try {
    // Rutas por calle: se piden a OSRM solo las que falten en route-cache.json (SEED_ROUTING=estimate no usa la red).
    const pairs = buildSeedStores().flatMap((st) => ZONES.map((zone) => ({ slug: st.slug, from: storeLocation(st.slug, st.area), zone })));
    const mode = process.env.SEED_ROUTING === "estimate" ? "estimate" : "osrm";
    const { cache, changed } = await completeRouteCache(ROUTE_CACHE, pairs, mode, console.log);
    if (changed) writeFileSync(new URL("../src/server/db/route-cache.json", import.meta.url), JSON.stringify(cache) + "\n");
    let count = 0;
    await db.transaction(async (tx) => {
      count = await resetSeedStores(tx, undefined, cache);
      await tx.insert(exchangeRates).values({ bsPerUsd: String(DEMO_RATE), source: "demo" });
    });
    console.log(`Listo en ${host}: ${count} tiendas con sus productos.`);
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
