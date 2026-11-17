import "server-only";

/** Cabecera con el id de la petición. La pone src/proxy.ts (o Vercel, con x-vercel-id). */
export const REQUEST_ID_HEADER = "x-request-id";

async function currentRequestId(): Promise<string | undefined> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return h.get(REQUEST_ID_HEADER) ?? h.get("x-vercel-id") ?? undefined;
  } catch {
    // Fuera de una petición (scripts, pruebas): no hay id.
    return undefined;
  }
}

/**
 * Error en una línea de JSON (Vercel y cualquier colector de logs lo pueden filtrar por `scope` o `requestId`).
 * Nunca incluye datos del cliente: solo el contexto que pase quien llama.
 */
export async function logError(scope: string, error: unknown, context: Record<string, unknown> = {}): Promise<void> {
  const err = error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : { message: String(error) };
  console.error(JSON.stringify({ level: "error", time: new Date().toISOString(), scope, requestId: await currentRequestId(), ...context, error: err }));
}
