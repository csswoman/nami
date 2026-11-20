"use client";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { DayHours } from "@/lib/catalog";
import type { StoreReview } from "@/server/reviews";
import type { InventoryItem, PanelData } from "@/server/store-panel";
import { DEMO_RESTORE_MINUTES } from "@/lib/demo/restore";
import { callPanel, notifyCatalogChanged } from "./api";
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
const isTab = (v: string): v is TabId => TABS.some((t) => t.id === v);
/**
 * Pestañas del panel. Todas se mantienen montadas para que la bandeja siga consultando (y la tienda siga al mando) en cualquier pestaña.
 * La pestaña activa va en el hash (#inventario…) para que sobreviva a una recarga y se pueda enlazar.
 */
export function PanelTabs({ slug, orders, inventory, schedule, reviews }: { slug: string; orders: PanelData; inventory: InventoryItem[]; schedule: DayHours[]; reviews: { items: StoreReview[]; count: number; sum: number } }) {
  const [tab, setTab] = useState<TabId>("pedidos");
  const [pending, setPending] = useState(orders.queue.length);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (isTab(h)) setTab(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);
  const select = useCallback((id: TabId, focus = false) => {
    setTab(id);
    window.history.replaceState(null, "", id === "pedidos" ? window.location.pathname + window.location.search : `#${id}`);
    if (focus) refs.current[id]?.focus();
  }, []);
  function onKeyDown(e: KeyboardEvent) {
    const i = TABS.findIndex((t) => t.id === tab);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(TABS[(next + TABS.length) % TABS.length].id, true);
  }
  async function reset() {
    if (!window.confirm("Se borran tus cambios de precios, stock, horario y estado, y la tienda vuelve a los datos de demo. ¿Seguir?")) return;
    setResetting(true);
    setError(null);
    const r = await callPanel(`/api/tienda-admin/${slug}/reset`, "POST");
    if (r.error) {
      setError(r.error);
      setResetting(false);
      return;
    }
    notifyCatalogChanged();
    window.location.reload();
  }
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Secciones del panel" className="nm-tabs" onKeyDown={onKeyDown}>
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => select(t.id)}
            className="nm-tab"
          >
            {t.label}
            {t.id === "pedidos" && pending ? (
              <span className="rounded-pill bg-primary px-2 text-badge text-on-primary">{pending}<span className="sr-only"> por atender</span></span>
            ) : null}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panel-pedidos" aria-labelledby="tab-pedidos" hidden={tab !== "pedidos"}><StorePanel slug={slug} initial={orders} onQueueChange={setPending} /></div>
      <div role="tabpanel" id="panel-inventario" aria-labelledby="tab-inventario" hidden={tab !== "inventario"}><InventoryPanel slug={slug} initial={inventory} /></div>
      <div role="tabpanel" id="panel-horario" aria-labelledby="tab-horario" hidden={tab !== "horario"}><SchedulePanel slug={slug} initial={schedule} /></div>
      <div role="tabpanel" id="panel-resenas" aria-labelledby="tab-resenas" hidden={tab !== "resenas"}><ReviewsPanel reviews={reviews.items} count={reviews.count} sum={reviews.sum} /></div>
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border p-4">
        <div className="grow">
          <p className="text-body-strong font-bold">Zona de demo</p>
          <p className="text-caption text-ink-muted">La demo es compartida: lo que cambies aquí lo ven los demás visitantes. Precios, stock, horario y estado vuelven solos a los datos de demo {DEMO_RESTORE_MINUTES} minutos después del primer cambio. Este botón lo hace ya.</p>
          {error ? <p role="alert" className="text-caption text-danger">{error}</p> : null}
        </div>
        <button type="button" disabled={resetting} onClick={() => void reset()} className="nm-btn nm-btn--secondary">{resetting ? "Reponiendo…" : "Reponer catálogo"}</button>
      </section>
    </div>
  );
}
