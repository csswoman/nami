"use client";

import { useEffect, useSyncExternalStore } from "react";
import { countLines, sumLines, useCartStore } from "@/lib/cart/store";

/** Se hidrata una sola vez desde localStorage (skipHydration evita el desajuste servidor/cliente). */
export function useCartHydration() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
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
  const store = useCartStore((s) => s.store);
  const lines = useCartStore((s) => s.lines);
  const isOpen = useCartStore((s) => s.isOpen);
  const openCart = useCartStore((s) => s.openCart);
  const closeCart = useCartStore((s) => s.closeCart);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const l = ready ? lines : [];
  return {
    ready,
    store: ready ? store : null,
    lines: l,
    count: countLines(l),
    subtotal: sumLines(l),
    isOpen,
    openCart,
    closeCart,
    toggleCart,
  };
}
