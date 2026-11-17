import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { buildOpenApi } from "./openapi";

const API_DIR = join(process.cwd(), "src", "app", "api");
/** Rutas de la carpeta que no son parte de la API documentada: la propia documentación. */
const SELF = new Set(["/api/docs", "/api/openapi.json"]);

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? routeFiles(full) : name === "route.ts" ? [full] : [];
  });
}
/** src/app/api/orders/[id]/route.ts → /api/orders/{id}, con los métodos que exporta. */
const handlers = routeFiles(API_DIR).map((file) => ({
  path: "/api/" + relative(API_DIR, file).split(sep).slice(0, -1).join("/").replace(/\[(\w+)\]/g, "{$1}"),
  methods: [...readFileSync(file, "utf8").matchAll(/export (?:async )?function (GET|POST|PUT|PATCH|DELETE)/g)].map((m) => m[1].toLowerCase()),
}));

describe("OpenAPI", () => {
  const spec = buildOpenApi();

  it("documenta cada Route Handler con sus métodos, y nada que no exista", () => {
    const real = handlers.filter((h) => !SELF.has(h.path));
    expect(Object.keys(spec.paths).sort()).toEqual(real.map((h) => h.path).sort());
    for (const h of real) expect(Object.keys(spec.paths[h.path as keyof typeof spec.paths]).sort()).toEqual([...h.methods].sort());
  });

  it("toma los cuerpos de los esquemas Zod", () => {
    const input = spec.components.schemas.OrderInput as { type: string; required: string[]; properties: Record<string, unknown> };
    expect(input.type).toBe("object");
    expect(input.required).toEqual(expect.arrayContaining(["delivery", "payment", "address", "items"]));
    // El cliente no puede mandar montos: no existen en el contrato.
    expect(input.properties).not.toHaveProperty("totalCents");
  });

  it("todas las referencias apuntan a un esquema definido", () => {
    const refs = [...JSON.stringify(spec).matchAll(/"#\/components\/schemas\/(\w+)"/g)].map((m) => m[1]);
    for (const r of new Set(refs)) expect(spec.components.schemas).toHaveProperty(r);
  });
});
