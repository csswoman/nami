import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { rateLimits } from "./db/schema";
import { logError } from "./log";

export type RateLimit = { limit: number; windowMs: number };
export type RateLimitResult = { ok: boolean; remaining: number; retryAfterS: number };

/**
 * Límites de la demo pública. Generosos para una persona probando la app; cortan un script que la llene de pedidos.
 * Se cuentan por IP: el token de invitado no sirve, porque cualquiera puede pedir uno nuevo borrando la cookie.
 */
export const LIMITS = {
  /** POST /api/orders y la Server Action del checkout. */
  orders: { limit: 10, windowMs: 10 * 60_000 },
  /** Cambios desde el panel de tienda (acciones, inventario, horario, abrir/cerrar, reponer). */
  panel: { limit: 60, windowMs: 60_000 },
  /** «Simular pedido entrante» del panel: crea pedidos, así que va aparte y es más corto. */
  simulate: { limit: 8, windowMs: 10 * 60_000 },
  /** Acciones de la app del repartidor (tomar, recoger, llegar). */
  rider: { limit: 60, windowMs: 60_000 },
} satisfies Record<string, RateLimit>;

/**
 * Cuenta una petición para `key` en una ventana fija y dice si pasa.
 * Un solo INSERT … ON CONFLICT DO UPDATE: Postgres serializa las peticiones simultáneas sobre la misma fila,
 * así que con N a la vez pasan exactamente `limit` (lo prueba tests/db/concurrency.test.ts).
 * `RATE_LIMIT=off` lo desactiva (Playwright, que hace muchos pedidos seguidos desde la misma IP).
 */
export async function hitRateLimit(key: string, { limit, windowMs }: RateLimit, now: number = Date.now()): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT === "off") return { ok: true, remaining: limit, retryAfterS: 0 };
  const at = new Date(now);
  const cutoff = new Date(now - windowMs);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart: at, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      // En el SET, rate_limits.* es la fila vieja: si su ventana venció, empieza una nueva.
      set: {
        count: sql`case when ${rateLimits.windowStart} <= ${cutoff.toISOString()}::timestamptz then 1 else ${rateLimits.count} + 1 end`,
        windowStart: sql`case when ${rateLimits.windowStart} <= ${cutoff.toISOString()}::timestamptz then ${at.toISOString()}::timestamptz else ${rateLimits.windowStart} end`,
      },
    })
    .returning({ count: rateLimits.count, windowStart: rateLimits.windowStart });
  const resetAt = row.windowStart.getTime() + windowMs;
  return { ok: row.count <= limit, remaining: Math.max(0, limit - row.count), retryAfterS: Math.max(1, Math.ceil((resetAt - now) / 1000)) };
}

/** Como `hitRateLimit`, pero si la BD falla deja pasar: el límite protege la demo, no debe tumbarla. */
export async function checkRateLimit(key: string, limit: RateLimit): Promise<RateLimitResult> {
  try {
    return await hitRateLimit(key, limit);
  } catch (e) {
    await logError("rate-limit", e, { bucket: key.split(":")[0] });
    return { ok: true, remaining: limit.limit, retryAfterS: 0 };
  }
}

/** Mensaje para el 429, en el tono de la app. */
export function rateLimitMessage(retryAfterS: number): string {
  return retryAfterS < 60 ? `Vas muy rápido. Intenta de nuevo en ${retryAfterS} s.` : `Vas muy rápido. Intenta de nuevo en ${Math.ceil(retryAfterS / 60)} min.`;
}
