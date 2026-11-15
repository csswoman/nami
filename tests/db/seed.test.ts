import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, expect, it } from "vitest";
import { exchangeRates, products, storeHours, stores } from "@/server/db/schema";

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const db = drizzle(pool);
afterAll(() => pool.end());

it("las migraciones y el seed dejaron tiendas, productos y tasa", async () => {
  const [s] = await db.select({ n: count() }).from(stores);
  const [p] = await db.select({ n: count() }).from(products);
  const [r] = await db.select({ n: count() }).from(exchangeRates);
  expect(s.n).toBeGreaterThan(0);
  expect(p.n).toBeGreaterThan(0);
  expect(r.n).toBeGreaterThan(0);
});

it("cada tienda tiene horario para los 7 días", async () => {
  const [s] = await db.select({ n: count() }).from(stores);
  const [h] = await db.select({ n: count() }).from(storeHours);
  expect(h.n).toBe(s.n * 7);
});
