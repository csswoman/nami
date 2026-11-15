# Plan de Nami (proyecto de demostración)

Proyecto personal para mostrar habilidades. Sin pagos reales, sin PWA, sin login real.
Las migraciones y los datos de prueba se corren en BD local. Neon solo se toca al desplegar, y lo corre el dueño del proyecto.

Ya hecho: las tiendas cerradas se pueden abrir desde inicio y listado, y aceptan pedidos programados para la próxima apertura (`scheduledFor`).

## Decisiones tomadas

- Un pedido con varias paradas (`orders` + `order_stops`). El seguimiento es uno solo y cada tienda ve solo su parte. (Las tablas ya existen en `schema.ts`.)
- Los productos tienen `slug`, para que el carrito guardado en el navegador no se rompa cuando el seed recrea los uuid.
- El botón "Avanzar" de la demo se queda, pero pasa a ser una acción del servidor.
- El panel de tienda no tiene login, como el modo admin local descrito en `CLAUDE.md`.
- Montos en centavos, tasa de cambio guardada en cada pedido, recálculo de precios en el servidor, polling en vez de websockets.

## Fase 2: Panel de tienda (3-4 días)

Ruta `/tienda-admin/[slug]`, sin login. Un selector indica "estás viendo como Arepera Doña Chela".

1. **Horarios por día.** Tabla `store_hours` (tienda, día de la semana, apertura, cierre, con soporte de varios turnos). Reemplaza el texto "Abre mañana a las…". `isOpenAt`, `opensText` y `nextOpening` leen de la tabla, y el seed la llena. Se edita desde el panel.
2. **Interruptor abrir/cerrar** manual que se combina con el horario (cerrado manual gana).
3. **Bandeja de pedidos entrantes** con polling: aceptar, rechazar (con motivo), "en preparación", "listo para retirar".
4. **Máquina de estados.** Cada `order_stop` avanza por su cuenta y `advanceOrderStatus` calcula el estado general del pedido. Transición inválida devuelve 409. Tests unitarios de todas las transiciones.
5. **Inventario.** Agotar o reponer productos, cambiar precios. Se ve al instante en la app del cliente.
6. **Modo automático o manual.** Si nadie atiende el panel, el pedido avanza solo con el plan de tiempos actual. Si alguien abre el panel, toma el control (marca de "última actividad" por tienda).
7. **Reponer catálogo.** Un botón más el script de limpieza devuelven todo al seed.
8. **`/demo`.** Pantalla dividida, cliente y tienda lado a lado en escritorio.

9. **Acceso documentado y visible al panel** (no debe quedar oculto):
   - Sección "Panel de tienda" en el README: URL `/tienda-admin/[slug]`, cómo entrar sin login, qué se puede hacer y un recorrido paso a paso (hacer un pedido, atenderlo desde el panel, verlo avanzar).
   - Página `/tienda-admin` con la lista de tiendas de demo para elegir a cuál entrar.
   - Enlaces al panel desde el menú del cliente, `/acerca` y `/perfil`, y desde el pie de la app.
   - Aviso dentro del panel ("estás viendo como…", cómo volver a la app del cliente y cómo reponer el catálogo).
   - Mismo recorrido en `/acerca` ("Prueba esto en 2 minutos") y en `/demo`.

Listo cuando: un pedido hecho en el cliente aparece en la bandeja, recorre todos los estados desde el panel, y los cambios de stock, precio y horario se reflejan en el cliente. Tests de la máquina de estados en verde.

## Fase 3: Lógica de negocio visible (2-3 días)

1. **Cupones.** Tabla `coupons` (porcentaje o monto fijo, mínimo, vencimiento, solo una tienda, envío gratis). El servidor los aplica en `createOrder` y el checkout los muestra. Cupones de prueba: `NAMI10`, `ENVIOGRATIS`, `AREPA2X1`. Además: primer pedido gratis y envío gratis desde cierto monto. La tienda los gestiona desde su panel y `/ofertas` muestra cupones aplicables.
2. **Franjas programadas con hora elegida.** En el checkout, selector de franjas (hoy 6:00 p. m., mañana 10:00 a. m., cada 30 min). Solo ofrece horas dentro del horario de `store_hours` de todas las tiendas del pedido. Se suma a "cuando abra".
3. **Cancelar pedido.** Solo antes de "en camino", con un motivo. Usa la máquina de estados.
4. **Reseñas.** La calificación de `EntregadoView` se guarda en la tabla `reviews`. Aparece en la página de la tienda con el promedio, y `rating` pasa a calcularse desde las reseñas. La tienda las ve en su panel.
5. **Sustituciones en mercado.** "Si no hay, cámbialo por…" en cada producto.

## Fase 4: Mapa real y entrega por zona (2 días)

1. **MapLibre GL** con tiles de OpenStreetMap, sin API key.
2. **Pin en el mapa** para elegir la dirección del cliente (`lat/lng`). Es lo primero que se pide para mostrar tiendas.
3. **Rutas con OSRM** calculadas una sola vez en el seed y guardadas, para no llamar servicios externos al pedir.
4. **Cobertura por zona.** Cada tienda tiene ubicación y radio o distancia máxima de cobertura. El listado muestra solo las tiendas que cubren la dirección elegida.
5. **Envío por distancia:** base + costo por km, con el cupón de envío gratis aplicado después.

Decisión: opción A. El seed precalcula con OSRM la ruta de cada tienda a una lista de zonas de Caracas (Chacao, Altamira, El Cafetal…) y la guarda. El pin del cliente se asigna a la zona más cercana y usa esa ruta guardada. Al pedir no se llama a ningún servicio externo.

## Fase 5: Perfil y pulido de cliente (1-2 días)

1. **`/perfil`** (hoy da 404): direcciones guardadas (con pin), moneda, tema, "borrar mis datos de demo" y enlace al panel de tienda.
2. **Favoritos** de tiendas y productos, guardados en el navegador.
3. **"Pedir de nuevo"** en `/pedidos`: rellena el carrito con un pedido anterior (por `slug`, avisando de productos agotados o cambiados).
4. **Búsqueda tolerante** a errores de tipeo con `pg_trgm` ("teqeños" encuentra "tequeños").
5. **Filtros y orden del listado:** más rápido, mejor calificado, envío gratis, precio, abierto ahora. Usan envío y rating ya reales.

## Fase 6: Presentación (1-2 días)

1. **README** con diagrama de arquitectura, decisiones importantes (centavos, tasa guardada por pedido, recálculo en servidor, polling vs websockets) y capturas.
2. **`/acerca`:** enlaces reales de GitHub y portafolio, y sección "Prueba esto en 2 minutos" con recorridos guiados.
3. **GitHub Actions:** lint, tipos, tests unitarios, integración contra Postgres y Playwright.
4. **Deploy en Vercel con Neon.** El seed y el cron de limpieza en producción los corre el dueño.

## Orden y dependencias

Horarios y panel (2) → cupones, franjas, cancelar, reseñas (3) → mapa y zonas (4) → perfil y filtros (5) → presentación (6).
Las franjas dependen de `store_hours`. Los filtros por envío y rating dependen de las fases 3 y 4. Las direcciones guardadas del perfil dependen del pin de la fase 4.

## Fuera de alcance

Pagos, PWA, login real, WhatsApp o push, chat con el repartidor.
