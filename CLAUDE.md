# Ñami

App de delivery venezolana (comida, mercado, farmacia, tiendas). Proyecto de portafolio: compra simulada y seguimiento del repartidor, pensado para que un reclutador lo pruebe sin registrarse.

Desarrolladora: Karla — diseño, frontend, backend y base de datos.

## Stack

- Next.js (App Router) + React + TypeScript (strict)
- Backend dentro de Next: Server Actions para mutaciones de la propia UI, Route Handlers (`app/api/**`) para lo que se consume como API REST
- PostgreSQL + Drizzle (schema y migraciones con drizzle-kit)
- Zod para validar toda entrada (formularios, params, body, query)
- Sin autenticación: se compra como invitado y el modo admin es local (navegador). No hay Better Auth ni cuentas
- Zustand solo para estado de cliente (carrito, preferencias), con `persist`
- Vitest (lógica de dominio) + Playwright (flujos completos)
- Tailwind CSS v4 con los tokens de Ñami

No usar Supabase como plataforma, ni Express/NestJS, ni microservicios.

## Arquitectura

- La lógica de negocio vive en `src/server/` (servicios puros: `createOrder`, `calculateTotals`, `advanceOrderStatus`…). No importa nada de Next; lleva `import "server-only"`.
- Actions y Route Handlers solo hacen: validar con Zod → llamar al servicio → responder. Nunca duplicar lógica entre ellos.
- Los datos del servidor se leen en Server Components; no se copian a Zustand.
- En checkout el servidor recalcula precios y totales. Nunca confiar en montos del cliente. El checkout corre en una transacción.
- Dinero en centavos (`integer`). Cada pedido guarda la tasa Bs./$ usada.
- Seguimiento del repartidor: ruta precalculada + hora de inicio guardadas en el pedido; el cliente calcula la posición y hace polling del estado (`preparando → en camino → entregado`). Sin websockets por ahora.
- Route Handlers: códigos de estado correctos y errores con forma consistente `{ error: { code, message } }`.
- Tests de integración contra un Postgres de prueba (Docker), no mocks del ORM.
- Errores del servidor: `logError(scope, e)` de `src/server/log.ts` (JSON con `requestId`), no `console.error`.
- Endpoints públicos que escriben: límite por IP con `checkRateLimit` (`src/server/rate-limit.ts`) → 429 `RATE_LIMITED` con `Retry-After`.
- Route Handler nuevo o cambiado: documentarlo en `src/lib/openapi.ts` (una prueba falla si falta).
- Mutación nueva del panel sobre el catálogo: llamar `markCatalogChanged` para que la tienda vuelva sola al seed (ver `docs/adr/0004`).
- El estado de un pedido solo lo decide `reconcileOrder` (`src/server/order-flow.ts`): `hold_stage` 0–1 = la tienda desde su panel, 2–3 = el repartidor desde `/repartidor`. Al final llama `settle`, que recalcula montos si una parada se cancela (ver `docs/adr/0006`).
- Toda regla que mueve dinero (recálculo, recargo, liquidación, cupones) es una función pura en `src/lib/pricing/` con prueba unitaria; los servicios solo la conectan con la BD.
- Nada de `Date.now()` en código que corre al renderizar una página (cacheComponents): pasar el tiempo como parámetro o calcularlo en SQL.
- Gestor de paquetes: npm (`package-lock.json`). En Windows, corre las pruebas desde `D:\` en mayúscula.
## Moneda
- Precio base en USD (centavos) y por tienda: cada tienda tiene sus propios `products` y precios.
- El usuario elige ver USD o Bs.; la preferencia va en una **cookie** (para que el servidor renderice en la moneda correcta). Es preferencia de UI, no de Zustand.
- La conversión usa la tasa vigente; los precios y tasas son de demostración, no necesitan ser reales (tasa manual está bien). El pedido guarda tasa y total en Bs.
## Modo demo
- Compra como invitado, sin cuenta: el servidor da una cookie con un token anónimo y el pedido se guarda con ese `guestToken`; el seguimiento exige id de pedido + token. No hay perfil ni historial de cliente (decisión de alcance).
- Contenido que un visitante demo crea (tiendas personalizadas, archivos subidos, pedidos sobre esas tiendas) vive **solo en su navegador** (IndexedDB / `localStorage`), nunca en la BD. Para eso, las funciones de cálculo (`calculateTotals`…) son puras y sin dependencias de servidor, para poder correr también en el cliente.
- Pedidos sobre el catálogo propio de la app (tiendas del seed) usan el flujo normal: servidor, transacción, BD. Son desechables: un script borra los viejos por `created_at`.
- No escribir en Neon (producción) sin que Karla lo pida; en desarrollo se usa Docker.

## Design system

Fuente de verdad: https://claude.ai/artifact/6Pg9gmtxwDps9UjPYiQJiB (copia local en `design/`).

- `design/marca.md` — reglas de marca: voz, color, tipografía, espacio, iconografía. Léelo antes de crear UI.
- `design/tokens.json` → generan `app/styles/tokens.css` (variables, claro/oscuro) y el `@theme` de `app/globals.css`. Si cambian los tokens, regenera `tokens.css` con `npm run tokens` (y añade a mano los nuevos al `@theme inline` de `globals.css`); no edites `tokens.css` a mano.
- `app/styles/nami-components.css` — estilos `.nm-*` de los componentes del sistema (Button, Badge, AppHeader, TopBar, ProductCard…).
- Usa utilidades mapeadas a tokens: `bg-primary text-on-primary`, `text-ink`, `text-ink-muted`, `bg-surface-tile`, `text-primary-text`, `rounded-pill`, `rounded-lg`, `shadow-card`, `text-title-lg`, `text-price`, `font-display`. Nunca hex sueltos ni la paleta por defecto de Tailwind (`red-500`, etc.).
- Tipografía: Nunito (`font-display`) solo en títulos y banners; Figtree para todo lo demás, incluidos precios.
- `brand` (#FF2D3B) no lleva texto pequeño encima: usa `primary`. Rojo sobre blanco: `primary-text`.
- Textos de UI en español venezolano, tuteando, sin emoji. Precios: `$ 3,50`. Siempre "Ñami" con Ñ.
- Mobile-first; escritorio desde `desktop:` (1024px).
- Imágenes de marca en `public/brand/` (logo, ícono, guacamaya, guacamaya en moto, key visual).
