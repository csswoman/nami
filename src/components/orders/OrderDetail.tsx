import Link from "next/link";
import { RepeatOrderButton } from "@/components/cart/RepeatOrderButton";
import { StatusPill, StoreStack, tint } from "@/components/orders/OrderParts";
import { CheckIcon } from "@/components/shell/glyphs";
import { Icon } from "@/components/nami";
import { RouteMiniMap } from "@/components/tracking/RouteMiniMap";
import { DEMO_RATE } from "@/lib/demo/home";
import type { OrderView } from "@/lib/orders/view";
import { formatUsd, formatVes, type Currency } from "@/lib/money";

const SHORT_STEP_NAMES: Record<string, string> = {
  "Buscando motorizado": "Motorizado",
  "Armando tu compra": "Armando",
};

/** Detalle de un pedido terminado (entregado o cancelado), con productos destacados y recorrido resumido. */
export function OrderDetail({ o, money }: { o: OrderView; money?: { currency: Currency; rate: number } }) {
  const cancelled = o.status === "cancelled";
  const multi = o.stops.length > 1;
  const name = o.stops.map((s) => s.store.name).join(" + ");
  const unavailable = o.stops.flatMap((s) => s.lines.filter((l) => !l.available));
  const changed = o.stops.flatMap((s) => s.lines.filter((l) => l.available && l.nowCents !== l.unitCents));
  const rate = money?.rate ?? DEMO_RATE;

  return (
    <div className="page-x flex flex-col gap-6 pt-2 pb-48 pb-[calc(10rem+env(safe-area-inset-bottom))] desktop:pt-6 desktop:pb-12">
      {/* Migas de pan en escritorio */}
      <nav aria-label="Ruta" className="hidden gap-2 text-caption text-ink-muted desktop:flex">
        <Link href="/pedidos" className="font-semibold text-primary-text hover:underline">
          Mis pedidos
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">#{o.code}</span>
      </nav>

      {/* Cabecera del comercio y pedido */}
      <header className="flex items-center gap-3.5 desktop:gap-5">
        <span className="desktop:hidden">
          <StoreStack stores={o.stops.map((s) => s.store)} size={56} />
        </span>
        <span className="hidden desktop:block">
          <StoreStack stores={o.stops.map((s) => s.store)} size={80} />
        </span>
        <div className="flex min-w-0 grow flex-col gap-1">
          <h1 className="font-display text-[22px] leading-7 font-extrabold text-ink desktop:text-[36px] desktop:leading-10">
            {name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-caption text-ink-muted desktop:text-body">
            <StatusPill status={o.status} />
            <span className="font-medium text-ink">Pedido #{o.code}</span>
            <span aria-hidden="true">·</span>
            <span>{o.whenLong}</span>
          </div>
        </div>
      </header>

      {/* Contenido principal en dos columnas (escritorio) o flujo ordenado (móvil) */}
      <div className="grid grid-cols-1 gap-6 desktop:grid-cols-[minmax(0,1fr)_380px] desktop:items-start desktop:gap-8">
        {/* Columna izquierda: Recorrido resumido, Productos (lo primordial), Pago y entrega */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* 1. Recorrido resumido */}
          {cancelled ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-surface-tile p-4.5 shadow-xs">
              <div className="flex items-center gap-2">
                <Icon name="close" className="size-5 text-danger shrink-0" />
                <h2 className="font-display text-title-md text-ink">Pedido cancelado</h2>
              </div>
              <p className="text-body text-ink-muted leading-snug">{o.cancelReason}</p>
            </div>
          ) : (
            <section aria-label="Resumen del recorrido" className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-surface p-4.5 desktop:p-5 shadow-xs">
              <div className="flex flex-col tablet:flex-row tablet:items-center tablet:justify-between gap-1.5 border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-pill bg-success-tint text-success [&_.nm-icon]:size-3.5">
                    <CheckIcon />
                  </span>
                  <span className="font-bold text-body-strong text-ink">Recorrido completado</span>
                </div>
                {o.courier && (
                  <span className="text-caption text-ink-muted">{o.courier}</span>
                )}
              </div>

              {/* Estadísticas clave del recorrido en pastillas compactas */}
              {o.stats.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {o.stats.map(([big, small]) => (
                    <div key={small} className="flex flex-col rounded-xl bg-surface-tile px-3 py-2 text-center">
                      <b className="font-display text-body-strong text-ink">{big}</b>
                      <span className="text-[11px] text-ink-muted leading-tight">{small}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Barra de etapas horizontal resumida */}
              {o.steps.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
                    {o.steps.map(([label]) => (
                      <span key={label} className="h-1.5 w-full rounded-pill bg-primary" />
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-[11px]">
                    {o.steps.map(([label, time]) => (
                      <div key={label} className="flex flex-col min-w-0">
                        <span className="truncate font-medium text-ink" title={label}>
                          {SHORT_STEP_NAMES[label] ?? label}
                        </span>
                        <span className="text-[10px] text-ink-muted tabular-nums">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Desplegable para ver la cronología vertical completa sólo si se desea */}
              {o.steps.length > 0 && (
                <details className="group cursor-pointer pt-2 border-t border-border/40">
                  <summary className="flex items-center justify-between text-caption font-semibold text-primary-text hover:underline py-1 list-none outline-none">
                    <span>Ver detalle cronológico</span>
                    <Icon name="chevronDown" className="size-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <ol className="flex flex-col pt-3 pl-1">
                    {o.steps.map(([label, time], i) => (
                      <li key={label} className="flex min-h-9 gap-3">
                        <span className="flex w-5 shrink-0 flex-col items-center">
                          <span className="grid size-5 place-items-center rounded-pill bg-primary text-on-primary [&_.nm-icon]:size-3">
                            <CheckIcon />
                          </span>
                          {i < o.steps.length - 1 ? <span className="min-h-3 w-0.5 grow bg-primary" /> : null}
                        </span>
                        <span className="flex grow justify-between gap-2 pb-2 text-caption">
                          <span className="font-medium text-ink">{label}</span>
                          <span className="text-ink-muted">{time}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </section>
          )}

          {/* 2. Productos: Lo más importante con imágenes reales y notas */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-title-lg text-ink">
              Productos ({o.itemCount})
            </h2>
            <div className="flex flex-col gap-2.5">
              {o.stops.map((s) => (
                <div key={s.store.slug} className="flex flex-col gap-2">
                  {multi && (
                    <span className="text-caption font-bold text-ink-muted uppercase tracking-wider">
                      {s.store.name}
                    </span>
                  )}
                  {s.lines.map((l) => (
                    <div
                      key={l.key}
                      className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-surface p-3.5 shadow-xs transition-colors hover:bg-surface-tile/40"
                    >
                      {/* Imagen real del producto */}
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-surface-tile shadow-xs">
                        {l.image ? (
                          <img src={l.image} alt="" className="size-full object-cover" />
                        ) : (
                          <span
                            className="grid size-full place-items-center"
                            style={{ background: tint(s.store.color), color: `var(--${s.store.color})` }}
                          >
                            <Icon name={l.icon} className="size-6" />
                          </span>
                        )}
                      </div>

                      {/* Detalles del ítem */}
                      <div className="flex min-w-0 grow flex-col gap-0.5">
                        <span className="text-body font-bold text-ink">
                          {l.qty} × {l.name}
                          {!l.available && (
                            <span className="ml-1 text-caption text-ink-muted font-normal">
                              (agotado hoy)
                            </span>
                          )}
                        </span>
                        {l.note && (
                          <span className="text-caption text-ink-muted leading-tight">
                            Nota: {l.note}
                          </span>
                        )}
                        {l.options && (
                          <span className="text-caption text-ink-muted leading-tight">
                            {Object.values(l.options).flat().join(" · ")}
                          </span>
                        )}
                      </div>

                      {/* Precio de la línea */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-price font-bold tabular-nums text-ink">
                          {formatUsd(l.qty * l.unitCents)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {multi && (
                    <div className="flex justify-between px-1 text-caption text-ink-muted">
                      <span>Subtotal {s.store.name}</span>
                      <span className="tabular-nums font-semibold text-ink">{formatUsd(s.subtotalCents)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. Pago y entrega */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-title-lg text-ink">Pago y entrega</h2>
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface p-4 shadow-xs">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-tile text-ink-muted">
                  <Icon name="receipt" className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                    Método de pago
                  </span>
                  <span className="text-body-strong font-bold text-ink">{o.payment}</span>
                  <span className="text-caption text-ink-muted">{o.paymentRef}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface p-4 shadow-xs">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-tile text-ink-muted">
                  <Icon name="pin" className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                    Dirección de entrega
                  </span>
                  <span className="text-body-strong font-bold text-ink">{o.address}</span>
                  <span className="text-caption text-ink-muted">{o.reference}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Columna derecha: Mapa (desktop) y Resumen de cobro (Ticket) */}
        <aside className="flex flex-col gap-5 desktop:sticky desktop:top-24">
          <RouteMiniMap className="hidden aspect-900/490 w-full rounded-2xl border border-border/80 overflow-hidden shadow-xs tablet:block" />

          {/* Tarjeta de recibo / totales */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-surface p-5 shadow-xs">
            <h3 className="font-display text-title-md text-ink">Resumen del cobro</h3>

            <div className="flex flex-col gap-2 border-b border-border/60 pb-3 text-body text-ink-muted">
              <div className="flex justify-between">
                <span>Subtotal productos</span>
                <span className="tabular-nums font-medium text-ink">{formatUsd(o.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>{o.shippingLabel}</span>
                <span className="tabular-nums font-medium text-ink">{formatUsd(o.shippingCents)}</span>
              </div>
              {o.tipCents > 0 && (
                <div className="flex justify-between">
                  <span>Propina al repartidor</span>
                  <span className="tabular-nums font-medium text-ink">{formatUsd(o.tipCents)}</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-body-strong font-bold text-ink">
                {cancelled ? "Total (reembolsado)" : "Total pagado"}
              </span>
              <div className="flex flex-col items-end">
                <span className="font-display text-title-lg font-extrabold text-ink tabular-nums">
                  {formatUsd(o.totalCents)}
                </span>
                <span className="text-[12px] font-medium text-ink-muted tabular-nums">
                  {formatVes(o.totalCents, rate)}
                </span>
              </div>
            </div>

            {/* Avisos de disponibilidad / precio */}
            {unavailable.length > 0 && (
              <p className="text-caption text-ink-muted">
                Hoy no hay: {unavailable.map((l) => l.name).join(", ")}. Se omitirá al repetir.
              </p>
            )}
            {changed.length > 0 && (
              <p className="text-caption text-ink-muted">
                Al repetir se usa el precio de hoy:{" "}
                {changed.map((l) => `${l.name} ${formatUsd(l.nowCents)}`).join(", ")}.
              </p>
            )}

            {/* Acciones principales en escritorio */}
            <div className="hidden desktop:flex desktop:flex-col desktop:gap-2.5 pt-2">
              <RepeatOrderButton
                stops={o.stops}
                label={cancelled ? "Volver a pedir" : "Repetir pedido"}
                className="nm-btn nm-btn--primary w-full"
              />
              <Link href="/acerca" className="nm-btn nm-btn--secondary w-full text-center">
                Ayuda con este pedido
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Barra de acción fija en móvil con soporte para safe-area (iOS home bar) */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-nav desktop:hidden border-t border-border/80">
        <RepeatOrderButton
          stops={o.stops}
          label={cancelled ? "Volver a pedir" : "Repetir pedido"}
          className="nm-btn nm-btn--primary w-full"
        />
        <Link href="/acerca" className="nm-btn nm-btn--secondary w-full text-center">
          Ayuda con este pedido
        </Link>
      </div>
    </div>
  );
}
