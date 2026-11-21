"use client";

import { Badge, ProductCard } from "@/components/nami";
import { useCart } from "@/lib/cart/hooks";
import { groupOf, useCartStore, type CartStore } from "@/lib/cart/store";
import { DEMO_RATE } from "@/lib/demo/home";
import type { MarketProduct } from "@/lib/demo/mercado";
import { formatMoney, type Currency } from "@/lib/money";

/** Producto de súper o farmacia: el "+" lo agrega al carrito y muestra cuántos llevas. */
export function MarketProductCard({ store, p, money = { currency: "USD", rate: DEMO_RATE } }: { store: CartStore; p: MarketProduct; money?: { currency: Currency; rate: number } }) {
  const other: Currency = money.currency === "USD" ? "VES" : "USD";
  const { groups } = useCart();
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);
  const last = (groupOf(groups, store.slug)?.lines ?? []).filter((l) => l.productId === p.id).at(-1);
  const qty = (groupOf(groups, store.slug)?.lines ?? []).filter((l) => l.productId === p.id).reduce((n, l) => n + l.qty, 0);
  const out = Boolean(p.soldOut);
  const maxed = p.stock != null && qty >= p.stock;

  return (
    <div className={`flex min-w-0 flex-col gap-1 ${out ? "opacity-55" : ""}`}>
      <ProductCard
        className="w-full"
        name={p.name}
        price={formatMoney(p.priceCents, money.currency, money.rate)}
        oldPrice={p.oldPriceCents ? formatMoney(p.oldPriceCents, money.currency, money.rate) : undefined}
        badges={p.oldPriceCents ? <Badge tone="brand">Oferta</Badge> : undefined}
        unit={`${p.unit} · ${formatMoney(p.priceCents, other, money.rate)}`}
        image={p.image}
        onAdd={out || maxed ? undefined : () => add(store, { productId: p.id, name: p.name, unitCents: p.priceCents, icon: "basket", image: p.image, stock: p.stock })}
      />
      {p.stock && !out ?<span className="text-badge text-primary-text">Quedan {p.stock}</span> : null}
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
