"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deliveryFor, routesFor, type DeliveryInfo } from "@/app/direccion/actions";
import { MapPicker, type MapRoute } from "@/components/map/MapPicker";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { useCartStore } from "@/lib/cart/store";
import { useProfileReady } from "@/lib/profile/hooks";
import { useProfileStore } from "@/lib/profile/store";
import { DEFAULT_LOCATION, LOCATION_COOKIE, nearestZone, zoneBySlug, type LatLng } from "@/lib/geo";
export type Spot = { id: string; short: string; name: string; addr: string; ref: string; zone: string };
const fmt = (p: LatLng) => `${p.lat.toFixed(5)}:${p.lng.toFixed(5)}`;
const posOf = (zone: string): LatLng => ({ lat: zoneBySlug(zone)!.lat, lng: zoneBySlug(zone)!.lng });
/**
 * Elegir dirección: un pin en el mapa de OpenStreetMap (se arrastra o se toca el mapa) o una de las zonas de prueba.
 * El punto decide qué tiendas llegan y cuánto cuesta el envío; todo eso lo calcula el servidor.
 */
export function DireccionView({ spots, initial, next }: { spots: readonly Spot[]; initial: string; next: string }) {
  const router = useRouter();
  const saved = useCartStore((st) => st.address);
  const setAddress = useCartStore((st) => st.setAddress);
  const groups = useCartStore((st) => st.groups);
  const setStoreFees = useCartStore((st) => st.setStoreFees);
  const start = saved.lat !== undefined && saved.lng !== undefined ? { lat: saved.lat, lng: saved.lng } : (spots.find((s) => s.id === initial) ? posOf(spots.find((s) => s.id === initial)!.zone) : DEFAULT_LOCATION);
  const [pin, setPin] = useState<LatLng>(start);
  const [sel, setSel] = useState<string | null>(spots.find((s) => s.id === initial)?.id ?? null);
  const [line, setLine] = useState(saved.line);
  const [name, setName] = useState(saved.name);
  const [ref, setRef] = useState(saved.reference);
  const [info, setInfo] = useState<DeliveryInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [keep, setKeep] = useState(false);
  const profileReady = useProfileReady();
  const savedAddresses = useProfileStore((st) => (profileReady ? st.addresses : []));
  const saveAddress = useProfileStore((st) => st.saveAddress);
  const [routes, setRoutes] = useState<MapRoute[]>([]);
  const slugs = groups.map((g) => g.store.slug).join(",");
  const zone = nearestZone(pin);
  // Qué tiendas llegan desde este punto (lo calcula el servidor con las rutas guardadas).
  useEffect(() => {
    let cancelled = false;
    deliveryFor(pin.lat, pin.lng, slugs ? slugs.split(",") : []).then((r) => !cancelled && setInfo(r)).catch(() => !cancelled && setInfo(null));
    return () => {
      cancelled = true;
    };
  }, [pin.lat, pin.lng, slugs]);
  // Las rutas por calle (guardadas en el seed) de las tiendas del carrito hasta el pin.
  useEffect(() => {
    if (!slugs) return;
    let cancelled = false;
    routesFor(pin.lat, pin.lng, slugs.split(","))
      .then((r) => !cancelled && setRoutes(r.map((x) => ({ id: x.slug, name: x.name, geometry: x.geometry, store: x.store }))))
      .catch(() => !cancelled && setRoutes([]));
    return () => {
      cancelled = true;
    };
  }, [pin.lat, pin.lng, slugs]);
  const pickSpot = (s: Spot) => {
    setSel(s.id);
    setPin(posOf(s.zone));
    setLine(`${s.addr}, ${s.short}`);
    setName(s.name);
    setRef(s.ref);
  };
  const pickSaved = (a: { name: string; line: string; reference: string; lat: number; lng: number }) => {
    setSel(null);
    setPin({ lat: a.lat, lng: a.lng });
    setName(a.name);
    setLine(a.line);
    setRef(a.reference);
  };
  const onMap = (p: LatLng) => {
    setPin(p);
    setSel(null);
    const z = nearestZone(p);
    setName(z ? z.zone.name : "Ubicación en el mapa");
    setLine((cur) => (spots.some((s) => `${s.addr}, ${s.short}` === cur) || cur === saved.line ? (z ? `Punto marcado en el mapa, ${z.zone.name}` : "Punto marcado en el mapa") : cur));
  };
  async function confirm() {
    setBusy(true);
    const chosen = { name: name || "Mi ubicación", line: line.trim() || "Punto marcado en el mapa", reference: ref.trim(), lat: pin.lat, lng: pin.lng };
    setAddress(chosen);
    if (keep) saveAddress(chosen);
    document.cookie = `${LOCATION_COOKIE}=${fmt(pin)}; path=/; max-age=31536000; samesite=lax`;
    // El carrito guarda el envío de cada tienda: se pone al día con las rutas de la nueva dirección.
    if (info?.stores.length) setStoreFees(Object.fromEntries(info.stores.map((s) => [s.slug, s.feeCents])));
    router.push(next);
    router.refresh();
  }
  const outOfCart = info?.stores.filter((s) => !s.covered) ?? [];
  const summary = (
    <div role="status" aria-live="polite" className="flex flex-col gap-1 rounded-lg bg-surface-tile p-3.5 text-caption" data-testid="coverage-summary">
      <b className="text-body-strong">{zone ? `Zona: ${zone.zone.name}` : "Esta ubicación está fuera de nuestras zonas"}</b>
      {info ? (
        <span className="text-ink-muted">
          {zone ? `${info.reachable} de ${info.total} tiendas llegan hasta aquí.` : "Mueve el pin hacia Caracas para ver qué tiendas llegan."}
          {outOfCart.length ? ` No llegan: ${outOfCart.map((s) => groups.find((g) => g.store.slug === s.slug)?.store.name ?? s.slug).join(", ")}.` : ""}
        </span>
      ) : <span className="text-ink-muted">Calculando…</span>}
    </div>
  );
  const map = <MapPicker value={pin} onChange={onMap} routes={slugs ? routes : []} className="aspect-4/3 w-full overflow-hidden rounded-xl border border-border bg-map-ground desktop:aspect-auto desktop:h-140 desktop:rounded-3xl" />;
  const cards = spots.map((s) => {
    const on = s.id === sel;
    return (
      <button key={s.id} type="button" aria-pressed={on} onClick={() => pickSpot(s)} className={`flex min-h-16 items-center gap-3 rounded-lg px-3.5 py-3 text-left ${on ? "border-2 border-primary bg-primary-tint" : "border border-border bg-surface"}`}>
        <span className={`box-border size-5 shrink-0 rounded-pill ${on ? "border-[6px] border-primary bg-surface" : "border-2 border-border"}`} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body-strong font-bold text-ink">{s.name}</span>
          <span className="text-caption font-medium text-ink-muted">{s.addr}</span>
        </span>
      </button>
    );
  });
  const fields = (suffix: string) => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`line-${suffix}`} className="text-body-strong font-bold">Dirección</label>
        <input id={`line-${suffix}`} value={line} onChange={(e) => setLine(e.target.value)} maxLength={200} className="min-h-12 rounded-lg border border-border bg-surface px-4 text-body text-ink" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`ref-${suffix}`} className="text-body-strong font-bold">Punto de referencia</label>
        <input id={`ref-${suffix}`} value={ref} onChange={(e) => setRef(e.target.value)} maxLength={200} className="min-h-12 rounded-lg border border-border bg-surface px-4 text-body text-ink" />
        <span className="text-caption font-medium text-ink-muted desktop:hidden">Ayuda al motorizado a encontrarte rápido.</span>
      </div>
    </div>
  );
  const cta = <button type="button" onClick={() => void confirm()} disabled={busy || !zone} className="nm-btn nm-btn--primary nm-btn--block">Confirmar dirección</button>;
  // Un solo árbol (y un solo mapa) para móvil y escritorio: en escritorio, mapa a la izquierda y datos a la derecha.
  return (
    <>
      <ScreenBar title="Elige tu dirección" back="/checkout" />
      <div className="mx-auto w-full max-w-300 desktop:grid desktop:grid-cols-[minmax(0,720px)_minmax(0,1fr)] desktop:items-start desktop:gap-10 desktop:py-8">
        <div className="px-4 desktop:px-0">{map}</div>
        <div className="flex flex-col gap-4 px-4 pt-4 pb-28 desktop:px-0 desktop:pt-0 desktop:pb-0">
          <div className="hidden flex-col gap-1.5 desktop:flex">
            <h1 className="font-display text-[32px] leading-9.5 font-extrabold">¿A dónde llevamos tu pedido?</h1>
            <p className="text-body text-ink-muted">Mueve el pin o toca el mapa. El envío depende de la distancia por calle desde cada tienda.</p>
          </div>
          <p className="text-center text-body text-ink-muted desktop:hidden">Mueve el pin o toca el mapa. También puedes elegir una zona de prueba.</p>
          {summary}
          {savedAddresses.length ? (
            <section aria-label="Mis direcciones" className="flex flex-col gap-2.5">
              <h2 className="font-display text-title-md">Mis direcciones</h2>
              <div className="grid gap-2.5">
                {savedAddresses.map((a) => (
                  <button key={a.id} type="button" onClick={() => pickSaved(a)} className="flex min-h-14 flex-col gap-0.5 rounded-lg border border-border bg-surface px-3.5 py-3 text-left">
                    <span className="text-body-strong font-bold text-ink">{a.name}</span>
                    <span className="text-caption font-medium text-ink-muted">{a.line}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          <h2 className="font-display text-title-md">Zonas de prueba</h2>
          <div className="grid gap-2.5">{cards}</div>
          {fields("direccion")}
          <label className="flex min-h-11 items-center gap-3 text-body">
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="size-5 accent-primary" />
            Guardar esta dirección en mi perfil
          </label>
          <div className="fixed inset-x-0 bottom-0 z-20 bg-surface-raised p-4 shadow-nav desktop:static desktop:bg-transparent desktop:p-0 desktop:shadow-none">{cta}</div>
        </div>
      </div>
    </>
  );
}
