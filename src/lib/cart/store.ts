"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { IconName } from "@/components/nami";
import type { BrandColor } from "@/lib/demo/home";

/**
 * Estado de cliente del invitado: carrito, dirección elegida y el último pedido (todo en el navegador).
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

export type Order = {
  id: string;
  store: CartStore;
  lines: CartLine[];
  subtotalCents: number;
  shippingCents: number;
  tipCents: number;
  totalCents: number;
  payment: PayMethod;
  address: Address;
  createdAt: number;
};

export const DEFAULT_ADDRESS: Address = {
  name: "Altamira",
  line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B, Altamira",
  reference: "Frente a la panadería La Reina",
};

type State = {
  store: CartStore | null;
  lines: CartLine[];
  address: Address;
  order: Order | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  add: (store: CartStore, line: Omit<CartLine, "key" | "qty"> & { qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  setAddress: (a: Address) => void;
  placeOrder: (o: { tipCents: number; payment: PayMethod }) => Order | null;
};

export const lineKey = (productId: string, note?: string) => `${productId}|${note ?? ""}`;
export const sumLines = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty * l.unitCents, 0);
/** Centavos que faltan para el pedido mínimo de la tienda (0 si ya lo alcanza). */
export const minOrderShortfall = (store: Pick<CartStore, "minOrderCents">, subtotalCents: number) => Math.max(0, store.minOrderCents - subtotalCents);
export const countLines = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);

export const useCartStore = create<State>()(
  persist(
    (set, get) => ({
      store: null,
      lines: [],
      address: DEFAULT_ADDRESS,
      order: null,
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      add: (store, line) =>
        set((s) => {
          // Un carrito es de una sola tienda: si cambias de tienda, empieza uno nuevo.
          const base = s.store?.slug === store.slug ? s.lines : [];
          const key = lineKey(line.productId, line.note);
          const qty = line.qty ?? 1;
          const found = base.find((l) => l.key === key);
          const lines = found
            ? base.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
            : [...base, { ...line, key, qty }];
          return { store, lines };
        }),

      setQty: (key, qty) =>
        set((s) => {
          const lines = qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty } : l));
          return { lines, store: lines.length ? s.store : null };
        }),

      clear: () => set({ lines: [], store: null }),

      setAddress: (address) => set({ address }),

      placeOrder: ({ tipCents, payment }) => {
        const { store, lines, address } = get();
        if (!store || lines.length === 0) return null;
        const subtotalCents = sumLines(lines);
        // Regla de negocio: aquí vive la validación real; los botones deshabilitados son solo ayuda visual.
        if (minOrderShortfall(store, subtotalCents) > 0) return null;
        const order: Order = {
          id: `ÑM-${2000 + Math.floor(Math.random() * 900)}`,
          store,
          lines,
          subtotalCents,
          shippingCents: store.feeCents,
          tipCents,
          totalCents: subtotalCents + store.feeCents + tipCents,
          payment,
          address,
          createdAt: Date.now(),
        };
        set({ order, lines: [], store: null });
        return order;
      },
    }),
    {
      name: "nami-guest",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ store: s.store, lines: s.lines, address: s.address, order: s.order }),
    },
  ),
);
