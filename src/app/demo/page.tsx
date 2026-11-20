import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { SplitView } from "@/components/panel/SplitView";
import { StoreSwitcher } from "@/components/panel/StoreSwitcher";
import { clientHrefOf, panelHrefOf } from "@/lib/demo/split-view";
import { listPanelStores } from "@/server/store-panel";
export const metadata: Metadata = {
  title: "Pantalla dividida · Ñami",
  description: "La app del cliente y el panel de tienda lado a lado: haz un pedido a la izquierda y atiéndelo a la derecha.",
  alternates: { canonical: "/demo" },
};
const DEFAULT_STORE = "arepera-dona-chela";
const STEPS = ["Pide algo en la tienda", "Acéptalo y prepáralo en el panel", "Sigue al motorizado en la app"];
export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  await connection();
  const [sp, stores] = await Promise.all([searchParams, listPanelStores()]);
  const wanted = typeof sp.tienda === "string" ? sp.tienda : DEFAULT_STORE;
  const store = stores.find((s) => s.slug === wanted) ?? stores.find((s) => s.slug === DEFAULT_STORE) ?? stores[0];
  const slug = store?.slug ?? DEFAULT_STORE;
  const clientHref = clientHrefOf(slug, store?.kind);
  return (
    <div className="flex h-dvh flex-col gap-3 bg-surface-tile p-3">
      <header className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <Link href="/" className="nm-btn nm-btn--secondary">Salir</Link>
        <div className="flex grow flex-col gap-1">
          <h1 className="font-display text-title-md">Pantalla dividida</h1>
          <ol className="hidden flex-wrap gap-x-4 text-caption text-ink-muted desktop:flex">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-1.5">
                <span aria-hidden className="grid size-5 place-items-center rounded-pill bg-primary text-badge text-on-primary">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <StoreSwitcher current={slug} stores={stores} base="/demo?tienda=" />
      </header>
      <div className="flex flex-col gap-3 rounded-lg bg-surface p-4 text-body desktop:hidden">
        <p>La pantalla dividida necesita una pantalla ancha. Abre los dos lados en pestañas separadas:</p>
        <div className="flex flex-wrap gap-2">
          <Link href={clientHref} className="nm-btn nm-btn--primary">La tienda como cliente</Link>
          <Link href={panelHrefOf(slug)} className="nm-btn nm-btn--secondary">Su panel</Link>
        </div>
      </div>
      {/* key: al cambiar de tienda, los dos iframes vuelven a empezar juntos. */}
      <SplitView key={slug} clientHref={clientHref} panelHref={panelHrefOf(slug, true)} />
    </div>
  );
}
