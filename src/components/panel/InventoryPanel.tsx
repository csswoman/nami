"use client";
import { useMemo, useState } from "react";
import { Badge } from "@/components/nami";
import type { InventoryItem } from "@/server/store-panel";
import { parsePriceCents, priceInputValue as showPrice } from "@/lib/money";
import { callPanel, notifyCatalogChanged } from "./api";
const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
function Row({ slug, item, onChange }: { slug: string; item: InventoryItem; onChange: (next: InventoryItem) => void }) {
  const [price, setPrice] = useState(showPrice(item.priceCents));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  async function patch(body: { available?: boolean; priceCents?: number }) {
    setBusy(true);
    setSaved(false);
    const r = await callPanel<{ item: InventoryItem }>(`/api/tienda-admin/${slug}/products/${item.slug}`, "PATCH", body);
    setError(r.error);
    if (r.data) {
      onChange(r.data.item);
      setPrice(showPrice(r.data.item.priceCents));
      setSaved(body.priceCents !== undefined);
      notifyCatalogChanged();
    }
    setBusy(false);
  }
  const cents = parsePriceCents(price);
  const invalid = Number.isNaN(cents) || cents <= 0;
  const changed = cents !== item.priceCents;
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-border py-3" data-testid="inventory-row">
      <span className={`min-w-40 grow ${item.isAvailable ? "" : "text-ink-muted"}`}>
        <span className="text-body-strong font-bold">{item.name}</span>
        {item.isAvailable ? null : <span className="ml-2 align-middle"><Badge tone="danger">Agotado</Badge></span>}
        {error ? <span role="alert" className="block text-caption text-danger">{error}</span> : null}
        {!error && changed && invalid && price ? <span className="block text-caption text-danger">Escribe un precio como 3,50.</span> : null}
        {saved && !changed ? <span role="status" className="block text-caption text-success">Precio guardado.</span> : null}
      </span>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (changed && !invalid) void patch({ priceCents: cents });
        }}
      >
        <label className="sr-only" htmlFor={`price-${item.slug}`}>Precio de {item.name} en dólares</label>
        <span className="text-ink-muted" aria-hidden>$</span>
        <input
          id={`price-${item.slug}`}
          inputMode="decimal"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setSaved(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPrice(showPrice(item.priceCents));
          }}
          aria-invalid={changed && invalid ? true : undefined}
          className="min-h-11 w-24 rounded-md border border-border px-3 text-right text-body"
        />
        <button type="submit" disabled={busy || !changed || invalid} className="nm-btn nm-btn--secondary">Guardar</button>
      </form>
      <button type="button" disabled={busy} onClick={() => void patch({ available: !item.isAvailable })} className={`nm-btn ${item.isAvailable ? "nm-btn--secondary" : "nm-btn--primary"}`}>
        {item.isAvailable ? "Agotar" : "Reponer"}
      </button>
    </li>
  );
}
/** Inventario: agotar o reponer productos y cambiar precios. El cliente lo ve en su próxima consulta. */
export function InventoryPanel({ slug, initial }: { slug: string; initial: InventoryItem[] }) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [onlyOut, setOnlyOut] = useState(false);
  const outCount = items.filter((i) => !i.isAvailable).length;
  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return items.filter((i) => (!onlyOut || !i.isAvailable) && (!q || normalize(i.name).includes(q)));
  }, [items, query, onlyOut]);
  const sections = [...new Map(visible.map((i) => [i.section, i.sectionTitle])).entries()];
  return (
    <div className="flex flex-col gap-5">
      <p className="text-caption text-ink-muted">Los cambios se aplican al instante en la app del cliente. Los pedidos nuevos se cobran con estos precios.</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor={`inv-q-${slug}`}>Buscar producto</label>
        <input id={`inv-q-${slug}`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto…" className="min-h-11 min-w-0 grow rounded-md border border-border bg-surface px-3 text-body" />
        <label className="flex min-h-11 items-center gap-2 text-body">
          <input type="checkbox" checked={onlyOut} onChange={(e) => setOnlyOut(e.target.checked)} className="size-5 accent-primary" />
          Solo agotados ({outCount})
        </label>
      </div>
      {sections.length === 0 ? <p className="rounded-lg bg-surface-tile p-6 text-center text-body text-ink-muted">{onlyOut && !query ? "No hay productos agotados." : "Ningún producto coincide con la búsqueda."}</p> : null}
      {sections.map(([id, title]) => (
        <section key={id} className="flex flex-col gap-1">
          <h2 className="font-display text-title-md">{title}</h2>
          <ul>
            {visible.filter((i) => i.section === id).map((i) => (
              <Row key={i.slug} slug={slug} item={i} onChange={(next) => setItems((cur) => cur.map((x) => (x.slug === next.slug ? next : x)))} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
