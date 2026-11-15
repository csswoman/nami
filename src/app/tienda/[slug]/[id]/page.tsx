import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ProductoView } from "@/components/shell/ProductoView";
import { cartStoreOf } from "@/lib/cart/meta";
import { DEMO_RATE } from "@/lib/demo/home";
import { getProduct } from "@/server/catalog";

export const metadata = { title: "Producto · Ñami" };

export default function ProductoPage({ params }: PageProps<"/tienda/[slug]/[id]">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false} bottomNav={false}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/tienda/[slug]/[id]">["params"] }) {
  const { slug, id } = await params;
  const found = await getProduct(slug, id);
  if (!found || found.store.kind !== "restaurante" || found.product.soldOut) notFound();
  const { store, product: item, groups } = found;

  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <ProductoView
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
      />
    </AppShell>
  );
}
