import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Un solo driver (node-postgres) para Docker y Neon: soporta transacciones.
const globalForDb = globalThis as unknown as { __namiPool?: Pool };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");
  return new Pool({ connectionString: url, max: 5 });
}

const pool = (globalForDb.__namiPool ??= createPool());

export const db = drizzle(pool, { schema });
export type Db = typeof db;
