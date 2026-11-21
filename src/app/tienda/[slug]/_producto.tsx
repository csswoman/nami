import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ProductoView } from "@/components/shell/ProductoView";
import { cartStoreOf } from "@/lib/cart/meta";
import { DEMO_RATE } from "@/lib/demo/home";
import { getDeliveryContext } from "@/server/prefs";
import { getProduct } from "@/server/catalog";

/**
 * Detalle de producto, compartido por la página completa (`[id]/page.tsx`, entrada directa por URL)
 * y por el modal interceptado (`@modal/(.)[id]/page.tsx`, al tocar un producto dentro de la tienda).
 */
export async function ProductoContent({ params, modal = false }: { params: Promise<{ slug: string; id: string }>; modal?: boolean }) {
  const { slug, id } = await params;
  const found = await getProduct(slug, id, await getDeliveryContext());
  if (!found || found.store.kind !== "restaurante" || found.product.soldOut) notFound();
  const { store, product: item, groups } = found;

  const view = (
    <ProductoView
      modal={modal}
      store={cartStoreOf({ slug: store.slug, name: store.name, initials: store.initials, color: store.color, feeCents: store.feeCents, minOrderCents: store.minOrderCents })}
      productId={item.id}
      name={item.name}
      desc={item.description}
      icon={item.icon ?? "utensils"}
      image={item.image ?? undefined}
      priceCents={item.priceCents}
      rate={DEMO_RATE}
      storeName={store.name}
      storeArea={store.area ?? ""}
      backHref={`/tienda/${store.slug}`}
      groups={groups}
      stock={item.stock ?? undefined}
    />
  );
  // En el modal la tienda ya está detrás: no se repite el shell.
  return modal ? view : <AppShell mobileHeader={false} bottomNav={false}>{view}</AppShell>;
}
