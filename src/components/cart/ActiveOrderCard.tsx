"use client";

import Link from "next/link";
import { Icon } from "@/components/nami";
import { useCartReady } from "@/lib/cart/hooks";
import { useCartStore } from "@/lib/cart/store";


/** Pedido en curso: el último que hiciste en este navegador; si no hay, estado vacío. */
export function ActiveOrderCard() {
  const order = useCartStore((s) => s.order);
  const ready = useCartReady();
  if (!ready) return <div className="h-22" aria-busy="true" />;
  if (!order) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface-tile p-5">
        <span className="text-body-strong font-bold">No tienes pedidos en curso</span>
        <span className="text-caption text-ink-muted">Cuando hagas un pedido, aquí podrás seguir su recorrido.</span>
        <Link href="/listado" className="nm-btn nm-btn--primary">Explorar restaurantes</Link>
      </div>
    );
  }
  const o = { store: order.store.name, summary: order.lines.map((l) => `${l.qty}× ${l.name}`).join(", "), eta: "Llega en 24 min" };

  return (
    <Link href="/seguimiento" className="flex items-center gap-4 rounded-xl border-2 border-primary bg-primary-tint p-4">
      <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-primary text-on-primary [&_.nm-icon]:size-7"><Icon name="moto" /></span>
      <span className="flex min-w-0 grow flex-col">
        <span className="font-display text-title-md">Tu pedido va en camino</span>
        <span className="text-caption text-ink-muted">
          <span className="desktop:hidden">{o.store} · {o.eta}</span>
          <span className="hidden desktop:inline">{o.store} · {o.summary} · {o.eta}</span>
        </span>
      </span>
      <span className="hidden text-button text-primary-text desktop:block">Ver recorrido</span>
      <Icon name="chevronRight" className="size-5 text-primary-text desktop:hidden" />
    </Link>
  );
}
