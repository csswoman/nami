import { describe, expect, it } from "vitest";
import { addAddress, cleanAddresses, cleanProducts, cleanStores, sameProduct, toggleIn } from "./favorites";
describe("toggleIn", () => {
  it("agrega al principio y quita si ya estaba", () => {
    expect(toggleIn(["a"], "b")).toEqual(["b", "a"]);
    expect(toggleIn(["b", "a"], "b")).toEqual(["a"]);
  });
  it("respeta el tope", () => {
    expect(toggleIn(["a", "b"], "c", undefined, 2)).toEqual(["c", "a"]);
  });
  it("compara productos por tienda e id", () => {
    const list = [{ store: "s", id: "p" }];
    expect(toggleIn(list, { store: "s", id: "p" }, sameProduct)).toEqual([]);
    expect(toggleIn(list, { store: "t", id: "p" }, sameProduct)).toHaveLength(2);
  });
});
describe("limpieza de lo guardado", () => {
  it("descarta valores inválidos y repetidos", () => {
    expect(cleanStores(["a", "a", 3, "", null, "b"])).toEqual(["a", "b"]);
    expect(cleanStores("x")).toEqual([]);
    expect(cleanProducts([{ store: "s", id: "p" }, { store: "s", id: "p" }, { store: "s" }, 4])).toEqual([{ store: "s", id: "p" }]);
  });
  it("exige pin en las direcciones", () => {
    const ok = { id: "1", name: "Casa", line: "Av. X", reference: "", lat: 10.5, lng: -66.9 };
    expect(cleanAddresses([ok, { ...ok, id: "2", lat: "10" }, { ...ok, id: "1" }])).toEqual([ok]);
  });
});
describe("addAddress", () => {
  const a = { name: "Casa", line: "Av. X", reference: "", lat: 10.5, lng: -66.9 };
  it("ignora direcciones sin pin o repetidas", () => {
    expect(addAddress([], { name: "Casa", line: "Av. X", reference: "" }, "1")).toEqual([]);
    const one = addAddress([], a, "1");
    expect(one).toHaveLength(1);
    expect(addAddress(one, a, "2")).toBe(one);
    expect(addAddress(one, { ...a, line: "Otra" }, "2")).toHaveLength(2);
  });
});
