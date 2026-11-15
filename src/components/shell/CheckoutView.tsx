/* eslint-disable react-hooks/purity -- la hora actual se usa solo para mostrar "programado para…"; el servidor recalcula todo */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deliveryFor, type DeliveryInfo } from "@/app/direccion/actions";
import { placeOrder as placeOrderAction } from "@/app/checkout/actions";
import { Icon, type IconName } from "@/components/nami";
import { EmptyState } from "@/components/shell/EmptyState";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { Stepper } from "@/components/shell/Stepper";
import { DeliveryChoice } from "@/components/cart/CartPanel";
import { MinNotice } from "@/components/cart/MinNotice";
import { CouponBox, type AppliedCoupon, type CouponOffer } from "@/components/shell/CouponBox";
import { SlotPicker, type ChosenSlot } from "@/components/shell/SlotPicker";
import { SubstitutionBox, effectiveSubstitution, type Substitutions } from "@/components/shell/SubstitutionBox";
import { StoreMark } from "@/components/shell/StoreMark";
import { useCart } from "@/lib/cart/hooks";
import { storeHref } from "@/lib/cart/meta";
import { minOrderShortfall, sumLines, useCartStore, type PayMethod } from "@/lib/cart/store";
import { getLineImage } from "@/lib/cart/image";
import { formatUsd, formatVes } from "@/lib/money";
import { formatWhen } from "@/lib/orders/progress";
import { useRemoteOrders } from "@/lib/orders/remote";
import { scheduledFor } from "@/lib/orders/schedule";

type Extra = { id: string; name: string; priceCents: number; icon: IconName; image?: string };
type Extras = Record<string, Extra[]>;

const PAYS: { id: PayMethod; label: string; hint: string }[] = [
  { id: "movil", label: "Pago móvil", hint: "Te damos los datos y verificas con la referencia" },
  { id: "zelle", label: "Zelle", hint: "Envía a pagos@nami.demo" },
  { id: "efectivo", label: "Efectivo en divisas", hint: "Pagas al motorizado cuando llegue" },
];
const TIPS = [0, 50, 100, 200];
const CASH = [{ label: "Exacto", usd: 0 }, { label: "$ 20", usd: 2000 }, { label: "$ 50", usd: 5000 }];
const ETA = "Llega entre 8:14 y 8:20 a. m.";

const pill = (on: boolean, tone: "ink" | "primary") =>
  `flex min-h-11 items-center justify-center rounded-pill px-4 text-center text-caption font-bold ${
    on ? (tone === "ink" ? "bg-ink text-surface" : "bg-primary text-on-primary") : "border border-border bg-surface text-ink"
  }`;

/** Confirmar pedido. Lee el carrito del invitado; al confirmar guarda el pedido y sigue a pago o seguimiento. */
export function CheckoutView({ extras, rate, offers = [] }: { extras: Extras; rate: number; offers?: CouponOffer[] }) {
  const router = useRouter();
  const { ready, groups, delivery, subtotal, shippingCents } = useCart();
  const address = useCartStore((s) => s.address);
  const setQty = useCartStore((s) => s.setQty);
  const removeStore = useCartStore((s) => s.removeStore);
  const add = useCartStore((s) => s.add);
  const placeLocal = useCartStore((s) => s.placeOrder);
  const addOrderId = useCartStore((s) => s.addOrderId);
  const clear = useCartStore((s) => s.clear);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pay, setPay] = useState<PayMethod>("movil");
  const [tip, setTip] = useState(2);
  const [cash, setCash] = useState(1);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [slot, setSlot] = useState<ChosenSlot | null>(null);
  const [subs, setSubs] = useState<Substitutions>({});
  const [coverage, setCoverage] = useState<DeliveryInfo | null>(null);
  const setStoreFees = useCartStore((s) => s.setStoreFees);
  const storeSlugs = groups.map((g) => g.store.slug).join(",");
  // Con un punto en el mapa, el servidor dice qué tiendas llegan y cuánto cobra cada una de envío.
  useEffect(() => {
    if (address.lat === undefined || address.lng === undefined || !storeSlugs) return;
    let cancelled = false;
    deliveryFor(address.lat, address.lng, storeSlugs.split(","))
      .then((r) => {
        if (cancelled) return;
        setCoverage(r);
        if (r?.stores.length) setStoreFees(Object.fromEntries(r.stores.map((s) => [s.slug, s.feeCents])));
      })
      .catch(() => !cancelled && setCoverage(null));
    return () => {
      cancelled = true;
    };
  }, [address.lat, address.lng, storeSlugs, setStoreFees]);
  if (!ready) return <div className="min-h-[60dvh]" aria-busy="true" />;
  if (groups.length === 0) {
    return (
      <>
        <ScreenBar title="Confirmar pedido" back="/carrito" />
        <EmptyState title="No hay nada que pagar" text="Agrega productos de una tienda para armar tu pedido." primary={{ href: "/listado", label: "Ver restaurantes abiertos" }} secondary={{ href: "/listado?v=1", label: "Hacer el mercado" }} />
      </>
    );
  }

  const tipCents = TIPS[tip];
  const multi = groups.length > 1;
  // Lo que descuenta el cupón lo calcula el servidor; aquí solo se resta.
  const discountCents = coupon?.quote?.discountCents ?? 0;
  const shipDiscountCents = coupon?.quote?.shippingDiscountCents ?? 0;
  const total = subtotal + shippingCents + tipCents - discountCents - shipDiscountCents;
  const orderBase = {
    delivery,
    tipCents,
    payment: pay,
    address,
    scheduledFor: slot?.at,
    items: groups.flatMap((g) => g.lines.map((l) => ({ store: g.store.slug, product: l.productId, qty: l.qty, options: l.options, note: l.userNote ?? (l.options ? undefined : l.note), substitution: g.store.kind === "mercado" ? effectiveSubstitution(subs[l.key]) : undefined }))),
  };
  const discountRows = coupon?.quote ? (
    <>
      {discountCents > 0 ? <div className="flex justify-between text-body text-success"><span>Cupón {coupon.code}</span><span>−{formatUsd(discountCents)}</span></div> : null}
      {shipDiscountCents > 0 ? <div className="flex justify-between text-body text-success"><span>Envío gratis ({coupon.code})</span><span>−{formatUsd(shipDiscountCents)}</span></div> : null}
    </>
  ) : null;
  const cta = `Hacer pedido · ${formatUsd(total)}`;
  const change = CASH[cash].usd ? `Tu vuelto: ${formatUsd(Math.max(0, CASH[cash].usd - total))}` : "Ten el monto exacto a mano.";
  // Dirección con punto en el mapa: si alguna tienda no llega hasta allá, no se puede pedir.
  const unreachable = coverage ? (coverage.zone ? coverage.stores.filter((s) => !s.covered) : coverage.stores) : [];
  const noCoverage = coverage !== null && (coverage.zone === null || unreachable.length > 0);
  const coverageNotice = noCoverage ? (
    <p role="alert" className="flex flex-col gap-1 rounded-lg bg-surface-warm p-3 text-caption" data-testid="coverage-warning">
      <b>{coverage?.zone ? `No llegamos a ${coverage.zone.name} con ${unreachable.map((u) => groups.find((g) => g.store.slug === u.slug)?.store.name ?? u.slug).join(" y ")}.` : "Tu ubicación está fuera de nuestras zonas de entrega."}</b>
      <Link href="/direccion" className="font-bold text-primary-text underline">Elegir otra dirección</Link>
    </p>
  ) : null;
  const blocked = groups.find((g) => minOrderShortfall(g.store, sumLines(g.lines)) > 0);
  const shortfall = blocked ? minOrderShortfall(blocked.store, sumLines(blocked.lines)) : 0;
  const names = groups.map((g) => g.store.name).join(" + ");
  const scheduled = scheduledFor(groups.map((g) => g.store), Date.now());
  const shipLabel = multi ? (delivery === "combined" ? `Envío (un motorizado, ${groups.length} paradas)` : `Envíos (${groups.length})`) : "Envío";
  const go = (id: string) => router.push(pay === "movil" ? `/pago?id=${encodeURIComponent(id)}` : `/seguimiento?id=${encodeURIComponent(id)}`);
  /** Manda al servidor solo ids, cantidades, opciones, notas, propina, pago y dirección; él calcula los montos. */
  async function confirm() {
    if (blocked || busy || coupon?.pending) return;
    setBusy(true);
    setError(null);
    try {
      // Un cupón que ya no sirve se manda igual: el servidor lo rechaza con el motivo y el pedido no se crea.
      const res = await placeOrderAction({ ...orderBase, coupon: coupon?.code });
      if (res.ok) {
        useRemoteOrders.getState().put(res.order);
        addOrderId(res.order.id);
        clear();
        go(res.order.id);
      } else if (res.error.code === "STORE_NOT_FOUND") {
        // Tienda que el servidor no conoce: el pedido sigue el camino local.
        const local = placeLocal({ tipCents, payment: pay });
        if (local) go(local.id);
      } else {
        setError(res.error.message);
      }
    } catch {
      setError("No pudimos crear el pedido. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ScreenBar title="Confirmar pedido" back="/carrito" />
      <div className="page-x flex flex-col gap-6 pt-2 pb-8 desktop:pt-6">
        <nav aria-label="Ruta" className="hidden gap-2 text-caption text-ink-muted desktop:flex">
          <Link href="/" className="font-semibold">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link href="/carrito" className="font-semibold">{names}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">Confirmar pedido</span>
        </nav>
        <h1 className="hidden font-display text-[40px] leading-11 font-extrabold desktop:block">Confirmar pedido</h1>

        <div className="grid grid-cols-1 gap-8 desktop:grid-cols-[minmax(0,1fr)_420px] desktop:items-start desktop:gap-10">
          <div className="flex min-w-0 flex-col gap-7 desktop:gap-8">
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-title-lg desktop:text-[20px]">Entrega</h2>
              <div className="flex items-start gap-3.5 rounded-lg border border-border p-4 desktop:p-4.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-pill bg-primary-tint text-primary-text [&_.nm-icon]:size-5"><Icon name="pin" /></span>
                <span className="flex grow flex-col gap-0.5">
                  <span className="text-body-strong font-semibold">{address.line}</span>
                  <span className="text-caption text-ink-muted">Punto de referencia: {address.reference}</span>
                  <span className="mt-1.5 hidden items-center gap-1.5 text-caption text-ink-muted desktop:flex [&_.nm-icon]:size-4"><Icon name="clock" />{ETA}</span>
                </span>
                <Link href="/direccion" className="text-button text-primary-text">Cambiar</Link>
              </div>
              <span className="flex items-center gap-1.5 text-caption text-ink-muted desktop:hidden [&_.nm-icon]:size-5"><Icon name="clock" />{ETA}</span>
            </section>
            {scheduled && !slot ? (
              <p className="flex items-start gap-3 rounded-lg bg-surface-warm p-4 text-caption [&_.nm-icon]:size-5 [&_.nm-icon]:shrink-0">
                <Icon name="clock" />
                <span><b>Pedido programado.</b> {groups.filter((g) => g.store.open === false).map((g) => g.store.name).join(" y ")} {groups.filter((g) => g.store.open === false).length > 1 ? "están cerradas" : "está cerrada"} ahora; empezamos a prepararlo {formatWhen(scheduled, Date.now()).toLowerCase()}.</span>
              </p>
            ) : null}
            <SlotPicker storeSlugs={groups.map((g) => g.store.slug)} value={slot} onChange={setSlot} />
            {multi ? (
              <section className="flex flex-col gap-3">
                <h2 className="font-display text-title-lg desktop:text-[20px]">Envío de {groups.length} tiendas</h2>
                <DeliveryChoice />
              </section>
            ) : null}

            <section className="flex flex-col gap-3">
              <h2 className="font-display text-title-lg desktop:text-[20px]">Método de pago</h2>
              <div role="radiogroup" aria-label="Método de pago" className="grid gap-3 desktop:grid-cols-3">
                {PAYS.map((p) => {
                  const on = p.id === pay;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setPay(p.id)}
                      className={`flex items-center gap-3 rounded-md p-4 text-left desktop:min-h-28 desktop:flex-col desktop:items-start desktop:gap-2 ${on ? "border-2 border-primary bg-primary-tint" : "border border-border bg-surface"}`}
                    >
                      <span className={`box-border size-5 shrink-0 rounded-pill ${on ? "border-[6px] border-primary bg-surface" : "border-2 border-border"}`} />
                      <span className="flex flex-col">
                        <span className="text-body-strong font-bold">{p.label}</span>
                        <span className="text-caption text-ink-muted">{p.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {pay === "efectivo" ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-surface-raised px-4 py-3.5 shadow-xs">
                  <span className="text-body-strong font-semibold">¿Con cuánto pagas?</span>
                  {CASH.map((c, i) => (
                    <button key={c.label} type="button" aria-pressed={i === cash} onClick={() => setCash(i)} className={pill(i === cash, "ink")}>{c.label}</button>
                  ))}
                  <span className="text-caption text-ink-muted desktop:ml-auto">{change}</span>
                </div>
              ) : null}
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-display text-title-lg desktop:text-[20px]">Propina para el motorizado</h2>
                <span className="text-caption text-ink-muted">Todo va para quien te lleva el pedido.</span>
              </div>
              <div className="grid grid-cols-4 gap-2 desktop:flex">
                {TIPS.map((t, i) => (
                  <button key={t} type="button" aria-pressed={i === tip} onClick={() => setTip(i)} className={`${pill(i === tip, "primary")} desktop:px-4.5`}>
                    {t ? formatUsd(t) : "Sin propina"}
                  </button>
                ))}
              </div>
            </section>

            <SubstitutionBox groups={groups} value={subs} onChange={setSubs} />
            <CouponBox offers={offers} base={orderBase} onChange={setCoupon} />
            {/* Resumen (móvil) */}
            <section aria-label="Resumen" className="flex flex-col gap-3 rounded-xl border border-border/70 bg-surface-raised p-5 shadow-xs desktop:hidden">
              <h2 className="font-display text-title-lg">Resumen del pedido</h2>
              {groups.map((g) => (
                <div key={g.store.slug} className="flex flex-col gap-2.5">
                  {multi ? (
                    <div className="flex items-center gap-2 border-b border-border/40 pt-1 pb-1.5">
                      <StoreMark initials={g.store.initials} color={g.store.color} slug={g.store.slug} size={22} />
                      <span className="text-caption font-bold">{g.store.name}</span>
                    </div>
                  ) : null}
                  {g.lines.map((l) => {
                    const imgSrc = getLineImage(l, g.store.slug);
                    return (
                      <div key={l.key} className="flex items-center justify-between gap-3 text-body">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border/40 bg-surface-product">
                            {imgSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imgSrc} alt="" className="size-full object-cover" />
                            ) : (
                              <span className="grid size-full place-items-center text-ink [&_.nm-icon]:size-4"><Icon name={l.icon} /></span>
                            )}
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-body font-medium">{l.qty}× {l.name}</span>
                            {l.note ? <span className="truncate text-caption text-ink-muted">{l.note}</span> : null}
                          </div>
                        </div>
                        <span className="shrink-0 font-medium">{formatUsd(l.qty * l.unitCents)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 text-body text-ink-muted"><span>{shipLabel}</span><span>{formatUsd(shippingCents)}</span></div>
              <div className="flex justify-between border-b border-dashed border-border pb-2 text-body text-ink-muted"><span>Propina</span><span>{formatUsd(tipCents)}</span></div>
              {discountRows}
              <div className="flex items-baseline justify-between pt-1">
                <b className="text-body-strong">Total</b>
                <span className="flex flex-col items-end"><b className="text-title-md">{formatUsd(total)}</b><span className="text-caption text-ink-muted">{formatVes(total, rate)}</span></span>
              </div>
            </section>

            <p className="rounded-md border border-border/60 bg-surface-raised px-4 py-3 text-caption text-ink-muted">Es una simulación: no se hará ningún cobro real.</p>
          </div>

          {/* Tu carrito (escritorio) */}
          <aside aria-label="Tu carrito" className="sticky top-6 hidden flex-col gap-4 rounded-xl border border-border p-6 shadow-card desktop:flex">
            {groups.map((g) => {
              const store = g.store;
              const offer = store.kind === "restaurante" ? (extras[store.slug] ?? []).filter((x) => !g.lines.some((l) => l.productId === x.id)) : [];
              return (
                <div key={store.slug} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <StoreMark initials={store.initials} color={store.color} slug={store.slug} size={44} />
                    <span className="flex grow flex-col"><span className="text-body-strong font-bold">{store.name}</span><span className="text-caption text-ink-muted">{multi ? `Parada ${groups.indexOf(g) + 1}` : "Tu carrito"}</span></span>
                    <Link href={storeHref(store)} className="text-button text-primary-text">Ver menú</Link>
                    {multi ? <button type="button" onClick={() => removeStore(store.slug)} aria-label={`Quitar ${store.name}`} className="text-button text-ink-muted">Quitar</button> : null}
                  </div>
                  {g.lines.map((l) => {
                    const imgSrc = getLineImage(l, store.slug);
                    return (
                      <div key={l.key} className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border/60 bg-surface-tile">
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgSrc} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="grid size-full place-items-center text-ink [&_.nm-icon]:size-5"><Icon name={l.icon} /></span>
                          )}
                        </div>
                        <span className="flex min-w-0 grow flex-col">
                          <span className="truncate text-body-strong font-semibold">{l.name}</span>
                          {l.note ? <span className="truncate text-caption text-ink-muted">{l.note}</span> : null}
                          <span className="text-caption font-semibold text-ink-muted">{formatUsd(l.qty * l.unitCents)}</span>
                        </span>
                        <Stepper qty={l.qty} name={l.name} onMinus={() => setQty(store.slug, l.key, l.qty - 1)} onPlus={() => setQty(store.slug, l.key, l.qty + 1)} />
                      </div>
                    );
                  })}
                  {offer.length ? (
                    <div className="flex flex-col gap-2 pt-1">
                      <span className="text-caption font-semibold text-ink-muted">¿Te provoca algo más?</span>
                      <div className="flex flex-wrap gap-2">
                        {offer.map((x) => {
                          const xImg = x.image ?? getLineImage({ productId: x.id, icon: x.icon }, store.slug);
                          return (
                            <button
                              key={x.id}
                              type="button"
                              aria-label={`Agregar ${x.name}`}
                              onClick={() => add(store, { productId: x.id, name: x.name, unitCents: x.priceCents, icon: x.icon, image: xImg })}
                              className="group flex min-h-9 items-center gap-2 rounded-pill border border-border bg-surface px-2.5 py-1 text-caption font-semibold transition-colors hover:border-primary hover:bg-surface-tile"
                            >
                              {xImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={xImg} alt="" className="size-5 rounded-full object-cover" />
                              ) : null}
                              <span>+ {x.name}</span>
                              <span className="font-normal text-ink-muted">· {formatUsd(x.priceCents)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="flex flex-col gap-1.5 border-t border-dashed border-border pt-3.5 text-body">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatUsd(subtotal)}</span></div>
              <div className="flex justify-between text-caption text-ink-muted"><span>{shipLabel}</span><span>{formatUsd(shippingCents)}</span></div>
              <div className="flex justify-between text-caption text-ink-muted"><span>Propina</span><span>{formatUsd(tipCents)}</span></div>
              {discountRows}
              <div className="flex items-baseline justify-between pt-1.5">
                <b className="text-body-strong">Total</b>
                <span className="flex flex-col items-end"><b className="text-title-md">{formatUsd(total)}</b><span className="text-caption text-ink-muted">{formatVes(total, rate)}</span></span>
              </div>
            </div>
            {coverageNotice}
            {blocked ? <MinNotice shortfall={shortfall} min={blocked.store.minOrderCents} href={storeHref(blocked.store)} /> : null}
            {error ? <p role="alert" className="text-caption font-bold text-danger">{error}</p> : null}
            <button type="button" onClick={() => void confirm()} disabled={!!blocked || noCoverage || busy || !!coupon?.pending} className="nm-btn nm-btn--primary nm-btn--block">{cta}</button>
          </aside>

          {/* Barra de acción (móvil) */}
          <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-surface p-4 shadow-nav desktop:hidden">
            {coverageNotice}
            {blocked ? <MinNotice shortfall={shortfall} min={blocked.store.minOrderCents} href={storeHref(blocked.store)} /> : null}
            {error ? <p role="alert" className="text-caption font-bold text-danger">{error}</p> : null}
            <button type="button" onClick={() => void confirm()} disabled={!!blocked || noCoverage || busy || !!coupon?.pending} className="nm-btn nm-btn--primary nm-btn--block">{cta}</button>
          </div>
        </div>
      </div>
    </>
  );
}
