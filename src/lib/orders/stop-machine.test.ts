import { describe, expect, it } from "vitest";
import { InvalidTransition, advanceOrderStatus, allowedActions, applyStopAction, holdStageOf, stopStatusAtStage, type StopStatus } from "./stop-machine";

describe("applyStopAction", () => {
  it("recorre el camino feliz recibido → aceptado → preparando → listo", () => {
    let s: StopStatus = "recibido";
    for (const a of ["aceptar", "preparar", "listo"] as const) s = applyStopAction(s, a);
    expect(s).toBe("listo");
  });
  it("rechazar vale hasta que la parada está lista", () => {
    for (const from of ["recibido", "aceptado", "preparando"] as const) expect(applyStopAction(from, "rechazar")).toBe("cancelado");
    expect(() => applyStopAction("listo", "rechazar")).toThrow(InvalidTransition);
  });
  it("no permite saltarse pasos ni repetirlos", () => {
    expect(() => applyStopAction("recibido", "listo")).toThrow(InvalidTransition);
    expect(() => applyStopAction("recibido", "preparar")).toThrow(InvalidTransition);
    expect(() => applyStopAction("aceptado", "aceptar")).toThrow(InvalidTransition);
    expect(() => applyStopAction("cancelado", "aceptar")).toThrow(InvalidTransition);
    expect(() => applyStopAction("entregado", "listo")).toThrow(InvalidTransition);
  });
  it("el error dice desde dónde y con qué acción", () => {
    const e = (() => { try { applyStopAction("listo", "aceptar"); } catch (x) { return x as InvalidTransition; } })();
    expect(e?.from).toBe("listo");
    expect(e?.action).toBe("aceptar");
  });
});
describe("allowedActions", () => {
  it("lista lo que la tienda puede hacer en cada estado", () => {
    expect(allowedActions("recibido")).toEqual(["aceptar", "rechazar"]);
    expect(allowedActions("aceptado")).toEqual(["rechazar", "preparar"]);
    expect(allowedActions("preparando")).toEqual(["rechazar", "listo"]);
    expect(allowedActions("listo")).toEqual([]);
    expect(allowedActions("cancelado")).toEqual([]);
  });
});
describe("holdStageOf", () => {
  it("espera respuesta si alguna parada está sin aceptar", () => {
    expect(holdStageOf(["recibido", "listo"])).toBe(0);
  });
  it("prepara mientras alguna esté aceptada o preparando", () => {
    expect(holdStageOf(["aceptado", "listo"])).toBe(1);
    expect(holdStageOf(["preparando", "preparando"])).toBe(1);
  });
  it("libera el pedido cuando todas las paradas vivas están listas", () => {
    expect(holdStageOf(["listo", "listo"])).toBeNull();
    expect(holdStageOf(["listo", "cancelado"])).toBeNull();
  });
  it("las canceladas no cuentan", () => {
    expect(holdStageOf(["cancelado", "preparando"])).toBe(1);
  });
});
describe("advanceOrderStatus", () => {
  it("sigue a la parada más atrasada", () => {
    expect(advanceOrderStatus("recibido", ["recibido", "listo"])).toBe("recibido");
    expect(advanceOrderStatus("recibido", ["aceptado", "preparando"])).toBe("preparando");
    expect(advanceOrderStatus("preparando", ["listo", "listo"])).toBe("buscando_motorizado");
  });
  it("se cancela solo si todas las paradas se cancelan", () => {
    expect(advanceOrderStatus("recibido", ["cancelado"])).toBe("cancelado");
    expect(advanceOrderStatus("preparando", ["cancelado", "cancelado"])).toBe("cancelado");
    expect(advanceOrderStatus("preparando", ["cancelado", "preparando"])).toBe("preparando");
  });
  it("una parada cancelada no frena a las demás", () => {
    expect(advanceOrderStatus("preparando", ["cancelado", "listo"])).toBe("buscando_motorizado");
  });
  it("en camino, entregado y cancelado no retroceden", () => {
    expect(advanceOrderStatus("en_camino", ["listo"])).toBe("en_camino");
    expect(advanceOrderStatus("entregado", ["listo"])).toBe("entregado");
    expect(advanceOrderStatus("cancelado", ["listo"])).toBe("cancelado");
  });
});
describe("stopStatusAtStage", () => {
  it("traduce la etapa del recorrido automático al estado de la parada", () => {
    expect([0, 1, 2, 3, 4].map(stopStatusAtStage)).toEqual(["recibido", "preparando", "listo", "en_camino", "en_camino"]);
  });
});
