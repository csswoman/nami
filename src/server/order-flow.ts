import "server-only";
import { and, eq, gt, inArray, ne } from "drizzle-orm";
import { STAGE_COUNT, reachedStage } from "@/lib/orders/progress";
import { advanceOrderStatus, holdStageOf, stopStatusAtStage, type OrderStatusName, type StopStatus } from "@/lib/orders/stop-machine";
import { isSimulatedToken } from "@/lib/guest";
import { usdToVesCents } from "@/lib/money";
import { repriceOrder } from "@/lib/pricing/reprice";
import type { db } from "./db";
import { coupons, orderStops, orders, riderSessions, stores } from "./db/schema";
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type OrderRow = typeof orders.$inferSelect;
type StopRow = typeof orderStops.$inferSelect;
/** Un panel abierto "atiende" la tienda mientras haya consultado hace menos de esto. */
export const PANEL_FRESH_MS = 30_000;
/** Un repartidor de la demo sigue conectado mientras /repartidor haya consultado hace menos de esto. */
export const RIDER_FRESH_MS = 30_000;
/** Un pedido listo espera a que el repartidor lo tome a lo sumo esto; después se asigna solo. */
export const RIDER_WAIT_MS = 90_000;
/** Con el panel abierto, la tienda tiene esto para aceptar un pedido. Después su parte se cancela sola. */
export const ACCEPT_TIMEOUT_MS = 5 * 60_000;
export const TIMEOUT_REASON = "La tienda no respondió a tiempo.";
/** Cupón de disculpa cuando las tiendas cancelan un pedido entero (no cuando lo cancela el cliente). */
export const COMPENSATION_CENTS = 200;
const COMPENSATION_DAYS = 7;
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
/** ¿Hay un repartidor conectado? Con `token`, ese en concreto; sin él, cualquiera. */
export async function riderOnline(conn: Tx, token: string | null, now: number): Promise<boolean> {
  const fresh = gt(riderSessions.seenAt, new Date(now - RIDER_FRESH_MS));
  const [row] = await conn.select({ t: riderSessions.token }).from(riderSessions).where(token ? and(eq(riderSessions.token, token), fresh) : fresh).limit(1);
  return !!row;
}
async function lockOrder(tx: Tx, orderId: string) {
  const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update").limit(1);
  return row ?? null;
}
const isClosed = (status: string) => status === "entregado" || status === "cancelado";
/**
 * Qué repartidor puede llevar un pedido: el mismo invitado que lo pidió (en /demo los tres lados comparten la cookie),
 * o cualquiera si es un pedido simulado desde el panel. Así un visitante con /repartidor abierto nunca frena
 * los pedidos de otros visitantes.
 */
const riderScope = (row: OrderRow): string | null => (isSimulatedToken(row.guestToken) ? null : row.guestToken);
/** ¿Todavía puede esperar a un repartidor? Solo un rato desde que quedó listo. */
const canWaitRider = (stageAt: (number | null)[], now: number) => now - (stageAt[2] ?? now) <= RIDER_WAIT_MS;
/** ¿La etapa retenida es de un repartidor (2 = va a la tienda o espera uno, 3 = ya recogió)? */
export const isRiderHold = (hold: number | null): hold is number => hold != null && hold >= 2;
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
/** Cuándo empezó a correr el plazo para aceptar: la hora del pedido, o la de inicio si estaba programado. */
const acceptFrom = (row: OrderRow) => (row.scheduledFor ?? row.createdAt).getTime();
/**
 * Pone al día un pedido activo. Con una tienda al mando (`holdStage` 0–1), el estado sale de las paradas;
 * con un repartidor de la demo (2–3), lo marca él; si nadie atiende, las paradas siguen el plan de tiempos.
 * Al final recalcula los montos (lo cancelado no se cobra) y, si las tiendas cancelaron todo, deja un cupón de disculpa.
 */
export async function reconcileOrder(tx: Tx, orderId: string, now: number): Promise<void> {
  const row = await lockOrder(tx, orderId);
  if (!row || isClosed(row.status)) return;
  const stops = await tx.select().from(orderStops).where(eq(orderStops.orderId, orderId));
  await advance(tx, row, stops, now);
  await settle(tx, orderId, now);
}
async function advance(tx: Tx, row: OrderRow, stops: StopRow[], now: number): Promise<void> {
  const orderId = row.id;
  const plan = row.plan ?? [];
  let hold = row.holdStage;
  let startAt = row.startAt.getTime();
  const stageAt = [...(row.stageAt ?? EMPTY_STAGES())];
  const statuses = new Map(stops.map((s) => [s.id, s.status as StopStatus]));
  let rebased = false;
  let releaseRider = false;
  if (isRiderHold(hold)) {
    // Con el repartidor conectado, el pedido espera sus botones. Si se fue, el recorrido sigue solo desde esa etapa.
    const keep = row.riderToken !== null ? await riderOnline(tx, row.riderToken, now) : canWaitRider(stageAt, now) && (await riderOnline(tx, riderScope(row), now));
    if (keep) {
      const target: StopStatus = hold === 2 ? "listo" : "en_camino";
      for (const s of stops) if (statuses.get(s.id) !== "cancelado") statuses.set(s.id, target);
      await persistStops(tx, stops, statuses);
      await tx.update(orders).set({ status: hold === 2 ? "buscando_motorizado" : "en_camino" }).where(eq(orders.id, orderId));
      return;
    }
    for (let i = 0; i <= hold; i++) stageAt[i] ??= now;
    startAt = now - (plan[hold] ?? 0) * 60_000;
    rebased = true;
    releaseRider = true;
    hold = null;
  }
  if (hold != null) {
    const attended = await attendedStores(tx, stops.map((s) => s.storeId), now);
    // Una tienda con el panel abierto que no acepta a tiempo pierde su parte del pedido.
    const timedOut = stops.filter((s) => attended.has(s.storeId) && statuses.get(s.id) === "recibido" && now - acceptFrom(row) > ACCEPT_TIMEOUT_MS);
    for (const s of timedOut) statuses.set(s.id, "cancelado");
    if (timedOut.length) await tx.update(orderStops).set({ rejectReason: TIMEOUT_REASON }).where(inArray(orderStops.id, timedOut.map((s) => s.id)));
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
  const all = () => [...statuses.values()];
  // Pedido listo y un repartidor de la demo conectado: lo espera a él en vez de asignar uno solo.
  if (stage === 2 && !releaseRider && canWaitRider(stageAt, now) && !all().every((s) => s === "cancelado") && (await riderOnline(tx, riderScope(row), now))) {
    for (const s of stops) if (statuses.get(s.id) !== "cancelado") statuses.set(s.id, "listo");
    stageAt[2] ??= now;
    await persistStops(tx, stops, statuses);
    const set: Partial<typeof orders.$inferInsert> = { status: "buscando_motorizado", holdStage: 2, stageAt, riderToken: null };
    if (rebased) set.startAt = new Date(startAt);
    await tx.update(orders).set(set).where(eq(orders.id, orderId));
    return;
  }
  for (const s of stops) if (statuses.get(s.id) !== "cancelado") statuses.set(s.id, stopStatusAtStage(stage));
  const next = all().length && all().every((s) => s === "cancelado") ? "cancelado" : STATUS_BY_STAGE[stage];
  await persistStops(tx, stops, statuses);
  const set: Partial<typeof orders.$inferInsert> = { status: next, holdStage: null };
  if (releaseRider) set.riderToken = null;
  if (rebased) {
    set.startAt = new Date(startAt);
    set.stageAt = stageAt;
    set.deliveryStartedAt = new Date(startAt + (plan[3] ?? 0) * 60_000);
  }
  await tx.update(orders).set(set).where(eq(orders.id, orderId));
}
async function persistStops(tx: Tx, stops: StopRow[], statuses: Map<string, StopStatus>) {
  for (const s of stops) {
    const next = statuses.get(s.id)!;
    if (next !== s.status) await tx.update(orderStops).set({ status: next }).where(eq(orderStops.id, s.id));
  }
}
/**
 * Montos del pedido según sus paradas: lo que una tienda quitó, rechazó o no atendió a tiempo no se cobra.
 * Si las tiendas cancelaron todo el pedido, el cliente recibe un cupón de disculpa (una sola vez).
 */
export async function settle(tx: Tx, orderId: string, now: number): Promise<void> {
  const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!row) return;
  const stops = await tx.select().from(orderStops).where(eq(orderStops.orderId, orderId));
  if (row.status === "cancelado") {
    // El cliente canceló (tiene motivo): no hay disculpa que dar.
    if (!row.cancelReason && !row.compensationCode) await compensate(tx, row, now);
    return;
  }
  const r = repriceOrder(
    { delivery: row.deliveryMode, shippingCents: row.deliveryFeeCents, tipCents: row.tipCents, surchargeCents: row.surchargeCents, discountCents: row.discountCents },
    stops.map((s) => ({ subtotalCents: s.subtotalCents, feeCents: s.feeCents, cancelled: s.status === "cancelado" })),
  );
  if (!r) return;
  if (r.subtotalCents === row.subtotalCents && r.shippingCents === row.deliveryFeeCents && r.discountCents === row.discountCents && r.totalCents === row.totalCents) return;
  await tx
    .update(orders)
    .set({ subtotalCents: r.subtotalCents, deliveryFeeCents: r.shippingCents, discountCents: r.discountCents, totalCents: r.totalCents, totalBsCents: usdToVesCents(r.totalCents, Number(row.exchangeRate)) })
    .where(eq(orders.id, orderId));
}
/** Código del cupón de disculpa de un pedido. */
export const compensationCodeOf = (orderNumber: number) => `PERDON-${orderNumber}`;
async function compensate(tx: Tx, row: OrderRow, now: number): Promise<void> {
  const code = compensationCodeOf(row.number);
  await tx
    .insert(coupons)
    .values({
      code,
      description: "Disculpa por tu pedido cancelado",
      amountCents: COMPENSATION_CENTS,
      expiresAt: new Date(now + COMPENSATION_DAYS * 86_400_000),
      guestToken: row.guestToken,
    })
    .onConflictDoNothing();
  await tx.update(orders).set({ compensationCode: code }).where(eq(orders.id, row.id));
}
