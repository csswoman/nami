"use client";

import Link from "next/link";
import { Icon } from "@/components/nami";
import { useCart } from "@/lib/cart/hooks";
import { Stepper } from "@/components/shell/Stepper";
import { useCartStore } from "@/lib/cart/store";
import { MinNotice } from "@/components/cart/MinNotice";
import { countLines, groupOf, minOrderShortfall, sumLines, type CartStore } from "@/lib/cart/store";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes } from "@/lib/money";

/** `scheduleText` = la tienda está cerrada: el pedido se programa para esa hora ("mañana a las 6:00 a. m."). */
type Props = { store: CartStore; label?: string; scheduleText?: string };

/** Carrito de la tienda que estás viendo: resumen lateral (escritorio) o barra inferior (móvil). */
export function StoreCart({ store, label = "Tu pedido", variant, scheduleText }: Props & { variant: "aside" | "bar" }) {
  const { groups, delivery, count: cartCount, subtotal: cartSub, shippingCents: cartShipping, totalCents: cartTotal } = useCart();
  const setQty = useCartStore((s) => s.setQty);
  const mine = groupOf(groups, store.slug);
  const others = groups.length - (mine ? 1 : 0);
  const rows = mine?.lines ?? [];
  const items = countLines(rows);
  const sub = sumLines(rows);
  // Con otras tiendas en el carrito, el envío y el total son los del carrito completo (envío combinado o separado).
  const shipping = others > 0 ? cartShipping : items ? store.feeCents : 0;
  const total = others > 0 ? cartTotal : sub + shipping;
  const shipLabel = others > 0 ? (delivery === "combined" ? `Envío (un motorizado, ${groups.length} paradas)` : `Envíos (${groups.length})`) : "Envío";
  const shortfall = items ? minOrderShortfall(store, sub) : 0;

  if (variant === "bar") {
    if (!items) return <p className="py-3 text-center text-caption text-ink-muted">{scheduleText ? `Toca + para programar tu pedido para ${scheduleText}.` : "Toca + para agregar productos a tu pedido."}</p>;
    return (
      <div className="flex flex-col gap-2">
        {scheduleText ? <p className="text-center text-caption text-ink-muted">Cerrada ahora · Tu pedido se programa para {scheduleText}</p> : null}
        {shortfall > 0 ? <MinNotice shortfall={shortfall} min={store.minOrderCents} /> : null}
        <Link href="/carrito" className="nm-btn nm-btn--primary nm-btn--block">
          <Icon name="cart" />Ver carrito · {cartCount} {cartCount === 1 ? "producto" : "productos"} · {formatUsd(cartSub)}
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
          <span className="flex grow flex-col"><span className="text-body">{l.name}</span>{l.note ? <span className="text-caption text-ink-muted">{l.note}</span> : null}<span className="text-body-strong whitespace-nowrap">{formatUsd(l.qty * l.unitCents)}</span></span>
          <Stepper qty={l.qty} max={l.stock} name={l.name} onMinus={() => setQty(store.slug, l.key, l.qty - 1)} onPlus={() => setQty(store.slug, l.key, l.qty + 1)} />
        </div>
      ))}
      <div className="flex flex-col gap-1.5 border-t border-dashed border-border pt-3 text-caption">
        <div className="flex justify-between"><span>{others > 0 ? "Subtotal de esta tienda" : "Subtotal"}</span><span>{formatUsd(sub)}</span></div>
        {others > 0 ? <div className="flex justify-between text-ink-muted"><span>Otras tiendas</span><span>{formatUsd(cartSub - sub)}</span></div> : null}
        <div className="flex justify-between text-ink-muted"><span>{shipLabel}</span><span>{formatUsd(shipping)}</span></div>
        <div className="flex items-baseline justify-between pt-1.5">
          <span className="text-body-strong font-bold">{others > 0 ? "Total del carrito" : "Total"}</span>
          <span className="flex flex-col items-end"><span className="text-price">{formatUsd(total)}</span><span className="text-caption text-ink-muted">{formatVes(total, DEMO_RATE)}</span></span>
        </div>
      </div>
      {shortfall > 0 ? <MinNotice shortfall={shortfall} min={store.minOrderCents} /> : null}
      {scheduleText && items ? <p className="text-caption text-ink-muted">Cerrada ahora: tu pedido se programa para {scheduleText}.</p> : null}
      {items && shortfall === 0
        ? <Link href="/checkout" className="nm-btn nm-btn--primary nm-btn--block">{scheduleText ? "Programar pedido" : "Ir a pagar"}</Link>
        : <button type="button" disabled className="nm-btn nm-btn--primary nm-btn--block">{scheduleText ? "Programar pedido" : "Ir a pagar"}</button>}
      {others > 0 ? <Link href="/carrito" className="text-center text-caption font-semibold text-primary-text">+ {others} {others === 1 ? "tienda más" : "tiendas más"} en tu carrito</Link> : null}
      <span className="text-center text-badge font-medium text-ink-muted">Pedido mínimo {formatUsd(store.minOrderCents)} · Simulación sin cobro real</span>
    </aside>
  );
}
