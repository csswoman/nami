"use client";

import { ProductCard } from "@/components/nami";
import { useCart } from "@/lib/cart/hooks";
import { groupOf, useCartStore, type CartStore } from "@/lib/cart/store";
import { DEMO_RATE } from "@/lib/demo/home";
import type { MarketProduct } from "@/lib/demo/mercado";
import { formatUsd, formatVes } from "@/lib/money";

/** Producto de súper o farmacia: el "+" lo agrega al carrito y muestra cuántos llevas. */
export function MarketProductCard({ store, p }: { store: CartStore; p: MarketProduct }) {
  const { groups } = useCart();
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);
  const last = (groupOf(groups, store.slug)?.lines ?? []).filter((l) => l.productId === p.id).at(-1);
  const qty = (groupOf(groups, store.slug)?.lines ?? []).filter((l) => l.productId === p.id).reduce((n, l) => n + l.qty, 0);
  const out = Boolean(p.soldOut);

  return (
    <div className={`flex min-w-0 flex-col gap-1 ${out ? "opacity-55" : ""}`}>
      <ProductCard
        className="w-full"
        name={p.name}
        price={formatUsd(p.priceCents)}
        oldPrice={p.oldPriceCents ? formatUsd(p.oldPriceCents) : undefined}
        unit={`${p.unit} · ${formatVes(p.priceCents, DEMO_RATE)}`}
        image={p.image}
        onAdd={out ? undefined : () => add(store, { productId: p.id, name: p.name, unitCents: p.priceCents, icon: "basket" })}
      />
      {p.stock ? <span className="text-badge text-primary-text">Quedan {p.stock}</span> : null}
      {qty && last ? (
        <span className="flex items-center gap-2 text-badge text-success">
          {qty} en tu carrito
          <button type="button" onClick={() => setQty(store.slug, last.key, last.qty - 1)} aria-label={`Quitar una ${p.name}`} className="rounded-pill border border-border px-2 py-0.5 font-bold text-ink">Quitar uno</button>
        </span>
      ) : null}
      {p.soldOut ? <span className="text-badge font-bold text-ink">{p.soldOut}</span> : null}
    </div>
  );
}
