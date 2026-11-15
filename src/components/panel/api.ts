type ApiFailure = { error?: { message?: string } };
/** Llama a la API del panel. Devuelve el error en español para mostrarlo, o null si salió bien (y el JSON). */
export async function callPanel<T = unknown>(url: string, method: "POST" | "PATCH" | "PUT", body?: unknown): Promise<{ error: string | null; data: T | null }> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (res.ok) return { error: null, data: (await res.json()) as T };
    return { error: ((await res.json()) as ApiFailure).error?.message ?? "No se pudo completar la acción.", data: null };
  } catch {
    return { error: "Sin conexión. Intenta de nuevo.", data: null };
  }
}
