"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/shell/glyphs";
import { EmptyState } from "@/components/shell/EmptyState";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { useNow, useOrders } from "@/lib/cart/hooks";
import { orderStoreName } from "@/lib/cart/store";
import { formatBs, formatUsd, formatVes } from "@/lib/money";

type Props = {
  rate: number;
  banks: string[];
  receiver: { label: string; value: string }[];
};

/** Pago móvil simulado. Estado local solo para copiar, escribir la referencia y mostrar el resultado. */
export function PagoMovilView({ rate, banks, receiver, id }: Props & { id?: string }) {
  const { ready, byId, active } = useOrders(useNow(60_000));
  const order = (id ? byId(id)?.order : active[0]?.order) ?? null;
  const [bank, setBank] = useState(banks[0]);
  const [ref, setRef] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  if (!ready) return <div className="min-h-[60dvh]" aria-busy="true" />;
  if (!order) {
    return (
      <>
        <ScreenBar title="Pago móvil" back="/checkout" />
        <EmptyState title="No hay un pedido por pagar" text="Arma tu pedido y confírmalo para ver los datos de pago." primary={{ href: "/listado", label: "Ver restaurantes abiertos" }} />
      </>
    );
  }
  const storeName = orderStoreName(order);
  const orderCode = `#${order.code ?? order.id}`;
  const lines = order.lines.map((l) => ({ id: l.key, label: `${l.qty}× ${l.name}`, amount: formatUsd(l.qty * l.unitCents) }));
  const extrasLabel = formatUsd(order.shippingCents + order.tipCents);
  const totalUsd = formatUsd(order.totalCents);
  const totalVes = order.totalBsCents !== undefined ? formatBs(order.totalBsCents) : formatVes(order.totalCents, rate);
  const dateLabel = new Date(order.createdAt).toLocaleString("es-VE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

  function copy(label: string, value: string) {
    void navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500);
  }

  if (verified) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-lg flex-col desktop:min-h-0 desktop:pt-10">
        <ScreenBar title="Pago móvil" back="/checkout" />
        <div className="flex grow flex-col gap-5 px-4 pb-6 desktop:grow-0 desktop:px-0">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-success-tint px-6 py-8 text-center" role="status">
            <span className="grid size-18 place-items-center rounded-pill bg-success text-on-primary [&_.nm-icon]:size-9"><CheckIcon /></span>
            <h1 className="font-display text-[28px] leading-8 font-extrabold">Pago verificado</h1>
            <p className="text-body">{storeName.split(" ").slice(-2).join(" ")} ya recibió tu pedido y empezó a prepararlo.</p>
          </div>
          <dl className="flex flex-col gap-2.5 rounded-lg border border-border p-5 text-body">
            {[
              ["Referencia", ref.padStart(6, "0") || "004821", true],
              ["Banco", bank, false],
              ["Monto", `${totalVes} · ${totalUsd}`, false],
              ["Fecha", dateLabel, false],
            ].map(([k, v, strong]) => (
              <div key={k as string} className="flex justify-between gap-4">
                <dt className="text-ink-muted">{k}</dt>
                <dd className={strong ? "font-bold" : ""}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-center text-caption text-ink-muted">Es una simulación: no se movió dinero real.</p>
        </div>
        <div className="flex flex-col gap-1 px-4 pb-6 desktop:px-0">
          <Link href={`/seguimiento?id=${encodeURIComponent(order.id)}`} className="nm-btn nm-btn--primary nm-btn--block">Seguir mi pedido</Link>
          <button type="button" onClick={() => { setVerified(false); setRef(""); }} className="min-h-11 text-button text-primary-text">Probar de nuevo</button>
        </div>
      </div>
    );
  }

  const fieldCls = "min-h-13 w-full rounded-pill border border-border bg-surface px-6 text-body text-ink outline-offset-2";

  return (
    <>
      <ScreenBar title="Pago móvil" back="/checkout" />
      <div className="page-x flex flex-col gap-6 pt-2 pb-32 desktop:pt-6 desktop:pb-8">
        <nav aria-label="Ruta" className="hidden gap-2 text-caption text-ink-muted desktop:flex">
          <Link href="/checkout" className="font-semibold text-primary-text">Confirmar pedido</Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">Pago móvil</span>
        </nav>
        <h1 className="hidden font-display text-[40px] leading-11 font-extrabold desktop:block">Paga con pago móvil</h1>

        <div className="grid grid-cols-1 gap-6 desktop:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] desktop:items-start desktop:gap-12">
          <aside aria-label="Monto a transferir" className="order-first flex flex-col gap-1 rounded-xl bg-surface-tile p-5 text-center desktop:order-last desktop:items-stretch desktop:gap-3 desktop:p-8 desktop:text-left">
            <span className="text-caption font-semibold text-ink-muted desktop:text-body">Monto a transferir</span>
            <b className="text-[40px] leading-11 font-extrabold desktop:text-[52px] desktop:leading-14">{totalVes}</b>
            <span className="text-body text-ink-muted">{totalUsd} a la tasa de la demo</span>
            <div className="mt-3 hidden flex-col gap-2.5 border-t border-border pt-5 text-body desktop:flex">
              <b className="text-body-strong">{storeName} · {orderCode}</b>
              {lines.map((l) => <div key={l.id} className="flex justify-between"><span>{l.label}</span><span>{l.amount}</span></div>)}
              <div className="flex justify-between text-ink-muted"><span>Envío y propina</span><span>{extrasLabel}</span></div>
            </div>
          </aside>

          <section className="flex flex-col gap-1">
            <h2 className="pb-2 font-display text-title-lg">1. Transfiere a estos datos</h2>
            {receiver.map((r) => (
              <div key={r.label} className="flex items-center gap-3 border-b border-border py-3">
                <span className="flex min-w-0 grow flex-col">
                  <span className="text-caption text-ink-muted">{r.label}</span>
                  <span className="text-body-strong font-semibold">{r.value}</span>
                </span>
                <button type="button" onClick={() => copy(r.label, r.value)} className="flex min-h-11 items-center gap-2 rounded-pill bg-surface-tile px-4 text-button text-ink [&_.nm-icon]:size-5">
                  {copied === r.label ? <CheckIcon /> : <CopyIcon />}{copied === r.label ? "Copiado" : "Copiar"}
                </button>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-title-lg">2. Confirma tu pago</h2>
            <label className="flex flex-col gap-2">
              <span className="text-body-strong font-bold">Banco desde el que pagaste</span>
              <select value={bank} onChange={(e) => setBank(e.target.value)} className={fieldCls}>
                {banks.map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-body-strong font-bold">Número de referencia</span>
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="Últimos 6 dígitos"
                className={`${fieldCls} tracking-widest placeholder:tracking-widest`}
              />
              <span className="text-caption text-ink-muted">Los encuentras en el comprobante de tu banco.</span>
            </label>
            <button type="button" onClick={() => setVerified(true)} className="nm-btn nm-btn--primary nm-btn--block hidden desktop:inline-flex">Verificar pago</button>
          </section>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface p-4 desktop:hidden">
        <button type="button" onClick={() => setVerified(true)} className="nm-btn nm-btn--primary nm-btn--block">Verificar pago</button>
      </div>
    </>
  );
}
