import { describe, expect, it } from "vitest";
import { formatSchedule } from "./progress";

const at = (day: number, h: number, m = 0) => new Date(2025, 0, day, h, m).getTime();
describe("formatSchedule", () => {
  it("dice hoy, mañana o la fecha", () => {
    const now = at(8, 10);
    expect(formatSchedule(at(8, 18), now)).toMatch(/^hoy a las 6:00/);
    expect(formatSchedule(at(9, 10), now)).toMatch(/^mañana a las 10:00/);
    expect(formatSchedule(at(12, 10), now)).toMatch(/^12 ene\.?,/);
  });
});
