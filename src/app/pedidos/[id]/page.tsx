import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { CheckIcon } from "@/components/shell/glyphs";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { StoreMark } from "@/components/shell/StoreMark";
import { RouteMiniMap } from "@/components/tracking/RouteMiniMap";
import { DEMO_RATE } from "@/lib/demo/home";
import { ORDER_DETAIL as o } from "@/lib/demo/pedidos";
import { formatUsd, formatVes } from "@/lib/money";

export const metadata = { title: "Detalle del pedido · Ñami" };

export default function DetallePedidoPage() {
  // Demo: cualquier id muestra el mismo pedido entregado. La lógica real lo leerá por id + guestToken.
  const subtotal = o.lines.reduce((n, l) => n + l.qty * l.unitCents, 0);
  const total = subtotal + o.shippingCents + o.tipCents;

  const stats = [
    [`${o.prepMin} min`, "Preparación"],
    [`${o.rideMin} min`, "En la moto"],
    [o.km, o.route],
  ];

  return (
    <AppShell mobileHeader={false} bottomNav={false} activeNav={3}>
      <ScreenBar title="Detalle del pedido" back="/pedidos" />
      <div className="page-x flex flex-col gap-6 pt-2 pb-48 desktop:pt-6 desktop:pb-8">
        <nav aria-label="Ruta" className="hidden gap-2 text-caption text-ink-muted desktop:flex">
          <Link href="/pedidos" className="font-semibold text-primary-text">Mis pedidos</Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">#{o.id}</span>
        </nav>

        <header className="flex items-center gap-3.5 desktop:gap-5">
          <span className="desktop:hidden"><StoreMark initials={o.initials} color={o.color} size={56} /></span>
          <span className="hidden desktop:block"><StoreMark initials={o.initials} color={o.color} size={88} /></span>
          <div className="flex min-w-0 grow flex-col">
            <h1 className="font-display text-[22px] leading-7 font-extrabold desktop:text-[48px] desktop:leading-14">{o.store}</h1>
            <span className="text-caption text-ink-muted desktop:text-body">Pedido #{o.id} · {o.date}</span>
          </div>
          <span className="self-start rounded-pill bg-success-tint px-3 py-1.5 text-badge font-bold text-success desktop:self-center">Entregado</span>
        </header>

        <div className="grid grid-cols-1 gap-8 desktop:grid-cols-[minmax(0,1fr)_420px] desktop:items-start desktop:gap-10">
          <div className="flex min-w-0 flex-col gap-5">
            <RouteMiniMap className="hidden aspect-900/490 w-full rounded-xl desktop:block" />
            <h2 className="font-display text-title-lg">Recorrido</h2>
            <div className="grid grid-cols-3 gap-3">
              {stats.map(([big, small]) => (
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
            <p className="text-caption text-ink-muted desktop:text-body">{o.courier}</p>
          </div>

          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-title-lg">Productos</h2>
              <div className="flex flex-col gap-2.5 text-body">
                {o.lines.map((l) => (
                  <div key={l.id} className="flex flex-col">
                    <div className="flex justify-between"><span>{l.qty}× {l.name}</span><span>{formatUsd(l.qty * l.unitCents)}</span></div>
                    {l.note ? <span className="text-caption text-ink-muted">{l.note}</span> : null}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border pt-3.5 text-body text-ink-muted">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatUsd(subtotal)}</span></div>
                <div className="flex justify-between"><span>Envío</span><span>{formatUsd(o.shippingCents)}</span></div>
                <div className="flex justify-between"><span>Propina para Carlos</span><span>{formatUsd(o.tipCents)}</span></div>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <b className="text-body-strong">Total</b>
                <span className="flex flex-col items-end"><b className="text-title-md">{formatUsd(total)}</b><span className="text-caption text-ink-muted">{formatVes(total, DEMO_RATE)}</span></span>
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

            <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-surface p-4 shadow-nav desktop:static desktop:flex-row desktop:bg-transparent desktop:p-0 desktop:shadow-none">
              <Link href="/carrito" className="nm-btn nm-btn--primary desktop:grow">Repetir pedido</Link>
              <Link href="/acerca" className="nm-btn nm-btn--secondary">
                <span className="desktop:hidden">Ayuda con este pedido</span><span className="hidden desktop:inline">Ayuda</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
