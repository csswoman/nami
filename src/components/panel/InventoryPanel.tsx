"use client";
import { useState } from "react";
import { Badge } from "@/components/nami";
import { formatUsd } from "@/lib/money";
import type { InventoryItem } from "@/server/store-panel";
import { callPanel } from "./api";
const toCents = (text: string) => Math.round(Number(text.replace(",", ".")) * 100);
function Row({ slug, item, onChange }: { slug: string; item: InventoryItem; onChange: (next: InventoryItem) => void }) {
  const [price, setPrice] = useState((item.priceCents / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function patch(body: { available?: boolean; priceCents?: number }) {
    setBusy(true);
    const r = await callPanel<{ item: InventoryItem }>(`/api/tienda-admin/${slug}/products/${item.slug}`, "PATCH", body);
    setError(r.error);
    if (r.data) {
      onChange(r.data.item);
      setPrice((r.data.item.priceCents / 100).toFixed(2));
    }
    setBusy(false);
  }
  const changed = toCents(price) !== item.priceCents;
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-border py-3" data-testid="inventory-row">
      <span className={`grow ${item.isAvailable ? "" : "text-ink-muted"}`}>
        <span className="text-body-strong font-bold">{item.name}</span>
        {item.isAvailable ? null : <span className="ml-2 align-middle"><Badge tone="danger">Agotado</Badge></span>}
        {error ? <span role="alert" className="block text-caption text-danger">{error}</span> : null}
      </span>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (changed) patch({ priceCents: toCents(price) });
        }}
      >
        <label className="sr-only" htmlFor={`price-${item.slug}`}>Precio de {item.name} en dólares</label>
        <span className="text-ink-muted">$</span>
        <input id={`price-${item.slug}`} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="min-h-11 w-24 rounded-md border border-border px-3 text-right text-body" />
        <button type="submit" disabled={busy || !changed || Number.isNaN(toCents(price))} className="nm-btn nm-btn--secondary">Guardar</button>
      </form>
      <button type="button" disabled={busy} onClick={() => patch({ available: !item.isAvailable })} className={`nm-btn ${item.isAvailable ? "nm-btn--secondary" : "nm-btn--primary"}`}>
        {item.isAvailable ? "Agotar" : "Reponer"}
      </button>
      <span className="sr-only">Precio actual {formatUsd(item.priceCents)}</span>
    </li>
  );
}
/** Inventario: agotar o reponer productos y cambiar precios. El cliente lo ve en su próxima consulta. */
export function InventoryPanel({ slug, initial }: { slug: string; initial: InventoryItem[] }) {
  const [items, setItems] = useState(initial);
  const sections = [...new Map(items.map((i) => [i.section, i.sectionTitle])).entries()];
  return (
    <div className="flex flex-col gap-6">
      <p className="text-caption text-ink-muted">Los cambios se aplican al instante en la app del cliente. Los pedidos nuevos se cobran con estos precios.</p>
      {sections.map(([id, title]) => (
        <section key={id} className="flex flex-col gap-1">
          <h2 className="font-display text-title-md">{title}</h2>
          <ul>
            {items.filter((i) => i.section === id).map((i) => (
              <Row key={i.slug} slug={slug} item={i} onChange={(next) => setItems((cur) => cur.map((x) => (x.slug === next.slug ? next : x)))} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
