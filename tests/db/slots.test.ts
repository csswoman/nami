import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { newGuestToken } from "@/lib/guest";
import { orderInputSchema } from "@/lib/orders/input";
import { reachedStage } from "@/lib/orders/progress";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { OrderError, createOrder, getOrder, listSlots } from "@/server/orders";
import { resetStoreCatalog, setSchedule } from "@/server/store-panel";
afterAll(async () => {
  await resetStoreCatalog("arepera-dona-chela");
  await (db.$client as { end(): Promise<void> }).end();
});
const NOW = Date.UTC(2025, 0, 8, 14, 0); // miércoles 10:00 en Caracas
const caracas = (day: number, h: number, m = 0) => Date.UTC(2025, 0, day, h + 4, m);
const address = { name: "Altamira", line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B", reference: "Frente a la panadería" };
const AREPERA = "arepera-dona-chela";
const PUERTO = "empanadas-el-puerto";
const reina = { store: AREPERA, product: "reina", qty: 2 };
const carne = { store: PUERTO, product: "carne-mechada", qty: 2 };
const place = (items: { store: string; product: string; qty: number }[], scheduledFor?: number, token = newGuestToken()) =>
  createOrder(orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address, items, scheduledFor }), token, NOW);
const code = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof OrderError ? e.code : String(e)));

describe("programar con hora elegida", () => {
  it("lista franjas de hoy y mañana dentro del horario de la tienda", async () => {
    await setSchedule(AREPERA, [2, 3].map((day) => ({ day, opensAt: 6 * 60, closesAt: 15 * 60 })));
    const slots = await listSlots([AREPERA], NOW);
    expect(slots[0]).toMatchObject({ at: caracas(8, 10, 30), day: "Hoy", label: "10:30 a. m." });
    expect(slots.filter((s) => s.day === "Hoy").at(-1)!.label).toBe("2:30 p. m.");
    expect(slots.filter((s) => s.day === "Mañana")[0].label).toBe("6:00 a. m.");
    expect(slots.every((s) => s.at < caracas(10, 0))).toBe(true);
  });
  it("con varias tiendas solo ofrece lo que todas cubren", async () => {
    const both = await listSlots([AREPERA, PUERTO], NOW);
    const onlyOne = await listSlots([AREPERA], NOW);
    expect(both.length).toBeLessThanOrEqual(onlyOne.length);
    expect(both.every((b) => onlyOne.some((o) => o.at === b.at))).toBe(true);
  });
  it("una tienda que no existe es un error", async () => {
    expect(await code(listSlots(["no-existe"], NOW))).toBe("STORE_NOT_FOUND");
  });
  it("el pedido queda programado para la franja elegida", async () => {
    const at = caracas(9, 10);
    const o = await place([reina], at);
    expect(o.scheduledFor).toBe(at);
    expect(o.startAt).toBe(at);
    // Hasta la hora elegida el pedido no avanza.
    const before = (await getOrder(o.id, (await ownerOf(o.id)), NOW + 3 * 60_000))!;
    expect(reachedStage(before, NOW + 3 * 60_000)).toBe(0);
  });
  it("sin franja, un pedido a una tienda abierta empieza ya", async () => {
    const o = await place([reina]);
    expect(o.scheduledFor).toBeNull();
  });
  it("rechaza una franja con la tienda cerrada, fuera de la cuadrícula, pasada o muy lejana", async () => {
    expect(await code(place([reina], caracas(9, 20)))).toBe("SLOT_UNAVAILABLE"); // cierra a las 3 p. m.
    expect(await code(place([reina], caracas(9, 10, 15)))).toBe("SLOT_UNAVAILABLE");
    expect(await code(place([reina], caracas(8, 9)))).toBe("SLOT_UNAVAILABLE");
    expect(await code(place([reina], caracas(10, 10)))).toBe("SLOT_UNAVAILABLE"); // viernes: sin turnos
    expect(await code(place([reina], caracas(8, 10, 0)))).toBe("SLOT_UNAVAILABLE"); // en menos de 20 min
  });
  it("con varias tiendas, todas deben estar abiertas a esa hora", async () => {
    await setSchedule(PUERTO, [{ day: 3, opensAt: 12 * 60, closesAt: 18 * 60 }]);
    expect(await code(place([reina, carne], caracas(9, 10)))).toBe("SLOT_UNAVAILABLE");
    expect((await place([reina, carne], caracas(9, 13))).scheduledFor).toBe(caracas(9, 13));
    await resetStoreCatalog(PUERTO);
  });
});
async function ownerOf(orderId: string): Promise<string> {
  const [row] = await db.select({ t: orders.guestToken }).from(orders).where(eq(orders.id, orderId));
  return row.t;
}
