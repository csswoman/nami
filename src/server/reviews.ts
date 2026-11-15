import "server-only";
import { and, count, desc, eq, inArray, ne, sum } from "drizzle-orm";
import { reachedStage } from "@/lib/orders/progress";
import { reviewInputSchema, type ReviewInput } from "@/lib/reviews";
import { db } from "./db";
import { orderStops, reviews, stores } from "./db/schema";
import { OrderError, getOrder } from "./orders";
export type RatingStat = { count: number; sum: number };
/** Cantidad y suma de estrellas de las reseñas de cada tienda (las tiendas sin reseñas no aparecen). */
export async function reviewStats(storeIds: string[]): Promise<Map<string, RatingStat>> {
  const out = new Map<string, RatingStat>();
  if (!storeIds.length) return out;
  const rows = await db
    .select({ storeId: reviews.storeId, n: count(), total: sum(reviews.rating) })
    .from(reviews)
    .where(inArray(reviews.storeId, storeIds))
    .groupBy(reviews.storeId);
  for (const r of rows) out.set(r.storeId, { count: r.n, sum: Number(r.total ?? 0) });
  return out;
}
/**
 * Guarda la reseña de un pedido entregado (o ya llegado). La misma calificación aplica a cada tienda del pedido
 * que lo atendió; si ya había reseña, se actualiza. Un pedido cancelado o en curso no se puede reseñar.
 */
export async function submitReview(orderId: string, guestToken: string, raw: unknown, now: number = Date.now()): Promise<{ stores: number } | null> {
  const parsed = reviewInputSchema.safeParse(raw);
  if (!parsed.success) throw new OrderError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Reseña inválida.", 400);
  const input: ReviewInput = parsed.data;
  const order = await getOrder(orderId, guestToken, now);
  if (!order) return null;
  if (order.status === "cancelled" || (order.status !== "delivered" && reachedStage(order, now) < 4)) {
    throw new OrderError("NOT_REVIEWABLE", "Solo puedes calificar un pedido que ya llegó.", 409);
  }
  const stops = await db.select({ storeId: orderStops.storeId }).from(orderStops).where(and(eq(orderStops.orderId, orderId), ne(orderStops.status, "cancelado")));
  if (!stops.length) throw new OrderError("NOT_REVIEWABLE", "Ninguna tienda atendió este pedido.", 409);
  await db.transaction(async (tx) => {
    for (const s of stops) {
      const row = { orderId, storeId: s.storeId, rating: input.rating, tags: input.tags, comment: input.comment || null, createdAt: new Date(now) };
      await tx.insert(reviews).values(row).onConflictDoUpdate({ target: [reviews.orderId, reviews.storeId], set: row });
    }
  });
  return { stores: stops.length };
}
export type StoreReview = { rating: number; tags: string[]; comment: string | null; createdAt: number };
/** Últimas reseñas de una tienda. */
export async function listReviews(storeId: string, limit = 5): Promise<StoreReview[]> {
  const rows = await db.select().from(reviews).where(eq(reviews.storeId, storeId)).orderBy(desc(reviews.createdAt)).limit(limit);
  return rows.map((r) => ({ rating: r.rating, tags: r.tags, comment: r.comment, createdAt: r.createdAt.getTime() }));
}
/** Id de una tienda por su slug. */
export async function storeIdOf(slug: string): Promise<string | null> {
  const [row] = await db.select({ id: stores.id }).from(stores).where(eq(stores.slug, slug)).limit(1);
  return row?.id ?? null;
}
