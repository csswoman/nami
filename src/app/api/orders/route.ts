import { NextResponse } from "next/server";
import { placeFromUnknown } from "@/server/order-api";

/** Crea un pedido para el invitado de la cookie. Misma lógica que la Server Action `placeOrder`. */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "El cuerpo debe ser JSON." } }, { status: 400 });
  }
  const { status, body } = await placeFromUnknown(raw);
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
