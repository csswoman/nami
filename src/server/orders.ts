import "server-only";
import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
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
import { deliveryFeeCents, formatDistance, nearestZone } from "@/lib/geo";
import { applyCoupon, normalizeCode } from "@/lib/pricing/coupons";
import { availableSlots, validateSlot, type Slot } from "@/lib/orders/slots";
import { describeChange, type Substitution } from "@/lib/orders/substitution";
import { usdToVesCents } from "@/lib/money";
import { db } from "./db";
import { attendedStores, reconcileOrder } from "./order-flow";
import {
  coupons,
  exchangeRates,
  orderItems,
  orderStops,
  orders,
  productOptionGroups,
  productOptions,
  products,
  storeHours,
  storeRoutes,
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
type StoreRow = typeof stores.$inferSelect;


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

/**
 * Envío de cada tienda hasta el punto del mapa del cliente (ruta por calle guardada en el seed).
 * Sin punto, no se calcula nada y vale la tarifa base. Si el punto cae fuera de toda zona, o la tienda no llega, el pedido falla.
 */
async function deliveryFees(tx: DbLike, storeRows: StoreRow[], address: { lat?: number; lng?: number }): Promise<Map<string, number>> {
  const fees = new Map<string, number>();
  if (address.lat === undefined || address.lng === undefined) return fees;
  const near = nearestZone({ lat: address.lat, lng: address.lng });
  if (!near) throw new OrderError("OUT_OF_COVERAGE", "Todavía no llegamos a la zona que marcaste en el mapa.");
  const routes = await tx
    .select({ storeId: storeRoutes.storeId, distanceM: storeRoutes.distanceM })
    .from(storeRoutes)
    .where(and(eq(storeRoutes.zone, near.zone.slug), inArray(storeRoutes.storeId, storeRows.map((s) => s.id))));
  for (const s of storeRows) {
    const route = routes.find((r) => r.storeId === s.id);
    if (!route) throw new OrderError("OUT_OF_COVERAGE", `${s.name} no reparte en ${near.zone.name}.`);
    if (route.distanceM > s.maxDeliveryM) throw new OrderError("OUT_OF_COVERAGE", `${s.name} no llega hasta ${near.zone.name}: reparte hasta ${formatDistance(s.maxDeliveryM)} y estás a ${formatDistance(route.distanceM)}.`);
    fees.set(s.id, deliveryFeeCents(s.deliveryFeeCents, route.distanceM));
  }
  return fees;
}
/** Lee tiendas y productos, valida opciones y mínimos y calcula los totales con precios de la BD. Lo usan crear pedido y cotizar cupón. */
async function priceCart(tx: DbLike, input: OrderInput) {
  const storeSlugs = [...new Set(input.items.map((i) => i.store))];
  const storeRows = await tx.select().from(stores).where(inArray(stores.slug, storeSlugs));
  for (const slug of storeSlugs) if (!storeRows.some((s) => s.slug === slug)) throw new OrderError("STORE_NOT_FOUND", `No existe la tienda «${slug}».`);
  const storeBySlug = new Map(storeRows.map((s) => [s.slug, s]));

  const productRows = await tx
    .select()
    .from(products)
    .where(and(inArray(products.storeId, storeRows.map((s) => s.id)), inArray(products.slug, [...new Set(input.items.flatMap((i) => [i.product, ...(i.substitution?.product ? [i.substitution.product] : [])]))])));
  const groupRows = productRows.length
    ? await tx.select().from(productOptionGroups).where(inArray(productOptionGroups.productId, productRows.map((p) => p.id))).orderBy(asc(productOptionGroups.sortOrder))
    : [];
  const optionRows = groupRows.length
    ? await tx.select().from(productOptions).where(inArray(productOptions.groupId, groupRows.map((g) => g.id))).orderBy(asc(productOptions.sortOrder))
    : [];

  type Built = { store: StoreRow; product: (typeof productRows)[number]; qty: number; unitCents: number; chosen: ChosenOption[]; note: string | null; substitution: Substitution | null };
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
    // La política de sustitución solo existe en mercados; si pide un producto, tiene que ser otro de la misma tienda.
    let substitution: Substitution | null = null;
    if (store.kind === "mercado" && it.substitution) {
      if (it.substitution.kind === "product") {
        const other = productRows.find((p) => p.storeId === store.id && p.slug === it.substitution!.product);
        if (!other || other.id === product.id) throw new OrderError("PRODUCT_NOT_FOUND", `«${it.substitution.product}» no sirve como reemplazo de «${product.name}» en ${store.name}.`);
      }
      substitution = it.substitution;
    }
    list.push({ store, product, qty: it.qty, unitCents, chosen, note: it.note || null, substitution });
    byStore.set(store.slug, list);
  }

  // Envío por distancia: si la dirección trae el punto del mapa, cada tienda cobra según su ruta por calle hasta esa zona.
  const fees = await deliveryFees(tx, storeRows, input.address);
  // Pedido mínimo por tienda.
  const stops = [...byStore.entries()].map(([, lines]) => ({ store: lines[0].store, lines, subtotalCents: sumLines(lines), feeCents: fees.get(lines[0].store.id) ?? lines[0].store.deliveryFeeCents }));
  for (const s of stops) {
    const short = minOrderShortfall({ minOrderCents: s.store.minOrderCents }, s.subtotalCents);
    if (short > 0) throw new OrderError("MIN_ORDER_NOT_MET", `${s.store.name} pide un mínimo de ${(s.store.minOrderCents / 100).toFixed(2)} USD; te faltan ${(short / 100).toFixed(2)}.`);
  }

  const totals = cartTotals(stops.map((s) => ({ store: { feeCents: s.feeCents }, lines: s.lines })), input.delivery, input.tipCents);
  return { stops, totals };
}
type PricedStops = Awaited<ReturnType<typeof priceCart>>["stops"];
type CouponApplied = { code: string | null; discountCents: number; shippingDiscountCents: number };
/** Valida el cupón contra el carrito ya calculado. Sin código no hay descuento; un cupón que no sirve es un error. */
async function applyCouponTo(tx: DbLike, code: string | undefined, stops: PricedStops, shippingCents: number, guestToken: string, now: number): Promise<CouponApplied> {
  if (!code) return { code: null, discountCents: 0, shippingDiscountCents: 0 };
  const normalized = normalizeCode(code);
  const [row] = await tx.select({ c: coupons, storeSlug: stores.slug }).from(coupons).leftJoin(stores, eq(stores.id, coupons.storeId)).where(eq(coupons.code, normalized)).limit(1);
  if (!row) throw new OrderError("COUPON_INVALID", `El cupón «${normalized}» no existe.`);
  const [{ n: prior }] = await tx.select({ n: count() }).from(orders).where(and(eq(orders.guestToken, guestToken), ne(orders.status, "cancelado")));
  const res = applyCoupon(
    {
      code: row.c.code, description: row.c.description, percent: row.c.percent, amountCents: row.c.amountCents, freeShipping: row.c.freeShipping,
      bogoSection: row.c.bogoSection, minSubtotalCents: row.c.minSubtotalCents, expiresAt: row.c.expiresAt ? row.c.expiresAt.getTime() : null,
      storeSlug: row.storeSlug, firstOrderOnly: row.c.firstOrderOnly,
    },
    { now, firstOrder: prior === 0, shippingCents, lines: stops.flatMap((s) => s.lines.map((l) => ({ storeSlug: s.store.slug, section: l.product.section, qty: l.qty, unitCents: l.unitCents }))) },
  );
  if (!res.ok) throw new OrderError(res.code, res.message);
  return { code: normalized, discountCents: res.discountCents, shippingDiscountCents: res.shippingDiscountCents };
}
export type OrderQuote = { subtotalCents: number; shippingCents: number; tipCents: number; discountCents: number; shippingDiscountCents: number; totalCents: number; couponCode: string | null };
/** Cuánto costaría este pedido con su cupón, sin crearlo. Usa los mismos precios y reglas que `createOrder`. */
export async function quoteOrder(input: OrderInput, guestToken: string, now: number = Date.now()): Promise<OrderQuote> {
  if (!isGuestToken(guestToken)) throw new OrderError("NO_GUEST_TOKEN", "Falta el token de invitado.", 401);
  const { stops, totals } = await priceCart(db, input);
  const c = await applyCouponTo(db, input.coupon, stops, totals.shippingCents, guestToken, now);
  return {
    subtotalCents: totals.subtotalCents, shippingCents: totals.shippingCents, tipCents: totals.tipCents,
    discountCents: c.discountCents, shippingDiscountCents: c.shippingDiscountCents,
    totalCents: totals.totalCents - c.discountCents - c.shippingDiscountCents, couponCode: c.code,
  };
}
/** Crea el pedido de un invitado. Todo se vuelve a leer y calcular aquí; el cliente solo manda ids y cantidades. */
export async function createOrder(input: OrderInput, guestToken: string, now: number = Date.now()): Promise<Order> {
  if (!isGuestToken(guestToken)) throw new OrderError("NO_GUEST_TOKEN", "Falta el token de invitado.", 401);
  const id = await db.transaction(async (tx) => {
    const { stops, totals } = await priceCart(tx, input);
    const coupon = await applyCouponTo(tx, input.coupon, stops, totals.shippingCents, guestToken, now);
    const discountCents = coupon.discountCents + coupon.shippingDiscountCents;
    const finalTotalCents = totals.totalCents - discountCents;
    const rate = await currentRate(tx);

    // Tiendas cerradas (interruptor manual o fuera de horario): el pedido queda programado para la apertura más tardía.
    const hourRows = await tx.select().from(storeHours).where(inArray(storeHours.storeId, stops.map((s) => s.store.id)));
    const closing = stops
      .map((s) => ({ s, schedule: hourRows.filter((h) => h.storeId === s.store.id) }))
      .filter(({ s, schedule }) => !s.store.isOpen || !isOpenAt({ schedule }, caracasMinutes(now), caracasWeekday(now)))
      .map(({ schedule }) => nextOpeningAt({ schedule }, now));
    // Con una franja elegida, todas las tiendas tienen que estar abiertas a esa hora; si no, se programa para la próxima apertura.
    let scheduled = closing.length ? Math.max(...closing) : null;
    if (input.scheduledFor !== undefined) {
      const check = validateSlot(input.scheduledFor, stops.map((s) => ({ schedule: hourRows.filter((h) => h.storeId === s.store.id) })), now);
      if (!check.ok) throw new OrderError("SLOT_UNAVAILABLE", check.message);
      scheduled = input.scheduledFor;
    }
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
      totalCents: finalTotalCents,
      totalBsCents: usdToVesCents(finalTotalCents, rate),
      couponCode: coupon.code,
      discountCents,
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
      // Si alguna tienda tiene su panel abierto, ella decide cuándo se acepta el pedido.
      holdStage: (await attendedStores(tx, stops.map((s) => s.store.id), now)).size ? 0 : null,
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
          substitution: l.substitution,
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
      .filter((i) => i.stopId === s.id && i.resolution?.kind !== "removed")
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
    hold: row.holdStage,
    cancelReason: row.cancelReason,
    changes: itemRows.map((i) => describeChange({ productName: i.productName, resolution: i.resolution })).filter((c): c is string => c !== null),
    couponCode: row.couponCode,
    discountCents: row.discountCents,
  };
  return { row, order };
}

/** Pedido de este invitado (otro token o id inexistente = null). Pone al día el estado guardado según la hora y la tienda. */
export async function getOrder(id: string, guestToken: string, now: number = Date.now()): Promise<Order | null> {
  const found = await loadOrder(db, id, guestToken);
  if (!found) return null;
  if (found.order.status !== "active") return found.order;
  await db.transaction((tx) => reconcileOrder(tx, id, now));
  return (await loadOrder(db, id, guestToken))?.order ?? null;
}
async function mutate(id: string, guestToken: string, change: (o: Order, now: number) => Partial<typeof orders.$inferInsert> | null, now: number): Promise<Order | null> {
  const found = await loadOrder(db, id, guestToken);
  if (!found) return null;
  const set = change(found.order, now);
  if (set) {
    await db.transaction(async (tx) => {
      await tx.update(orders).set(set).where(eq(orders.id, id));
      if (set.status) await tx.update(orderStops).set({ status: set.status }).where(and(eq(orderStops.orderId, id), ne(orderStops.status, "cancelado")));
    });
  }
  return getOrder(id, guestToken, now);
}

/** Motivo de cancelación: entre 3 y 200 caracteres. */
const cancelReasonOk = (r: string) => r.length >= 3 && r.length <= 200;
/**
 * El cliente cancela su pedido con un motivo. Solo vale antes de «En camino»: después el motorizado ya salió.
 * Las tiendas ven sus paradas como canceladas, con el motivo del cliente.
 */
export async function cancelOrder(id: string, guestToken: string, reason: string, now: number = Date.now()): Promise<Order | null> {
  const found = await loadOrder(db, id, guestToken);
  if (!found) return null;
  const why = reason.trim();
  if (!cancelReasonOk(why)) throw new OrderError("INVALID_INPUT", "Cuéntanos el motivo (entre 3 y 200 caracteres).", 400);
  await db.transaction(async (tx) => {
    await reconcileOrder(tx, id, now);
    const [row] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).for("update");
    if (row.status === "cancelado") throw new OrderError("NOT_CANCELLABLE", "Este pedido ya estaba cancelado.", 409);
    if (row.status === "en_camino" || row.status === "entregado") throw new OrderError("NOT_CANCELLABLE", "Ya no se puede cancelar: el motorizado va en camino.", 409);
    await tx.update(orders).set({ status: "cancelado", holdStage: null, cancelReason: why }).where(eq(orders.id, id));
    await tx.update(orderStops).set({ status: "cancelado", rejectReason: `El cliente canceló: ${why}` }).where(and(eq(orderStops.orderId, id), ne(orderStops.status, "cancelado")));
  });
  return (await loadOrder(db, id, guestToken))?.order ?? null;
}
/** Demo: salta a la etapa siguiente corriendo el recorrido hacia atrás, para que las horas sigan siendo creíbles. */
export function advanceOrder(id: string, guestToken: string, now: number = Date.now()): Promise<Order | null> {
  return mutate(id, guestToken, (o) => {
    // Con una tienda al mando del pedido, solo ella lo avanza desde su panel.
    if (o.status !== "active" || o.hold != null) return null;
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
    holdStage: null,
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
/** Franjas para programar un pedido a estas tiendas (solo horas en que todas están abiertas). */
export async function listSlots(storeSlugs: string[], now: number = Date.now()): Promise<Slot[]> {
  const slugs = [...new Set(storeSlugs)];
  if (!slugs.length) return [];
  const rows = await db.select({ id: stores.id, slug: stores.slug }).from(stores).where(inArray(stores.slug, slugs));
  if (rows.length !== slugs.length) throw new OrderError("STORE_NOT_FOUND", "Alguna tienda no existe.");
  const hours = await db.select().from(storeHours).where(inArray(storeHours.storeId, rows.map((r) => r.id)));
  return availableSlots(rows.map((r) => ({ schedule: hours.filter((h) => h.storeId === r.id) })), now);
}
