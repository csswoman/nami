# 0005 · Rate limiting in Postgres instead of Redis

Status: accepted

## Context

`POST /api/orders` and the store panel's write endpoints are public and unauthenticated. A script could fill the production database (Neon free tier) with orders or flip the panel thousands of times. The usual tool is Redis (e.g. Upstash), but that adds a service, an account and secrets to a project whose rule is "Next.js + Postgres, nothing else".

## Decision

- A `rate_limits` table with one row per key (`orders:<ip>`, `panel:<ip>`): window start and count.
- Fixed window counter in a single statement:
  `INSERT … VALUES (key, now, 1) ON CONFLICT (key) DO UPDATE SET count = CASE WHEN window expired THEN 1 ELSE count + 1 END, …  RETURNING count`.
  Postgres serializes concurrent upserts on the same row, so the count is exact without explicit locks. A test fires 25 concurrent requests at a limit of 10, and exactly 10 get through.
- Limits: 10 orders per 10 minutes and 60 panel changes per minute, per IP. Generous for a person, low enough to stop a loop.
- Keyed by IP (`x-forwarded-for`, which Vercel's edge sets), not by guest token, because tokens are free to mint.
- Over the limit: `429` with `Retry-After` and the usual `{ error: { code: "RATE_LIMITED", message } }` body.
- **Fails open.** If the limiter's query fails, the request goes through and the error is logged: the limiter protects the demo, so it must never be what takes it down.
- `RATE_LIMIT=off` disables it for Playwright, which places many orders from one IP.
- `npm run db:cleanup` deletes counters older than a day.

## Consequences

- No new infrastructure. The limiter is tested against the same real Postgres as everything else.
- One extra round trip on each limited request (writes only, not reads or polling).
- A fixed window allows up to 2× the limit across a window boundary. For abuse protection on a demo, that's fine; a sliding window or token bucket would be the upgrade.
- Under heavy traffic the hot rows would become a bottleneck. At that point, move the limiter to Redis or the edge. Callers only use `checkRateLimit(key, limit)`, so only that function changes.
