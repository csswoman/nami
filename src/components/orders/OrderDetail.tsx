import Link from "next/link";
import { RepeatOrderButton } from "@/components/cart/RepeatOrderButton";
import { StatusPill, StoreStack, tint } from "@/components/orders/OrderParts";
import { CheckIcon } from "@/components/shell/glyphs";
import { Icon } from "@/components/nami";
import { RouteMiniMap } from "@/components/tracking/RouteMiniMap";
import { DEMO_RATE } from "@/lib/demo/home";
import type { OrderView } from "@/lib/orders/view";
import { formatUsd, formatVes } from "@/lib/money";

/** Detalle de un pedido terminado (entregado o cancelado), con los montos que se cobraron. */
export function OrderDetail({ o }: { o: OrderView }) {
  const cancelled = o.status === "cancelled";
  const multi = o.stops.length > 1;
  const name = o.stops.map((s) => s.store.name).join(" + ");
  const unavailable = o.stops.flatMap((s) => s.lines.filter((l) => !l.available));
  const changed = o.stops.flatMap((s) => s.lines.filter((l) => l.available && l.nowCents !== l.unitCents));
  return (
    <div className="page-x flex flex-col gap-6 pt-2 pb-48 desktop:pt-6 desktop:pb-8">
      <nav aria-label="Ruta" className="hidden gap-2 text-caption text-ink-muted desktop:flex">
        <Link href="/pedidos" className="font-semibold text-primary-text">Mis pedidos</Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">#{o.id}</span>
      </nav>
      <header className="flex items-center gap-3.5 desktop:gap-5">
        <span className="desktop:hidden"><StoreStack stores={o.stops.map((s) => s.store)} size={56} /></span>
        <span className="hidden desktop:block"><StoreStack stores={o.stops.map((s) => s.store)} size={88} /></span>
        <div className="flex min-w-0 grow flex-col gap-1">
          <h1 className="font-display text-[22px] leading-7 font-extrabold desktop:text-[48px] desktop:leading-14">{name}</h1>
          <span className="flex flex-wrap items-center gap-2 text-caption text-ink-muted desktop:text-body">
            <StatusPill status={o.status} />Pedido #{o.id} · {o.whenLong}
          </span>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-8 desktop:grid-cols-[minmax(0,1fr)_420px] desktop:items-start desktop:gap-10">
        <div className="flex min-w-0 flex-col gap-5">
          {cancelled ? (
            <div className="flex flex-col gap-2 rounded-lg bg-surface-tile p-4">
              <h2 className="font-display text-title-lg">Pedido cancelado</h2>
              <p className="text-body text-ink-muted">{o.cancelReason}</p>
            </div>
          ) : (
            <>
              <RouteMiniMap className="hidden aspect-900/490 w-full rounded-xl desktop:block" />
              <h2 className="font-display text-title-lg">Recorrido</h2>
              <div className="grid grid-cols-3 gap-3">
                {o.stats.map(([big, small]) => (
                  <div key={small} className="flex flex-col gap-0.5 rounded-lg bg-surface-tile p-3.5 desktop:px-5 desktop:py-4">
                    <b className="font-display text-title-lg">{big}</b>
                    <span className="text-caption text-ink-muted">{small}</span>
                  </div>
                ))}
              </div>
              <ol className="flex flex-col">
                {o.steps.map(([label, time], i) => (
                  <li key={label} className="flex min-h-14 gap-3.5">
                    <span className="flex w-6 shrink-0 flex-col items-center">
                      <span className="grid size-6 place-items-center rounded-pill bg-primary text-on-primary [&_.nm-icon]:size-4"><CheckIcon /></span>
                      {i < o.steps.length - 1 ? <span className="min-h-5 w-0.5 grow bg-primary" /> : null}
                    </span>
                    <span className="flex grow justify-between gap-2 pt-px">
                      <span className="text-body">{label}</span>
                      <span className="text-caption text-ink-muted">{time}</span>
                    </span>
                  </li>
                ))}
              </ol>
              {o.courier ? <p className="text-caption text-ink-muted desktop:text-body">{o.courier}</p> : null}
            </>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-title-lg">Productos</h2>
            {o.stops.map((s) => (
              <div key={s.store.slug} className="flex flex-col gap-2.5 text-body">
                {multi ? <span className="text-caption font-bold text-ink-muted">{s.store.name}</span> : null}
                {s.lines.map((l) => (
                  <div key={l.key} className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md" style={{ background: tint(s.store.color), color: `var(--${s.store.color})` }}><Icon name={l.icon} className="size-5" /></span>
                    <span className="flex grow flex-col">
                      <span>{l.qty}× {l.name}{l.available ? "" : " (agotado hoy)"}</span>
                      {l.note ? <span className="text-caption text-ink-muted">{l.note}</span> : null}
                    </span>
                    <span className="whitespace-nowrap tabular-nums">{formatUsd(l.qty * l.unitCents)}</span>
                  </div>
                ))}
                {multi ? <div className="flex justify-between text-caption text-ink-muted"><span>Subtotal {s.store.name}</span><span className="tabular-nums">{formatUsd(s.subtotalCents)}</span></div> : null}
              </div>
            ))}
            <div className="flex flex-col gap-1.5 border-t border-border pt-3.5 text-body text-ink-muted">
              <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatUsd(o.subtotalCents)}</span></div>
              <div className="flex justify-between"><span>{o.shippingLabel}</span><span className="tabular-nums">{formatUsd(o.shippingCents)}</span></div>
              {o.tipCents > 0 ? <div className="flex justify-between"><span>Propina</span><span className="tabular-nums">{formatUsd(o.tipCents)}</span></div> : null}
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <b className="text-body-strong">{cancelled ? "Total (reembolsado)" : "Total pagado"}</b>
              <span className="flex flex-col items-end"><b className="text-title-md tabular-nums">{formatUsd(o.totalCents)}</b><span className="text-caption text-ink-muted">{formatVes(o.totalCents, DEMO_RATE)}</span></span>
            </div>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-title-lg">Pago y entrega</h2>
            <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <div className="flex flex-col gap-0.5 border-b border-border pb-3">
                <span className="text-body-strong font-bold">{o.payment}</span>
                <span className="text-caption text-ink-muted">{o.paymentRef}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-body-strong font-bold">{o.address}</span>
                <span className="text-caption text-ink-muted">{o.reference}</span>
              </div>
            </div>
          </section>
          <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-surface p-4 shadow-nav desktop:static desktop:flex-row desktop:flex-wrap desktop:bg-transparent desktop:p-0 desktop:shadow-none">
            {unavailable.length > 0 ? <p className="text-caption text-ink-muted desktop:w-full">Hoy no hay: {unavailable.map((l) => l.name).join(", ")}. Se omitirá al repetir.</p> : null}
            {changed.length > 0 ? <p className="text-caption text-ink-muted desktop:w-full">Al repetir se usa el precio de hoy: {changed.map((l) => `${l.name} ${formatUsd(l.nowCents)}`).join(", ")}.</p> : null}
            <RepeatOrderButton stops={o.stops} label="Repetir pedido" className="nm-btn nm-btn--primary desktop:grow" />
            <Link href="/acerca" className="nm-btn nm-btn--secondary">
              <span className="desktop:hidden">Ayuda con este pedido</span><span className="hidden desktop:inline">Ayuda</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
