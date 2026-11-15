import { Icon, type IconName } from "@/components/nami";
import { StoreMark } from "@/components/shell/StoreMark";
import type { CartStore } from "@/lib/cart/store";
import type { BrandColor } from "@/lib/demo/home";

/** Iniciales de una o varias tiendas, encimadas cuando el pedido pasa por más de una. */
export function StoreStack({ stores, size = 52 }: { stores: Pick<CartStore, "slug" | "initials" | "color">[]; size?: number }) {
  if (stores.length === 1) return <StoreMark initials={stores[0].initials} color={stores[0].color} size={size} />;
  const small = Math.round(size * 0.62);
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <span className="absolute top-0 left-0"><StoreMark initials={stores[0].initials} color={stores[0].color} size={small} /></span>
      <span className="absolute right-0 bottom-0 rounded-md ring-2 ring-surface"><StoreMark initials={stores[1].initials} color={stores[1].color} size={small} /></span>
    </span>
  );
}

/** Tono suave del color de la tienda para fondos de productos. */
export const tint = (color: BrandColor, pct = 13) => `color-mix(in oklab, var(--${color}) ${pct}%, var(--surface))`;

type Thumb = { key: string; icon: IconName; qty: number; name: string; color: BrandColor };

/** Fila de productos con su icono y cantidad; si no caben, el último cuadro dice cuántos faltan. */
export function ProductStrip({ items, max = 5, size = 48 }: { items: Thumb[]; max?: number; size?: number }) {
  const shown = items.length > max ? items.slice(0, max - 1) : items;
  const rest = items.length - shown.length;
  return (
    <ul className="flex gap-1.5" aria-label="Productos del pedido">
      {shown.map((t) => (
        <li key={t.key} title={`${t.qty}× ${t.name}`} className="relative grid shrink-0 place-items-center rounded-md" style={{ width: size, height: size, background: tint(t.color), color: `var(--${t.color})` }}>
          <Icon name={t.icon} className="size-6" />
          <span className="sr-only">{t.qty}× {t.name}</span>
          {t.qty > 1 ? <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-5 rounded-pill bg-ink px-1 text-center text-[11px] leading-5 font-bold text-surface">{t.qty}</span> : null}
        </li>
      ))}
      {rest > 0 ? (
        <li className="grid shrink-0 place-items-center rounded-md bg-surface-tile text-caption font-bold text-ink-muted" style={{ width: size, height: size }}>
          +{rest}<span className="sr-only"> productos más</span>
        </li>
      ) : null}
    </ul>
  );
}

const STATUS = {
  delivered: { label: "Entregado", icon: "check", cls: "bg-success-tint text-success" },
  cancelled: { label: "Cancelado", icon: "close", cls: "bg-surface-tile text-ink-muted" },
} as const;

/** Pastilla de estado del pedido. */
export function StatusPill({ status }: { status: keyof typeof STATUS }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-badge ${s.cls}`}>
      {s.icon === "check"
        ? <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current stroke-3" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        : <Icon name="close" className="size-3.5" />}
      {s.label}
    </span>
  );
}

/** Icono del tipo de tienda: comida, súper o farmacia. */
export const kindIcon = (store: Pick<CartStore, "kind">, kindLabel: string): IconName =>
  store.kind === "restaurante" ? "utensils" : kindLabel === "Farmacia" ? "pill" : "basket";
