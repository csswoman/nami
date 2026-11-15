import { describe, expect, it } from "vitest";
import type { DayHours } from "@/lib/catalog";
import { availableSlots, slotHorizon, validateSlot } from "./slots";

const week = (opensAt: number, closesAt: number): { schedule: DayHours[] } => ({ schedule: Array.from({ length: 7 }, (_, day) => ({ day, opensAt, closesAt })) });
const H = (n: number, m = 0) => n * 60 + m;
// Miércoles 2025-01-08 10:00 en Caracas = 14:00 UTC.
const NOW = Date.UTC(2025, 0, 8, 14, 0);
const caracas = (day: number, h: number, m = 0) => Date.UTC(2025, 0, day, h + 4, m);
describe("availableSlots", () => {
  it("empieza 30 minutos adelante, en punto o y media, y llega hasta el fin de mañana", () => {
    const s = availableSlots([week(0, 1440)], NOW);
    expect(s[0].at).toBe(caracas(8, 10, 30));
    expect(s[0]).toMatchObject({ day: "Hoy", label: "10:30 a. m." });
    expect(s.at(-1)!.at).toBe(caracas(9, 23, 30));
    expect(s.at(-1)).toMatchObject({ day: "Mañana", label: "11:30 p. m." });
  });
  it("redondea hacia arriba cuando el reloj no está en la cuadrícula", () => {
    expect(availableSlots([week(0, 1440)], NOW + 7 * 60_000)[0].at).toBe(caracas(8, 11, 0));
  });
  it("solo ofrece lo que cae dentro del horario de la tienda", () => {
    const s = availableSlots([week(H(8), H(12))], NOW);
    expect(s.map((x) => x.label)).toEqual(["10:30 a. m.", "11:00 a. m.", "11:30 a. m.", "8:00 a. m.", "8:30 a. m.", "9:00 a. m.", "9:30 a. m.", "10:00 a. m.", "10:30 a. m.", "11:00 a. m.", "11:30 a. m."]);
    expect(s.filter((x) => x.day === "Mañana")).toHaveLength(8);
  });
  it("con varias tiendas, solo las horas en que todas están abiertas", () => {
    const s = availableSlots([week(H(8), H(12)), week(H(11), H(18))], NOW);
    expect(s.filter((x) => x.day === "Hoy").map((x) => x.label)).toEqual(["11:00 a. m.", "11:30 a. m."]);
  });
  it("incluye el turno que pasa de medianoche", () => {
    const s = availableSlots([week(H(20), H(26))], NOW);
    const labels = s.map((x) => `${x.day} ${x.label}`);
    expect(labels).toContain("Hoy 11:30 p. m.");
    expect(labels).toContain("Mañana 1:30 a. m.");
    expect(labels).not.toContain("Mañana 2:00 a. m.");
  });
  it("una tienda sin horario o sin tiendas no ofrece nada", () => {
    expect(availableSlots([{ schedule: [] }], NOW)).toEqual([]);
    expect(availableSlots([], NOW)).toEqual([]);
  });
  it("no ofrece franjas en días cerrados", () => {
    // Solo abre los viernes; hoy es miércoles y mañana jueves.
    expect(availableSlots([{ schedule: [{ day: 4, opensAt: 0, closesAt: 1440 }] }], NOW)).toEqual([]);
  });
});
describe("validateSlot", () => {
  const stores = [week(H(8), H(18))];
  it("acepta una franja disponible", () => {
    expect(validateSlot(caracas(9, 10), stores, NOW)).toEqual({ ok: true });
    expect(validateSlot(caracas(8, 11), stores, NOW)).toEqual({ ok: true });
  });
  it("rechaza horas fuera de la cuadrícula", () => {
    expect(validateSlot(caracas(9, 10, 15), stores, NOW).ok).toBe(false);
    expect(validateSlot(1.5, stores, NOW).ok).toBe(false);
  });
  it("rechaza lo muy pronto (tolerando unos minutos), lo pasado y lo muy lejos", () => {
    expect(validateSlot(caracas(8, 10, 30), stores, NOW).ok).toBe(true);
    expect(validateSlot(caracas(8, 10, 0), stores, NOW).ok).toBe(false);
    expect(validateSlot(caracas(8, 9, 0), stores, NOW).ok).toBe(false);
    expect(validateSlot(slotHorizon(NOW), stores, NOW).ok).toBe(false);
    expect(validateSlot(caracas(10, 10), stores, NOW).ok).toBe(false);
  });
  it("rechaza cuando alguna tienda está cerrada a esa hora", () => {
    const r = validateSlot(caracas(9, 20), stores, NOW);
    expect(r).toMatchObject({ ok: false });
    expect(validateSlot(caracas(9, 10), [...stores, week(H(12), H(18))], NOW).ok).toBe(false);
  });
});
