import type { CartStore } from "@/lib/cart/store";
import type { BrandColor } from "@/lib/demo/home";

/** Arma los datos de tienda que el carrito guarda (así las pantallas del cliente no dependen del catálogo). */
export function cartStoreOf(s: { slug: string; name: string; initials: string; color: BrandColor; feeCents: number; minOrderCents: number; open?: boolean; opensAt?: string | number | null }, kind: CartStore["kind"] = "restaurante"): CartStore {
  return { slug: s.slug, name: s.name, initials: s.initials, color: s.color, feeCents: s.feeCents, minOrderCents: s.minOrderCents, kind, open: s.open, opensAt: typeof s.opensAt === "string" ? s.opensAt : undefined };
}

export const storeHref = (s: Pick<CartStore, "slug" | "kind">) => (s.kind === "mercado" ? `/mercado/${s.slug}` : `/tienda/${s.slug}`);
