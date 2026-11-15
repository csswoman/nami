import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PanelError } from "./store-panel";
const headers = { "Cache-Control": "no-store" };
export const jsonOk = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
export const jsonError = (code: string, message: string, status: number) => NextResponse.json({ error: { code, message } }, { status, headers });
/** Traduce un error del panel a su respuesta HTTP; lo desconocido es un 500 sin detalles. */
export function panelFailure(e: unknown) {
  if (e instanceof PanelError) return jsonError(e.code, e.message, e.status);
  console.error("tienda-admin", e);
  return jsonError("INTERNAL", "No pudimos completar la acción. Intenta de nuevo.", 500);
}
/** Lee el cuerpo JSON y lo valida con Zod; si falla, devuelve la respuesta 400 lista para enviar. */
export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<{ data: z.infer<S>; error?: undefined } | { data?: undefined; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: jsonError("INVALID_INPUT", "El cuerpo debe ser JSON.", 400) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: jsonError("INVALID_INPUT", parsed.error.issues[0]?.message ?? z.prettifyError(parsed.error), 400) };
  return { data: parsed.data };
}
