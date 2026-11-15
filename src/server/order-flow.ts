import "server-only";
import { and, eq, gt, inArray, ne } from "drizzle-orm";
import { STAGE_COUNT, reachedStage } from "@/lib/orders/progress";
import { advanceOrderStatus, holdStageOf, stopStatusAtStage, type OrderStatusName, type StopStatus } from "@/lib/orders/stop-machine";
import type { db } from "./db";
import { orderStops, orders, stores } from "./db/schema";
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
/** Un panel abierto "atiende" la tienda mientras haya consultado hace menos de esto. */
export const PANEL_FRESH_MS = 30_000;
/** Estado general del pedido según la etapa del recorrido automático. */
export const STATUS_BY_STAGE: OrderStatusName[] = ["recibido", "preparando", "buscando_motorizado", "en_camino", "en_camino"];
const RANK: Partial<Record<StopStatus, number>> = { recibido: 0, aceptado: 1, preparando: 2, listo: 3 };
const EMPTY_STAGES = (): (number | null)[] => Array.from({ length: STAGE_COUNT }, () => null);
/** Ids de las tiendas (entre las dadas) cuyo panel está abierto ahora. */
export async function attendedStores(conn: Tx, storeIds: string[], now: number): Promise<Set<string>> {
  if (!storeIds.length) return new Set();
  const rows = await conn
    .select({ id: stores.id })
    .from(stores)
    .where(and(inArray(stores.id, storeIds), gt(stores.panelSeenAt, new Date(now - PANEL_FRESH_MS))));
  return new Set(rows.map((r) => r.id));
}
async function lockOrder(tx: Tx, orderId: string) {
  const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update").limit(1);
  return row ?? null;
}
const isClosed = (status: string) => status === "entregado" || status === "cancelado";
/**
 * Una tienda abre su panel: toma el control de los pedidos suyos que todavía no están listos.
 * Antes pone las paradas al día con el recorrido por tiempo, para que el cliente no vea un retroceso.
 */
export async function takeControl(tx: Tx, orderId: string, storeId: string, now: number): Promise<void> {
  const row = await lockOrder(tx, orderId);
  if (!row || isClosed(row.status) || row.holdStage != null) return;
  const stops = await tx.select().from(orderStops).where(eq(orderStops.orderId, orderId));
  const mine = stops.find((s) => s.storeId === storeId);
  if (!mine || mine.status === "cancelado" || (RANK[mine.status as StopStatus] ?? 9) >= 3) return;
  const stageAt = [...(row.stageAt ?? EMPTY_STAGES())];
  const stage = reachedStage({ status: "active", plan: row.plan ?? [], startAt: row.startAt.getTime(), stageAt, deliveredAt: null }, now);
  if (stage >= 2) return;
  const target = stopStatusAtStage(stage);
  await tx.update(orderStops).set({ status: target }).where(and(eq(orderStops.orderId, orderId), ne(orderStops.status, "cancelado")));
  if (stage === 1) stageAt[1] ??= now;
  await tx.update(orders).set({ holdStage: stage, stageAt }).where(eq(orders.id, orderId));
}
/**
 * Pone al día un pedido activo. Con una tienda al mando (`holdStage`), el estado sale de las paradas;
 * si nadie atiende, las paradas siguen el plan de tiempos de siempre.
 */
export async function reconcileOrder(tx: Tx, orderId: string, now: number): Promise<void> {
  const row = await lockOrder(tx, orderId);
  if (!row || isClosed(row.status)) return;
  const stops = await tx.select().from(orderStops).where(eq(orderStops.orderId, orderId));
  const plan = row.plan ?? [];
  let hold = row.holdStage;
  let startAt = row.startAt.getTime();
  const stageAt = [...(row.stageAt ?? EMPTY_STAGES())];
  const statuses = new Map(stops.map((s) => [s.id, s.status as StopStatus]));
  let rebased = false;
  if (hold != null) {
    const attended = await attendedStores(tx, stops.map((s) => s.storeId), now);
    const pendingOf = (id: string) => (RANK[statuses.get(id)!] ?? 9) < 3;
    const attendedPending = stops.some((s) => attended.has(s.storeId) && pendingOf(s.id));
    // Las tiendas sin panel abierto siguen el reloj del pedido, pero solo mientras otra tienda lo sigue atendiendo.
    if (attendedPending) {
      const clockStage = Math.min(2, reachedStage({ status: "active", plan, startAt: row.createdAt.getTime(), stageAt: EMPTY_STAGES(), deliveredAt: null }, now));
      for (const s of stops) {
        const cur = statuses.get(s.id)!;
        if (attended.has(s.storeId) || cur === "cancelado") continue;
        const target = stopStatusAtStage(clockStage);
        if ((RANK[target] ?? 0) > (RANK[cur] ?? 0)) statuses.set(s.id, target);
      }
    }
    const allReady = holdStageOf([...statuses.values()]) === null;
    const newHold = allReady || !attendedPending ? null : holdStageOf([...statuses.values()]);
    if (newHold === null) {
      // Todo está listo (o nadie atiende lo que falta): el recorrido sigue solo desde esa etapa.
      const from = allReady ? 2 : hold;
      for (let i = 0; i <= from; i++) stageAt[i] ??= now;
      startAt = now - (plan[from] ?? 0) * 60_000;
      rebased = true;
      hold = null;
    } else {
      hold = newHold;
      if (hold === 1) stageAt[1] ??= now;
    }
    const all = [...statuses.values()];
    if (all.length && all.every((s) => s === "cancelado")) {
      await persistStops(tx, stops, statuses);
      await tx.update(orders).set({ status: "cancelado", holdStage: null }).where(eq(orders.id, orderId));
      return;
    }
    if (hold !== null) {
      await persistStops(tx, stops, statuses);
      await tx.update(orders).set({ status: advanceOrderStatus(row.status as OrderStatusName, all), holdStage: hold, stageAt }).where(eq(orders.id, orderId));
      return;
    }
  }
  // Recorrido automático.
  const stage = reachedStage({ status: "active", plan, startAt, stageAt, deliveredAt: null }, now);
  for (const s of stops) if (statuses.get(s.id) !== "cancelado") statuses.set(s.id, stopStatusAtStage(stage));
  const all = [...statuses.values()];
  const next = all.length && all.every((s) => s === "cancelado") ? "cancelado" : STATUS_BY_STAGE[stage];
  await persistStops(tx, stops, statuses);
  const set: Partial<typeof orders.$inferInsert> = { status: next, holdStage: null };
  if (rebased) {
    set.startAt = new Date(startAt);
    set.stageAt = stageAt;
    set.deliveryStartedAt = new Date(startAt + (plan[3] ?? 0) * 60_000);
  }
  await tx.update(orders).set(set).where(eq(orders.id, orderId));
}
async function persistStops(tx: Tx, stops: (typeof orderStops.$inferSelect)[], statuses: Map<string, StopStatus>) {
  for (const s of stops) {
    const next = statuses.get(s.id)!;
    if (next !== s.status) await tx.update(orderStops).set({ status: next }).where(eq(orderStops.id, s.id));
  }
}
