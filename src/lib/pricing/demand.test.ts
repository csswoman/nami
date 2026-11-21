import { describe, expect, it } from "vitest";
import { DEMAND_INFO, demandOf, surchargeFor } from "./demand";

describe("demanda del modo demo", () => {
  it("lee la cookie y cualquier otro valor es normal", () => {
    expect(demandOf("lluvia")).toBe("lluvia");
    expect(demandOf("pico")).toBe("pico");
    expect(demandOf("granizo")).toBe("normal");
    expect(demandOf(undefined)).toBe("normal");
  });

  it("solo hay recargo y viaje más largo con lluvia u hora pico", () => {
    expect(surchargeFor("normal")).toBe(0);
    expect(surchargeFor("lluvia")).toBeGreaterThan(0);
    expect(DEMAND_INFO.normal.rideFactor).toBe(1);
    expect(DEMAND_INFO.lluvia.rideFactor).toBeGreaterThan(DEMAND_INFO.pico.rideFactor);
  });
});
