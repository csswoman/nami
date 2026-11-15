import { describe, expect, it } from "vitest";
import { validateSchedule } from "./store-schedule";

const s = (day: number, opensAt: number, closesAt: number) => ({ day, opensAt, closesAt });
const bad = (raw: unknown) => {
  const r = validateSchedule(raw);
  return r.ok ? "ok" : r.message;
};
describe("validateSchedule", () => {
  it("acepta un horario normal y lo ordena", () => {
    const r = validateSchedule([s(1, 480, 1020), s(0, 1080, 1260), s(0, 480, 720)]);
    expect(r).toEqual({ ok: true, schedule: [s(0, 480, 720), s(0, 1080, 1260), s(1, 480, 1020)] });
  });
  it("un día sin turnos es válido (cerrado)", () => {
    expect(validateSchedule([])).toEqual({ ok: true, schedule: [] });
  });
  it("acepta turnos que pasan de medianoche y 24 horas", () => {
    expect(validateSchedule([s(4, 1200, 1560), s(5, 600, 1000)]).ok).toBe(true);
    expect(validateSchedule([s(2, 0, 1440)]).ok).toBe(true);
  });
  it("rechaza datos mal formados", () => {
    expect(bad("x")).toMatch(/lista/);
    expect(bad([{ day: 1, opensAt: 5 }])).toMatch(/necesita/);
    expect(bad([s(0.5, 1, 2)])).toMatch(/necesita/);
    expect(bad([s(7, 60, 120)])).toMatch(/día/);
    expect(bad([s(0, -1, 120)])).toMatch(/apertura/);
    expect(bad([s(0, 1440, 1500)])).toMatch(/apertura/);
  });
  it("el cierre va después de la apertura y no pasa de 24 horas", () => {
    expect(bad([s(0, 600, 600)])).toMatch(/después/);
    expect(bad([s(0, 600, 500)])).toMatch(/después/);
    expect(bad([s(0, 60, 1600)])).toMatch(/24 horas/);
  });
  it("rechaza turnos que se cruzan en el mismo día", () => {
    expect(bad([s(0, 480, 720), s(0, 700, 900)])).toMatch(/se cruzan/);
    expect(validateSchedule([s(0, 480, 720), s(0, 720, 900)]).ok).toBe(true);
  });
  it("rechaza el turno nocturno que pisa la apertura del día siguiente", () => {
    expect(bad([s(4, 1200, 1560), s(5, 0, 300)])).toMatch(/noche anterior/);
    expect(bad([s(6, 1200, 1560), s(0, 0, 300)])).toMatch(/noche anterior/);
    expect(validateSchedule([s(4, 1200, 1560), s(5, 120, 300)]).ok).toBe(true);
  });
  it("limita los turnos por día", () => {
    expect(bad([s(0, 0, 100), s(0, 200, 300), s(0, 400, 500), s(0, 600, 700)])).toMatch(/Máximo/);
  });
});
