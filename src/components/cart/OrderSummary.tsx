import type { Order, PayMethod } from "@/lib/cart/store";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes } from "@/lib/money";

const PAY_LABEL: Record<PayMethod, string> = {
  movil: "Pago móvil · Verificado",
  zelle: "Zelle · Pendiente de confirmar",
  efectivo: "Efectivo en divisas · Pagas al recibir",
};

/** "Tu pedido" del seguimiento: líneas por tienda y los totales guardados al hacer el pedido. */
export function OrderSummary({ order: o }: { order: Order }) {
  const multi = o.stops.length > 1;
  const shipLabel = multi ? (o.delivery === "combined" ? `Envío (un motorizado, ${o.stops.length} paradas)` : `Envíos (${o.stops.length})`) : "Envío";
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-title-md">Tu pedido</h2>
        <span className="text-caption text-ink-muted">#{o.code ?? o.id}</span>
      </div>
      <div className="flex flex-col gap-3 text-body">
        {o.stops.map((s) => (
          <div key={s.store.slug} className="flex flex-col gap-1.5">
            {multi ? <span className="text-caption font-bold text-ink-muted">{s.store.name}</span> : null}
            {s.lines.map((l) => (
              <div key={l.key} className="flex justify-between gap-3">
                <span>{l.qty}× {l.name}{l.note ? <span className="block text-caption text-ink-muted">{l.note}</span> : null}</span>
                <span className="tabular-nums">{formatUsd(l.qty * l.unitCents)}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="flex flex-col gap-1 border-t border-dashed border-border pt-2 text-caption text-ink-muted">
          <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatUsd(o.subtotalCents)}</span></div>
          <div className="flex justify-between"><span>{shipLabel}</span><span className="tabular-nums">{formatUsd(o.shippingCents)}</span></div>
          {o.tipCents > 0 ? <div className="flex justify-between"><span>Propina para el motorizado</span><span className="tabular-nums">{formatUsd(o.tipCents)}</span></div> : null}
        </div>
      </div>
      <div className="flex items-baseline justify-between border-t border-dashed border-border pt-2">
        <span className="text-body-strong font-bold">Total</span>
        <span className="flex flex-col items-end"><span className="text-price tabular-nums">{formatUsd(o.totalCents)}</span><span className="text-caption text-ink-muted">{formatVes(o.totalCents, DEMO_RATE)}</span></span>
      </div>
      <span className="self-start rounded-pill bg-success-tint px-3 py-1.5 text-badge text-ink">{PAY_LABEL[o.payment]}</span>
    </section>
  );
}
