"use client";
import { useState } from "react";
import { Tabs } from "@/components/nami";
import { MarketProductCard } from "@/components/cart/MarketProductCard";
import type { CartStore } from "@/lib/cart/store";
import type { MarketProduct } from "@/lib/demo/mercado";
import type { Currency } from "@/lib/money";

export type PromoGroup = { label: string; initials: string; color?: string; logo?: string; store: CartStore; products: MarketProduct[] };

/** Promociones del día: una pestaña por tienda, cada una con sus propios productos y su propio carrito. */
export function PromoTabs({ groups, money }: { groups: PromoGroup[]; money?: { currency: Currency; rate: number } }) {
  const [i, setI] = useState(0);
  const g = groups[i];
  return (
    <>
      <Tabs className="scroll-x" items={groups.map(({ label, initials, color, logo }) => ({ label, initials, color, logo }))} onChange={setI} />
      <div
        key={g.store.slug}
        className="scroll-x -mx-4 flex gap-4 px-4 pt-2 desktop:mx-0 desktop:grid desktop:grid-cols-5 desktop:gap-6 desktop:overflow-visible desktop:px-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        {g.products.map((p) => (
          <div key={`${g.store.slug}-${p.id}`} className="w-40 shrink-0 desktop:w-auto desktop:shrink transition-transform duration-200 hover:-translate-y-1">
            <MarketProductCard store={g.store} p={p} money={money} />
          </div>
        ))}
      </div>
    </>
  );
}
