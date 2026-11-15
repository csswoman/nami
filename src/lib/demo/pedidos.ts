import type { IconName } from "@/components/nami";
import type { CartStore } from "@/lib/cart/store";
import { getStore } from "@/lib/demo/catalog";
import type { BrandColor } from "@/lib/demo/home";
import { MARKETS } from "@/lib/demo/mercado";

/**
 * Historial de ejemplo de "Mis pedidos". Cada línea apunta a un producto real del catálogo
 * (tienda + id) y guarda el precio que se pagó: el total del pedido no cambia aunque cambie el menú,
 * y "Repetir pedido" mete en el carrito los mismos productos con el precio de hoy.
 */

type RawLine = { id: string; qty: number; paid: number; note?: string };
type Raw = {
  id: string;
  slug: string;
  status: "delivered" | "cancelled";
  date: string;
  dateLong: string;
  lines: RawLine[];
  /** Envío cobrado ese día. */
  shippingCents: number;
  tipCents: number;
  payment: string;
  paymentRef: string;
  address: string;
  reference: string;
  /** Solo entregados */
  steps?: readonly (readonly [string, string])[];
  prepMin?: number;
  rideMin?: number;
  km?: string;
  route?: string;
  courier?: string;
  /** Solo cancelados */
  cancelReason?: string;
};

const HOME = { address: "Av. Luis Roche, Edif. Los Samanes, apto. 4B, Altamira", reference: "Frente a la panadería La Reina" };

const RAW: Raw[] = [
  {
    id: "ÑM-2031", slug: "perros-el-gocho", status: "delivered", date: "Ayer, 10:42 p. m.", dateLong: "Ayer · 10:42 p. m.",
    lines: [{ id: "perro-todo", qty: 2, paid: 320, note: "Sin cebolla" }, { id: "papitas", qty: 1, paid: 200 }, { id: "malta", qty: 2, paid: 120 }],
    shippingCents: 80, tipCents: 100, payment: "Pago móvil · Banesco", paymentRef: "Ref. 009377 · Verificado a las 10:43 p. m.", ...HOME,
    steps: [["Recibido", "10:42 p. m."], ["Preparando", "10:44 p. m."], ["Buscando motorizado", "10:55 p. m."], ["En camino", "10:58 p. m."], ["Llegó", "11:09 p. m."]],
    prepMin: 13, rideMin: 11, km: "1,9 km", route: "Chacao → Altamira", courier: "Te lo llevó Luis Ramírez · Moto roja · AC8F21K",
  },
  {
    id: "ÑM-2048", slug: "arepera-dona-chela", status: "delivered", date: "28 sep., 7:52 a. m.", dateLong: "28 sep. · 7:52 a. m.",
    lines: [{ id: "reina", qty: 2, paid: 350, note: "Masa blanca · Asada en budare" }, { id: "guayoyo", qty: 1, paid: 100 }],
    shippingCents: 120, tipCents: 100, payment: "Pago móvil · Banco del Ávila", paymentRef: "Ref. 004821 · Verificado a las 7:52 a. m.", ...HOME,
    steps: [["Recibido", "7:52 a. m."], ["Preparando", "7:54 a. m."], ["Buscando motorizado", "8:03 a. m."], ["En camino", "8:06 a. m."], ["Llegó", "8:17 a. m."]],
    prepMin: 11, rideMin: 11, km: "2,4 km", route: "Chacao → Altamira", courier: "Te lo llevó Carlos Mendoza · Moto negra · AB2C34D",
  },
  {
    id: "ÑM-2019", slug: "abasto-el-saman", status: "delivered", date: "24 sep., 5:15 p. m.", dateLong: "24 sep. · 5:15 p. m.",
    lines: [{ id: "harina", qty: 2, paid: 115 }, { id: "arroz", qty: 2, paid: 130 }, { id: "pasta", qty: 1, paid: 160 }, { id: "queso", qty: 1, paid: 390 }, { id: "leche", qty: 3, paid: 190 }, { id: "aceite", qty: 1, paid: 320 }],
    shippingCents: 100, tipCents: 150, payment: "Zelle", paymentRef: "Confirmación Z-55120 · Verificado a las 5:21 p. m.", ...HOME,
    steps: [["Recibido", "5:15 p. m."], ["Armando tu compra", "5:22 p. m."], ["Buscando motorizado", "5:41 p. m."], ["En camino", "5:46 p. m."], ["Llegó", "6:02 p. m."]],
    prepMin: 26, rideMin: 16, km: "3,1 km", route: "Los Palos Grandes → Altamira", courier: "Te lo llevó Yusmary Pérez · Moto azul · AD4K09M",
  },
  {
    id: "ÑM-2007", slug: "pollos-en-brasa-el-rey", status: "cancelled", date: "20 sep., 1:05 p. m.", dateLong: "20 sep. · 1:05 p. m.",
    lines: [{ id: "medio-pollo", qty: 1, paid: 800 }, { id: "cuarto", qty: 1, paid: 480 }, { id: "tajadas", qty: 2, paid: 200 }],
    shippingCents: 120, tipCents: 0, payment: "Pago móvil · Mercantil", paymentRef: "Reembolsado el 20 sep. · Ref. 007714", ...HOME,
    cancelReason: "El local se quedó sin pollo y canceló el pedido. Te devolvimos el pago completo.",
  },
  {
    id: "ÑM-1992", slug: "farmacia-san-onofre", status: "delivered", date: "15 sep., 9:30 p. m.", dateLong: "15 sep. · 9:30 p. m.",
    lines: [{ id: "aceta", qty: 1, paid: 180 }, { id: "suero", qty: 2, paid: 250 }],
    shippingCents: 90, tipCents: 50, payment: "Efectivo · Pago al recibir", paymentRef: "Pagado en efectivo al motorizado", ...HOME,
    steps: [["Recibido", "9:30 p. m."], ["Preparando", "9:33 p. m."], ["Buscando motorizado", "9:41 p. m."], ["En camino", "9:44 p. m."], ["Llegó", "9:57 p. m."]],
    prepMin: 11, rideMin: 13, km: "2,0 km", route: "Chacao → Altamira", courier: "Te lo llevó Carlos Mendoza · Moto negra · AB2C34D",
  },
  {
    id: "ÑM-1978", slug: "cachapas-el-tio", status: "delivered", date: "9 sep., 12:48 p. m.", dateLong: "9 sep. · 12:48 p. m.",
    lines: [{ id: "cachapa-queso", qty: 2, paid: 550 }, { id: "cachapa-jamon", qty: 1, paid: 600 }, { id: "papelon", qty: 3, paid: 150 }],
    shippingCents: 110, tipCents: 100, payment: "Pago móvil · Banco del Ávila", paymentRef: "Ref. 003390 · Verificado a las 12:49 p. m.", ...HOME,
    steps: [["Recibido", "12:48 p. m."], ["Preparando", "12:50 p. m."], ["Buscando motorizado", "1:06 p. m."], ["En camino", "1:09 p. m."], ["Llegó", "1:24 p. m."]],
    prepMin: 19, rideMin: 15, km: "3,4 km", route: "La Castellana → Altamira", courier: "Te lo llevó Luis Ramírez · Moto roja · AC8F21K",
  },
];

export type HistoryLine = {
  id: string; name: string; qty: number;
  /** Precio que se pagó (el del pedido). */
  unitCents: number;
  /** Precio de hoy, el que se usa al repetir. */
  nowCents: number;
  icon: IconName;
  image?: string;
  note?: string;
  /** false si hoy el producto está agotado o ya no existe */
  available: boolean;
};

export type HistoryOrder = Omit<Raw, "lines"> & {
  store: CartStore;
  /** "Perros calientes", "Abasto", "Farmacia"… */
  kindLabel: string;
  lines: HistoryLine[];
  /** Resumen corto: "2× Perro con todo, 1× Papas fritas" */
  summary: string;
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

/** Tipo de tienda en pocas palabras, para distinguir pedidos a simple vista. */
export function storeKindLabel(slug: string): string {
  const rest = getStore(slug);
  if (rest) return rest.kind.split("·")[0].trim();
  return MARKETS[slug]?.kind ?? "Tienda";
}

/** Icono de cada producto de mercado: medicinas en farmacia, cesta en el resto. */
export const marketIcon = (slug: string): IconName => (MARKETS[slug]?.kind === "Farmacia" ? "pill" : "basket");

function resolve(r: Raw): HistoryOrder | null {
  const rest = getStore(r.slug);
  const mk = MARKETS[r.slug];
  const base = rest ?? mk;
  if (!base) return null;
  const store: CartStore = {
    slug: base.slug, name: base.name, initials: base.initials, color: base.color as BrandColor,
    feeCents: base.feeCents, minOrderCents: base.minOrderCents, kind: rest ? "restaurante" : "mercado",
  };
  const lines: HistoryLine[] = r.lines.flatMap((l): HistoryLine[] => {
    if (rest) {
      const it = rest.menu.flatMap((s) => s.items).find((i) => i.id === l.id);
      return it ? [{ id: l.id, name: it.name, qty: l.qty, unitCents: l.paid, nowCents: it.priceCents, icon: it.icon, image: it.image, note: l.note, available: !it.soldOut }] : [];
    }
    const p = mk?.sections.flatMap((s) => s.products).find((i) => i.id === l.id);
    return p ? [{ id: l.id, name: p.name, qty: l.qty, unitCents: l.paid, nowCents: p.priceCents, icon: marketIcon(r.slug), image: p.image, note: l.note, available: !p.soldOut }] : [];
  });
  const subtotalCents = lines.reduce((n, l) => n + l.qty * l.unitCents, 0);
  return {
    ...r, store, lines, subtotalCents,
    kindLabel: storeKindLabel(r.slug),
    totalCents: subtotalCents + r.shippingCents + r.tipCents,
    itemCount: lines.reduce((n, l) => n + l.qty, 0),
    summary: lines.map((l) => `${l.qty}× ${l.name}`).join(", "),
  };
}

export const PAST_ORDERS: HistoryOrder[] = RAW.map(resolve).filter((o): o is HistoryOrder => o !== null);
export const getPastOrder = (id: string) => PAST_ORDERS.find((o) => o.id === id);
