# 0002 · Guest checkout with an anonymous cookie, no accounts

Status: accepted

## Context

Ñami is a portfolio project. The person most likely to try it is a recruiter or an engineer with five minutes to spare, and a sign-up form is where they would leave. At the same time, orders must not be readable by anyone who guesses an id.

## Decision

- `src/proxy.ts` gives every visitor an httpOnly, `SameSite=Lax` cookie with a random guest token on the first request (and passes it to that same request, so the first `POST /api/orders` already sees it).
- Orders store that `guestToken`. Reading, cancelling or confirming an order requires both the order id and the matching token; otherwise it's a `404`, which doesn't reveal that the order exists.
- There is no profile or order history on the server. Favorites and saved addresses live in `localStorage`.
- Content a visitor *creates* (custom stores, uploads) never reaches the database: it stays in the browser. The pricing functions are pure so they can run there too.

## Consequences

- Zero friction: the whole flow, including the store side, works without an account.
- Clearing cookies "loses" your orders. That's acceptable for a demo.
- Guest tokens are free to mint, so they can't be used for abuse limits; rate limiting is keyed by IP instead (see [0005](0005-rate-limiting-in-postgres.md)).
- Adding real accounts later means attaching existing guest orders to a user id on sign-in. The schema doesn't need to change.
