"use client";
import { useEffect, useState } from "react";
import { quoteOrder } from "@/app/checkout/actions";
import { formatUsd } from "@/lib/money";
import type { OrderQuote } from "@/server/orders";
export type CouponOffer = { code: string; description: string };
/** Cupón aplicado al carrito. `pending` = se está recalculando (no confirmar todavía). */
export type AppliedCoupon = { code: string; quote: OrderQuote | null; pending: boolean };
type Props = {
  offers: CouponOffer[];
  /** Pedido sin cupón: el servidor calcula el descuento con estos mismos datos. */
  base: Record<string, unknown>;
  onChange: (applied: AppliedCoupon | null) => void;
};
/**
 * Campo de cupón del checkout. El descuento lo calcula el servidor (`quoteOrder`) con los precios de la BD;
 * si el carrito cambia, se vuelve a calcular y, si el cupón ya no sirve, se avisa por qué.
 */
export function CouponBox({ offers, base, onChange }: Props) {
  const [text, setText] = useState("");
  const [code, setCode] = useState<string | null>(null);
  // Resultado del servidor para una combinación (código + carrito); mientras no coincida con la actual, se está recalculando.
  const [result, setResult] = useState<{ forKey: string; quote: OrderQuote | null; error: string | null } | null>(null);
  const key = JSON.stringify(base);
  const requestKey = `${code}|${key}`;
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    const done = (quote: OrderQuote | null, error: string | null) => {
      if (!cancelled) setResult({ forKey: `${code}|${key}`, quote, error });
    };
    quoteOrder({ ...JSON.parse(key), coupon: code })
      .then((res) => (res.ok ? done(res.quote, null) : done(null, res.error.message)))
      .catch(() => done(null, "No pudimos revisar el cupón. Revisa tu conexión."));
    return () => {
      cancelled = true;
    };
  }, [code, key]);
  const pending = code !== null && result?.forKey !== requestKey;
  const quote = result?.quote ?? null;
  const error = result?.error ?? null;
  useEffect(() => {
    onChange(code ? { code, quote, pending } : null);
  }, [code, quote, pending, onChange]);
  function apply(raw: string) {
    const next = raw.trim().toUpperCase();
    if (!next) return;
    setText(next);
    setResult(null);
    setCode(next);
  }
  function remove() {
    setCode(null);
    setResult(null);
    setText("");
  }
  const saved = quote ? quote.discountCents + quote.shippingDiscountCents : 0;
  return (
    <section className="flex flex-col gap-3" aria-label="Cupón">
      <h2 className="font-display text-title-lg desktop:text-[20px]">Cupón</h2>
      {code && quote ? (
        <div className="flex items-center gap-3 rounded-lg bg-primary-tint p-4" data-testid="coupon-applied">
          <span className="flex grow flex-col">
            <b className="text-body-strong">{code} aplicado</b>
            <span className="text-caption text-ink-muted">Ahorras {formatUsd(saved)} en este pedido.</span>
          </span>
          <button type="button" onClick={remove} className="text-button text-primary-text">Quitar</button>
        </div>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply(text);
          }}
        >
          <label htmlFor="coupon-code" className="sr-only">Código de cupón</label>
          <input
            id="coupon-code"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={30}
            autoCapitalize="characters"
            placeholder="Código de cupón"
            className="min-h-11 min-w-0 grow rounded-md border border-border bg-surface px-3 text-body uppercase placeholder:normal-case"
          />
          <button type="submit" disabled={pending || !text.trim()} className="nm-btn nm-btn--secondary">{pending ? "Revisando…" : "Aplicar"}</button>
        </form>
      )}
      {error ? <p role="alert" className="text-caption font-bold text-danger">{error}</p> : null}
      {!code && offers.length ? (
        <div className="flex flex-wrap gap-2">
          {offers.map((o) => (
            <button key={o.code} type="button" onClick={() => apply(o.code)} className="flex flex-col items-start rounded-lg border border-dashed border-border px-3 py-2 text-left">
              <b className="text-caption">{o.code}</b>
              <span className="text-caption text-ink-muted">{o.description}</span>
            </button>
          ))}
        </div>
      ) : null}
      {code && !quote && error ? <button type="button" onClick={remove} className="self-start text-button text-primary-text">Quitar cupón</button> : null}
    </section>
  );
}
