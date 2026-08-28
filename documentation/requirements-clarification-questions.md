# Requirements — Clarification Questions (Effect + BFF architecture)

Your answers are locked (see `state.md`). Three new mandates — **Effect at its best**, **nosko
DDD standards**, and a **separate GraphQL-like BFF Lambda** — need five decisions pinned before I
write the requirements, database design, and plan. Each has a recommendation as the first option;
you can likely accept the defaults and be done fast.

Fill the letter after `[Answer]:`. Say "done" when finished.

---

## C1 — BFF technology (the "GraphQL-like, per-section" layer)
You want the BFF to feel like GraphQL (typed, per-section, returns exactly what the frontend
needs) but **not** be GraphQL — an Effect-native technology instead. The two idiomatic Effect
options:

A) **`@effect/rpc`** — define typed RPC procedures grouped **per section** (e.g. `cycles`,
`bills`, `savings`, `evaluations`, `auth`); the frontend gets a fully typed client, requests are
batchable, responses are Effect `Schema`-validated view models. Closest match to the GraphQL/tRPC
"ask per section, get exactly this shape" feel. Best fit for a response-shaping BFF. (Recommended)

B) **`@effect/platform` `HttpApi`** — define REST endpoints grouped **per section**
(`HttpApiGroup` = section), typed derived client, and **auto-generated OpenAPI + Swagger UI**
(keeps nosko's docs story). Slightly more REST than GraphQL-like, but standards-friendly.

C) **Both** — `@effect/rpc` for the frontend↔BFF channel; `HttpApi` for any documented internal
API surface.

D) Other (describe after [Answer]:)

[Answer]: C

## C2 — BFF deployment topology
"Separate the backend with a BFF Lambda at the front." How physically separate?

A) **One deployable, layered** — the BFF Lambda is the single API entrypoint; the domain and data
layers (nosko-style DDD) live **in-process** as Effect services/layers behind a strict BFF
presentation boundary. Lowest latency, cost, and complexity for two users; can be split into
separate services later without rewriting domain code. (Recommended)

B) **Two tiers** — a BFF Lambda (frontend-facing: shaping, aggregation, error formatting) calls a
**separate core-domain API Lambda** over HTTP. True physical separation, but adds a network hop,
more infra, and cost — heavy for a two-user app.

C) **BFF + per-domain Lambdas** (finer-grained services per section)

D) Other (describe after [Answer]:)

[Answer]: A

## C3 — Contract / validation library
nosko's standard was **Zod** (money-evaluation's frontend also uses Zod). "Use Effect at its
best" points the other way.

A) **Effect `Schema`** everywhere — one schema language for validation, encode/decode, API
contracts (RPC/HttpApi), and error types; integrates natively with the whole Effect stack and
derives OpenAPI. Replaces Zod. (Recommended — this is "Effect at its best")

B) **Keep Zod** for contracts, use Effect only for control flow/error handling (mixes two schema
systems; more glue, less idiomatic)

C) Other (describe after [Answer]:)

[Answer]: A

## C4 — Frontend: reuse the money-evaluation dashboard, or rebuild?
Your Q8 answer emphasised Effect + future mobile but didn't pick reuse-vs-rebuild.

A) **Carry the money-evaluation dashboard forward** — same visual language and pages (Overview,
Cycles, Evaluations, Savings, "Copiar resumo"), React 19 + Vite + Tailwind, **rewired to the BFF
using Effect on the client** (Effect for data fetching + error handling, no try/catch). Mobile
later. (Recommended — keeps the proven UI, adds Effect)

B) **Rebuild the frontend from scratch** (still React + Effect), not reusing money-evaluation's
components/visuals

C) Other (describe after [Answer]:)

[Answer]: B

## C5 — Household account-linking flow
You want two normal users who **link their accounts** into one household (not a single shared
login).

A) **Invite by email** — each person signs up independently (full signup + MFA, nosko-style). One
creates the household and invites the partner by email; the partner accepts to join. The
household owns cycles/bills/savings; both members see shared data; income/withdrawal split tracks
per member. (Recommended)

B) **Join code** — one creates the household and shares a code; the partner enters it to link
(no email dependency)

C) Other (describe after [Answer]:)

[Answer]: A
