import { NextResponse } from "next/server";
import { buildOpenApi } from "@/lib/openapi";

/** Especificación OpenAPI 3.1, generada de los esquemas Zod que validan cada ruta. */
export function GET() {
  return NextResponse.json(buildOpenApi(), { headers: { "Cache-Control": "public, max-age=300" } });
}
