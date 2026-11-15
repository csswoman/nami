"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { IconName } from "@/components/nami";
import type { BrandColor } from "@/lib/demo/home";
import { STAGE_COUNT, planFor, pickCourier, reachedStage, type Courier } from "@/lib/orders/progress";
import { scheduledFor } from "@/lib/orders/schedule";

/**
 * Estado de cliente del invitado: carrito, dirección elegida y sus pedidos (todo en el navegador).
 * Es la versión de la interfaz; el servidor sigue recalculando precios y totales en el checkout real.
 */

export type CartStore = {
  slug: string;
  name: string;
  initials: string;
  color: BrandColor;
  feeCents: number;
  minOrderCents: number;
  /** Decide a qué página vuelve "Ver menú": /tienda o /mercado. */
  kind: "restaurante" | "mercado";
  /** false = cerrada ahora: el pedido se programa para `opensAt`. Ausente = abierta. */
  open?: boolean;
  opensAt?: string;
};

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  unitCents: number;
  qty: number;
  icon: IconName;
  note?: string;
};

export type Address = { name: string; line: string; reference: string };
export type PayMethod = "movil" | "zelle" | "efectivo";
/** Cómo llega un carrito con varias tiendas: un motorizado por tienda o uno solo que pasa por todas. */
export type DeliveryMode = "separate" | "combined";

/** Recargo por cada parada extra cuando un solo motorizado recoge en varias tiendas. */
export const EXTRA_STOP_CENTS = 60;

export type CartGroup = { store: CartStore; lines: CartLine[] };
export type OrderStop = { store: CartStore; lines: CartLine[]; subtotalCents: number };

export type OrderStatus = "active" | "delivered" | "cancelled";

export type Order = {
  id: string;
  /** Tiendas del pedido, en el orden en que se recogen. */
  stops: OrderStop[];
  delivery: DeliveryMode;
  /** Primera tienda (compatibilidad con pantallas de una sola tienda). */
  store: CartStore;
  /** Todas las líneas, de todas las tiendas. */
  lines: CartLine[];
  subtotalCents: number;
  shippingCents: number;
  tipCents: number;
  totalCents: number;
  payment: PayMethod;
  address: Address;
  createdAt: number;
  /** "delivered" solo cuando confirmas que lo recibiste (o pasó mucho tiempo desde que llegó). */
  status: OrderStatus;
  /** Minutos desde el inicio en que se espera cada etapa: Recibido, Preparando, Buscando motorizado, En camino, Llegó. */
  plan: number[];
  /** Inicio virtual del plan; "Avanzar" de la demo lo adelanta para saltar a la siguiente etapa. */
  startAt: number;
  /** Hora real en que se alcanzó cada etapa (null = todavía no). */
  stageAt: (number | null)[];
  deliveredAt: number | null;
  courier: Courier;
  /** Hora a la que arranca un pedido programado (tienda cerrada al pedir); null = se prepara ya. */
  scheduledFor: number | null;
};

export const DEFAULT_ADDRESS: Address = {
  name: "Altamira",
  line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B, Altamira",
  reference: "Frente a la panadería La Reina",
};

type State = {
  groups: CartGroup[];
  delivery: DeliveryMode;
  address: Address;
  /** Pedidos hechos en este navegador, el más reciente primero. */
  orders: Order[];
  /** Contador para el número de pedido (ÑM-2101, ÑM-2102…), así no se repite. */
  seq: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  add: (store: CartStore, line: Omit<CartLine, "key" | "qty"> & { qty?: number }) => void;
  setQty: {
    (slug: string, key: string, qty: number): void;
    (key: string, qty: number): void;
  };
  removeStore: (slug: string) => void;
  clear: () => void;
  setDelivery: (m: DeliveryMode) => void;
  setAddress: (a: Address) => void;
  placeOrder: (o: { tipCents: number; payment: PayMethod }) => Order | null;
  /** Demo: salta a la siguiente etapa del recorrido. */
  advanceOrder: (id: string) => void;
  /** Demo: vuelve a empezar el recorrido desde "Recibido". */
  restartOrder: (id: string) => void;
  /** "Confirmar que lo recibí": pasa el pedido al historial. */
  confirmDelivered: (id: string) => void;
};

export const lineKey = (productId: string, note?: string) => `${productId}|${note ?? ""}`;
export const sumLines = (lines: Pick<CartLine, "qty" | "unitCents">[]) => lines.reduce((n, l) => n + l.qty * l.unitCents, 0);
/** Centavos que faltan para el pedido mínimo de la tienda (0 si ya lo alcanza). */
export const minOrderShortfall = (store: Pick<CartStore, "minOrderCents">, subtotalCents: number) => Math.max(0, store.minOrderCents - subtotalCents);
export const countLines = (lines: Pick<CartLine, "qty">[]) => lines.reduce((n, l) => n + l.qty, 0);
export const groupOf = (groups: CartGroup[], slug: string) => groups.find((g) => g.store.slug === slug);
export const countGroups = (groups: CartGroup[]) => groups.reduce((n, g) => n + countLines(g.lines), 0);
export const subtotalGroups = (groups: CartGroup[]) => groups.reduce((n, g) => n + sumLines(g.lines), 0);

/** Envío: separado = suma de cada tienda; combinado = el envío más caro + recargo por cada parada extra. */
export function shippingOf(stores: Pick<CartStore, "feeCents">[], mode: DeliveryMode): number {
  if (stores.length === 0) return 0;
  if (mode === "separate" || stores.length === 1) return stores.reduce((n, s) => n + s.feeCents, 0);
  return Math.max(...stores.map((s) => s.feeCents)) + EXTRA_STOP_CENTS * (stores.length - 1);
}

export type CartTotals = { itemCount: number; subtotalCents: number; shippingCents: number; tipCents: number; totalCents: number };

/** Única fuente de las sumas del carrito: todas las pantallas (carrito, panel, checkout, pedido) usan esto. */
export function cartTotals(groups: CartGroup[], mode: DeliveryMode, tipCents = 0): CartTotals {
  const subtotalCents = subtotalGroups(groups);
  const shippingCents = shippingOf(groups.map((g) => g.store), mode);
  return { itemCount: countGroups(groups), subtotalCents, shippingCents, tipCents, totalCents: subtotalCents + shippingCents + tipCents };
}

/** Nombre(s) de las tiendas de un pedido: "A + B". */
export const orderStoreName = (o: Pick<Order, "stops">) => o.stops.map((s) => s.store.name).join(" + ");

const nextId = (seq: number) => `ÑM-${2101 + seq}`;

export const useCartStore = create<State>()(
  persist(
    (set, get) => ({
      groups: [],
      delivery: "combined",
      address: DEFAULT_ADDRESS,
      orders: [],
      seq: 0,
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (store, line) =>
        set((s) => {
          // Un carrito puede tener varias tiendas: cada una es un grupo con sus propias líneas.
          const key = lineKey(line.productId, line.note);
          const qty = line.qty ?? 1;
          const has = s.groups.some((g) => g.store.slug === store.slug);
          const next = has ? s.groups : [...s.groups, { store, lines: [] }];
          return {
            groups: next.map((g) => {
              if (g.store.slug !== store.slug) return g;
              const found = g.lines.find((l) => l.key === key);
              const lines = found
                ? g.lines.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
                : [...g.lines, { ...line, key, qty }];
              return { ...g, lines };
            }),
          };
        }),
      setQty: ((...args: [string, string, number] | [string, number]) =>
        set((s) => {
          let slug: string | undefined;
          let key: string;
          let qty: number;
          if (args.length === 2) {
            key = args[0];
            qty = args[1];
            slug = s.groups.find((g) => g.lines.some((l) => l.key === key))?.store.slug;
          } else {
            slug = args[0];
            key = args[1];
            qty = args[2];
          }
          if (!slug) return s;
          return {
            groups: s.groups
              .map((g) =>
                g.store.slug !== slug
                  ? g
                  : {
                    ...g,
                    lines:
                      qty <= 0
                        ? g.lines.filter((l) => l.key !== key)
                        : g.lines.map((l) => (l.key === key ? { ...l, qty } : l)),
                  }
              )
              .filter((g) => g.lines.length > 0),
          };
        })) as State["setQty"],
      removeStore: (slug) => set((s) => ({ groups: s.groups.filter((g) => g.store.slug !== slug) })),
      clear: () => set({ groups: [] }),
      setDelivery: (delivery) => set({ delivery }),
      setAddress: (address) => set({ address }),
      placeOrder: ({ tipCents, payment }) => {
        const { groups, address, delivery, seq, orders } = get();
        if (groups.length === 0) return null;
        // Regla de negocio: aquí vive la validación real; los botones deshabilitados son solo ayuda visual.
        if (groups.some((g) => minOrderShortfall(g.store, sumLines(g.lines)) > 0)) return null;
        const stops: OrderStop[] = groups.map((g) => ({ store: g.store, lines: g.lines, subtotalCents: sumLines(g.lines) }));
        const t = cartTotals(groups, delivery, tipCents);
        const now = Date.now();
        const scheduled = scheduledFor(stops.map((s) => s.store), now);
        const start = scheduled ?? now;
        const order: Order = {
          id: nextId(seq),
          stops,
          delivery,
          store: stops[0].store,
          lines: stops.flatMap((g) => g.lines),
          subtotalCents: t.subtotalCents,
          shippingCents: t.shippingCents,
          tipCents,
          totalCents: t.totalCents,
          payment,
          address,
          createdAt: now,
          status: "active",
          plan: planFor(stops.map((s) => s.store), delivery),
          startAt: start,
          stageAt: [scheduled ? null : now, null, null, null, null],
          deliveredAt: null,
          courier: pickCourier(seq),
          scheduledFor: scheduled,
        };
        set({ orders: [order, ...orders], seq: seq + 1, groups: [] });
        return order;
      },
      advanceOrder: (id) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id || o.status !== "active") return o;
            const now = Date.now();
            const cur = reachedStage(o, now);
            if (cur >= STAGE_COUNT - 1) return o;
            const target = cur + 1;
            // Como si hubiera pasado el tiempo: todo el recorrido se corre hacia atrás hasta que la etapa siguiente sea "ahora".
            // Así las horas de cada etapa siguen siendo creíbles en lugar de quedar todas iguales.
            const shift = Math.max(0, o.startAt + o.plan[target] * 60_000 - now);
            const stageAt = o.stageAt.map((t) => (t == null ? null : t - shift));
            return { ...o, stageAt, startAt: o.startAt - shift, createdAt: o.createdAt - shift };
          }),
        })),
      restartOrder: (id) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            const now = Date.now();
            // También se vuelve a calcular el plan: así un pedido viejo con tiempos largos pasa a la versión rápida de la demo.
            return { ...o, status: "active", plan: planFor(o.stops.map((x) => x.store), o.delivery), startAt: now, stageAt: [now, null, null, null, null], deliveredAt: null };
          }),
        })),
      confirmDelivered: (id) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id || o.status !== "active") return o;
            const now = Date.now();
            const arrived = o.stageAt[STAGE_COUNT - 1] ?? Math.min(now, o.startAt + o.plan[STAGE_COUNT - 1] * 60_000);
            const stageAt = o.stageAt.map((t, i) => t ?? Math.min(arrived, o.startAt + o.plan[i] * 60_000));
            return { ...o, status: "delivered", stageAt, deliveredAt: arrived };
          }),
        })),
    }),
    {
      name: "nami-guest",
      version: 5,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ groups: s.groups, delivery: s.delivery, address: s.address, orders: s.orders, seq: s.seq }),
      // v1: una sola tienda (store + lines). v2: varias tiendas y un solo pedido (`order`). v3: lista de pedidos con estado. v4: pedidos programados. v5: recorrido rápido de la demo (los pedidos en curso con tiempos largos se reinician).
      // Se ejecuta siempre al leer (no solo al cambiar de versión): descarta carritos o pedidos con forma inválida.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        const groups = cleanGroups(p.groups);
        const orders = Array.isArray(p.orders) ? p.orders.filter(validOrder) : current.orders;
        return {
          ...current,
          groups,
          orders,
          delivery: p.delivery === "separate" ? "separate" : "combined",
          address: p.address && typeof p.address.line === "string" ? p.address : current.address,
          seq: typeof p.seq === "number" ? p.seq : orders.length,
        };
      },
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        const groups = Array.isArray(p.groups) ? p.groups : p.store && Array.isArray(p.lines) && p.lines.length ? [{ store: p.store, lines: p.lines }] : [];
        const legacy = p.order ? [p.order] : [];
        const raw: any[] = Array.isArray(p.orders) ? p.orders : legacy; // eslint-disable-line @typescript-eslint/no-explicit-any
        const orders = raw.flatMap((o, i) => {
          try {
            return o && (o.stops || o.store) ? [upgradeOrder(o, i)] : [];
          } catch {
            return []; // un pedido guardado que no se puede leer no debe romper todo el carrito
          }
        });
        return { groups, delivery: p.delivery ?? "combined", address: p.address ?? DEFAULT_ADDRESS, orders, seq: typeof p.seq === "number" ? p.seq : orders.length } as never;
      },
    },
  ),
);

const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** Solo deja grupos con tienda y líneas bien formadas; lo demás se descarta en vez de romper la pantalla. */
function cleanGroups(raw: unknown): CartGroup[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((g) => {
    if (!g || typeof g.store?.slug !== "string" || !Array.isArray(g.lines)) return [];
    const lines = g.lines.filter((l: any) => l && typeof l.key === "string" && typeof l.productId === "string" && isNum(l.qty) && l.qty > 0 && isNum(l.unitCents)); // eslint-disable-line @typescript-eslint/no-explicit-any
    return lines.length ? [{ store: { ...g.store, feeCents: isNum(g.store.feeCents) ? g.store.feeCents : 0, minOrderCents: isNum(g.store.minOrderCents) ? g.store.minOrderCents : 0 }, lines }] : [];
  });
}

function validOrder(o: any): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
  return !!o && typeof o.id === "string" && Array.isArray(o.stops) && Array.isArray(o.plan) && Array.isArray(o.stageAt) && isNum(o.startAt) && isNum(o.totalCents);
}

/** Completa un pedido guardado por una versión anterior con los campos que ahora son obligatorios. */
function upgradeOrder(o: any, i: number): Order { // eslint-disable-line @typescript-eslint/no-explicit-any
  const stops: OrderStop[] = o.stops ?? [{ store: o.store, lines: o.lines ?? [], subtotalCents: o.subtotalCents ?? sumLines(o.lines ?? []) }];
  const delivery: DeliveryMode = o.delivery ?? "combined";
  const createdAt = typeof o.createdAt === "number" ? o.createdAt : Date.now();
  const plan: number[] = Array.isArray(o.plan) ? o.plan : planFor(stops.map((s) => s.store), delivery);
  // Pedido en curso con los tiempos largos de antes (más de 5 min): se reinicia con el recorrido rápido.
  const stale = (o.status ?? "active") === "active" && plan[plan.length - 1] > 5;
  return {
    ...o,
    ...(stale ? { startAt: Date.now(), stageAt: [Date.now(), null, null, null, null], deliveredAt: null } : {}),
    stops,
    delivery,
    store: o.store ?? stops[0].store,
    lines: o.lines ?? stops.flatMap((s) => s.lines),
    status: o.status ?? "active",
    plan: stale ? planFor(stops.map((s) => s.store), delivery) : plan,
    startAt: stale ? Date.now() : (o.startAt ?? createdAt),
    stageAt: stale ? [Date.now(), null, null, null, null] : Array.isArray(o.stageAt) ? o.stageAt : [createdAt, null, null, null, null],
    deliveredAt: stale ? null : (o.deliveredAt ?? null),
    courier: o.courier ?? pickCourier(i),
    scheduledFor: o.scheduledFor ?? null,
    createdAt,
  };
}
