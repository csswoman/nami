# 0003 · Precomputed street routes and a client-side courier

Status: accepted

## Context

Delivery fees depend on street distance, stores only deliver within a radius, and the tracking screen shows the courier moving along real streets. Calling a routing API at checkout or on every tracking tick would add latency, a failure point and, at scale, cost. The public OSRM server is meant for light use.

## Decision

- The seed computes, once, the street route from every store to the center of each of the 13 delivery zones (OSRM) and stores distance, duration and geometry in `store_routes`. The results are also cached in `src/server/db/route-cache.json`, so later seeds, CI and the "restore catalog" button need no network.
- Without network, routes fall back to a straight-line estimate (`SEED_ROUTING=estimate`).
- At checkout, the customer's pin is snapped to the nearest zone; fee and coverage come from the stored route. The server rejects out-of-coverage orders (`OUT_OF_COVERAGE`).
- Each order stores its timeline plan and start time; the browser interpolates the courier's position along the stored geometry.

## Consequences

- Checkout and tracking never call an external service.
- Precision is per zone, not per address: two customers in the same zone pay the same fee. That's a deliberate simplification.
- Adding a store or a zone requires re-running the seed for the new pairs.
- Map tiles still come from the public OpenStreetMap servers. Real traffic would need a paid tile provider.
