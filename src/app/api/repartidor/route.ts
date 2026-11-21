import { currentGuestToken } from "@/server/guest";
import { jsonOk, panelFailure } from "@/server/panel-http";
import { getRiderBoard } from "@/server/rider";
/** Tablero del repartidor (la app lo consulta cada pocos segundos; eso lo mantiene conectado). */
export async function GET() {
  try {
    return jsonOk(await getRiderBoard(await currentGuestToken()));
  } catch (e) {
    return panelFailure(e);
  }
}
