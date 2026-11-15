import Link from "next/link";
import { FAST_MAX_MIN, SORT_LABELS, type ListingFilters, type PriceLevel, type SortKey } from "@/lib/listing";
const base = "flex min-h-10 shrink-0 items-center rounded-pill px-3.5 text-caption font-bold whitespace-nowrap";
const on = "bg-ink text-surface";
const off = "border border-border bg-surface text-ink";
const PRICES: PriceLevel[] = [1, 2, 3];
/** Filtros y orden como enlaces (el estado vive en la URL, así que funcionan sin JavaScript). `to` arma el enlace con un cambio. */
export function ListingFilterChips({ filters: f, to, row = false }: { filters: ListingFilters; to: (patch: Partial<ListingFilters>) => string; row?: boolean }) {
  const toggles = [
    { label: "Abiertos ahora", active: f.open, patch: { open: !f.open } },
    { label: "Envío gratis", active: f.free, patch: { free: !f.free } },
    { label: `Hasta ${FAST_MAX_MIN} min`, active: f.fast, patch: { fast: !f.fast } },
  ];
  const sorts = (Object.keys(SORT_LABELS) as SortKey[]).map((k) => ({ label: SORT_LABELS[k], active: f.sort === k, patch: { sort: f.sort === k ? null : k } }));
  const prices = PRICES.map((p) => ({ label: "$".repeat(p), name: `Precio ${"$".repeat(p)}`, active: f.price === p, patch: { price: f.price === p ? null : p } }));
  const chip = (c: { label: string; name?: string; active: boolean; patch: Partial<ListingFilters> }) => (
    <Link key={c.name ?? c.label} href={to(c.patch)} scroll={false} replace aria-pressed={c.active} aria-label={c.name} className={`${base} ${c.active ? on : off}`}>{c.label}</Link>
  );
  return (
    <div className={`scroll-x -mx-4 flex gap-2 px-4 desktop:mx-0 desktop:px-0 ${row ? "" : "desktop:flex-col desktop:overflow-visible"}`}>
      {toggles.map(chip)}
      <div role="group" aria-label="Precio" className="flex gap-2">{prices.map(chip)}</div>
      <div role="group" aria-label="Ordenar" className="flex gap-2">{sorts.map(chip)}</div>
    </div>
  );
}
