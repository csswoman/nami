"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { useCartStore } from "@/lib/cart/store";

export type Spot = { id: string; short: string; name: string; addr: string; ref: string; x: number; y: number };

/** Elegir dirección de prueba. Estado local: selección y punto de referencia; guardar la dirección lo conecta la lógica. */
export function DireccionView({ spots, initial, next }: { spots: readonly Spot[]; initial: string; next: string }) {
  const [sel, setSel] = useState(initial);
  const [ref, setRef] = useState(spots.find((s) => s.id === initial)?.ref ?? "");
  const router = useRouter();
  const setAddress = useCartStore((st) => st.setAddress);
  const confirm = () => {
    const s = spots.find((x) => x.id === sel);
    if (s) setAddress({ name: s.name, line: `${s.addr}, ${s.short}`, reference: ref.trim() || s.ref });
    router.push(next);
  };
  const pick = (s: Spot) => { setSel(s.id); setRef(s.ref); };

  const map = (
    <div className="relative aspect-390/300 w-full overflow-hidden bg-[#F4EEE6] desktop:rounded-3xl">
      <svg className="block size-full" viewBox="0 0 390 300" role="img" aria-label="Mapa de Caracas con las direcciones de prueba">
        <path d="M0 0H390V58C340 76 300 44 250 62C200 80 150 50 100 70C60 84 30 62 0 74Z" fill="#CFE3C8" />
        <path d="M0 0H390V30C350 44 300 20 240 36C190 50 140 24 90 40C50 52 20 32 0 40Z" fill="#B7D6AE" />
        <text x="176" y="24" fontFamily="Figtree, sans-serif" fontSize="11" fontWeight="700" fill="#2F5A2A" letterSpacing="1.5">EL ÁVILA</text>
        <path d="M0 196C60 186 120 200 180 190S300 176 390 186" fill="none" stroke="#BFD8EE" strokeWidth="8" strokeLinecap="round" />
        <text x="16" y="216" fontFamily="Figtree, sans-serif" fontSize="9" fontWeight="600" fill="#6B8CAB">Río Guaire</text>
        <path d="M-10 150H90L150 160H260L300 142L400 130" fill="none" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 140L80 150L150 162L250 160L300 142L350 132" fill="none" stroke="#E8182E" strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80 150L78 200L62 262" fill="none" stroke="#1F1A1C" strokeOpacity="0.25" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="240" y="290" fontFamily="Figtree, sans-serif" fontSize="9" fontWeight="600" fill="#8A7F77">Línea 1 y 2 del Metro (referencia)</text>
      </svg>
      {spots.map((s) => {
        const on = s.id === sel;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => pick(s)}
            aria-label={`Elegir ${s.name}`}
            aria-pressed={on}
            style={{ left: `${(s.x / 390) * 100}%`, top: `${(s.y / 300) * 100}%`, transformOrigin: "15px 36px" }}
            className={`absolute flex min-h-11 items-center gap-1 ${on ? "z-30 scale-115" : "z-20"}`}
          >
            <svg width="30" height="36" viewBox="0 0 30 36" aria-hidden="true">
              <path d="M15 35c-8-9-13-15-13-21a13 13 0 0 1 26 0c0 6-5 12-13 21Z" className={on ? "fill-primary" : "fill-ink"} stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="15" cy="14" r="5" fill="#FFFFFF" />
            </svg>
            <span className={`rounded-pill px-2 py-0.75 text-badge font-bold whitespace-nowrap ${on ? "bg-primary text-on-primary" : "bg-surface-raised text-ink shadow-card"}`}>{s.short}</span>
          </button>
        );
      })}
    </div>
  );

  const cards = spots.map((s) => {
    const on = s.id === sel;
    return (
      <button
        key={s.id}
        type="button"
        aria-pressed={on}
        onClick={() => pick(s)}
        className={`flex min-h-16 items-center gap-3 rounded-lg px-3.5 py-3 text-left ${on ? "border-2 border-primary bg-primary-tint" : "border border-border bg-surface"}`}
      >
        <span className={`box-border size-5 shrink-0 rounded-pill ${on ? "border-[6px] border-primary bg-surface" : "border-2 border-border"}`} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body-strong font-bold text-ink">{s.name}</span>
          <span className="text-caption font-medium text-ink-muted">{s.addr}</span>
        </span>
      </button>
    );
  });

  const refField = (id: string) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-strong font-bold">Punto de referencia</label>
      <input id={id} value={ref} onChange={(e) => setRef(e.target.value)} className="min-h-12 rounded-lg border border-border bg-surface px-4 text-body text-ink" />
      <span className="text-caption font-medium text-ink-muted desktop:hidden">Ayuda al motorizado a encontrarte rápido.</span>
    </div>
  );

  return (
    <>
      {/* Móvil */}
      <div className="desktop:hidden">
        <ScreenBar title="Elige tu dirección" back="/checkout" />
        <p className="-mt-1 mb-3 px-5 text-center text-body text-ink-muted">Son direcciones de prueba en Caracas. Elige una y ajusta el punto de referencia.</p>
        {map}
        <div className="flex flex-col gap-2.5 px-4 pt-5">
          <h2 className="font-display text-title-md">Direcciones de prueba</h2>
          {cards}
        </div>
        <div className="px-4 pt-5">{refField("ref-movil")}</div>
        <div className="fixed inset-x-0 bottom-0 z-20 bg-surface-raised p-4 shadow-nav">
          <button type="button" onClick={confirm} className="nm-btn nm-btn--primary nm-btn--block">Confirmar dirección</button>
        </div>
      </div>

      {/* Escritorio */}
      <div className="mx-auto hidden w-full max-w-300 grid-cols-[minmax(0,720px)_minmax(0,1fr)] items-start gap-10 py-8 desktop:grid">
        {map}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-[32px] leading-9.5 font-extrabold">¿A dónde llevamos tu pedido?</h1>
            <p className="text-body text-ink-muted">Son direcciones de prueba en Caracas. Elige una y ajusta el punto de referencia.</p>
          </div>
          {cards}
          {refField("ref-escritorio")}
          <button type="button" onClick={confirm} className="nm-btn nm-btn--primary nm-btn--block">Confirmar dirección</button>
        </div>
      </div>
    </>
  );
}
