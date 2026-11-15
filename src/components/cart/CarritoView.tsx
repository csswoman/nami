"use client";

import Link from "next/link";
import { Icon, ProductCard, type IconName } from "@/components/nami";
import { DeliveryChoice } from "@/components/cart/CartPanel";
import { MinNotice } from "@/components/cart/MinNotice";
import { EmptyState } from "@/components/shell/EmptyState";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { Stepper } from "@/components/shell/Stepper";
import { StoreMark } from "@/components/shell/StoreMark";
import { useCart } from "@/lib/cart/hooks";
import { storeHref } from "@/lib/cart/meta";
import { minOrderShortfall, sumLines, useCartStore } from "@/lib/cart/store";
import { getLineImage } from "@/lib/cart/image";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes } from "@/lib/money";

type Extra = { id: string; name: string; priceCents: number; icon: IconName; image?: string };

export function CarritoView({ extras }: { extras: Record<string, Extra[]> }) {
  const { ready, groups, delivery, subtotal, shippingCents, totalCents: total } = useCart();
  const setQty = useCartStore((s) => s.setQty);
  const removeStore = useCartStore((s) => s.removeStore);
  const clear = useCartStore((s) => s.clear);
  const add = useCartStore((s) => s.add);
  if (!ready) return <div className="min-h-[60dvh]" aria-busy="true" />;
  if (groups.length === 0) {
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
  const multi = groups.length > 1;
  const blocked = groups.find((g) => minOrderShortfall(g.store, sumLines(g.lines)) > 0);
  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <ScreenBar title="Tu carrito" action={<button type="button" onClick={clear} className="min-w-11 text-button text-primary-text">Vaciar</button>} />
        <div className="hidden items-end justify-between px-8 pt-8 desktop:flex">
          <h1 className="font-display text-[40px] leading-11 font-extrabold">Tu carrito</h1>
          <button type="button" onClick={clear} className="min-h-11 text-button text-primary-text">Vaciar carrito</button>
        </div>
        <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-8 desktop:pt-6">
          {groups.map((g) => {
            const store = g.store;
            const sub = sumLines(g.lines);
            const shortfall = minOrderShortfall(store, sub);
            const offer = store.kind === "restaurante" ? (extras[store.slug] ?? []).filter((x) => !g.lines.some((l) => l.productId === x.id)) : [];
            return (
              <section key={store.slug} aria-label={store.name} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-lg bg-surface-tile p-3.5">
                  <StoreMark initials={store.initials} color={store.color} slug={store.slug} size={48} />
                  <span className="flex min-w-0 grow flex-col">
                    <span className="text-body-strong font-bold">{store.name}</span>
                    <span className="text-caption text-ink-muted">{multi && delivery === "combined" ? "Parada de recogida" : `Envío ${formatUsd(store.feeCents)}`}</span>
                  </span>
                  <Link href={storeHref(store)} className="text-button text-primary-text">Ver menú</Link>
                  {multi ? <button type="button" onClick={() => removeStore(store.slug)} aria-label={`Quitar ${store.name}`} className="text-button text-ink-muted">Quitar</button> : null}
                </div>
                <ul className="flex flex-col">
                  {g.lines.map((l) => {
                    const imgSrc = getLineImage(l, store.slug);
                    return (
                      <li key={l.key} className="flex items-center gap-4 border-b border-border py-4">
                        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-border/50 bg-surface-tile">
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgSrc} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="[&_.nm-icon]:size-8"><Icon name={l.icon} /></span>
                          )}
                        </span>
                        <span className="flex min-w-0 grow flex-col gap-0.5">
                          <span className="text-body-strong font-bold">{l.name}</span>
                          {l.note ? <span className="text-caption text-ink-muted">{l.note}</span> : null}
                          <span className="text-price">{formatUsd(l.qty * l.unitCents)}</span>
                        </span>
                        <Stepper qty={l.qty} name={l.name} onMinus={() => setQty(store.slug, l.key, l.qty - 1)} onPlus={() => setQty(store.slug, l.key, l.qty + 1)} />
                      </li>
                    );
                  })}
                </ul>
                {multi ? <div className="flex justify-between text-body"><span className="text-ink-muted">Subtotal {store.name}</span><b>{formatUsd(sub)}</b></div> : null}
                {shortfall > 0 ? <MinNotice shortfall={shortfall} min={store.minOrderCents} href={storeHref(store)} /> : null}
                {offer.length ? (
                  <div className="flex flex-col gap-3">
                    <h2 className="font-display text-title-lg">¿Te provoca algo más?</h2>
                    <div className="scroll-x -mx-4 flex gap-4 px-4 desktop:mx-0 desktop:px-0">
                      {offer.map((x) => {
                        const xImg = x.image ?? getLineImage({ productId: x.id, icon: x.icon }, store.slug);
                        return (
                          <div key={x.id} className="shrink-0">
                            <ProductCard className="w-40" name={x.name} price={formatUsd(x.priceCents)} image={xImg} onAdd={() => add(store, { productId: x.id, name: x.name, unitCents: x.priceCents, icon: x.icon, image: xImg })} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
          {multi ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-title-lg">¿Cómo lo enviamos?</h2>
              <DeliveryChoice />
            </section>
          ) : null}
          <div className="flex flex-col gap-1.5 rounded-lg bg-surface-tile p-5 text-body">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatUsd(subtotal)}</span></div>
            <div className="flex justify-between border-b border-dashed border-border pb-2"><span>{multi ? (delivery === "combined" ? "Envío (un motorizado, " + groups.length + " paradas)" : `Envíos (${groups.length})`) : "Envío"}</span><span>{formatUsd(shippingCents)}</span></div>
            <div className="flex items-baseline justify-between pt-1.5">
              <b className="text-body-strong">Total</b>
              <span className="flex flex-col items-end"><b className="text-title-md">{formatUsd(total)}</b><span className="text-caption text-ink-muted">{formatVes(total, DEMO_RATE)}</span></span>
            </div>
            <p className="pt-2 text-caption text-ink-muted">Bolívares a la tasa de la demo: Bs. {DEMO_RATE.toLocaleString("es-VE", { minimumFractionDigits: 2 })} por dólar.</p>
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-surface p-4 shadow-nav desktop:static desktop:mx-auto desktop:max-w-2xl desktop:px-8 desktop:shadow-none">
        {blocked ? <MinNotice shortfall={minOrderShortfall(blocked.store, sumLines(blocked.lines))} min={blocked.store.minOrderCents} href={storeHref(blocked.store)} /> : null}
        {blocked
          ? <button type="button" disabled className="nm-btn nm-btn--primary nm-btn--block">Ir a pagar · {formatUsd(total)}</button>
          : <Link href="/checkout" className="nm-btn nm-btn--primary nm-btn--block">Ir a pagar · {formatUsd(total)}</Link>}
      </div>
    </>
  );
}
