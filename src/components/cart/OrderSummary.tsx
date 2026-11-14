"use client";

import { useCartReady } from "@/lib/cart/hooks";
import { useCartStore, type PayMethod } from "@/lib/cart/store";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes } from "@/lib/money";

type Fallback = {
  code: string;
  store: string;
  lines: { key: string; name: string; qty: number; unitCents: number }[];
  shippingCents: number;
  tipCents: number;
};

const PAY_LABEL: Record<PayMethod, string> = {
  movil: "Pago móvil · Ref. 4821 · Verificado",
  zelle: "Zelle · Pendiente de confirmar",
  efectivo: "Efectivo en divisas · Pagas al recibir",
};

/** "Tu pedido" del seguimiento: usa el último pedido hecho; sin pedido, muestra uno de ejemplo. */
export function OrderSummary({ fallback }: { fallback: Fallback }) {
  const order = useCartStore((s) => s.order);
  const ready = useCartReady();
  const o = ready && order
    ? { code: order.id, store: order.store.name, lines: order.lines, shippingCents: order.shippingCents, tipCents: order.tipCents, pay: PAY_LABEL[order.payment] }
    : { ...fallback, pay: PAY_LABEL.movil };
  const subtotal = o.lines.reduce((n, l) => n + l.qty * l.unitCents, 0);
  const total = subtotal + o.shippingCents + o.tipCents;

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-title-md">Tu pedido</h2>
        <span className="text-caption text-ink-muted">{o.store} · #{o.code}</span>
      </div>
      <div className="flex flex-col gap-2 text-body">
        {o.lines.map((l) => (
          <div key={l.key} className="flex justify-between"><span>{l.qty}× {l.name}</span><span>{formatUsd(l.qty * l.unitCents)}</span></div>
        ))}
        <div className="flex justify-between text-caption text-ink-muted"><span>Envío</span><span>{formatUsd(o.shippingCents)}</span></div>
        <div className="flex justify-between text-caption text-ink-muted"><span>Propina para el motorizado</span><span>{formatUsd(o.tipCents)}</span></div>
      </div>
      <div className="flex items-baseline justify-between border-t border-dashed border-border pt-2">
        <span className="text-body-strong font-bold">Total</span>
        <span className="flex flex-col items-end"><span className="text-price">{formatUsd(total)}</span><span className="text-caption text-ink-muted">{formatVes(total, DEMO_RATE)}</span></span>
      </div>
      <span className="self-start rounded-pill bg-success-tint px-3 py-1.5 text-badge text-ink">{o.pay}</span>
    </section>
  );
}
