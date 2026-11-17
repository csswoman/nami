import "server-only";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { stores } from "./db/schema";
import { resetSeedStores } from "./db/seed-data";
import { logError } from "./log";

import { DEMO_RESTORE_MINUTES } from "@/lib/demo/restore";
export { DEMO_RESTORE_MINUTES };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Marca que la tienda se salió del seed. Solo guarda el primer cambio: la cuenta no se reinicia con cada clic.
 * Usa la hora real de la BD (no el `now` simulado de las acciones) para que el plazo siempre sea de verdad.
 */
export async function markCatalogChanged(storeId: string, conn: Tx | typeof db = db): Promise<void> {
  await conn.update(stores).set({ catalogChangedAt: sql`now()` }).where(and(eq(stores.id, storeId), isNull(stores.catalogChangedAt)));
}

/**
 * Devuelve al seed las tiendas cambiadas hace más de DEMO_RESTORE_MINUTES. Devuelve sus slugs.
 * El UPDATE … RETURNING reclama cada tienda dentro de la transacción: si dos peticiones llegan a la vez,
 * la segunda espera el bloqueo de la fila y ya no la ve vencida, así que cada tienda se repone una sola vez.
 */
export async function restoreStaleStores(now?: number): Promise<string[]> {
  // Sin `now`, el corte lo calcula Postgres: así no hay Date.now() durante el render de una página
  // (con cacheComponents, Next lo prohíbe al prerenderizar). Las pruebas pasan un `now` para simular el paso del tiempo.
  const cutoff = now === undefined ? sql`now() - make_interval(mins => ${DEMO_RESTORE_MINUTES})` : new Date(now - DEMO_RESTORE_MINUTES * 60_000);
  // Lo normal es que no haya ninguna: una consulta barata evita abrir una transacción en cada lectura.
  const [any] = await db.select({ id: stores.id }).from(stores).where(lt(stores.catalogChangedAt, cutoff)).limit(1);
  if (!any) return [];
  return db.transaction(async (tx) => {
    const claimed = await tx.update(stores).set({ catalogChangedAt: null }).where(lt(stores.catalogChangedAt, cutoff)).returning({ slug: stores.slug });
    for (const { slug } of claimed) await resetSeedStores(tx, slug);
    return claimed.map((c) => c.slug);
  });
}

/** Igual que `restoreStaleStores`, pero nunca rompe la lectura que la llama: si falla, se registra y sigue. */
export async function restoreStaleStoresSafely(): Promise<void> {
  try {
    await restoreStaleStores();
  } catch (e) {
    await logError("demo-restore", e);
  }
}
