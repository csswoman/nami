import type { IconName } from "@/components/nami";
import { getStore } from "@/lib/demo/catalog";
import { MARKETS } from "@/lib/demo/mercado";

const DISH_ICON_FALLBACK: Record<string, string> = {
  arepa: "/brand/food/arepa.jpg",
  empanada: "/brand/food/empanada.jpg",
  cachapa: "/brand/food/cachapa-queso.jpg",
  pabellon: "/brand/food/pabellon.jpg",
  tequeno: "/brand/food/tequeno.jpg",
  golfeado: "/brand/food/golfeado.jpg",
  hamburguesa: "/brand/food/hamburguesa.jpg",
  "perro-caliente": "/brand/food/perro-caliente.jpg",
  perro: "/brand/food/perro-caliente.jpg",
  pepito: "/brand/food/pepito.jpg",
  cafe: "/brand/food/cafe-con-leche.jpg",
  malta: "/brand/products/malta-6.jpg",
  chicha: "/brand/food/chicha-vaso.jpg",
  papelon: "/brand/food/papelon-vaso.jpg",
  "pan-de-jamon": "/brand/food/pan-de-jamon.jpg",
  tajadas: "/brand/food/tajadas.jpg",
  hallaca: "/brand/food/hallaca.jpg",
  mandocas: "/brand/food/mandocas.jpg",
  patacones: "/brand/food/patacon.jpg",
  patacon: "/brand/food/patacon.jpg",
  parrilla: "/brand/food/parrilla-mixta.jpg",
};

export function getProductImage(productId: string, storeSlug?: string): string | undefined {
  if (storeSlug) {
    const rest = getStore(storeSlug);
    if (rest) {
      const it = rest.menu.flatMap((s) => s.items).find((i) => i.id === productId);
      if (it?.image) return it.image;
    }
    const mk = MARKETS[storeSlug];
    if (mk) {
      const p = mk.sections.flatMap((s) => s.products).find((i) => i.id === productId);
      if (p?.image) return p.image;
    }
  }
  for (const slug in MARKETS) {
    const p = MARKETS[slug].sections.flatMap((s) => s.products).find((i) => i.id === productId);
    if (p?.image) return p.image;
  }
  return undefined;
}

export function getLineImage(
  line: { image?: string; productId: string; icon?: IconName },
  storeSlug?: string
): string | undefined {
  if (line.image) return line.image;
  const found = getProductImage(line.productId, storeSlug);
  if (found) return found;
  if (line.icon && DISH_ICON_FALLBACK[line.icon]) {
    return DISH_ICON_FALLBACK[line.icon];
  }
  return undefined;
}
