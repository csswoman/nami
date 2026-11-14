"use client";
import { useState } from "react";
import { Tabs } from "@/components/nami";
import { MarketProductCard } from "@/components/cart/MarketProductCard";
import type { CartStore } from "@/lib/cart/store";
import type { MarketProduct } from "@/lib/demo/mercado";

export type PromoGroup = { label: string; initials: string; color?: string; store: CartStore; products: MarketProduct[] };

/** Promociones del día: una pestaña por tienda, cada una con sus propios productos y su propio carrito. */
export function PromoTabs({ groups }: { groups: PromoGroup[] }) {
  const [i, setI] = useState(0);
  const g = groups[i];
  return (
    <>
      <Tabs className="scroll-x" items={groups.map(({ label, initials, color }) => ({ label, initials, color }))} onChange={setI} />
      <div className="scroll-x -mx-4 flex gap-4 px-4 pt-2 desktop:mx-0 desktop:grid desktop:grid-cols-5 desktop:gap-6 desktop:overflow-visible desktop:px-0">
        {g.products.map((p) => (
          <div key={`${g.store.slug}-${p.id}`} className="w-40 shrink-0 desktop:w-auto desktop:shrink">
            <MarketProductCard store={g.store} p={p} />
          </div>
        ))}
      </div>
    </>
  );
}
