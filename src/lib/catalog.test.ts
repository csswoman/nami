import { describe, expect, it } from "vitest";
import { hoursText, isOpenAt, nextOpening, nextOpeningAt, opensText, type DayHours } from "./catalog";

const h = (day: number, from: number, to: number): DayHours => ({ day, opensAt: from, closesAt: to });
const MON = 0, TUE = 1, SAT = 5, SUN = 6;
const H = (n: number, m = 0) => n * 60 + m;
// Lunes a viernes 8:00–17:00, sábado 9:00–13:00, domingo cerrado; viernes además de noche hasta las 2:00 del sábado.
const weekly = { schedule: [MON, TUE, 2, 3].map((d) => h(d, H(8), H(17))).concat([h(4, H(8), H(17)), h(4, H(20), H(26)), h(SAT, H(9), H(13))]) };

describe("isOpenAt", () => {
  it("abre dentro del turno y cierra fuera de él", () => {
    expect(isOpenAt(weekly, H(8), MON)).toBe(true);
    expect(isOpenAt(weekly, H(16, 59), MON)).toBe(true);
    expect(isOpenAt(weekly, H(17), MON)).toBe(false);
    expect(isOpenAt(weekly, H(7, 59), MON)).toBe(false);
  });
  it("un día sin turnos está cerrado", () => {
    expect(isOpenAt(weekly, H(12), SUN)).toBe(false);
  });
  it("el turno que pasa de medianoche cubre la madrugada del día siguiente", () => {
    expect(isOpenAt(weekly, H(1), SAT)).toBe(true);
    expect(isOpenAt(weekly, H(2), SAT)).toBe(false);
    expect(isOpenAt(weekly, H(1), MON)).toBe(false);
  });
  it("admite varios turnos en un día", () => {
    expect(isOpenAt(weekly, H(18), 4)).toBe(false);
    expect(isOpenAt(weekly, H(21), 4)).toBe(true);
  });
});
describe("nextOpening / opensText", () => {
  it("hoy si todavía no abrió", () => {
    expect(nextOpening(weekly, H(6), MON)).toEqual({ daysAhead: 0, minutes: H(8) });
    expect(opensText(weekly, H(6), MON)).toBe("Abre a las 8:00 a. m.");
  });
  it("mañana si ya cerró", () => {
    expect(opensText(weekly, H(18), MON)).toBe("Abre mañana a las 8:00 a. m.");
  });
  it("salta los días cerrados y nombra el día", () => {
    expect(nextOpening(weekly, H(14), SAT)).toEqual({ daysAhead: 2, minutes: H(8) });
    expect(opensText(weekly, H(14), SAT)).toBe("Abre el lunes a las 8:00 a. m.");
  });
  it("el segundo turno del día es la siguiente apertura", () => {
    expect(nextOpening(weekly, H(18), 4)).toEqual({ daysAhead: 0, minutes: H(20) });
  });
  it("sin horario no hay apertura", () => {
    expect(nextOpening({ schedule: [] }, 0, MON)).toBeNull();
    expect(opensText({ schedule: [] }, 0, MON)).toBe("Sin horario");
  });
});
describe("hoursText", () => {
  it("indica hasta cuándo atiende, también en el turno de madrugada", () => {
    expect(hoursText(weekly, H(10), MON)).toBe("Hasta las 5:00 p. m.");
    expect(hoursText(weekly, H(1), SAT)).toBe("Hasta las 2:00 a. m.");
  });
  it("cerrado fuera de horario", () => {
    expect(hoursText(weekly, H(20), MON)).toBe("Cerrado");
  });
  it("24 horas todos los días", () => {
    const all = { schedule: Array.from({ length: 7 }, (_, d) => h(d, 0, 1440)) };
    expect(hoursText(all, H(3), MON)).toBe("Abierto 24 horas");
  });
});
describe("nextOpeningAt", () => {
  it("devuelve el instante (ms) de la próxima apertura en hora de Caracas", () => {
    // Lunes 2024-01-01 18:00 Caracas = 22:00 UTC. Próxima apertura: martes 8:00 Caracas = 12:00 UTC.
    const now = Date.UTC(2024, 0, 1, 22, 0);
    expect(nextOpeningAt(weekly, now)).toBe(Date.UTC(2024, 0, 2, 12, 0));
  });
  it("cruza el fin de semana", () => {
    // Sábado 2024-01-06 14:00 Caracas = 18:00 UTC. Próxima: lunes 8:00 Caracas = 12:00 UTC.
    expect(nextOpeningAt(weekly, Date.UTC(2024, 0, 6, 18, 0))).toBe(Date.UTC(2024, 0, 8, 12, 0));
  });
});
