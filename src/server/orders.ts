import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { IconName } from "@/components/nami";
import { caracasMinutes, caracasWeekday, isOpenAt, nextOpeningAt } from "@/lib/catalog";
import { lineKey } from "@/lib/cart/line";
import type { CartLine, CartStore, Order } from "@/lib/cart/store";
import type { BrandColor } from "@/lib/demo/home";
import { isGuestToken } from "@/lib/guest";
import type { ApiErrorCode, OrderInput } from "@/lib/orders/input";
import { STAGE_COUNT, pickCourier, planFor, reachedStage } from "@/lib/orders/progress";
import { routeFor } from "@/lib/orders/route";
import { cartTotals, minOrderShortfall, sumLines } from "@/lib/pricing";
import { usdToVesCents } from "@/lib/money";
import { db } from "./db";
import {
  exchangeRates,
  orderItems,
  orderStops,
  orders,
  productOptionGroups,
  productOptions,
  products,
  storeHours,
  stores,
  type ChosenOption,
} from "./db/schema";

/** Error de negocio con código estable; las rutas lo traducen a `{ error: { code, message } }`. */
export class OrderError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status = 422,
  ) {
    super(message);
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbLike = typeof db | Tx;
type OrderRow = typeof orders.$inferSelect;
type OrderStatus = OrderRow["status"];
type StoreRow = typeof stores.$inferSelect;

const STATUS_BY_STAGE: OrderStatus[] = ["recibido", "preparando", "buscando_motorizado", "en_camino", "en_camino"];

/** Tasa Bs./$ más reciente. */
export async function currentRate(conn: DbLike = db): Promise<number> {
  const [r] = await conn.select({ v: exchangeRates.bsPerUsd }).from(exchangeRates).orderBy(desc(exchangeRates.createdAt)).limit(1);
  const rate = r ? Number(r.v) : NaN;
  if (!Number.isFinite(rate) || rate <= 0) throw new OrderError("RATE_UNAVAILABLE", "No hay una tasa de cambio disponible.", 503);
  return rate;
}

const cartStoreOf = (s: StoreRow): CartStore => ({
  slug: s.slug, name: s.name, initials: s.initials, color: s.color as BrandColor, feeCents: s.deliveryFeeCents, minOrderCents: s.minOrderCents, kind: s.kind,
});

/** Crea el pedido de un invitado. Todo se vuelve a leer y calcular aquí; el cliente solo manda ids y cantidades. */
export async function createOrder(input: OrderInput, guestToken: string, now: number = Date.now()): Promise<Order> {
  if (!isGuestToken(guestToken)) throw new OrderError("NO_GUEST_TOKEN", "Falta el token de invitado.", 401);
  const id = await db.transaction(async (tx) => {
    const storeSlugs = [...new Set(input.items.map((i) => i.store))];
    const storeRows = await tx.select().from(stores).where(inArray(stores.slug, storeSlugs));
    for (const slug of storeSlugs) if (!storeRows.some((s) => s.slug === slug)) throw new OrderError("STORE_NOT_FOUND", `No existe la tienda «${slug}».`);
    const storeBySlug = new Map(storeRows.map((s) => [s.slug, s]));

    const productRows = await tx
      .select()
      .from(products)
      .where(and(inArray(products.storeId, storeRows.map((s) => s.id)), inArray(products.slug, [...new Set(input.items.map((i) => i.product))])));
    const groupRows = productRows.length
      ? await tx.select().from(productOptionGroups).where(inArray(productOptionGroups.productId, productRows.map((p) => p.id))).orderBy(asc(productOptionGroups.sortOrder))
      : [];
    const optionRows = groupRows.length
      ? await tx.select().from(productOptions).where(inArray(productOptions.groupId, groupRows.map((g) => g.id))).orderBy(asc(productOptions.sortOrder))
      : [];

    type Built = { store: StoreRow; product: (typeof productRows)[number]; qty: number; unitCents: number; chosen: ChosenOption[]; note: string | null };
    const byStore = new Map<string, Built[]>();
    for (const it of input.items) {
      const store = storeBySlug.get(it.store)!;
      const product = productRows.find((p) => p.storeId === store.id && p.slug === it.product);
      if (!product) throw new OrderError("PRODUCT_NOT_FOUND", `«${it.product}» no existe en ${store.name}.`);
      if (!product.isAvailable) throw new OrderError("PRODUCT_UNAVAILABLE", `«${product.name}» está agotado.`, 409);

      const groups = groupRows.filter((g) => g.productId === product.id);
      const requested = it.options ?? {};
      for (const gid of Object.keys(requested)) {
        if (!groups.some((g) => g.slug === gid)) throw new OrderError("INVALID_OPTIONS", `«${product.name}» no tiene el grupo de opciones «${gid}».`);
      }
      const chosen: ChosenOption[] = [];
      for (const g of groups) {
        const opts = optionRows.filter((o) => o.groupId === g.id);
        let picks = [...new Set(requested[g.slug] ?? [])];
        // Un grupo obligatorio sin elección usa su opción por defecto (así entran al carrito las bebidas sugeridas).
        if (picks.length === 0 && g.required) picks = opts.filter((o) => o.isDefault).map((o) => o.slug);
        for (const pid of picks) if (!opts.some((o) => o.slug === pid)) throw new OrderError("INVALID_OPTIONS", `Opción «${pid}» inválida en «${g.title}».`);
        if (g.required && picks.length === 0) throw new OrderError("INVALID_OPTIONS", `Elige una opción en «${g.title}» para «${product.name}».`);
        if (g.kind === "one" && picks.length > 1) throw new OrderError("INVALID_OPTIONS", `«${g.title}» admite una sola opción.`);
        if (g.maxSelect !== null && picks.length > g.maxSelect) throw new OrderError("INVALID_OPTIONS", `«${g.title}» admite hasta ${g.maxSelect} opciones.`);
        // En el orden del menú, no en el que mandó el cliente.
        for (const o of opts.filter((x) => picks.includes(x.slug))) {
          chosen.push({ groupId: g.slug, optionId: o.slug, group: g.title, label: o.label, priceCents: o.priceCents });
        }
      }
      const unitCents = product.priceCents + chosen.reduce((n, o) => n + o.priceCents, 0);
      const list = byStore.get(store.slug) ?? [];
      list.push({ store, product, qty: it.qty, unitCents, chosen, note: it.note || null });
      byStore.set(store.slug, list);
    }

    // Pedido mínimo por tienda.
    const stops = [...byStore.entries()].map(([, lines]) => ({ store: lines[0].store, lines, subtotalCents: sumLines(lines) }));
    for (const s of stops) {
      const short = minOrderShortfall({ minOrderCents: s.store.minOrderCents }, s.subtotalCents);
      if (short > 0) throw new OrderError("MIN_ORDER_NOT_MET", `${s.store.name} pide un mínimo de ${(s.store.minOrderCents / 100).toFixed(2)} USD; te faltan ${(short / 100).toFixed(2)}.`);
    }

    const totals = cartTotals(stops.map((s) => ({ store: { feeCents: s.store.deliveryFeeCents }, lines: s.lines })), input.delivery, input.tipCents);
    const rate = await currentRate(tx);

    // Tiendas cerradas (interruptor manual o fuera de horario): el pedido queda programado para la apertura más tardía.
    const hourRows = await tx.select().from(storeHours).where(inArray(storeHours.storeId, stops.map((s) => s.store.id)));
    const closing = stops
      .map((s) => ({ s, schedule: hourRows.filter((h) => h.storeId === s.store.id) }))
      .filter(({ s, schedule }) => !s.store.isOpen || !isOpenAt({ schedule }, caracasMinutes(now), caracasWeekday(now)))
      .map(({ schedule }) => nextOpeningAt({ schedule }, now));
    const scheduled = closing.length ? Math.max(...closing) : null;
    const start = scheduled ?? now;
    const plan = planFor(stops.map((s) => ({ kind: s.store.kind, name: s.store.name })), input.delivery);
    const orderId = crypto.randomUUID();
    const courier = pickCourier(parseInt(orderId.slice(0, 8), 16));
    const ride = plan[3] * 60_000;

    await tx.insert(orders).values({
      id: orderId,
      guestToken,
      storeId: stops[0].store.id,
      status: "recibido",
      subtotalCents: totals.subtotalCents,
      deliveryFeeCents: totals.shippingCents,
      totalCents: totals.totalCents,
      totalBsCents: usdToVesCents(totals.totalCents, rate),
      exchangeRate: String(rate),
      deliveryAddress: input.address.line,
      deliveryName: input.address.name || null,
      deliveryReference: input.address.reference || null,
      deliveryMode: input.delivery,
      tipCents: input.tipCents,
      paymentMethod: input.payment,
      scheduledFor: scheduled ? new Date(scheduled) : null,
      courier,
      plan,
      stageAt: [scheduled ? null : now, null, null, null, null],
      route: routeFor(stops.length),
      deliveryStartedAt: new Date(start + ride),
      deliveryDurationSeconds: Math.round((plan[4] - plan[3]) * 60),
      startAt: new Date(start),
      createdAt: new Date(now),
    });
    for (const [position, s] of stops.entries()) {
      const [stop] = await tx
        .insert(orderStops)
        .values({ orderId, storeId: s.store.id, position, subtotalCents: s.subtotalCents, status: "recibido" })
        .returning({ id: orderStops.id });
      await tx.insert(orderItems).values(
        s.lines.map((l) => ({
          stopId: stop.id,
          productId: l.product.id,
          productSlug: l.product.slug,
          productName: l.product.name,
          icon: l.product.icon,
          unitPriceCents: l.unitCents,
          quantity: l.qty,
          note: l.note,
          options: l.chosen,
        })),
      );
    }
    return orderId;
  });
  const order = await getOrder(id, guestToken, now);
  if (!order) throw new OrderError("INTERNAL", "No se pudo leer el pedido recién creado.", 500);
  return order;
}

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

async function loadOrder(conn: DbLike, id: string, guestToken: string): Promise<{ row: OrderRow; order: Order } | null> {
  if (!isUuid(id) || !isGuestToken(guestToken)) return null;
  const [row] = await conn.select().from(orders).where(and(eq(orders.id, id), eq(orders.guestToken, guestToken))).limit(1);
  if (!row) return null;
  const stopRows = await conn.select().from(orderStops).where(eq(orderStops.orderId, id)).orderBy(asc(orderStops.position));
  const storeRows = stopRows.length ? await conn.select().from(stores).where(inArray(stores.id, stopRows.map((s) => s.storeId))) : [];
  const itemRows = stopRows.length ? await conn.select().from(orderItems).where(inArray(orderItems.stopId, stopRows.map((s) => s.id))).orderBy(asc(orderItems.id)) : [];
  const stops = stopRows.map((s) => {
    const store = cartStoreOf(storeRows.find((x) => x.id === s.storeId)!);
    const lines: CartLine[] = itemRows
      .filter((i) => i.stopId === s.id)
      .map((i) => {
        const opts = i.options ?? [];
        const note = [...opts.map((o) => o.label), i.note ?? ""].filter(Boolean).join(" · ") || undefined;
        const options: Record<string, string[]> = {};
        for (const o of opts) (options[o.groupId] ??= []).push(o.optionId);
        return {
          key: lineKey(i.productSlug, note), productId: i.productSlug, name: i.productName, unitCents: i.unitPriceCents, qty: i.quantity,
          icon: (i.icon ?? "basket") as IconName, note, options: opts.length ? options : undefined, userNote: i.note ?? undefined,
        };
      });
    return { store, lines, subtotalCents: s.subtotalCents };
  });
  const status: Order["status"] = row.status === "entregado" ? "delivered" : row.status === "cancelado" ? "cancelled" : "active";
  const order: Order = {
    id: row.id,
    code: `ÑM-${row.number}`,
    totalBsCents: row.totalBsCents,
    rate: Number(row.exchangeRate),
    stops,
    delivery: row.deliveryMode,
    store: stops[0].store,
    lines: stops.flatMap((s) => s.lines),
    subtotalCents: row.subtotalCents,
    shippingCents: row.deliveryFeeCents,
    tipCents: row.tipCents,
    totalCents: row.totalCents,
    payment: row.paymentMethod,
    address: { name: row.deliveryName ?? "", line: row.deliveryAddress, reference: row.deliveryReference ?? "" },
    createdAt: row.createdAt.getTime(),
    status,
    plan: row.plan ?? [],
    startAt: row.startAt.getTime(),
    stageAt: row.stageAt ?? [null, null, null, null, null],
    deliveredAt: row.deliveredAt ? row.deliveredAt.getTime() : null,
    courier: row.courier ?? pickCourier(0),
    scheduledFor: row.scheduledFor ? row.scheduledFor.getTime() : null,
  };
  return { row, order };
}

/** Pedido de este invitado (otro token o id inexistente = null). Pone al día el estado guardado según la hora. */
export async function getOrder(id: string, guestToken: string, now: number = Date.now()): Promise<Order | null> {
  const found = await loadOrder(db, id, guestToken);
  if (!found) return null;
  const { row, order } = found;
  if (order.status === "active") {
    const next = STATUS_BY_STAGE[reachedStage(order, now)];
    if (next !== row.status) {
      await db.transaction(async (tx) => {
        await tx.update(orders).set({ status: next }).where(eq(orders.id, id));
        await tx.update(orderStops).set({ status: next }).where(eq(orderStops.orderId, id));
      });
    }
  }
  return order;
}

async function mutate(id: string, guestToken: string, change: (o: Order, now: number) => Partial<typeof orders.$inferInsert> | null, now: number): Promise<Order | null> {
  const found = await loadOrder(db, id, guestToken);
  if (!found) return null;
  const set = change(found.order, now);
  if (set) {
    await db.transaction(async (tx) => {
      await tx.update(orders).set(set).where(eq(orders.id, id));
      if (set.status) await tx.update(orderStops).set({ status: set.status }).where(eq(orderStops.orderId, id));
    });
  }
  return getOrder(id, guestToken, now);
}

/** Demo: salta a la etapa siguiente corriendo el recorrido hacia atrás, para que las horas sigan siendo creíbles. */
export function advanceOrder(id: string, guestToken: string, now: number = Date.now()): Promise<Order | null> {
  return mutate(id, guestToken, (o) => {
    if (o.status !== "active") return null;
    const cur = reachedStage(o, now);
    if (cur >= STAGE_COUNT - 1) return null;
    const shift = Math.max(0, o.startAt + o.plan[cur + 1] * 60_000 - now);
    return {
      stageAt: o.stageAt.map((t) => (t == null ? null : t - shift)),
      startAt: new Date(o.startAt - shift),
      createdAt: new Date(o.createdAt - shift),
    };
  }, now);
}

/** Demo: vuelve a empezar el recorrido desde «Recibido». */
export function restartOrder(id: string, guestToken: string, now: number = Date.now()): Promise<Order | null> {
  return mutate(id, guestToken, (o) => ({
    status: "recibido",
    plan: planFor(o.stops.map((s) => ({ kind: s.store.kind, name: s.store.name })), o.delivery),
    startAt: new Date(now),
    stageAt: [now, null, null, null, null],
    deliveredAt: null,
  }), now);
}

/** «Confirmar que lo recibí»: pasa el pedido a entregado. */
export function confirmDelivered(id: string, guestToken: string, now: number = Date.now()): Promise<Order | null> {
  return mutate(id, guestToken, (o) => {
    if (o.status !== "active") return null;
    const arrived = o.stageAt[STAGE_COUNT - 1] ?? Math.min(now, o.startAt + o.plan[STAGE_COUNT - 1] * 60_000);
    return {
      status: "entregado",
      stageAt: o.stageAt.map((t, i) => t ?? Math.min(arrived, o.startAt + o.plan[i] * 60_000)),
      deliveredAt: new Date(arrived),
    };
  }, now);
}
