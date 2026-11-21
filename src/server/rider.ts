import "server-only";
import { and, desc, eq, gt, inArray, isNull, like, ne, notInArray, or } from "drizzle-orm";
import { SIMULATED_PREFIX, isGuestToken, isSimulatedToken } from "@/lib/guest";
import { STAGE_COUNT } from "@/lib/orders/progress";
import type { RiderAction } from "@/lib/rider-input";
import { db } from "./db";
import { orderStops, orders, riderSessions, stores } from "./db/schema";
import { reconcileOrder } from "./order-flow";
import { PanelError } from "./store-panel";

/**
 * App del repartidor (/repartidor), el tercer lado del marketplace. Sin login: el repartidor es el invitado de la cookie.
 * Mientras tiene la app abierta (consulta cada pocos segundos), los pedidos listos lo esperan en vez de asignarse solos;
 * él los toma, los recoge en la tienda y avisa que llegó. Si cierra la app, el pedido sigue solo por tiempo.
 */
export type RiderStage = "disponible" | "a_tienda" | "en_camino" | "llego";
export type RiderOrder = {
  id: string;
  code: string;
  stage: RiderStage;
  stores: { name: string; area: string | null }[];
  customerArea: string;
  address: string;
  reference: string | null;
  items: number;
  /** Lo que gana el repartidor: envío, recargo y propina. */
  earningCents: number;
  /** El cliente paga en efectivo al recibir: el repartidor cobra esto. */
  cashCents: number | null;
  /** El personaje que muestra la app del cliente. */
  courierName: string;
  createdAt: number;
};
export type RiderBoard = { available: RiderOrder[]; mine: RiderOrder[]; done: RiderOrder[] };
/** Cuánto atrás busca pedidos activos para tenerlos al día. */
const WINDOW_MS = 3 * 3_600_000;

function requireToken(token: string | null): string {
  if (!isGuestToken(token)) throw new PanelError("NO_GUEST_TOKEN", "Falta la cookie de invitado. Recarga la página.", 401);
  return token;
}
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
/** Marca al repartidor como conectado (la app lo hace en cada consulta y en cada acción). */
async function touch(conn: typeof db | Tx, token: string, now: number) {
  await conn.insert(riderSessions).values({ token, seenAt: new Date(now) }).onConflictDoUpdate({ target: riderSessions.token, set: { seenAt: new Date(now) } });
}

/** Tablero del repartidor: pedidos esperando a alguien, los suyos en curso y los que ya entregó. */
export async function getRiderBoard(rawToken: string | null, now: number = Date.now()): Promise<RiderBoard> {
  const token = requireToken(rawToken);
  await touch(db, token, now);
  // Pone al día los pedidos recientes: con el repartidor conectado, los que llegan a «listo» lo esperan.
  const active = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(gt(orders.createdAt, new Date(now - WINDOW_MS)), notInArray(orders.status, ["entregado", "cancelado"])));
  for (const { id } of active) await db.transaction((tx) => reconcileOrder(tx, id, now));

  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        gt(orders.createdAt, new Date(now - WINDOW_MS)),
        or(
          // Esperando repartidor: los pedidos de este mismo invitado y los simulados desde el panel.
          and(eq(orders.status, "buscando_motorizado"), eq(orders.holdStage, 2), isNull(orders.riderToken), or(eq(orders.guestToken, token), like(orders.guestToken, `${SIMULATED_PREFIX}%`))),
          eq(orders.riderToken, token),
        ),
      ),
    )
    .orderBy(desc(orders.createdAt));
  const ids = rows.map((r) => r.id);
  const stopRows = ids.length
    ? await db.select({ orderId: orderStops.orderId, status: orderStops.status, position: orderStops.position, name: stores.name, area: stores.area }).from(orderStops).innerJoin(stores, eq(stores.id, orderStops.storeId)).where(inArray(orderStops.orderId, ids))
    : [];
  const view = (r: (typeof rows)[number]): RiderOrder => {
    const stops = stopRows.filter((s) => s.orderId === r.id && s.status !== "cancelado").sort((a, b) => a.position - b.position);
    const stage: RiderStage = r.riderToken !== token ? "disponible" : r.holdStage === 2 ? "a_tienda" : r.holdStage === 3 ? "en_camino" : "llego";
    return {
      id: r.id,
      code: `ÑM-${r.number}`,
      stage,
      stores: stops.map((s) => ({ name: s.name, area: s.area })),
      customerArea: r.deliveryName || "Cliente",
      address: r.deliveryAddress,
      reference: r.deliveryReference,
      items: stops.length,
      earningCents: r.deliveryFeeCents + r.surchargeCents + r.tipCents,
      cashCents: r.paymentMethod === "efectivo" ? r.totalCents : null,
      courierName: r.courier?.name ?? "Repartidor",
      createdAt: r.createdAt.getTime(),
    };
  };
  const all = rows.map(view);
  return {
    available: all.filter((o) => o.stage === "disponible").reverse(),
    mine: all.filter((o) => o.stage === "a_tienda" || o.stage === "en_camino"),
    done: all.filter((o) => o.stage === "llego").slice(0, 5),
  };
}

/**
 * Acción del repartidor sobre un pedido. Tomar solo vale si nadie lo tomó (con dos repartidores a la vez, gana uno);
 * recoger y llegar solo los puede hacer quien lo tomó, en orden. Lo que no corresponde es un 409.
 */
export async function riderAct(rawToken: string | null, orderId: string, action: RiderAction, now: number = Date.now()): Promise<void> {
  const token = requireToken(rawToken);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) throw new PanelError("NOT_FOUND", "No encontramos ese pedido.", 404);
  await db.transaction(async (tx) => {
    await touch(tx, token, now);
    await reconcileOrder(tx, orderId, now);
    const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update").limit(1);
    if (!row) throw new PanelError("NOT_FOUND", "No encontramos ese pedido.", 404);
    if (row.status === "cancelado") throw new PanelError("INVALID_TRANSITION", "El pedido se canceló.", 409);
    const plan = row.plan ?? [];
    const stageAt = [...(row.stageAt ?? Array.from({ length: STAGE_COUNT }, () => null))];
    if (action === "tomar") {
      if (row.riderToken === token) return;
      if (row.riderToken !== null) throw new PanelError("INVALID_TRANSITION", "Otro repartidor ya tomó este pedido.", 409);
      if (row.guestToken !== token && !isSimulatedToken(row.guestToken)) throw new PanelError("INVALID_TRANSITION", "Ese pedido es de otro visitante de la demo.", 409);
      if (row.holdStage !== 2 || row.status !== "buscando_motorizado") throw new PanelError("INVALID_TRANSITION", "Ese pedido ya no está esperando repartidor.", 409);
      await tx.update(orders).set({ riderToken: token, riderTakenAt: new Date(now) }).where(eq(orders.id, orderId));
      return;
    }
    if (row.riderToken !== token) throw new PanelError("INVALID_TRANSITION", "Ese pedido no lo llevas tú.", 409);
    if (action === "recoger") {
      if (row.holdStage !== 2) throw new PanelError("INVALID_TRANSITION", "Ya recogiste este pedido.", 409);
      // Las etapas anteriores quedan con su hora real (o la estimada, si llegaron solas); el viaje empieza ahora.
      const oldStart = row.startAt.getTime();
      for (let i = 0; i < 3; i++) stageAt[i] ??= Math.min(now, oldStart + (plan[i] ?? 0) * 60_000);
      stageAt[3] = now;
      const startAt = now - (plan[3] ?? 0) * 60_000;
      await tx.update(orders).set({ holdStage: 3, status: "en_camino", stageAt, startAt: new Date(startAt), deliveryStartedAt: new Date(now) }).where(eq(orders.id, orderId));
      await tx.update(orderStops).set({ status: "en_camino" }).where(and(eq(orderStops.orderId, orderId), ne(orderStops.status, "cancelado")));
      return;
    }
    // llegue
    if (row.holdStage !== 3) throw new PanelError("INVALID_TRANSITION", "Primero recoge el pedido en la tienda.", 409);
    stageAt[4] = now;
    await tx.update(orders).set({ holdStage: null, stageAt }).where(eq(orders.id, orderId));
  });
}
