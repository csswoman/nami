import { PANEL_CHANGED_MESSAGE } from "@/lib/demo/split-view";
type ApiFailure = { error?: { message?: string } };
export type PanelResult<T> = { error: string | null; data: T | null };
/** Llama a la API del panel. Devuelve el error en español para mostrarlo, o null si salió bien (y el JSON). */
export async function callPanel<T = unknown>(url: string, method: "GET" | "POST" | "PATCH" | "PUT" = "GET", body?: unknown): Promise<PanelResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      cache: "no-store",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (res.ok) return { error: null, data: json as T };
    return { error: (json as ApiFailure | null)?.error?.message ?? "No se pudo completar la acción.", data: null };
  } catch {
    return { error: "Sin conexión. Intenta de nuevo.", data: null };
  }
}

/** Avisa a la pantalla dividida (si el panel está dentro de ella) que el cliente debería recargar para ver el cambio. */
export function notifyCatalogChanged() {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage({ type: PANEL_CHANGED_MESSAGE }, window.location.origin);
}
