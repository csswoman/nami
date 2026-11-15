"use client";
import { useState } from "react";
import { substituteOptions } from "@/app/checkout/actions";
import type { CartGroup } from "@/lib/cart/store";
import { formatUsd } from "@/lib/money";
import { SUBSTITUTION_LABELS, type Substitution } from "@/lib/orders/substitution";
type Candidate = { id: string; name: string; priceCents: number };
/** Elección por línea del carrito (clave = `line.key`). Sin elección vale «algo parecido». */
export type Substitutions = Record<string, Substitution>;
export const DEFAULT_SUBSTITUTION: Substitution = { kind: "similar" };
/** Lo que se manda al servidor: «elegir producto» sin producto todavía se trata como «algo parecido». */
export const effectiveSubstitution = (s: Substitution | undefined): Substitution => (!s ? DEFAULT_SUBSTITUTION : s.kind === "product" && !s.product ? DEFAULT_SUBSTITUTION : s);
/**
 * «Si no hay…»: para cada producto de un mercado, qué hacer si la tienda no lo tiene. El cambio nunca cuesta más
 * de lo pedido. Solo aparecen las tiendas de tipo mercado.
 */
export function SubstitutionBox({ groups, value, onChange }: { groups: CartGroup[]; value: Substitutions; onChange: (next: Substitutions) => void }) {
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const markets = groups.filter((g) => g.store.kind === "mercado");
  if (markets.length === 0) return null;
  async function pick(storeSlug: string, productId: string, lineKey: string, kind: Substitution["kind"]) {
    onChange({ ...value, [lineKey]: { kind } });
    if (kind === "product" && !candidates[lineKey]) {
      const list = await substituteOptions(storeSlug, productId);
      setCandidates((c) => ({ ...c, [lineKey]: list }));
    }
  }
  return (
    <section className="flex flex-col gap-3" aria-label="Si no hay un producto">
      <h2 className="font-display text-title-lg desktop:text-[20px]">Si no hay algún producto</h2>
      <p className="text-caption text-ink-muted">Elige qué hacemos con cada uno. Si lo cambiamos, nunca cobramos más de lo que pediste.</p>
      <ul className="flex flex-col gap-3">
        {markets.flatMap((g) =>
          g.lines.map((l) => {
            const cur = value[l.key] ?? DEFAULT_SUBSTITUTION;
            const list = candidates[l.key];
            return (
              <li key={`${g.store.slug}-${l.key}`} className="flex flex-col gap-2 rounded-lg border border-border p-3" data-testid="substitution-line">
                <span className="text-body-strong font-bold">{l.qty}× {l.name}</span>
                <label className="sr-only" htmlFor={`sub-${l.key}`}>Si no hay {l.name}</label>
                <select id={`sub-${l.key}`} value={cur.kind} onChange={(e) => void pick(g.store.slug, l.productId, l.key, e.target.value as Substitution["kind"])} className="min-h-11 rounded-md border border-border bg-surface px-3 text-body">
                  {(["similar", "remove", "product"] as const).map((k) => <option key={k} value={k}>{SUBSTITUTION_LABELS[k]}</option>)}
                </select>
                {cur.kind === "product" ? (
                  <>
                    <label className="sr-only" htmlFor={`sub-product-${l.key}`}>Producto de reemplazo para {l.name}</label>
                    <select
                      id={`sub-product-${l.key}`}
                      value={cur.product ?? ""}
                      disabled={!list}
                      onChange={(e) => onChange({ ...value, [l.key]: { kind: "product", product: e.target.value || undefined } })}
                      className="min-h-11 rounded-md border border-border bg-surface px-3 text-body"
                    >
                      <option value="">{list ? "Elige un producto…" : "Cargando…"}</option>
                      {(list ?? []).map((c) => <option key={c.id} value={c.id}>{c.name} · {formatUsd(c.priceCents)}</option>)}
                    </select>
                    {!cur.product ? <span className="text-caption text-ink-muted">Hasta que elijas uno, cambiaremos por algo parecido.</span> : null}
                  </>
                ) : null}
              </li>
            );
          }),
        )}
      </ul>
    </section>
  );
}
