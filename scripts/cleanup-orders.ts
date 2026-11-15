/**
 * Borra los pedidos de más de 7 días (y sus paradas y productos, por cascade) y devuelve el catálogo al seed
 * (precios, stock, horarios y estado abierto/cerrado que cambió cualquier visitante desde el panel de tienda).
 * Uso: npm run db:cleanup            (DAYS=3 npm run db:cleanup para otro plazo; KEEP_CATALOG=1 para no tocar el catálogo)
 * Igual que el seed: lee .env.development.local y se niega a tocar un host remoto
 * salvo que lo pidas: CLEANUP_ALLOW_REMOTE=1 npm run db:cleanup
 */
import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { lt } from "drizzle-orm";
import { Pool } from "pg";
import { orders } from "../src/server/db/schema";
import { resetSeedStores } from "../src/server/db/seed-data";
loadEnvConfig(process.cwd(), true);
const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL");
const host = new URL(url).hostname;
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
if (!isLocal && process.env.CLEANUP_ALLOW_REMOTE !== "1") {
  throw new Error(`DATABASE_URL apunta a ${host}, que no es local. Si es intencional: CLEANUP_ALLOW_REMOTE=1`);
}
const days = Number(process.env.DAYS ?? 7);
if (!Number.isFinite(days) || days < 0) throw new Error("DAYS debe ser un número de días mayor o igual a 0");
const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle(pool);
async function main() {
  try {
    const cutoff = new Date(Date.now() - days * 86_400_000);
    const gone = await db.delete(orders).where(lt(orders.createdAt, cutoff)).returning({ id: orders.id });
    console.log(`Listo en ${host}: ${gone.length} pedidos de más de ${days} días borrados.`);
    if (process.env.KEEP_CATALOG !== "1") {
      const n = await db.transaction((tx) => resetSeedStores(tx));
      console.log(`Catálogo repuesto: ${n} tiendas como en el seed.`);
    }
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
