"use client";

import Link from "next/link";
import { Icon, ProductCard, type IconName } from "@/components/nami";
import { MinNotice } from "@/components/cart/MinNotice";
import { EmptyState } from "@/components/shell/EmptyState";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { Stepper } from "@/components/shell/Stepper";
import { StoreMark } from "@/components/shell/StoreMark";
import { useCart } from "@/lib/cart/hooks";
import { storeHref } from "@/lib/cart/meta";
import { minOrderShortfall, useCartStore } from "@/lib/cart/store";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes } from "@/lib/money";

type Extra = { id: string; name: string; priceCents: number; icon: IconName };

export function CarritoView({ extras }: { extras: Record<string, Extra[]> }) {
  const { ready, store, lines, subtotal } = useCart();
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);
  const add = useCartStore((s) => s.add);

  if (!ready) return <div className="min-h-[60dvh]" aria-busy="true" />;

  if (!store || lines.length === 0) {
    return (
      <>
        <ScreenBar title="Tu carrito" />
        <EmptyState
          title="Tu carrito está vacío"
          text="Las areperas de tu zona están abiertas hasta las 11:00 a. m. ¿Qué se te antoja?"
          primary={{ href: "/listado", label: "Ver restaurantes abiertos" }}
          secondary={{ href: "/listado?v=1", label: "Hacer el mercado" }}
        />
      </>
    );
  }

  const total = subtotal + store.feeCents;
  const shortfall = minOrderShortfall(store, subtotal);
  const offer = store.kind === "restaurante" ? (extras[store.slug] ?? []).filter((x) => !lines.some((l) => l.productId === x.id)) : [];

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <ScreenBar title="Tu carrito" action={<button type="button" onClick={clear} className="min-w-11 text-button text-primary-text">Vaciar</button>} />
        <div className="hidden items-end justify-between px-8 pt-8 desktop:flex">
          <h1 className="font-display text-[40px] leading-11 font-extrabold">Tu carrito</h1>
          <button type="button" onClick={clear} className="min-h-11 text-button text-primary-text">Vaciar carrito</button>
        </div>

        <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-8 desktop:pt-6">
          <div className="flex items-center gap-3 rounded-lg bg-surface-tile p-3.5">
            <StoreMark initials={store.initials} color={store.color} size={48} />
            <span className="flex min-w-0 grow flex-col">
              <span className="text-body-strong font-bold">{store.name}</span>
              <span className="text-caption text-ink-muted">Envío {formatUsd(store.feeCents)}</span>
            </span>
            <Link href={storeHref(store)} className="text-button text-primary-text">Ver menú</Link>
          </div>

          <ul className="flex flex-col">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-4 border-b border-border py-4">
                <span className="grid size-16 shrink-0 place-items-center rounded-md bg-surface-tile [&_.nm-icon]:size-8"><Icon name={l.icon} /></span>
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="text-body-strong font-bold">{l.name}</span>
                  {l.note ? <span className="text-caption text-ink-muted">{l.note}</span> : null}
                  <span className="text-price">{formatUsd(l.qty * l.unitCents)}</span>
                </span>
                <Stepper qty={l.qty} name={l.name} onMinus={() => setQty(l.key, l.qty - 1)} onPlus={() => setQty(l.key, l.qty + 1)} />
              </li>
            ))}
          </ul>

          {offer.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-title-lg">¿Te provoca algo más?</h2>
              <div className="scroll-x -mx-4 flex gap-4 px-4 desktop:mx-0 desktop:px-0">
                {offer.map((x) => (
                  <div key={x.id} className="shrink-0">
                    <ProductCard className="w-40" name={x.name} price={formatUsd(x.priceCents)} onAdd={() => add(store, { productId: x.id, name: x.name, unitCents: x.priceCents, icon: x.icon })} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div className="flex flex-col gap-1.5 rounded-lg bg-surface-tile p-5 text-body">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatUsd(subtotal)}</span></div>
            <div className="flex justify-between border-b border-dashed border-border pb-2"><span>Envío</span><span>{formatUsd(store.feeCents)}</span></div>
            <div className="flex items-baseline justify-between pt-1.5">
              <b className="text-body-strong">Total</b>
              <span className="flex flex-col items-end"><b className="text-title-md">{formatUsd(total)}</b><span className="text-caption text-ink-muted">{formatVes(total, DEMO_RATE)}</span></span>
            </div>
            <p className="pt-2 text-caption text-ink-muted">Bolívares a la tasa de la demo: Bs. {DEMO_RATE.toLocaleString("es-VE", { minimumFractionDigits: 2 })} por dólar.</p>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-surface p-4 shadow-nav desktop:static desktop:mx-auto desktop:max-w-2xl desktop:px-8 desktop:shadow-none">
        {shortfall > 0 ? <MinNotice shortfall={shortfall} min={store.minOrderCents} href={storeHref(store)} /> : null}
        {shortfall > 0
          ? <button type="button" disabled className="nm-btn nm-btn--primary nm-btn--block">Ir a pagar · {formatUsd(total)}</button>
          : <Link href="/checkout" className="nm-btn nm-btn--primary nm-btn--block">Ir a pagar · {formatUsd(total)}</Link>}
      </div>
    </>
  );
}
