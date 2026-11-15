"use client";
import { useState } from "react";
import type { DayHours } from "@/lib/catalog";
import type { StoreReview } from "@/server/reviews";
import type { InventoryItem, PanelData } from "@/server/store-panel";
import { callPanel } from "./api";
import { InventoryPanel } from "./InventoryPanel";
import { SchedulePanel } from "./SchedulePanel";
import { ReviewsPanel } from "./ReviewsPanel";
import { StorePanel } from "./StorePanel";
const TABS = [
  { id: "pedidos", label: "Pedidos" },
  { id: "inventario", label: "Inventario" },
  { id: "horario", label: "Horario" },
  { id: "resenas", label: "Reseñas" },
] as const;
type TabId = (typeof TABS)[number]["id"];
/** Pestañas del panel. Las tres se mantienen montadas para que la bandeja siga consultando (y la tienda siga al mando) en cualquier pestaña. */
export function PanelTabs({ slug, orders, inventory, schedule, reviews }: { slug: string; orders: PanelData; inventory: InventoryItem[]; schedule: DayHours[]; reviews: { items: StoreReview[]; count: number; sum: number } }) {
  const [tab, setTab] = useState<TabId>("pedidos");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function reset() {
    if (!window.confirm("Se borran tus cambios de precios, stock, horario y estado, y la tienda vuelve a los datos de demo. ¿Seguir?")) return;
    setResetting(true);
    const r = await callPanel(`/api/tienda-admin/${slug}/reset`, "POST");
    if (r.error) {
      setError(r.error);
      setResetting(false);
      return;
    }
    window.location.reload();
  }
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Secciones del panel" className="nm-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} onClick={() => setTab(t.id)} className="nm-tab">{t.label}</button>
        ))}
      </div>
      <div role="tabpanel" id="panel-pedidos" aria-labelledby="tab-pedidos" hidden={tab !== "pedidos"}><StorePanel slug={slug} initial={orders} /></div>
      <div role="tabpanel" id="panel-inventario" aria-labelledby="tab-inventario" hidden={tab !== "inventario"}><InventoryPanel slug={slug} initial={inventory} /></div>
      <div role="tabpanel" id="panel-horario" aria-labelledby="tab-horario" hidden={tab !== "horario"}><SchedulePanel slug={slug} initial={schedule} /></div>
      <div role="tabpanel" id="panel-resenas" aria-labelledby="tab-resenas" hidden={tab !== "resenas"}><ReviewsPanel reviews={reviews.items} count={reviews.count} sum={reviews.sum} /></div>
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border p-4">
        <div className="grow">
          <p className="text-body-strong font-bold">Zona de demo</p>
          <p className="text-caption text-ink-muted">Cualquier visitante puede cambiar precios y horarios. Este botón deja la tienda como en el seed.</p>
          {error ? <p role="alert" className="text-caption text-danger">{error}</p> : null}
        </div>
        <button type="button" disabled={resetting} onClick={reset} className="nm-btn nm-btn--secondary">Reponer catálogo</button>
      </section>
    </div>
  );
}
