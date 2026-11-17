# 0004 · Shared store panel that restores itself

Status: accepted

## Context

The store panel (`/tienda-admin/{slug}`) is open without login so visitors can see the store side of an order. It can change prices, stock, opening hours and whether the store is open, and those changes are written to the shared database. On a public demo, one visitor could close every store or set a price to $0.01, and the next visitor (maybe a recruiter) would find a broken app.

Options considered:

1. **Per-visitor sandbox.** Store each visitor's catalog changes in an overlay keyed by their guest token and merge it into every catalog read. This is the most isolated option, but the overlay would have to be applied in about 100 read sites (listing, search, store page, product page, checkout pricing, slots, coverage). That's a lot of surface for bugs in the core flow.
2. **Read-only panel.** Safe, but it removes the most interesting part of the demo.
3. **Shared panel with automatic restore.** Keep one shared catalog and undo changes after a while.

## Decision

Option 3.

- Every catalog mutation from the panel stamps `stores.catalog_changed_at` (only the first change; later clicks don't extend the window). The timestamp comes from the database clock.
- Before catalog and panel reads, `restoreStaleStores()` resets every store changed more than 15 minutes ago back to the seed. A cheap `SELECT … LIMIT 1` short-circuits the common case where nothing is stale.
- The reset claims stores with `UPDATE … SET catalog_changed_at = NULL … RETURNING` inside a transaction. Two concurrent requests can't both reset the same store: the second blocks on the row lock and then no longer sees it as stale (covered by `tests/db/concurrency.test.ts`).
- The cutoff is computed in SQL (`now() - interval`) rather than with `Date.now()`, so it is safe to call while Next.js prerenders a page with `cacheComponents`.
- The panel says so plainly: changes are shared and revert after 15 minutes, and a button reverts them now.
- Panel mutations are rate-limited per IP (see [0005](0005-rate-limiting-in-postgres.md)).

## Consequences

- A vandalized store heals itself within 15 minutes, with no cron job (Vercel Hobby only allows daily crons).
- During those minutes other visitors do see the change. For a demo, that's an acceptable trade.
- Order actions (accept, reject) are not reverted. They belong to that order's lifecycle, and orders are deleted after 7 days by `npm run db:cleanup`.
- If isolation ever matters more than simplicity, option 1 is still open. `catalog_changed_at` would simply move into the overlay table.
