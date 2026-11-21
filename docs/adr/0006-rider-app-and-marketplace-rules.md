# 0006 · Rider app and the rules for when things go wrong

Status: accepted

## Context

The demo already had two sides of the marketplace: the customer and the store panel. The courier was simulated by time only: once every store marked its part ready, the order went "on the way" after a fixed delay. A delivery marketplace has three sides, and the interesting rules show up when one of them fails: a store that never answers, a store that rejects only its part of a multi-store order, rain that slows down couriers.

## Decision

### Rider app (`/repartidor`)

- No login, like the store panel. The rider is the visitor's guest cookie.
- Presence works like `stores.panel_seen_at`: the app polls `GET /api/repartidor` every 4 s and each poll upserts `rider_sessions(token, seen_at)`. A rider counts as online for 30 s after the last poll.
- `orders.hold_stage` already meant "the furthest stage the order may reach while someone handles it by hand" (0–1 for the store). It now also takes 2 (waiting for the rider or going to the store) and 3 (picked up, on the way). `reconcileOrder` handles both owners. When the owner goes away, the timeline resumes from that stage: the same rebase the store hold already used.
- Taking an order runs in a transaction with `SELECT … FOR UPDATE`. With five riders taking the same order at once, exactly one wins (`tests/db/marketplace.test.ts`).
- **Scope.** A rider only holds orders from the same guest token, plus orders created by "Simular pedido entrante" (tokens prefixed `simulado-`). In `/demo` the three iframes share the cookie, so one visitor plays all three roles. A visitor who leaves `/repartidor` open never slows down other visitors' orders.
- An unclaimed order waits for a rider at most 90 s, then gets assigned automatically and never waits again.

### Store doesn't answer, or rejects its part

- With its panel open, a store has 5 minutes to accept an order. After that its stop is cancelled with the reason "La tienda no respondió a tiempo". Without the panel open, orders keep advancing on their own as before.
- `order_stops.fee_cents` now stores each store's delivery fee. When a stop is cancelled, `settle()` reprices the order with the pure function `repriceOrder`: that store's products and delivery fee are not charged. In a combined delivery, the extra-stop surcharge drops too. Tip and demand surcharge stay, and the discount is capped. The Bs. total is recomputed with the rate saved on the order.
- If every stop gets cancelled by the stores (not by the customer), the customer gets a single-use apology coupon `PERDON-<number>` worth $2. It lives in `coupons` with a `guest_token`: for any other visitor the coupon doesn't exist.

### Demand surcharge (rain, rush hour)

- The visitor picks the weather in the demo clock. The choice goes in the `nami_demanda` cookie, like the other UI preferences.
- The server reads the cookie and computes the surcharge itself (`lib/pricing/demand.ts`). The client never sends an amount. The surcharge and its reason are stored on the order, and the plan stretches the ride.

### Settlement

- `lib/pricing/settlement.ts` is pure: Ñami takes 18 % of restaurant products and 12 % of market products. Store coupons are paid by the store, and the commission is charged on the discounted subtotal. Ñami's own coupons are paid by Ñami. Delivery, surcharge and tip are not store revenue. The panel's "Ventas" tab aggregates the last 7 Caracas calendar days.

## Consequences

- The tracking screen can be driven by three different actors. All of them write through `reconcileOrder`, which remains the only place that decides an order's state.
- Any rule that charges money is a pure function with unit tests (`repriceOrder`, `settleStop`, `surchargeFor`). The database tests check the wiring.
- Per-visitor isolation of catalog changes (option 1 in [0004](0004-shared-demo-panel.md)) is still not done. The rider was scoped per visitor because it was cheap: one `WHERE`. Isolating the catalog still means touching every read.
