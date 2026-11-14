"use client";

import Link from "next/link";
import { Icon } from "@/components/nami";
import { useCart } from "@/lib/cart/hooks";
import { MinNotice } from "@/components/cart/MinNotice";
import { minOrderShortfall, type CartStore } from "@/lib/cart/store";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes } from "@/lib/money";

type Props = { store: CartStore; open?: boolean; label?: string; reopenText?: string };

/** Carrito de la tienda que estás viendo: resumen lateral (escritorio) o barra inferior (móvil). */
export function StoreCart({ store, open = true, label = "Tu pedido", variant, reopenText }: Props & { variant: "aside" | "bar" }) {
  const { store: cur, lines, count, subtotal } = useCart();
  const mine = cur?.slug === store.slug;
  const rows = mine ? lines : [];
  const items = mine ? count : 0;
  const sub = mine ? subtotal : 0;
  const total = sub + (items ? store.feeCents : 0);
  const shortfall = items ? minOrderShortfall(store, sub) : 0;

  if (variant === "bar") {
    if (!open) {
      return <button type="button" disabled className="nm-btn nm-btn--primary nm-btn--block">{reopenText}</button>;
    }
    if (!items) return <p className="py-3 text-center text-caption text-ink-muted">Toca + para agregar productos a tu pedido.</p>;
    return (
      <div className="flex flex-col gap-2">
        {shortfall > 0 ? <MinNotice shortfall={shortfall} min={store.minOrderCents} /> : null}
        <Link href="/carrito" className="nm-btn nm-btn--primary nm-btn--block">
          <Icon name="cart" />Ver carrito · {items} {items === 1 ? "producto" : "productos"} · {formatUsd(sub)}
        </Link>
      </div>
    );
  }

  return (
    <aside aria-label={label} className="sticky top-6 hidden flex-col gap-3.5 rounded-lg border border-border p-5 shadow-card desktop:flex">
      <h2 className="font-display text-[20px] leading-6.5 font-extrabold">{label}</h2>
      {rows.length === 0 ? <p className="text-caption text-ink-muted">Todavía no agregas nada. Toca + en el menú.</p> : null}
      {rows.map((l) => (
        <div key={l.key} className="flex items-start gap-2.5">
          <span className="min-w-7 text-body-strong font-bold">{l.qty}×</span>
          <span className="flex grow flex-col"><span className="text-body">{l.name}</span>{l.note ? <span className="text-caption text-ink-muted">{l.note}</span> : null}</span>
          <span className="text-body-strong whitespace-nowrap">{formatUsd(l.qty * l.unitCents)}</span>
        </div>
      ))}
      <div className="flex flex-col gap-1.5 border-t border-dashed border-border pt-3 text-caption">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatUsd(sub)}</span></div>
        <div className="flex justify-between text-ink-muted"><span>Envío</span><span>{formatUsd(items ? store.feeCents : 0)}</span></div>
        <div className="flex items-baseline justify-between pt-1.5">
          <span className="text-body-strong font-bold">Total</span>
          <span className="flex flex-col items-end"><span className="text-price">{formatUsd(total)}</span><span className="text-caption text-ink-muted">{formatVes(total, DEMO_RATE)}</span></span>
        </div>
      </div>
      {shortfall > 0 ? <MinNotice shortfall={shortfall} min={store.minOrderCents} /> : null}
      {open && items && shortfall === 0
        ? <Link href="/checkout" className="nm-btn nm-btn--primary nm-btn--block">Ir a pagar</Link>
        : <button type="button" disabled className="nm-btn nm-btn--primary nm-btn--block">Ir a pagar</button>}
      <span className="text-center text-badge font-medium text-ink-muted">Pedido mínimo {formatUsd(store.minOrderCents)} · Simulación sin cobro real</span>
    </aside>
  );
}
