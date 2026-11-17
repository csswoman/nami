# 0001 · Polling instead of WebSockets for order tracking

Status: accepted

## Context

The customer follows an order through five stages (received, preparing, looking for a courier, on the way, arrived), and the store panel needs to see new orders. Stages change every few minutes, not every few milliseconds. The app runs on Vercel, where serverless functions don't keep long-lived connections. Concurrent viewers number in the tens, not thousands.

## Decision

- The tracking screen polls `GET /api/orders/{id}` every few seconds; the store panel polls its inbox every 4 seconds.
- The courier's movement is not streamed. Each order stores a precomputed street route and a start time (see [0003](0003-precomputed-routes.md)), and the client interpolates the position locally. Polling only carries state changes.
- Responses are `Cache-Control: no-store`; reads reconcile the order's timeline on the server, so a stale client can't push the order into an invalid state.

## Consequences

- No extra infrastructure (no WebSocket server, no Pusher/Ably account), and it behaves the same locally, in CI and on Vercel.
- Easy to test: a poll is a plain HTTP request, so Playwright and integration tests use the same path the browser does.
- Updates arrive with up to ~4 s of delay. That's fine for food delivery.
- Cost grows linearly with open tabs. If that ever matters, the next step is Server-Sent Events on the same endpoint (one-way, works over plain HTTP), not WebSockets.
