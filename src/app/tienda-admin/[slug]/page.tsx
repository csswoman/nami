import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/shell/AppShell";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { PanelTabs } from "@/components/panel/PanelTabs";
import { StoreSwitcher } from "@/components/panel/StoreSwitcher";
import { listReviews, reviewStats, storeIdOf } from "@/server/reviews";
import { PanelError, getInventory, getPanel, getSchedule, listPanelStores } from "@/server/store-panel";
export const metadata: Metadata = { title: "Panel de tienda · Ñami", robots: { index: false } };
export default async function PanelPage({ params }: PageProps<"/tienda-admin/[slug]">) {
  await connection();
  const { slug } = await params;
  const [all, initial] = await Promise.all([
    listPanelStores(),
    getPanel(slug).catch((e) => {
      if (e instanceof PanelError && e.status === 404) return null;
      throw e;
    }),
  ]);
  if (!initial) notFound();
  const kind = all.find((s) => s.slug === slug)?.kind;
  const clientHref = kind === "mercado" ? `/mercado/${slug}` : `/tienda/${slug}`;
  const [inventory, schedule, storeId] = await Promise.all([getInventory(slug), getSchedule(slug), storeIdOf(slug)]);
  const [items, stats] = storeId ? await Promise.all([listReviews(storeId, 20), reviewStats([storeId])]) : [[], new Map()];
  const stat = (storeId && stats.get(storeId)) || { count: 0, sum: 0 };
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <ScreenBar title="Panel de tienda" back="/tienda-admin" />
      <div className="page-x flex flex-col gap-5 pt-2 desktop:pt-8">
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-primary-tint p-4">
          <div className="grow">
            <p className="text-caption text-ink-muted">Estás viendo como</p>
            <h1 className="font-display text-title-lg desktop:text-[28px]">{initial.store.name}</h1>
          </div>
          <StoreSwitcher current={slug} stores={all} />
          <Link href={clientHref} className="nm-btn nm-btn--secondary">Ver la tienda como cliente</Link>
        </div>
        <p className="text-caption text-ink-muted">
          Panel de demo, sin login. Para ver los dos lados a la vez abre la <Link href={`/demo?tienda=${slug}`} className="font-bold text-primary-text underline">pantalla dividida</Link> o <Link href="/" className="font-bold text-primary-text underline">vuelve a la app del cliente</Link>.
        </p>
        <PanelTabs slug={slug} orders={initial} inventory={inventory} schedule={schedule} reviews={{ items, count: stat.count, sum: stat.sum }} />
      </div>
    </AppShell>
  );
}
