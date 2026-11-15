import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/nami";
import { AppShell } from "@/components/shell/AppShell";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { StoreMark } from "@/components/shell/StoreMark";
import { listPanelStores } from "@/server/store-panel";
export const metadata: Metadata = {
  title: "Panel de tienda · Ñami",
  description: "Elige una tienda de demo para atender sus pedidos, agotar productos y abrir o cerrar la tienda. Sin login.",
  alternates: { canonical: "/tienda-admin" },
};
export default async function TiendaAdminPage() {
  await connection();
  const stores = await listPanelStores();
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <ScreenBar title="Panel de tienda" back="/" />
      <div className="page-x flex flex-col gap-6 pt-2 desktop:pt-8">
        <header className="flex flex-col gap-2">
          <h1 className="hidden font-display text-[32px] leading-9 desktop:block">Panel de tienda</h1>
          <p className="text-body">Este es el lado de la tienda. No pide login: elige una tienda de demo y atiende sus pedidos como si fueras su dueño. Lo que hagas aquí lo ve el cliente al instante.</p>
          <p className="text-caption text-ink-muted">Tip: abre la app del cliente en otra pestaña, haz un pedido a esa tienda y míralo avanzar desde aquí.</p>
        </header>
        {([["Restaurantes", "restaurante"], ["Mercados, farmacias y tiendas", "mercado"]] as const).map(([title, kind]) => (
          <section key={kind} className="flex flex-col gap-3" aria-label={title}>
            <h2 className="font-display text-title-lg">{title}</h2>
            <div className="grid gap-3 desktop:grid-cols-3 desktop:gap-4">
              {stores.filter((s) => s.kind === kind).map((s) => (
                <Link key={s.slug} href={`/tienda-admin/${s.slug}`} className="flex min-h-22 items-center gap-3.5 rounded-lg border border-border p-4 text-ink">
                  <StoreMark initials={s.initials} color={s.color} slug={s.slug} />
                  <span className="flex grow flex-col gap-0.5">
                    <span className="text-body-strong font-bold">{s.name}</span>
                    <span className={`text-badge ${s.isOpen ? "text-success" : "text-ink-muted"}`}>{s.isOpen ? "Abierta" : "Cerrada"}</span>
                  </span>
                  <span className="text-ink-muted"><Icon name="chevronRight" /></span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
