import { z } from "zod";
import { orderInputSchema } from "./orders/input";
import { hoursSchema, openSchema, outOfStockSchema, productPatchSchema, stopActionSchema } from "./panel-input";
import { riderActionSchema } from "./rider-input";

/**
 * Especificación OpenAPI 3.1 de la API REST. Los cuerpos de entrada salen de los mismos esquemas Zod que validan
 * las rutas, así que el contrato documentado no se puede desviar de lo que el servidor acepta.
 * Se sirve en /api/openapi.json y se lee en /api/docs.
 */
const body = (schema: z.ZodType) => z.toJSONSchema(schema, { io: "input", unrepresentable: "any", target: "draft-2020-12" });

const ERROR_CODES = [
  "INVALID_INPUT",
  "NO_GUEST_TOKEN",
  "NOT_FOUND",
  "STORE_NOT_FOUND",
  "PRODUCT_NOT_FOUND",
  "PRODUCT_UNAVAILABLE",
  "INVALID_OPTIONS",
  "MIN_ORDER_NOT_MET",
  "RATE_UNAVAILABLE",
  "INVALID_TRANSITION",
  "NOT_CANCELLABLE",
  "SLOT_UNAVAILABLE",
  "OUT_OF_COVERAGE",
  "COUPON_INVALID",
  "COUPON_EXPIRED",
  "COUPON_NOT_APPLICABLE",
  "COUPON_MIN_NOT_MET",
  "RATE_LIMITED",
  "INTERNAL",
];

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ content: { "application/json": { schema } } });
const err = (description: string) => ({ description, ...json(ref("Error")) });
const ok = (description: string, schema: object = ref("Ok")) => ({ description, ...json(schema) });
const tooMany = { description: "Demasiadas peticiones desde tu IP. `Retry-After` dice cuántos segundos esperar.", headers: { "Retry-After": { schema: { type: "integer" } } }, ...json(ref("Error")) };
const slug = { name: "slug", in: "path", required: true, description: "Slug de la tienda (p. ej. `arepera-dona-chela`).", schema: { type: "string" } };
const uuidParam = (name: string, description: string) => ({ name, in: "path", required: true, description, schema: { type: "string", format: "uuid" } });

export function buildOpenApi(serverUrl?: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Ñami API",
      version: "1.0.0",
      description:
        "API REST de Ñami, una app de delivery de demostración. Los pedidos son de invitado: la cookie httpOnly `nami_guest` " +
        "la crea el servidor en la primera visita y cada pedido solo se puede leer con ella. El servidor recalcula precios, " +
        "envío, cupones y totales: los montos que mande el cliente se ignoran. Dinero siempre en centavos (USD). " +
        "Todos los errores tienen la forma `{ error: { code, message } }`.",
    },
    servers: serverUrl ? [{ url: serverUrl }] : [],
    tags: [
      { name: "Pedidos", description: "Lado del cliente." },
      { name: "Catálogo" },
      { name: "Panel de tienda", description: "Demo abierta y compartida: los cambios de catálogo se deshacen solos a los 15 minutos." },
      { name: "Repartidor", description: "App del repartidor. Sin login: el repartidor es el invitado de la cookie. Mientras consulta su tablero, los pedidos listos lo esperan." },
    ],
    components: {
      securitySchemes: { guestCookie: { type: "apiKey", in: "cookie", name: "nami_guest" } },
      schemas: {
        Error: {
          type: "object",
          required: ["error"],
          properties: { error: { type: "object", required: ["code", "message"], properties: { code: { type: "string", enum: ERROR_CODES }, message: { type: "string", description: "En español, lista para mostrar." } } } },
        },
        Ok: { type: "object", properties: { ok: { type: "boolean", const: true } } },
        OrderInput: body(orderInputSchema),
        Order: {
          type: "object",
          description: "Pedido tal como lo ve el cliente (resumen de los campos principales).",
          properties: {
            id: { type: "string", format: "uuid" },
            code: { type: "string", examples: ["ÑM-2101"] },
            status: { type: "string" },
            subtotalCents: { type: "integer" },
            shippingCents: { type: "integer" },
            tipCents: { type: "integer" },
            discountCents: { type: "integer" },
            totalCents: { type: "integer" },
            totalBsCents: { type: "integer", description: "Total en bolívares (céntimos) a la tasa del momento del pedido." },
            surchargeCents: { type: "integer", description: "Recargo por lluvia u hora pico (cookie `nami_demanda` del modo demo). Ya va en el total." },
            compensation: { type: ["object", "null"], description: "Cupón de disculpa si las tiendas cancelaron el pedido.", properties: { code: { type: "string" }, amountCents: { type: "integer" } } },
            rate: { type: "number", description: "Tasa Bs./$ guardada en el pedido." },
            plan: { type: "array", items: { type: "number" }, description: "Minuto en que se espera cada etapa." },
            startAt: { type: "integer", description: "ms epoch" },
            stops: { type: "array", items: { type: "object" } },
            lines: { type: "array", items: { type: "object" } },
          },
        },
        StopAction: body(stopActionSchema),
        Open: body(openSchema),
        ProductPatch: body(productPatchSchema),
        Hours: body(hoursSchema),
        OutOfStock: body(outOfStockSchema),
        RiderAction: body(riderActionSchema),
      },
    },
    paths: {
      "/api/orders": {
        post: {
          tags: ["Pedidos"],
          summary: "Crear un pedido",
          description: "Valida con Zod, recalcula todo en el servidor y guarda el pedido en una transacción. Límite: 10 pedidos cada 10 minutos por IP.",
          security: [{ guestCookie: [] }],
          requestBody: { required: true, ...json(ref("OrderInput")) },
          responses: {
            201: ok("Pedido creado.", { type: "object", properties: { order: ref("Order") } }),
            400: err("El cuerpo no es JSON o no cumple el esquema (`INVALID_INPUT`)."),
            401: err("Falta la cookie de invitado."),
            409: err("Un producto está agotado (`PRODUCT_UNAVAILABLE`)."),
            422: err("Regla de negocio: tienda o producto inexistente, opciones inválidas, pedido mínimo, fuera de cobertura, franja no disponible o cupón no válido."),
            429: tooMany,
            503: err("No hay tasa Bs./$ cargada (`RATE_UNAVAILABLE`)."),
          },
        },
      },
      "/api/orders/{id}": {
        get: {
          tags: ["Pedidos"],
          summary: "Estado de un pedido",
          description: "El seguimiento la consulta cada pocos segundos. Solo responde al invitado que hizo el pedido.",
          security: [{ guestCookie: [] }],
          parameters: [uuidParam("id", "Id del pedido.")],
          responses: { 200: ok("Pedido.", { type: "object", properties: { order: ref("Order") } }), 401: err("Falta la cookie de invitado."), 404: err("No existe o es de otro invitado.") },
        },
      },
      "/api/search": {
        get: {
          tags: ["Catálogo"],
          summary: "Buscar tiendas y productos",
          description: "Tolerante a errores de tipeo (`pg_trgm`) y a acentos (`unaccent`).",
          parameters: [{ name: "q", in: "query", schema: { type: "string", maxLength: 100 }, example: "teqeños" }],
          responses: { 200: ok("Resultados.", { type: "object", properties: { stores: { type: "array", items: { type: "object" } }, products: { type: "array", items: { type: "object" } }, currency: { type: "string", enum: ["USD", "VES"] }, rate: { type: "number" } } }) },
        },
      },
      "/api/tienda-admin/{slug}/orders": {
        get: { tags: ["Panel de tienda"], summary: "Bandeja de pedidos", description: "Consultarla marca el panel como abierto: la tienda toma el control de sus pedidos.", parameters: [slug], responses: { 200: ok("Bandeja.", { type: "object" }), 404: err("No existe esa tienda.") } },
      },
      "/api/tienda-admin/{slug}/stops/{stopId}": {
        post: {
          tags: ["Panel de tienda"],
          summary: "Aceptar, rechazar, preparar o dejar listo",
          description: "Máquina de estados por parada: una acción que no corresponde al estado actual devuelve 409.",
          parameters: [slug, uuidParam("stopId", "Parada del pedido.")],
          requestBody: { required: true, ...json(ref("StopAction")) },
          responses: { 200: ok("Hecho."), 400: err("Acción o motivo inválido."), 404: err("No es un pedido de esta tienda."), 409: err("Transición inválida o pedido cerrado."), 429: tooMany },
        },
      },
      "/api/tienda-admin/{slug}/stops/{stopId}/items/{itemId}": {
        post: {
          tags: ["Panel de tienda"],
          summary: "«No hay»: quitar o sustituir un producto (mercados)",
          description: "Aplica lo que eligió el cliente. El reemplazo nunca cobra más que el original y los totales se recalculan.",
          parameters: [slug, uuidParam("stopId", "Parada."), uuidParam("itemId", "Producto del pedido.")],
          requestBody: { required: true, ...json(ref("OutOfStock")) },
          responses: { 200: ok("Hecho."), 400: err("Entrada inválida."), 404: err("No encontrado."), 409: err("Ya resuelto o pedido listo."), 429: tooMany },
        },
      },
      "/api/tienda-admin/{slug}/open": {
        post: { tags: ["Panel de tienda"], summary: "Abrir o cerrar la tienda", parameters: [slug], requestBody: { required: true, ...json(ref("Open")) }, responses: { 200: ok("Hecho."), 400: err("Entrada inválida."), 404: err("No existe esa tienda."), 429: tooMany } },
      },
      "/api/tienda-admin/{slug}/inventory": {
        get: { tags: ["Panel de tienda"], summary: "Inventario", parameters: [slug], responses: { 200: ok("Productos.", { type: "object", properties: { items: { type: "array", items: { type: "object" } } } }), 404: err("No existe esa tienda.") } },
      },
      "/api/tienda-admin/{slug}/products/{productSlug}": {
        patch: {
          tags: ["Panel de tienda"],
          summary: "Agotar, reponer o cambiar el precio de un producto",
          parameters: [slug, { name: "productSlug", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, ...json(ref("ProductPatch")) },
          responses: { 200: ok("Producto actualizado.", { type: "object" }), 400: err("Entrada inválida."), 404: err("Producto o tienda inexistente."), 429: tooMany },
        },
      },
      "/api/tienda-admin/{slug}/hours": {
        get: { tags: ["Panel de tienda"], summary: "Horario semanal", parameters: [slug], responses: { 200: ok("Turnos.", { type: "object" }), 404: err("No existe esa tienda.") } },
        put: { tags: ["Panel de tienda"], summary: "Reemplazar el horario", description: "Turnos en minutos desde la medianoche, hora de Caracas. Lunes = 0.", parameters: [slug], requestBody: { required: true, ...json(ref("Hours")) }, responses: { 200: ok("Horario guardado.", { type: "object" }), 400: err("Turnos inválidos o solapados."), 404: err("No existe esa tienda."), 429: tooMany } },
      },
      "/api/tienda-admin/{slug}/simulate": {
        post: {
          tags: ["Panel de tienda"],
          summary: "Simular un pedido entrante",
          description: "El servidor crea un pedido de prueba para la tienda con el mismo flujo que un cliente real (precios de la BD, transacción, tasa guardada). Límite propio: 8 cada 10 minutos por IP.",
          parameters: [slug],
          responses: { 201: ok("Pedido creado.", { type: "object", properties: { id: { type: "string", format: "uuid" }, code: { type: "string" } } }), 404: err("No existe esa tienda."), 409: err("La tienda no tiene productos disponibles o zonas de entrega."), 429: tooMany },
        },
      },
      "/api/tienda-admin/{slug}/metrics": {
        get: {
          tags: ["Panel de tienda"],
          summary: "Ventas y liquidación (7 días)",
          description: "Pedidos y ventas por día, ticket promedio, productos más vendidos, tiempo de preparación y la liquidación: venta bruta, comisión de Ñami (18 % restaurantes, 12 % mercados), cupones que paga la tienda y neto.",
          parameters: [slug],
          responses: { 200: ok("Métricas.", { type: "object" }), 404: err("No existe esa tienda.") },
        },
      },
      "/api/repartidor": {
        get: {
          tags: ["Repartidor"],
          summary: "Tablero del repartidor",
          description: "Pedidos esperando repartidor, los que lleva este invitado y los que ya entregó. Consultarlo lo marca conectado durante 30 s.",
          security: [{ guestCookie: [] }],
          responses: { 200: ok("Tablero.", { type: "object", properties: { available: { type: "array", items: { type: "object" } }, mine: { type: "array", items: { type: "object" } }, done: { type: "array", items: { type: "object" } } } }), 401: err("Falta la cookie de invitado.") },
        },
      },
      "/api/repartidor/orders/{id}": {
        post: {
          tags: ["Repartidor"],
          summary: "Tomar, recoger o avisar que llegó",
          description: "Tomar solo vale si nadie lo tomó (con dos repartidores a la vez gana uno). Recoger y llegar solo los hace quien lo tomó, en orden; lo demás es un 409.",
          security: [{ guestCookie: [] }],
          parameters: [uuidParam("id", "Id del pedido.")],
          requestBody: { required: true, ...json(ref("RiderAction")) },
          responses: { 200: ok("Hecho."), 400: err("Acción inválida."), 401: err("Falta la cookie de invitado."), 404: err("No existe el pedido."), 409: err("Ya lo tomó otro repartidor o la acción no va en ese orden."), 429: tooMany },
        },
      },
      "/api/tienda-admin/{slug}/reset": {
        post: { tags: ["Panel de tienda"], summary: "Reponer catálogo", description: "Devuelve la tienda a los datos de demo.", parameters: [slug], responses: { 200: ok("Hecho."), 404: err("No está en los datos de demo."), 429: tooMany } },
      },
    },
  };
}
