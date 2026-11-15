"use client";

import { Icon } from "@/components/nami";
import { useCartStore } from "@/lib/cart/store";
import type { OrderViewStop } from "@/lib/orders/view";

/** Suma al carrito los productos de un pedido anterior (los que sigan disponibles, al precio de hoy) y abre el carrito. */
export function RepeatOrderButton({ stops, className = "nm-btn nm-btn--secondary", label = "Repetir" }: { stops: OrderViewStop[]; className?: string; label?: string }) {
  const count = stops.reduce((n, s) => n + s.lines.filter((l) => l.available).length, 0);
  function repeat() {
    // Se suma a lo que ya tengas (también de otras tiendas) y se abre el carrito, sin cambiar de página.
    const { add, openCart } = useCartStore.getState();
    for (const s of stops) {
      for (const l of s.lines) {
        if (l.available) add(s.store, { productId: l.productId, name: l.name, unitCents: l.nowCents, icon: l.icon, qty: l.qty, note: l.note });
      }
    }
    openCart();
  }
  return (
    <button type="button" className={className} onClick={repeat} disabled={count === 0}>
      <Icon name="repeat" />{label}
    </button>
  );
}
