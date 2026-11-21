import "server-only";
import { and, eq, gt, gte, inArray, lte } from "drizzle-orm";
import { COMMISSION_BPS, settleStop, sumSettlements, type StopSettlement } from "@/lib/pricing/settlement";
import { db } from "./db";
import { coupons, orderItems, orderStops, orders, reviews, stores } from "./db/schema";
import { PanelError } from "./store-panel";

/**
 * Ventas de una tienda en los últimos 7 días y su liquidación: lo que vendió, la comisión de Ñami,
 * los cupones que pagó ella y el neto que recibe. Lo lee la pestaña «Ventas» del panel.
 */
export type DayStat = { date: string; label: string; orders: number; salesCents: number };
export type StoreMetrics = {
  days: DayStat[];
  orders: number;
  cancelled: number;
  salesCents: number;
  avgTicketCents: number;
  settlement: StopSettlement;
  commissionPercent: number;
  topProducts: { name: string; qty: number; salesCents: number }[];
  /** Minutos promedio entre «preparando» y «listo», contra lo que prometía el plan. null sin datos. */
  prep: { avgMin: number; promisedMin: number; samples: number } | null;
  rating: { avg: number; count: number } | null;
};
const DAYS = 7;
const DAY_MS = 86_400_000;
/** Fecha de Caracas (UTC-4) de una hora: "2026-11-20". */
const caracasDate = (ms: number) => new Date(ms - 4 * 3_600_000).toISOString().slice(0, 10);
const WEEKDAY = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export async function getStoreMetrics(slug: string, now: number = Date.now()): Promise<StoreMetrics> {
  const [store] = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);
  if (!store) throw new PanelError("STORE_NOT_FOUND", "No existe esa tienda.", 404);
  // Desde la medianoche (Caracas, UTC-4) del primer día de la gráfica, para que el total y las barras cuenten lo mismo.
  const since = new Date(`${caracasDate(now - (DAYS - 1) * DAY_MS)}T04:00:00Z`);
  const rows = await db
    .select({
      stopId: orderStops.id,
      stopStatus: orderStops.status,
      stopSubtotal: orderStops.subtotalCents,
      orderId: orders.id,
      orderStatus: orders.status,
      orderSubtotal: orders.subtotalCents,
      discountCents: orders.discountCents,
      shippingCents: orders.deliveryFeeCents,
      couponCode: orders.couponCode,
      createdAt: orders.createdAt,
      plan: orders.plan,
      stageAt: orders.stageAt,
    })
    .from(orderStops)
    .innerJoin(orders, eq(orders.id, orderStops.orderId))
    .where(and(eq(orderStops.storeId, store.id), gte(orders.createdAt, since), lte(orders.createdAt, new Date(now))));
  const codes = [...new Set(rows.map((r) => r.couponCode).filter((c): c is string => !!c))];
  const couponRows = codes.length ? await db.select({ code: coupons.code, storeId: coupons.storeId, freeShipping: coupons.freeShipping }).from(coupons).where(inArray(coupons.code, codes)) : [];
  const couponOf = new Map(couponRows.map((c) => [c.code, c]));

  const isCancelled = (r: (typeof rows)[number]) => r.stopStatus === "cancelado" || r.orderStatus === "cancelado";
  const live = rows.filter((r) => !isCancelled(r));
  const settlements = rows.map((r) => {
    const c = r.couponCode ? couponOf.get(r.couponCode) : undefined;
    // El descuento guardado junta productos y envío: el envío gratis no es de la tienda.
    const shipPart = c?.freeShipping ? Math.min(r.discountCents, r.shippingCents) : 0;
    return settleStop({
      kind: store.kind,
      subtotalCents: r.stopSubtotal,
      orderSubtotalCents: r.orderSubtotal,
      productDiscountCents: r.discountCents - shipPart,
      couponFundedByStore: c?.storeId === store.id,
      cancelled: isCancelled(r),
    });
  });
  const settlement = sumSettlements(settlements);

  const days: DayStat[] = Array.from({ length: DAYS }, (_, i) => {
    const ms = now - (DAYS - 1 - i) * DAY_MS;
    const date = caracasDate(ms);
    const d = new Date(`${date}T12:00:00Z`);
    return { date, label: `${WEEKDAY[d.getUTCDay()]} ${d.getUTCDate()}`, orders: 0, salesCents: 0 };
  });
  for (const r of live) {
    const day = days.find((d) => d.date === caracasDate(r.createdAt.getTime()));
    if (!day) continue;
    day.orders++;
    day.salesCents += r.stopSubtotal;
  }

  const items = live.length
    ? await db.select({ name: orderItems.productName, qty: orderItems.quantity, unit: orderItems.unitPriceCents, resolution: orderItems.resolution }).from(orderItems).where(inArray(orderItems.stopId, live.map((r) => r.stopId)))
    : [];
  const byName = new Map<string, { name: string; qty: number; salesCents: number }>();
  for (const it of items) {
    if (it.resolution?.kind === "removed") continue;
    const p = byName.get(it.name) ?? { name: it.name, qty: 0, salesCents: 0 };
    p.qty += it.qty;
    p.salesCents += it.qty * it.unit;
    byName.set(it.name, p);
  }
  const topProducts = [...byName.values()].sort((a, b) => b.qty - a.qty || b.salesCents - a.salesCents).slice(0, 5);

  // Preparación: de la etapa 1 (preparando) a la 2 (listo), solo pedidos con las dos horas reales.
  const prepSamples = live.flatMap((r) => {
    const a = r.stageAt?.[1];
    const b = r.stageAt?.[2];
    const plan = r.plan ?? [];
    return a != null && b != null && b >= a && plan.length > 2 ? [{ real: (b - a) / 60_000, promised: plan[2] - plan[1] }] : [];
  });
  const prep = prepSamples.length
    ? {
        avgMin: Math.round((prepSamples.reduce((n, s) => n + s.real, 0) / prepSamples.length) * 10) / 10,
        promisedMin: Math.round((prepSamples.reduce((n, s) => n + s.promised, 0) / prepSamples.length) * 10) / 10,
        samples: prepSamples.length,
      }
    : null;

  const revs = await db.select({ rating: reviews.rating }).from(reviews).where(and(eq(reviews.storeId, store.id), gt(reviews.createdAt, since)));
  const rating = revs.length ? { avg: Math.round((revs.reduce((n, r) => n + r.rating, 0) / revs.length) * 10) / 10, count: revs.length } : null;

  const orderCount = new Set(live.map((r) => r.orderId)).size;
  return {
    days,
    orders: orderCount,
    cancelled: rows.length - live.length,
    salesCents: settlement.grossCents,
    avgTicketCents: orderCount ? Math.round(settlement.grossCents / orderCount) : 0,
    settlement,
    commissionPercent: COMMISSION_BPS[store.kind] / 100,
    topProducts,
    prep,
    rating,
  };
}
