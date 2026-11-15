import type { IconName } from "@/components/nami";
import type { CartStore, Order, PayMethod } from "@/lib/cart/store";
import { getStore } from "@/lib/demo/catalog";
import { MARKETS } from "@/lib/demo/mercado";
import { marketIcon, storeKindLabel, type HistoryOrder } from "@/lib/demo/pedidos";
import { formatClock, formatWhen, minutesBetween, stageLabels, type Progress } from "@/lib/orders/progress";

function findProductImage(storeSlug: string, productId: string): string | undefined {
  const rest = getStore(storeSlug);
  if (rest) {
    const it = rest.menu.flatMap((s) => s.items).find((i) => i.id === productId);
    if (it?.image) return it.image;
  }
  const mk = MARKETS[storeSlug];
  if (mk) {
    const p = mk.sections.flatMap((s) => s.products).find((i) => i.id === productId);
    if (p?.image) return p.image;
  }
  return undefined;
}

/**
 * Forma común de un pedido para "Mis pedidos" y el detalle, venga del historial de ejemplo
 * o de un pedido hecho en este navegador. Los montos son los que se cobraron.
 */

export type OrderViewLine = {
  key: string; productId: string; name: string; qty: number;
  unitCents: number; nowCents: number; icon: IconName; image?: string; note?: string; available: boolean;
  /** Opciones y nota del cliente, para repetir el pedido tal cual. */
  options?: Record<string, string[]>; userNote?: string;
};
export type OrderViewStop = { store: CartStore; kindLabel: string; lines: OrderViewLine[]; subtotalCents: number };

export type OrderView = {
  id: string;
  /** Número que se muestra (ÑM-2101). */
  code: string;
  status: "delivered" | "cancelled";
  when: string;
  whenLong: string;
  stops: OrderViewStop[];
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  shippingLabel: string;
  tipCents: number;
  /** Cupón aplicado y lo que descontó (productos + envío); `totalCents` ya lo trae restado. */
  couponCode?: string;
  discountCents?: number;
  /** Cambios de la tienda por falta de stock (productos quitados o sustituidos). */
  changes?: string[];
  totalCents: number;
  payment: string;
  paymentRef: string;
  address: string;
  reference: string;
  steps: [string, string][];
  stats: [string, string][];
  courier?: string;
  cancelReason?: string;
};

export function fromHistory(h: HistoryOrder): OrderView {
  return {
    id: h.id,
    code: h.id,
    status: h.status,
    when: h.date,
    whenLong: h.dateLong,
    stops: [{
      store: h.store,
      kindLabel: h.kindLabel,
      subtotalCents: h.subtotalCents,
      lines: h.lines.map((l) => ({ key: `${l.id}|${l.note ?? ""}`, productId: l.id, name: l.name, qty: l.qty, unitCents: l.unitCents, nowCents: l.nowCents, icon: l.icon, image: l.image, note: l.note, available: l.available })),
    }],
    itemCount: h.itemCount,
    subtotalCents: h.subtotalCents,
    shippingCents: h.shippingCents,
    shippingLabel: "Envío",
    tipCents: h.tipCents,
    totalCents: h.totalCents,
    payment: h.payment,
    paymentRef: h.paymentRef,
    address: h.address,
    reference: h.reference,
    steps: (h.steps ?? []).map(([a, b]) => [a, b]),
    stats: h.status === "cancelled" ? [] : [[`${h.prepMin} min`, "Preparación"], [`${h.rideMin} min`, "En la moto"], [h.km ?? "", h.route ?? ""]],
    courier: h.courier,
    cancelReason: h.cancelReason,
  };
}

const PAY: Record<PayMethod, [string, string]> = {
  movil: ["Pago móvil", "Referencia verificada"],
  zelle: ["Zelle", "Confirmación recibida"],
  efectivo: ["Efectivo · Pago al recibir", "Pagado en efectivo al motorizado"],
};

/** Pedido hecho en este navegador, ya terminado. */
export function fromOrder(o: Order, p: Progress, now: number): OrderView {
  const multi = o.stops.length > 1;
  const labels = stageLabels(o.stops);
  const end = p.times[p.times.length - 1];
  return {
    id: o.id,
    code: o.code ?? o.id,
    status: o.status === "cancelled" ? "cancelled" : "delivered",
    cancelReason: o.cancelReason ? `Cancelaste este pedido. Motivo: ${o.cancelReason}` : undefined,
    when: formatWhen(o.createdAt, now),
    whenLong: formatWhen(o.createdAt, now).replace(", ", " · "),
    stops: o.stops.map((s) => ({
      store: s.store,
      kindLabel: storeKindLabel(s.store.slug),
      subtotalCents: s.subtotalCents,
      lines: s.lines.map((l) => ({
        key: l.key, productId: l.productId, name: l.name, qty: l.qty, unitCents: l.unitCents, nowCents: l.unitCents,
        icon: s.store.kind === "mercado" && l.icon === "basket" ? marketIcon(s.store.slug) : l.icon,
        image: findProductImage(s.store.slug, l.productId),
        note: l.note, available: true, options: l.options, userNote: l.userNote,
      })),
    })),
    itemCount: o.lines.reduce((n, l) => n + l.qty, 0),
    subtotalCents: o.subtotalCents,
    shippingCents: o.shippingCents,
    shippingLabel: multi ? (o.delivery === "combined" ? `Envío (un motorizado, ${o.stops.length} paradas)` : `Envíos (${o.stops.length})`) : "Envío",
    tipCents: o.tipCents,
    couponCode: o.couponCode ?? undefined,
    discountCents: o.discountCents ?? 0,
    changes: o.changes,
    totalCents: o.totalCents,
    payment: PAY[o.payment][0],
    paymentRef: `${PAY[o.payment][1]} · ${formatClock(o.createdAt)}`,
    address: o.address.line,
    reference: o.address.reference,
    steps: labels.map((l, i) => [l, formatClock(p.times[i])]),
    stats: [
      [`${minutesBetween(p.times[0], p.times[3])} min`, "Preparación"],
      [`${minutesBetween(p.times[3], end)} min`, "En la moto"],
      multi ? [`${o.stops.length} paradas`, o.delivery === "combined" ? "Un solo motorizado" : "Envíos separados"] : [`${minutesBetween(p.times[0], end)} min`, "En total"],
    ],
    courier: `Te lo llevó ${o.courier.name} · ${o.courier.vehicle} · ${o.courier.plate}`,
  };
}
