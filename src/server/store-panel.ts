import "server-only";
import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { InvalidTransition, allowedActions, applyStopAction, type StopAction, type StopStatus } from "@/lib/orders/stop-machine";
import type { ApiErrorCode } from "@/lib/orders/input";
import type { BrandColor } from "@/lib/demo/home";
import { db } from "./db";
import type { DayHours } from "@/lib/catalog";
import { usdToVesCents } from "@/lib/money";
import { MAX_PRICE_CENTS } from "@/lib/panel-input";
import { replacementUnitCents, totalsAfterChange, type Resolution, type Substitution } from "@/lib/orders/substitution";
import { validateSchedule } from "@/lib/store-schedule";
import { orderItems, orderStops, orders, products, storeHours, stores } from "./db/schema";
import { resetSeedStores } from "./db/seed-data";
import { reconcileOrder, takeControl } from "./order-flow";
import { markCatalogChanged, restoreStaleStoresSafely } from "./demo-restore";
/** Error de negocio del panel; las rutas lo traducen a `{ error: { code, message } }` con su `status`. */
export class PanelError extends Error {
  constructor(public code: ApiErrorCode, message: string, public status: number) {
    super(message);
  }
}
export type PanelItem = {
  id: string;
  slug: string;
  name: string;
  qty: number;
  unitCents: number;
  note: string | null;
  options: string[];
  /** Mercados: qué pidió el cliente que se haga si no hay el producto. */
  substitution: Substitution | null;
  /** Qué se hizo ya con el producto (quitado o cambiado). */
  resolution: Resolution | null;
};
export type PanelStop = {
  stopId: string;
  code: string;
  createdAt: number;
  /** Hora a la que arranca un pedido programado; null = se prepara ya. */
  scheduledFor: number | null;
  status: StopStatus;
  actions: StopAction[];
  rejectReason: string | null;
  customerArea: string;
  subtotalCents: number;
  items: PanelItem[];
  /** El pedido incluye otras tiendas. */
  otherStores: string[];
};
export type PanelData = {
  store: { slug: string; name: string; isOpen: boolean; kind: "restaurante" | "mercado" };
  /** Esperan una acción de la tienda: sin aceptar, aceptados o en preparación. */
  queue: PanelStop[];
  /** Listos o en camino, y los de hoy ya cerrados (entregados o cancelados). */
  done: PanelStop[];
};
/** Cuánto atrás mira la bandeja. */
const WINDOW_MS = 24 * 3_600_000;
async function findStore(slug: string) {
  // Antes de leer o cambiar una tienda, las que llevan mucho rato cambiadas vuelven al seed.
  await restoreStaleStoresSafely();
  const [store] = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);
  if (!store) throw new PanelError("STORE_NOT_FOUND", "No existe esa tienda.", 404);
  return store;
}
/** Tiendas que se pueden ver en el panel (selector de /tienda-admin). */
export async function listPanelStores(): Promise<{ slug: string; name: string; kind: "restaurante" | "mercado"; initials: string; color: BrandColor; isOpen: boolean }[]> {
  await restoreStaleStoresSafely();
  const rows = await db
    .select({ slug: stores.slug, name: stores.name, kind: stores.kind, initials: stores.initials, color: stores.color, isOpen: stores.isOpen })
    .from(stores)
    .orderBy(asc(stores.sortOrder), asc(stores.name));
  return rows.map((r) => ({ ...r, color: r.color as BrandColor }));
}
/** Bandeja de la tienda. Consultarla marca el panel como abierto: la tienda toma el control de sus pedidos. */
export async function getPanel(slug: string, now: number = Date.now()): Promise<PanelData> {
  const store = await findStore(slug);
  await db.update(stores).set({ panelSeenAt: new Date(now) }).where(eq(stores.id, store.id));
  const since = new Date(now - WINDOW_MS);
  const base = () =>
    db
      .select({ stopId: orderStops.id, orderId: orderStops.orderId })
      .from(orderStops)
      .innerJoin(orders, eq(orders.id, orderStops.orderId))
      .where(and(eq(orderStops.storeId, store.id), gt(orders.createdAt, since)));
  // Primero se pone al día cada pedido (toma el control y adelanta a las demás tiendas), luego se lee.
  for (const { orderId } of await base()) {
    await db.transaction(async (tx) => {
      await takeControl(tx, orderId, store.id, now);
      await reconcileOrder(tx, orderId, now);
    });
  }
  const rows = await db
    .select({
      stopId: orderStops.id,
      orderId: orders.id,
      number: orders.number,
      createdAt: orders.createdAt,
      scheduledFor: orders.scheduledFor,
      deliveryName: orders.deliveryName,
      deliveryAddress: orders.deliveryAddress,
      status: orderStops.status,
      rejectReason: orderStops.rejectReason,
      subtotalCents: orderStops.subtotalCents,
    })
    .from(orderStops)
    .innerJoin(orders, eq(orders.id, orderStops.orderId))
    .where(and(eq(orderStops.storeId, store.id), gt(orders.createdAt, since)))
    .orderBy(asc(orders.createdAt));
  const stopIds = rows.map((r) => r.stopId);
  const itemRows = stopIds.length ? await db.select().from(orderItems).where(inArray(orderItems.stopId, stopIds)).orderBy(asc(orderItems.id)) : [];
  const orderIds = [...new Set(rows.map((r) => r.orderId))];
  const siblings = orderIds.length
    ? await db
        .select({ orderId: orderStops.orderId, name: stores.name, storeId: orderStops.storeId })
        .from(orderStops)
        .innerJoin(stores, eq(stores.id, orderStops.storeId))
        .where(inArray(orderStops.orderId, orderIds))
    : [];
  const stops: PanelStop[] = rows.map((r) => ({
    stopId: r.stopId,
    code: `ÑM-${r.number}`,
    createdAt: r.createdAt.getTime(),
    scheduledFor: r.scheduledFor ? r.scheduledFor.getTime() : null,
    status: r.status as StopStatus,
    actions: allowedActions(r.status as StopStatus),
    rejectReason: r.rejectReason,
    customerArea: r.deliveryName || r.deliveryAddress,
    subtotalCents: r.subtotalCents,
    items: itemRows
      .filter((i) => i.stopId === r.stopId)
      .map((i) => ({ id: i.id, slug: i.productSlug, name: i.productName, qty: i.quantity, unitCents: i.unitPriceCents, note: i.note, options: (i.options ?? []).map((o) => o.label), substitution: i.substitution, resolution: i.resolution })),
    otherStores: siblings.filter((s) => s.orderId === r.orderId && s.storeId !== store.id).map((s) => s.name),
  }));
  const pending = (s: PanelStop) => s.status === "recibido" || s.status === "aceptado" || s.status === "preparando";
  return {
    store: { slug: store.slug, name: store.name, isOpen: store.isOpen, kind: store.kind },
    queue: stops.filter(pending),
    done: stops.filter((s) => !pending(s)).reverse(),
  };
}
/**
 * Acción de la tienda sobre una de sus paradas. Una acción que no corresponde al estado actual es un 409.
 * Después se recalcula el pedido entero: estado general, etapa del cliente y paradas de las demás tiendas.
 */
export async function actOnStop(slug: string, stopId: string, action: StopAction, reason: string | undefined, now: number = Date.now()): Promise<void> {
  const store = await findStore(slug);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stopId)) throw new PanelError("NOT_FOUND", "No encontramos ese pedido.", 404);
  if (action === "rechazar" && !reason?.trim()) throw new PanelError("INVALID_INPUT", "Escribe el motivo del rechazo.", 400);
  await db.transaction(async (tx) => {
    await tx.update(stores).set({ panelSeenAt: new Date(now) }).where(eq(stores.id, store.id));
    const [stop] = await tx.select().from(orderStops).where(and(eq(orderStops.id, stopId), eq(orderStops.storeId, store.id))).limit(1);
    if (!stop) throw new PanelError("NOT_FOUND", "No encontramos ese pedido en tu tienda.", 404);
    // Sin esto, un pedido que seguía solo por tiempo se quedaría con el estado viejo de la parada.
    await takeControl(tx, stop.orderId, store.id, now);
    await reconcileOrder(tx, stop.orderId, now);
    const [order] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, stop.orderId)).for("update");
    if (order.status === "entregado" || order.status === "cancelado") throw new PanelError("INVALID_TRANSITION", "Ese pedido ya está cerrado.", 409);
    const [fresh] = await tx.select({ status: orderStops.status }).from(orderStops).where(eq(orderStops.id, stopId));
    let next: StopStatus;
    try {
      next = applyStopAction(fresh.status as StopStatus, action);
    } catch (e) {
      if (e instanceof InvalidTransition) throw new PanelError("INVALID_TRANSITION", e.message, 409);
      throw e;
    }
    await tx
      .update(orderStops)
      .set({ status: next, rejectReason: action === "rechazar" ? reason!.trim().slice(0, 200) : null })
      .where(eq(orderStops.id, stopId));
    await reconcileOrder(tx, stop.orderId, now);
  });
}
/** Interruptor manual abrir/cerrar. Se combina con el horario: cerrada manual gana. */
export async function setStoreOpen(slug: string, open: boolean): Promise<void> {
  const store = await findStore(slug);
  await db.update(stores).set({ isOpen: open }).where(eq(stores.id, store.id));
  await markCatalogChanged(store.id);
}
export type InventoryItem = { slug: string; name: string; section: string; sectionTitle: string; priceCents: number; isAvailable: boolean };
/** Productos de la tienda para el inventario, en el orden del menú. */
export async function getInventory(slug: string): Promise<InventoryItem[]> {
  const store = await findStore(slug);
  return db
    .select({ slug: products.slug, name: products.name, section: products.section, sectionTitle: products.sectionTitle, priceCents: products.priceCents, isAvailable: products.isAvailable })
    .from(products)
    .where(eq(products.storeId, store.id))
    .orderBy(asc(products.sortOrder));
}
/** Agota o repone un producto, o cambia su precio (en centavos). El cliente lo ve en su próxima consulta. */
export async function updateProduct(slug: string, productSlug: string, patch: { available?: unknown; priceCents?: unknown }): Promise<InventoryItem> {
  const store = await findStore(slug);
  const set: Partial<typeof products.$inferInsert> = {};
  if (patch.available !== undefined) {
    if (typeof patch.available !== "boolean") throw new PanelError("INVALID_INPUT", "`available` debe ser true o false.", 400);
    set.isAvailable = patch.available;
    set.soldOutUntil = null;
  }
  if (patch.priceCents !== undefined) {
    const p = patch.priceCents;
    if (typeof p !== "number" || !Number.isInteger(p) || p < 1 || p > MAX_PRICE_CENTS) throw new PanelError("INVALID_INPUT", `El precio debe estar entre $ 0,01 y $ ${MAX_PRICE_CENTS / 100}.`, 400);
    set.priceCents = p;
  }
  if (!Object.keys(set).length) throw new PanelError("INVALID_INPUT", "No hay nada que cambiar.", 400);
  const [row] = await db
    .update(products)
    .set(set)
    .where(and(eq(products.storeId, store.id), eq(products.slug, productSlug)))
    .returning({ slug: products.slug, name: products.name, section: products.section, sectionTitle: products.sectionTitle, priceCents: products.priceCents, isAvailable: products.isAvailable });
  if (!row) throw new PanelError("PRODUCT_NOT_FOUND", "Ese producto no existe en tu tienda.", 404);
  await markCatalogChanged(store.id);
  return row;
}
/** Horario semanal de la tienda. */
export async function getSchedule(slug: string): Promise<DayHours[]> {
  const store = await findStore(slug);
  return db
    .select({ day: storeHours.day, opensAt: storeHours.opensAt, closesAt: storeHours.closesAt })
    .from(storeHours)
    .where(eq(storeHours.storeId, store.id))
    .orderBy(asc(storeHours.day), asc(storeHours.opensAt));
}
/** Reemplaza el horario semanal. Un día sin turnos queda cerrado. */
export async function setSchedule(slug: string, raw: unknown): Promise<DayHours[]> {
  const store = await findStore(slug);
  const result = validateSchedule(raw);
  if (!result.ok) throw new PanelError("INVALID_INPUT", result.message, 400);
  await db.transaction(async (tx) => {
    await tx.delete(storeHours).where(eq(storeHours.storeId, store.id));
    if (result.schedule.length) await tx.insert(storeHours).values(result.schedule.map((h) => ({ ...h, storeId: store.id })));
    await markCatalogChanged(store.id, tx);
  });
  return result.schedule;
}
/** Devuelve la tienda a como la deja el seed: precios, stock, horario y estado abierto/cerrado. */
export async function resetStoreCatalog(slug: string): Promise<void> {
  await findStore(slug);
  const n = await db.transaction((tx) => resetSeedStores(tx, slug));
  if (n === 0) throw new PanelError("STORE_NOT_FOUND", "Esa tienda no está en los datos de demo.", 404);
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * «No hay»: la tienda no tiene un producto del pedido (solo mercados). Se aplica lo que pidió el cliente:
 * quitarlo, o cambiarlo por el producto que eligió o por el que elija la tienda (`replacement`).
 * El producto queda agotado, el reemplazo nunca cobra más que el original y los totales del pedido se recalculan.
 */
export async function markOutOfStock(slug: string, stopId: string, itemId: string, replacement: string | undefined, now: number = Date.now()): Promise<void> {
  const store = await findStore(slug);
  if (store.kind !== "mercado") throw new PanelError("INVALID_INPUT", "Las sustituciones solo existen en mercados.", 400);
  if (!UUID.test(stopId) || !UUID.test(itemId)) throw new PanelError("NOT_FOUND", "No encontramos ese producto.", 404);
  await db.transaction(async (tx) => {
    await tx.update(stores).set({ panelSeenAt: new Date(now) }).where(eq(stores.id, store.id));
    const [stop] = await tx.select().from(orderStops).where(and(eq(orderStops.id, stopId), eq(orderStops.storeId, store.id))).limit(1);
    if (!stop) throw new PanelError("NOT_FOUND", "No encontramos ese pedido en tu tienda.", 404);
    await takeControl(tx, stop.orderId, store.id, now);
    await reconcileOrder(tx, stop.orderId, now);
    const [order] = await tx.select().from(orders).where(eq(orders.id, stop.orderId)).for("update");
    if (order.status === "entregado" || order.status === "cancelado") throw new PanelError("INVALID_TRANSITION", "Ese pedido ya está cerrado.", 409);
    const [fresh] = await tx.select({ status: orderStops.status }).from(orderStops).where(eq(orderStops.id, stopId));
    if (!["recibido", "aceptado", "preparando"].includes(fresh.status)) throw new PanelError("INVALID_TRANSITION", "El pedido ya está listo: no se puede cambiar.", 409);
    const [item] = await tx.select().from(orderItems).where(and(eq(orderItems.id, itemId), eq(orderItems.stopId, stopId))).limit(1);
    if (!item) throw new PanelError("NOT_FOUND", "No encontramos ese producto en el pedido.", 404);
    if (item.resolution) throw new PanelError("INVALID_TRANSITION", "Ese producto ya se resolvió.", 409);
    const policy: Substitution = item.substitution ?? { kind: "remove" };
    let resolution: Resolution = { kind: "removed" };
    if (policy.kind !== "remove") {
      const wanted = replacement ?? (policy.kind === "product" ? policy.product : undefined);
      if (!wanted) throw new PanelError("INVALID_INPUT", "Elige con qué reemplazarlo.", 400);
      const [rep] = await tx.select().from(products).where(and(eq(products.storeId, store.id), eq(products.slug, wanted))).limit(1);
      if (!rep) throw new PanelError("PRODUCT_NOT_FOUND", "Ese producto no existe en tu tienda.", 404);
      if (rep.id === item.productId) throw new PanelError("INVALID_INPUT", "Elige un producto distinto al que falta.", 400);
      if (!rep.isAvailable) throw new PanelError("PRODUCT_UNAVAILABLE", `«${rep.name}» también está agotado. Elige otro.`, 409);
      resolution = { kind: "replaced", fromName: item.productName, fromSlug: item.productSlug, fromUnitCents: item.unitPriceCents };
      await tx
        .update(orderItems)
        .set({ productId: rep.id, productSlug: rep.slug, productName: rep.name, icon: rep.icon, unitPriceCents: replacementUnitCents(item.unitPriceCents, rep.priceCents), resolution })
        .where(eq(orderItems.id, itemId));
    } else {
      await tx.update(orderItems).set({ resolution }).where(eq(orderItems.id, itemId));
    }
    // Lo que no hay queda agotado en el catálogo.
    if (item.productId) {
      await tx.update(products).set({ isAvailable: false, soldOutUntil: null }).where(eq(products.id, item.productId));
      await markCatalogChanged(store.id, tx);
    }
    // Totales: la parada, el pedido (con el mismo envío, propina y descuento topado) y los bolívares a la tasa guardada.
    const items = await tx.select().from(orderItems).where(eq(orderItems.stopId, stopId));
    const stopSubtotal = items.filter((i) => i.resolution?.kind !== "removed").reduce((n, i) => n + i.quantity * i.unitPriceCents, 0);
    const empty = items.every((i) => i.resolution?.kind === "removed");
    await tx
      .update(orderStops)
      .set({ subtotalCents: stopSubtotal, ...(empty ? { status: "cancelado" as const, rejectReason: "No hay ninguno de los productos del pedido." } : {}) })
      .where(eq(orderStops.id, stopId));
    const stops = await tx.select({ subtotalCents: orderStops.subtotalCents }).from(orderStops).where(eq(orderStops.orderId, order.id));
    const subtotalCents = stops.reduce((n, s) => n + s.subtotalCents, 0);
    const t = totalsAfterChange({ subtotalCents, shippingCents: order.deliveryFeeCents, tipCents: order.tipCents, discountCents: order.discountCents });
    await tx
      .update(orders)
      .set({ subtotalCents, discountCents: t.discountCents, totalCents: t.totalCents, totalBsCents: usdToVesCents(t.totalCents, Number(order.exchangeRate)) })
      .where(eq(orders.id, order.id));
    await reconcileOrder(tx, order.id, now);
  });
}
