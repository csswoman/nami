import { describe, expect, it } from "vitest";
import { hoursSchema, openSchema, productPatchSchema, stopActionSchema } from "./panel-input";

const msg = (r: { success: boolean; error?: { issues: { message: string }[] } }) => (r.success ? "ok" : r.error!.issues[0].message);
describe("stopActionSchema", () => {
  it("acepta las cuatro acciones y un motivo", () => {
    for (const action of ["aceptar", "rechazar", "preparar", "listo"]) expect(stopActionSchema.safeParse({ action }).success).toBe(true);
    expect(stopActionSchema.safeParse({ action: "rechazar", reason: "Sin harina" }).success).toBe(true);
  });
  it("rechaza acciones desconocidas y motivos larguísimos", () => {
    expect(msg(stopActionSchema.safeParse({ action: "volar" }))).toMatch(/acción válida/);
    expect(msg(stopActionSchema.safeParse({}))).toMatch(/acción válida/);
    expect(msg(stopActionSchema.safeParse({ action: "rechazar", reason: "x".repeat(201) }))).toMatch(/200/);
  });
});
describe("openSchema", () => {
  it("pide un booleano", () => {
    expect(openSchema.safeParse({ open: false }).success).toBe(true);
    expect(msg(openSchema.safeParse({ open: "si" }))).toMatch(/open/);
  });
});
describe("productPatchSchema", () => {
  it("acepta disponibilidad, precio o ambos", () => {
    expect(productPatchSchema.safeParse({ available: false }).success).toBe(true);
    expect(productPatchSchema.safeParse({ priceCents: 350 }).success).toBe(true);
    expect(productPatchSchema.safeParse({ available: true, priceCents: 99_999 }).success).toBe(true);
  });
  it("rechaza precios inválidos y cuerpos vacíos", () => {
    expect(productPatchSchema.safeParse({ priceCents: 0 }).success).toBe(false);
    expect(productPatchSchema.safeParse({ priceCents: 1.5 }).success).toBe(false);
    expect(productPatchSchema.safeParse({ priceCents: 100_001 }).success).toBe(false);
    expect(productPatchSchema.safeParse({ priceCents: "3" }).success).toBe(false);
    expect(msg(productPatchSchema.safeParse({}))).toMatch(/nada que cambiar/);
  });
});
describe("hoursSchema", () => {
  it("acepta una lista de turnos, incluso vacía", () => {
    expect(hoursSchema.safeParse({ schedule: [] }).success).toBe(true);
    expect(hoursSchema.safeParse({ schedule: [{ day: 0, opensAt: 480, closesAt: 900 }] }).success).toBe(true);
  });
  it("rechaza turnos incompletos y listas enormes", () => {
    expect(hoursSchema.safeParse({ schedule: [{ day: 0 }] }).success).toBe(false);
    expect(hoursSchema.safeParse({}).success).toBe(false);
    expect(hoursSchema.safeParse({ schedule: Array.from({ length: 22 }, () => ({ day: 0, opensAt: 0, closesAt: 60 })) }).success).toBe(false);
  });
});
