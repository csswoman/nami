"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { cartTotals, useCartStore, type CartGroup, type Order } from "@/lib/cart/store";
import { progressOf, type Progress } from "@/lib/orders/progress";

const EMPTY: CartGroup[] = [];
const NO_ORDERS: Order[] = [];

/** Se hidrata una sola vez desde localStorage (skipHydration evita el desajuste servidor/cliente). */
export function useCartHydration() {
  useEffect(() => {
    (async () => {
      await useCartStore.persist.rehydrate();
      // Si lo guardado está dañado, zustand deja hasHydrated en false para siempre y el carrito parece no agregar nada.
      // En ese caso se descarta lo guardado y se arranca limpio.
      if (!useCartStore.persist.hasHydrated()) {
        try {
          localStorage.removeItem(useCartStore.persist.getOptions().name ?? "nami-guest");
        } catch {}
        await useCartStore.persist.rehydrate();
      }
    })();
  }, []);
}

/** true cuando el carrito ya leyó localStorage; antes de eso la interfaz muestra el estado vacío. */
export function useCartReady(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const off = useCartStore.persist.onFinishHydration(cb);
      return off;
    },
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}

export function useCart() {
  const ready = useCartReady();
  const rawGroups = useCartStore((s) => s.groups);
  const delivery = useCartStore((s) => s.delivery);
  const isOpen = useCartStore((s) => s.isOpen);
  const openCart = useCartStore((s) => s.openCart);
  const closeCart = useCartStore((s) => s.closeCart);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const groups = ready ? rawGroups : EMPTY;
  const t = cartTotals(groups, delivery);
  return {
    ready,
    groups,
    store: groups[0]?.store ?? null,
    lines: groups.flatMap((g) => g.lines),
    delivery,
    count: t.itemCount,
    subtotal: t.subtotalCents,
    shippingCents: t.shippingCents,
    /** Subtotal + envío (sin propina). */
    totalCents: t.totalCents,
    isOpen,
    openCart,
    closeCart,
    toggleCart,
  };
}

/** Hora actual que se actualiza sola (para el recorrido simulado). */
export function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export type TrackedOrder = { order: Order; progress: Progress };

/** Pedidos del navegador con su recorrido: en curso y terminados. Vacío hasta leer localStorage. */
export function useOrders(now: number) {
  const ready = useCartReady();
  const raw = useCartStore((s) => s.orders);
  const orders = ready ? raw : NO_ORDERS;
  const tracked: TrackedOrder[] = orders.map((order) => ({ order, progress: progressOf(order, now) }));
  return {
    ready,
    active: tracked.filter((t) => !t.progress.finished),
    past: tracked.filter((t) => t.progress.finished),
    byId: (id: string | undefined) => tracked.find((t) => t.order.id === id),
  };
}
