"use client";
import { Icon } from "@/components/nami";
import { useProfileReady } from "@/lib/profile/hooks";
import { sameProduct, type FavoriteProduct } from "@/lib/profile/favorites";
import { useProfileStore } from "@/lib/profile/store";
type Target = { kind: "store"; slug: string } | { kind: "product"; product: FavoriteProduct };
/** Estrella de favoritos (se guarda en el navegador). `round` va sobre la imagen; `pill` lleva texto. */
export function FavoriteButton({ target, name, variant = "round" }: { target: Target; name: string; variant?: "round" | "pill" }) {
  const ready = useProfileReady();
  const on = useProfileStore((s) => ready && (target.kind === "store" ? s.stores.includes(target.slug) : s.products.some((p) => sameProduct(p, target.product))));
  const toggleStore = useProfileStore((s) => s.toggleStore);
  const toggleProduct = useProfileStore((s) => s.toggleProduct);
  const toggle = () => (target.kind === "store" ? toggleStore(target.slug) : toggleProduct(target.product));
  const label = on ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`;
  const star = <Icon name="star" className={on ? "fill-current" : ""} />;
  if (variant === "pill") {
    return (
      <button type="button" onClick={toggle} aria-pressed={on} aria-label={label} className={`nm-btn nm-btn--sm ${on ? "nm-btn--primary" : "nm-btn--secondary"}`}>
        {star}{on ? "En favoritos" : "Guardar en favoritos"}
      </button>
    );
  }
  return (
    <button type="button" onClick={toggle} aria-pressed={on} aria-label={label} className={`grid size-11 place-items-center rounded-pill bg-surface-raised shadow-card [&_.nm-icon]:size-5 ${on ? "text-primary-text" : "text-ink"}`}>
      {star}
    </button>
  );
}
