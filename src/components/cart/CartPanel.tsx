"use client";
import Link from "next/link";
import { Icon } from "@/components/nami";
import { MinNotice } from "@/components/cart/MinNotice";
import { Stepper } from "@/components/shell/Stepper";
import { StoreMark } from "@/components/shell/StoreMark";
import { useCart } from "@/lib/cart/hooks";
import { storeHref } from "@/lib/cart/meta";
import { EXTRA_STOP_CENTS, minOrderShortfall, shippingOf, sumLines, useCartStore, type DeliveryMode } from "@/lib/cart/store";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes } from "@/lib/money";

/** Elección de envío cuando el carrito tiene más de una tienda. */
export function DeliveryChoice({ compact = false }: { compact?: boolean }) {
  const { groups, delivery } = useCart();
  const setDelivery = useCartStore((s) => s.setDelivery);
  if (groups.length < 2) return null;
  const stores = groups.map((g) => g.store);
  const opts: { id: DeliveryMode; label: string; hint: string; price: number }[] = [
    { id: "combined", label: "Un solo motorizado", hint: `Pasa por las ${stores.length} tiendas y te lo lleva todo junto (+${formatUsd(EXTRA_STOP_CENTS)} por parada extra)`, price: shippingOf(stores, "combined") },
    { id: "separate", label: "Envíos separados", hint: "Un motorizado por tienda, llegan por separado", price: shippingOf(stores, "separate") },
  ];
  return (
    <div role="radiogroup" aria-label="Tipo de envío" className="flex flex-col gap-2">
      {opts.map((o) => {
        const on = o.id === delivery;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setDelivery(o.id)}
            className={`flex items-start gap-3 rounded-md text-left ${compact ? "p-2.5" : "p-3.5"} ${on ? "border-2 border-primary bg-primary-tint" : "border border-border bg-surface"}`}
          >
            <span className={`mt-0.5 box-border size-5 shrink-0 rounded-pill ${on ? "border-[6px] border-primary bg-surface" : "border-2 border-border"}`} />
            <span className="flex min-w-0 grow flex-col">
              <span className="text-body-strong text-[13px] font-bold">{o.label}</span>
              <span className="text-caption text-ink-muted">{o.hint}</span>
            </span>
            <span className="text-body-strong text-[13px] font-bold">{formatUsd(o.price)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Contenido del carrito (popover al pasar el cursor y hoja que se abre al repetir un pedido). */
export function CartPanel({ onNavigate }: { onNavigate?: () => void }) {
  const { ready, groups, delivery, count, subtotal, shippingCents, totalCents } = useCart();
  const setQty = useCartStore((s) => s.setQty);
  const removeStore = useCartStore((s) => s.removeStore);
  const blocked = groups.some((g) => minOrderShortfall(g.store, sumLines(g.lines)) > 0);
  const multi = groups.length > 1;

  return (
    <div className="nm-cart-popover__panel max-h-[85dvh] desktop:max-h-[calc(100dvh-8rem)]">
      <div className="nm-cart-popover__header shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-[16px] leading-5 font-extrabold">Tu carrito</span>
          <span className="nm-badge nm-badge--primary">{count}</span>
        </div>
        {multi ? <span className="text-caption font-medium text-ink-muted">{groups.length} tiendas</span> : null}
      </div>
      {!ready || count === 0 ? (
        <div className="nm-cart-popover__empty">
          <div className="grid size-11 place-items-center rounded-pill bg-surface-tile text-ink-muted [&_.nm-icon]:size-5"><Icon name="cart" /></div>
          <p className="text-body-strong text-[14px] font-bold">Tu carrito está vacío</p>
          <p className="max-w-[220px] text-center text-caption text-ink-muted">Pasa por nuestras tiendas y toca + para agregar lo que te provoque.</p>
          <Link href="/listado" onClick={onNavigate} className="nm-btn nm-btn--secondary nm-btn--sm mt-1">Ver restaurantes</Link>
        </div>
      ) : (
        <>
          <div className="min-h-0 grow overflow-y-auto">
            {groups.map((g) => {
              const sub = sumLines(g.lines);
              const shortfall = minOrderShortfall(g.store, sub);
              return (
                <section key={g.store.slug} aria-label={g.store.name} className="border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2.5 bg-surface-tile px-4 py-2.5">
                    <StoreMark initials={g.store.initials} color={g.store.color} size={28} />
                    <span className="flex min-w-0 grow flex-col">
                      <Link href={storeHref(g.store)} onClick={onNavigate} className="truncate text-[13px] leading-4 font-bold">{g.store.name}</Link>
                      <span className="text-caption text-ink-muted">{multi && delivery === "combined" ? "Parada de recogida" : `Envío ${formatUsd(g.store.feeCents)}`}</span>
                    </span>
                    <button type="button" onClick={() => removeStore(g.store.slug)} aria-label={`Quitar ${g.store.name} del carrito`} className="text-caption font-bold text-primary-text">Quitar</button>
                  </div>
                  <ul className="m-0 list-none px-4">
                    {g.lines.map((l) => (
                      <li key={l.key} className="nm-cart-popover__item">
                        <span className="nm-cart-popover__item-art"><Icon name={l.icon} /></span>
                        <div className="flex min-w-0 grow flex-col">
                          <span className="truncate text-[13px] leading-4 font-semibold">{l.name}</span>
                          {l.note ? <span className="truncate text-caption text-ink-muted">{l.note}</span> : null}
                          <span className="text-price text-[13px] font-bold">{formatUsd(l.qty * l.unitCents)}</span>
                        </div>
                        <Stepper qty={l.qty} name={l.name} onMinus={() => setQty(g.store.slug, l.key, l.qty - 1)} onPlus={() => setQty(g.store.slug, l.key, l.qty + 1)} />
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between px-4 py-2 text-caption text-ink-muted"><span>Subtotal {multi ? g.store.name : ""}</span><span className="font-semibold text-ink">{formatUsd(sub)}</span></div>
                  {shortfall > 0 ? <div className="px-4 pb-3"><MinNotice shortfall={shortfall} min={g.store.minOrderCents} href={storeHref(g.store)} /></div> : null}
                </section>
              );
            })}
            {multi ? <div className="flex flex-col gap-2 border-t border-border px-4 py-3"><span className="text-caption font-bold">¿Cómo lo enviamos?</span><DeliveryChoice compact /></div> : null}
          </div>
          <div className="nm-cart-popover__summary shrink-0">
            <div className="flex justify-between text-caption"><span>Subtotal</span><span className="font-semibold">{formatUsd(subtotal)}</span></div>
            <div className="flex justify-between text-caption text-ink-muted">
              <span>{multi ? (delivery === "combined" ? "Envío (un motorizado)" : `Envíos (${groups.length})`) : "Envío"}</span>
              <span>{formatUsd(shippingCents)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
              <span className="text-body-strong text-[14px] font-bold">Total</span>
              <div className="flex flex-col items-end">
                <span className="text-title-md text-[16px] leading-5 font-extrabold">{formatUsd(totalCents)}</span>
                <span className="text-[11px] text-caption text-ink-muted">{formatVes(totalCents, DEMO_RATE)}</span>
              </div>
            </div>
          </div>
          <div className="nm-cart-popover__footer shrink-0">
            {blocked ? (
              <button type="button" disabled className="nm-btn nm-btn--primary nm-btn--block nm-btn--sm">Completa el pedido mínimo para pagar</button>
            ) : (
              <Link href="/checkout" onClick={onNavigate} className="nm-btn nm-btn--primary nm-btn--block nm-btn--sm">Ir a pagar · {formatUsd(totalCents)}</Link>
            )}
            <Link href="/carrito" onClick={onNavigate} className="nm-btn nm-btn--secondary nm-btn--block nm-btn--sm">Ver carrito completo</Link>
          </div>
        </>
      )}
    </div>
  );
}
