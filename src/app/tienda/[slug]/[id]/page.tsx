import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ProductoView } from "@/components/shell/ProductoView";
import { cartStoreOf } from "@/lib/cart/meta";
import { getStore } from "@/lib/demo/catalog";
import { DEMO_RATE } from "@/lib/demo/home";
import { optionGroupsFor } from "@/lib/demo/producto";

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
  const store = getStore(slug);
  const section = store?.menu.find((s) => s.items.some((i) => i.id === id));
  const item = section?.items.find((i) => i.id === id);
  if (!store || !section || !item || item.soldOut) notFound();

  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <ProductoView
        store={cartStoreOf(store)}
        productId={item.id}
        name={item.name}
        desc={item.desc}
        icon={item.icon}
        priceCents={item.priceCents}
        rate={DEMO_RATE}
        storeName={store.name}
        storeArea="Chacao"
        backHref={`/tienda/${store.slug}`}
        groups={optionGroupsFor(section.id)}
      />
    </AppShell>
  );
}
