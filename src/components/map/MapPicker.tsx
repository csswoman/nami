"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import type { LatLng } from "@/lib/geo";
/** Mapa de OpenStreetMap con tiles públicos (sin API key). */
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© Colaboradores de OpenStreetMap",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};
/** Ruta de una tienda hasta el pin (polilínea [lng, lat]) y el punto de la tienda. */
export type MapRoute = { id: string; name: string; geometry: [number, number][]; store: LatLng };
type Props = {
  value: LatLng;
  onChange: (p: LatLng) => void;
  routes?: MapRoute[];
  className?: string;
  label?: string;
};
const ROUTES_SOURCE = "routes";
const toGeoJson = (routes: MapRoute[]) => ({
  type: "FeatureCollection" as const,
  features: routes.map((r) => ({ type: "Feature" as const, properties: { id: r.id }, geometry: { type: "LineString" as const, coordinates: r.geometry } })),
});
const round5 = (n: number) => Math.round(n * 1e5) / 1e5;
/**
 * Mapa con un pin que se arrastra, o se mueve tocando el mapa. La posición manda desde afuera (`value`):
 * si cambia (por ejemplo al elegir una zona de la lista), el pin y la cámara la siguen.
 */
export function MapPicker({ value, onChange, routes = [], className, label = "Mapa para elegir tu dirección" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const syncFn = useRef<() => void>(() => {});
  const storeMarkers = useRef<Marker[]>([]);
  const latest = useRef({ value, onChange, routes });
  useEffect(() => {
    latest.current = { value, onChange, routes };
  });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { default: maplibregl } = await import("maplibre-gl");
      if (cancelled || !box.current) return;
      const syncRoutes = () => {
        const mm = map.current;
        if (!mm) return;
        const src = mm.getSource(ROUTES_SOURCE) as { setData: (d: unknown) => void } | undefined;
        src?.setData(toGeoJson(latest.current.routes));
        for (const old of storeMarkers.current) old.remove();
        storeMarkers.current = latest.current.routes.map((r) => {
          const el = document.createElement("div");
          el.className = "rounded-pill bg-ink px-2 py-1 text-badge font-bold text-surface shadow-card";
          el.textContent = r.name;
          return new maplibregl.Marker({ element: el }).setLngLat([r.store.lng, r.store.lat]).addTo(mm);
        });
      };
      syncFn.current = syncRoutes;
      const m = new maplibregl.Map({ container: box.current, style: OSM_STYLE, center: [latest.current.value.lng, latest.current.value.lat], zoom: 13.5, attributionControl: { compact: true } });
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      const pin = new maplibregl.Marker({ draggable: true, color: "#e11d48" }).setLngLat([latest.current.value.lng, latest.current.value.lat]).addTo(m);
      pin.on("dragend", () => {
        const { lat, lng } = pin.getLngLat();
        latest.current.onChange({ lat: round5(lat), lng: round5(lng) });
      });
      m.on("click", (e) => {
        pin.setLngLat(e.lngLat);
        latest.current.onChange({ lat: round5(e.lngLat.lat), lng: round5(e.lngLat.lng) });
      });
      m.on("load", () => {
        m.addSource(ROUTES_SOURCE, { type: "geojson", data: toGeoJson(latest.current.routes) });
        m.addLayer({ id: "routes-casing", type: "line", source: ROUTES_SOURCE, paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.9 }, layout: { "line-cap": "round", "line-join": "round" } });
        m.addLayer({ id: "routes-line", type: "line", source: ROUTES_SOURCE, paint: { "line-color": "#1d4ed8", "line-width": 4 }, layout: { "line-cap": "round", "line-join": "round" } });
        syncRoutes();
      });
      map.current = m;
      marker.current = pin;
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (map.current?.getSource(ROUTES_SOURCE)) syncFn.current();
  }, [routes]);
  useEffect(() => {
    const m = map.current;
    const pin = marker.current;
    if (!m || !pin) return;
    const cur = pin.getLngLat();
    if (Math.abs(cur.lat - value.lat) > 1e-6 || Math.abs(cur.lng - value.lng) > 1e-6) {
      pin.setLngLat([value.lng, value.lat]);
      m.easeTo({ center: [value.lng, value.lat], duration: 600 });
    }
  }, [value.lat, value.lng]);
  return <div ref={box} role="application" aria-label={label} className={className} data-testid="map-picker" />;
}
