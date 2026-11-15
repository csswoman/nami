import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { StoreSwitcher } from "@/components/panel/StoreSwitcher";
import { listPanelStores } from "@/server/store-panel";
export const metadata: Metadata = {
  title: "Pantalla dividida · Ñami",
  description: "La app del cliente y el panel de tienda lado a lado: haz un pedido a la izquierda y atiéndelo a la derecha.",
  alternates: { canonical: "/demo" },
};
const DEFAULT_STORE = "arepera-dona-chela";
export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  await connection();
  const sp = await searchParams;
  const stores = await listPanelStores();
  const wanted = typeof sp.tienda === "string" ? sp.tienda : DEFAULT_STORE;
  const slug = stores.some((s) => s.slug === wanted) ? wanted : stores[0]?.slug ?? DEFAULT_STORE;
  const clientHref = stores.find((s) => s.slug === slug)?.kind === "mercado" ? `/mercado/${slug}` : `/tienda/${slug}`;
  const frame = "size-full rounded-lg border border-border bg-surface";
  return (
    <div className="flex h-dvh flex-col gap-3 bg-surface-tile p-3">
      <header className="flex flex-wrap items-center gap-3">
        <Link href="/" className="nm-btn nm-btn--secondary">Salir</Link>
        <h1 className="grow font-display text-title-md">Pantalla dividida</h1>
        <StoreSwitcher current={slug} stores={stores} base="/demo?tienda=" />
      </header>
      <p className="desktop:hidden rounded-lg bg-surface p-4 text-body">
        La pantalla dividida necesita una pantalla ancha. Desde aquí puedes abrir <Link href={clientHref} className="font-bold text-primary-text underline">la tienda como cliente</Link> y <Link href={`/tienda-admin/${slug}`} className="font-bold text-primary-text underline">su panel</Link> en dos pestañas.
      </p>
      <div className="hidden min-h-0 grow grid-cols-2 gap-3 desktop:grid">
        <section aria-label="Cliente" className="flex min-h-0 flex-col gap-1.5">
          <h2 className="text-caption font-bold text-ink-muted">Cliente: pide algo de esta tienda</h2>
          <iframe key={`c-${slug}`} title="App del cliente" src={clientHref} className={frame} />
        </section>
        <section aria-label="Tienda" className="flex min-h-0 flex-col gap-1.5">
          <h2 className="text-caption font-bold text-ink-muted">Tienda: atiende el pedido</h2>
          <iframe key={`t-${slug}`} title="Panel de tienda" src={`/tienda-admin/${slug}`} className={frame} />
        </section>
      </div>
    </div>
  );
}
