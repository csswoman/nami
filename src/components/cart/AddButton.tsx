"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/nami";
import { useCart } from "@/lib/cart/hooks";
import { useCartStore, type CartStore } from "@/lib/cart/store";

type Item = { id: string; name: string; priceCents: number; icon: IconName };

const base = "flex h-10 min-w-10 items-center justify-center gap-1 rounded-pill bg-primary px-2.5 text-button text-on-primary shadow-card [&_.nm-icon]:size-5";

/** Botón "+" de un producto. Con opciones lleva al detalle; si no, lo agrega directo al carrito. */
export function AddButton({ store, item, href, hasOptions, className = "" }: { store: CartStore; item: Item; href: string; hasOptions: boolean; className?: string }) {
  const { store: cur, lines } = useCart();
  const add = useCartStore((s) => s.add);
  const qty = cur?.slug === store.slug ? lines.filter((l) => l.productId === item.id).reduce((n, l) => n + l.qty, 0) : 0;
  const content = <>{qty > 0 ? <span>{qty}</span> : null}<Icon name="plus" /></>;

  if (hasOptions) {
    return <Link href={href} aria-label={`Elegir opciones de ${item.name}`} className={`${base} ${className}`}>{content}</Link>;
  }
  return (
    <button type="button" aria-label={`Agregar ${item.name}`} onClick={() => add(store, { productId: item.id, name: item.name, unitCents: item.priceCents, icon: item.icon })} className={`${base} ${className}`}>
      {content}
    </button>
  );
}
