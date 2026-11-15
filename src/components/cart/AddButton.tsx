"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/nami";
import { useCart } from "@/lib/cart/hooks";
import { groupOf, useCartStore, type CartStore } from "@/lib/cart/store";

type Item = { id: string; name: string; priceCents: number; icon: IconName; image?: string };

const base = "flex h-10 min-w-10 items-center justify-center gap-1 rounded-pill bg-primary px-2.5 text-button text-on-primary shadow-card [&_.nm-icon]:size-5";

/** Botón "+" de un producto. Con opciones lleva al detalle; si no, lo agrega directo al carrito. */
export function AddButton({ store, item, href, hasOptions, className = "" }: { store: CartStore; item: Item; href: string; hasOptions: boolean; className?: string }) {
  const { groups } = useCart();
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);
  const lines = (groupOf(groups, store.slug)?.lines ?? []).filter((l) => l.productId === item.id);
  const qty = lines.reduce((n, l) => n + l.qty, 0);
  const last = lines[lines.length - 1];
  const addOne = () => add(store, { productId: item.id, name: item.name, unitCents: item.priceCents, icon: item.icon, image: item.image });
  const content = <>{qty > 0 ? <span>{qty}</span> : null}<Icon name="plus" /></>;

  if (hasOptions) {
    return <Link href={href} aria-label={`Elegir opciones de ${item.name}`} className={`${base} ${className}`}>{content}</Link>;
  }
  if (qty > 0 && last) {
    return (
      <div className={`${base} gap-0 px-1 ${className}`}>
        <button type="button" aria-label={`Quitar una ${item.name}`} onClick={() => setQty(store.slug, last.key, last.qty - 1)} className="grid size-8 place-items-center">
          <svg className="nm-icon size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <span className="min-w-5 text-center" aria-live="polite">{qty}</span>
        <button type="button" aria-label={`Agregar otra ${item.name}`} onClick={addOne} className="grid size-8 place-items-center"><Icon name="plus" /></button>
      </div>
    );
  }
  return (
    <button type="button" aria-label={`Agregar ${item.name}`} onClick={addOne} className={`${base} ${className}`}>
      {content}
    </button>
  );
}
