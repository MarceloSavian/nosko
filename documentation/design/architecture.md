# Architecture — nosko

Implements `requirements.md` under the locked mandates: **Effect end-to-end (no try/catch,
exhaustive error handling)**, **nosko DDD/Clean Architecture**, a **single layered BFF Lambda**
exposing both `@effect/rpc` (per-section, GraphQL-like) and `@effect/platform` `HttpApi`
(documented surface), **Neon Postgres** via `@effect/sql-pg`, **Terraform** IaC, and a **rebuilt
bilingual (en/pt) React + Effect** frontend. Two additional principles from the latest review:
the app is **configuration-first** and **all code identifiers are English** (the source project's
Portuguese domain terms are mapped in §4).

## 1. System topology

```
Browser (React + Effect client, en/pt i18n)
    |  HTTPS
    v
CloudFront ── S3 (static SPA)                 [static-site module]
    |
    |  /api/rpc  and  /api/http/*
    v
API Gateway (HTTP API)                        [api-routing module]
    |  authorizer (session/JWT)
    v
BFF Lambda (Effect, single deployable)        [compute module]
    ├─ presentation:  RpcServer (per-section groups) + HttpApi groups + view-model mappers
    ├─ domain:        use-cases + pure engines (Cycle, Projection, RecurringDetector,
    │                 SubscriptionAudit, Evaluation) + IngestionRules + FxConversion
    ├─ data:          service/repository ports
    └─ infra:         repositories (@effect/sql-pg), auth, parsers, mailer, config
    |            |               |
    v            v               v
Neon Postgres   S3 (uploads)    SES (email: verify/MFA/invite)
(RLS on)                        SSM (secrets)                     [secrets module]
                                EventBridge schedule → fx-rates fetch (daily, ECB)
```

One region, all serverless, near-zero idle cost. The backend "separation" is the strict BFF
presentation boundary over an in-process DDD core (C2=A), extractable later without touching
domain code.

## 2. Effect application architecture

Composition of Effect `Layer`s providing services (`Context.Tag`s), executed by one
`ManagedRuntime` reused across warm invocations.

- **No try/catch, exhaustive errors.** Every fallible operation is `Effect<A, E, R>` with a
  **typed error union**; failures are tagged (`Data.TaggedError`). Handlers discharge errors with
  exhaustive `catchTags`; unexpected defects are caught at the boundary (§10).
- **DI via `Layer`:** `SqlClient` (Neon) → repositories → domain services → presentation. Config
  via `Config`/`ConfigProvider` from SSM/env.
- **`effect/Schema` everywhere** (replaces Zod): DTOs, request/response contracts, DB row
  decoders, error shapes; OpenAPI derived from HttpApi schemas.
- **Identifiers are English** (§4). Portuguese remains only in user-facing **content** (category
  names the user types, pt locale strings) — never in code, columns, or API fields.
- **Runtime on Lambda:** served via `@effect-aws/lambda` (`LambdaHandler.fromHttpApi`); the RPC
  endpoint via `RpcServer.toHttpApp` → `HttpApp.toWebHandler`. Verify adapter at implementation.

### Clean Architecture layers (nosko lineage, Effect-flavoured)

```
backend/src/
  domain/
    models/        Schema entities + value objects (Money, Currency, CycleKey, Locale)
    usecases/      port interfaces for application use-cases
    services/      pure engines: CycleEngine, ProjectionEngine, RecurringDetector,
                   SubscriptionAuditEngine, EvaluationEngine, IngestionRules, FxConversion
    errors/        tagged errors
  data/
    usecases/      use-case implementations orchestrating ports (Effect)
    protocols/     repository/service port tags
  infra/
    repositories/  @effect/sql-pg implementations (per-request transaction + RLS settings)
    auth/          password hashing, TOTP, tokens
    fx/            ECB rate fetcher
    parsers/       per-bank statement parsers (ING/Revolut/Amex/Nubank/C6)
    mailer/        SES adapter (localised templates)
    config/        Config layer (SSM/env) + household settings loader
  presentation/
    rpc/           per-section groups + view-model mappers (formatting/localisation hints)
    http/          HttpApi groups (OpenAPI/Swagger)
  main/            layers.ts, runtime.ts, handler.ts (Lambda entry + top-level error boundary)
  test/            Jest (@swc/jest) unit + integration
```

Dependencies point inward: `presentation → data → domain`; `infra` implements ports; `main`
wires layers. Domain has zero infra imports.

## 3. BFF: RPC + HttpApi in one Lambda (C1=C)

- **Frontend↔BFF: `@effect/rpc`** — `Schema`-defined requests/responses grouped **per section**:
  `auth`, `household`, `accounts`, `cycles`, `bills`, `payments`, `goals`,
  `savings`/`projection`, `subscriptions`, `evaluations`, `ingestion`, `settings` (see
  `user-stories.md` for the actions per section). `RpcGroup.make(Rpc.make("CycleById", { success, error, payload }))`;
  handlers via `Group.toLayer`; typed client via `RpcClient.make`. Responses are **frontend-ready
  view models** (computed figures, formatting hints), so the client renders directly.
- **Documented surface: `@effect/platform` `HttpApi`** — `HttpApiGroup` per section → OpenAPI +
  Swagger. Same domain services back both channels.
- **Middleware** validates the session, loads member + household + **household settings**, and
  opens the per-request transaction that sets `app.user_id` / `app.household_id` for RLS (§11.1).
- **Scope discipline:** `@effect/rpc` is the only channel the web client uses. `HttpApi` groups
  are added only for operations worth documenting externally (auth, ingestion, export); "both per
  section" is not a definition-of-done requirement.

## 4. Domain vocabulary (English identifiers)

All code, columns, and API fields use these English names. The Portuguese source terms are for
reference only; localisation of labels happens in the frontend i18n layer, not in code.

| Concept (pt, money-evaluation) | English identifier |
|---|---|
| ciclo | cycle |
| renda / salários | income / salaries |
| bônus | bonus |
| contas fixas / fixas | fixedBills / fixedTotal |
| gastos (variáveis) | expenses / variableTotal |
| categoria | category |
| reserva | reserve |
| estimativa | estimate |
| disponível | available |
| orçamento variável | variableBudget |
| saldo inicial | openingBalance |
| saque | withdrawal (member transfer `to_personal`, user-defined) |
| aporte p/ casa | contribution (member transfer `to_household`) |
| disponível após pagamentos | availableAfterPayments |
| sobra / falta | surplus (signed) |
| por categoria | byCategory |
| pagamentos compartilhados | sharedPayments |
| participação na renda | contributionShare (income %) |
| conta conjunta | joint account (ownership `joint`, two owners) |
| teto | estimate (cycle) / cap (category) |
| meta / cofre | goal / vault |
| assinaturas | subscriptions |
| conta (visibilidade) | account (visibility: personal / shared) |
| resumo | summary |
| pode gastar €X/dia | dailyAllowance |

This table is the source of truth for naming and is copied into `backend/CONVENTIONS.md` and a
`documentation/glossary.md` at implementation start (§13, and the agreements map).

## 5. Domain spec: the Cycle Engine (configurable, parity with money-evaluation)

`CycleEngine` is **pure**, computing a cycle's derived figures from raw inputs plus the previous
cycle's outputs (cycles ordered by `startDate`). It implements the **proportional model**
(requirements § "How the household money flows"): income shares fund the joint account; fixed
bills, then the variable estimate and the reserve are covered; the remainder is the couple's to
spread by user-defined withdrawals. Formulas ported from `money-evaluation/_build_dataset.py`,
renamed to English (money in base-currency minor units; `sharedPayments` use `amountBase`):

```
income                 = sum(salaries) + bonus
contributionShare[m]   = salary[m] / income                      (0 if income = 0)
fixedTotal             = sum(fixedBills.amount)
estimate               = cycle.estimate ?? prev.variableTotal    (seed.estimate on the first cycle)
reserve                = cycle.reserve (default from household settings)
openingBalance         = seed.openingBalance if seeded else prev.surplus
availableAfterPayments = openingBalance + income - fixedTotal - estimate - reserve
withdrawal[m]          = user-defined input (member transfer to_personal; default 0)
contribution[m]        = user-defined input (member transfer to_household; default 0)
withdrawalTotal        = sum(withdrawal) - sum(contribution)
unallocated            = availableAfterPayments - withdrawalTotal   (stays in the joint account)
available              = openingBalance + income - withdrawalTotal
variableTotal          = sum(sharedPayments.amountBase)
totalSpent             = fixedTotal + variableTotal
surplus                = available - totalSpent
variableBudget         = available - fixedTotal
savingsRate            = surplus / income
byCategory             = sum(sharedPayments.amountBase) grouped by category, vs category caps
burnRate[day]          = cumulative variableTotal up to day, vs estimate * day / cycleDays
```

`prev` for the next cycle = `{ variableTotal, surplus }`. There is **no payer, split, or
settlement**: shared payments are household payments from joint accounts, and
`contributionShare` is informational. **Withdrawals are user-defined**, not computed — the engine
surfaces `availableAfterPayments` and each member records their own withdrawal.

**Configurable cycle boundary.** The 23rd→22nd rule is not hardcoded. Each household sets a
`cycleAnchorDay` (default 23). A cycle spans `[anchorDay of month M, (anchorDay − 1) of month
M+1]`, with day-clamping when `anchorDay` exceeds a month's length. `startDate`/`endDate` are
stored per cycle so a household can also override an individual cycle's dates. Current-cycle
detection returns the cycle whose `[startDate, endDate]` contains today;
`dailyAllowance = (estimate − variableTotal) / max(daysUntilEnd, 1)`. Engine tests assert parity
with the five existing money-evaluation cycles (anchor 23).

## 5.1 Domain spec: FX conversion and the Evaluation Engine

- `FxConversion` is pure: given `fx_rates` for a date (falling back to the latest earlier rate),
  it converts a `Money` to the base currency and returns `{ amountBase, rate }`. Applied once, when
  a non-base shared payment is confirmed (stored) and on read for display tiles (net worth, BRL
  balances). Cycle math never mixes currencies.
- `EvaluationEngine` is pure: from confirmed shared payments + fixed bills it builds the monthly
  inflow/outflow/net series, the category × month matrix with averages and vs-average deltas,
  biggest vendors, and recurring charges. Nothing is stored except optional `month_notes`.

## 6. Recurring detection & fixed-bill identification

Two paths satisfy "fixed bills identified automatically, or set by the user":

- **Auto:** `RecurringDetector` scans confirmed transactions for periodic same-matcher charges
  (monthly cadence, amount stable within tolerance) and proposes `recurring_rules`
  (`source = auto_detected`, with a confidence score). The user confirms to activate.
- **Manual:** the user marks any transaction or vendor as a fixed bill, creating a rule
  (`source = user_defined`, `isFixedBill = true`).

Active `isFixedBill` rules **generate `fixedBills` rows** when a cycle is created (carry-forward),
and matching **ingested transactions auto-mark the bill paid** (`paidOnDay` from the booked date).
Rules also act as **categorisation rules**: a matching expense is auto-assigned the rule's
category on ingestion (still user-overridable). This is the core of the configuration-first
behaviour (§9).

## 7. Domain spec: the Projection Engine

Reproduces `ComputeSavingsProjection`:

- **EUR two-phase:** monthly compounding; while `balance < reserveTarget`, grow at `annualRate/12`
  plus the monthly contribution; above the target, the excess compounds at `postReserveRate/12`.
  Emits the plan series + a "savings-only" comparison.
- **Box-3 wealth tax:** monthly deduct `wealthTaxRate/12 * max(balance − allowance, 0)`,
  compounding the drag; emits the net-of-tax series + total tax.
- **BR CDB:** single-rate model with its own contribution and a "contributions-only" comparison.
- Horizons 1/5/10/15/20/30/40/50y; milestone table; compact money formatting. Parameters come
  from `projection_settings` (overridable per request).

## 8. Ingestion pipeline (P2)

```
upload file (CSV; PDF for Amex/C6) ─► S3 (private) ─► statement_uploads(row) ─► parse (per-bank)
   ─► normalise to transactions ─► dedup (per-source identity, hash)
   ─► pair internal transfers (Wise EUR↔BRL / self between own accounts) as neutral;
      a personal→joint pair becomes a member contribution (shared leg visible, personal leg private)
   ─► route by account/IBAN to PERSONAL (private) or SHARED destination
   ─► rule-based categorisation (recurring rules + last category per counterparty) ─► review queue
   ─► user confirms/categorises
   ─► shared ─► shared_payment in the correct cycle (anchor boundary), amountBase via FxConversion;
      personal ─► private transaction
   ─► fixed-bill rule match ─► auto-mark the cycle's fixed bill paid
```

Parsers are `infra/parsers/*` returning `Effect<Transaction[], InvalidStatement>` (no try/catch;
malformed rows → tagged failures). A Nubank export may yield rows for two accounts (account +
card). **No bank sync — file import only.** Dedup uses `transactions.dedup_hash` (unique per
household). Transfer pairing implements the money-flow rules (Wise EUR↔BRL equivalence,
self-transfers, internal moves). **Account/IBAN routing** sends each transaction to the owner's
personal (private) space or to the household's shared payments. An LLM categoriser is an optional
later add-on behind the same `Categoriser` port.

## 9. Configuration-first design & i18n

- **Household settings** (one editable surface, `settings` RPC/HttpApi section): `cycleAnchorDay`,
  `locale` (default), `baseCurrency`, `defaultReserve`, fiscal params, plus links to the other
  configurable collections: `categories` + caps, `recurring_rules`, `projection_settings`.
- **Per-user preference:** `preferredLocale` (overrides household default in the UI),
  `user_settings.personalSpendCap`, personal categories; hide-values / last space are client-side.
- **Bilingual UI (en + pt-BR):** the frontend holds typed locale dictionaries; **no hardcoded
  user-facing strings**. The backend returns locale-neutral data + codes; money/date formatting
  and labels are localised on the client. Server-generated text (emails, and the summary/resumo)
  uses **localised templates** keyed by locale.
- Configurability is deliberately **concrete knobs**, not a speculative plugin framework
  (pragmatism over abstraction).

## 10. Total error-handling model ("really handle all errors")

Guarantee: **no error path is unhandled**, on the server or the client.

- **Typed unions:** every RPC/HttpApi endpoint declares its full error union in `Schema`; domain
  use-cases return tagged errors (`CycleNotFound`, `DuplicateTransaction`, `InvalidStatement`,
  `Unauthorized`, `ValidationError`, `SqlError`, …). The compiler enforces exhaustive handling.
- **Boundary catch-all:** the Lambda handler wraps the program with `Effect.catchAll` (known
  errors → typed, localisable client responses) **and** `Effect.catchAllCause` /
  `catchAllDefect` (unexpected defects → logged with a correlation id, returned as a generic
  `InternalError` carrying no internals). The handler never throws raw; it always returns a shaped
  response. The Effect runtime removes unhandled promise rejections by construction.
- **Validation:** `Schema` decode failures become a `ValidationError` with field-level detail
  (safe to show), not a 500.
- **Client:** the Effect client consumes success + typed error channels explicitly; a global UI
  error boundary + toasts handle defects; safe retries/backoff where idempotent. No `try/catch`
  and no bare `Promise.catch` anywhere (lint-enforced).
- **Observability:** errors logged via Effect's logger with tags + correlation id; **never** log
  balances, PII, or bank-file contents.

## 11. Auth architecture (custom, ported from nosko to Effect)

Signup → email verification (SES) → login → MFA (TOTP or email OTP; "remember this device" marks
the session `mfa_trusted_until` ≤ 30 days) → access token (short-lived) + refresh token
(`user_sessions`); argon2id hashing (`@node-rs/argon2`, bundled for the Lambda platform). Password
reset can revoke all other sessions. **Household linking (C5=A):** owner creates a household,
invites the partner by email (`household_invitations`, tokenised link), partner accepts as member;
a household has at most two members. All data scoped by `household_id`; per-member attribution
preserved. Authorization enforced in BFF middleware and again at the database (§11.1).

## 11.1 Visibility & isolation (mandatory RLS)

**By design, each member's personal data is hidden from the other member** — enforced by the
application and by mandatory RLS, not by cryptography (there is no cryptographic isolation
between the two partners; a database administrator can read everything). The cryptographic
concern is a separate, narrower one: outsiders and a compromised client, addressed by encryption
at rest/in transit, below. Every financial row carries `owner_user_id` + `visibility`
(`personal` | `shared`); joint accounts add `co_owner_user_id`. The BFF middleware opens one
transaction per request and runs `select set_config('app.user_id', $1, true)` (and
`app.household_id` when known) — `set_config(..., true)` behaves like `SET LOCAL` but, unlike a
literal `SET`, accepts a bound parameter (Neon's pooled endpoint is PgBouncer in transaction mode,
so a plain session `SET` would not be reliable either way). **Row-Level Security is enabled and
forced on every financial table**: shared rows are visible to the household, personal rows only
to their owner, accounts to owner or co-owner; policies guard the GUC read with
`nullif(current_setting(...), '')` since a reset custom GUC reverts to `''`, not `NULL`. Crucially,
the runtime role (`app_role`) is created by SQL inside the migrations and is genuinely
`NOSUPERUSER NOBYPASSRLS` with table-level grants only — **not** the Neon console/CLI-created
role, which inherits `neon_superuser` (`BYPASSRLS`) and would silently skip every policy. See
`design/database-design.md` § Access and `iac/README.md` for the two-connection-string setup this
requires (`migration-v1` as the admin role, `bff-v1` as `app_role`). Repositories repeat the
filters explicitly (defence in depth), and integration tests assert that a partner never receives
personal rows. Data at rest is protected by Neon and S3 encryption against outsiders/compromise;
no application-level envelope encryption and no client-side E2EE (the UI's "cofre / E2E" copy is
dropped). No bank sync means no third-party account tokens to store.

## 11.2 Session delivery: httpOnly cookies, never client-stored tokens

The access and refresh tokens issued by `data/usecases/Sessions.ts` (§11) never reach browser
JavaScript. The web client does not store or attach a token; it only ever calls `fetch` with
`credentials: "include"`.

- **Access token** (`jose` JWT, 15 min TTL): set as an `httpOnly`, `Secure`, `SameSite=Strict`
  cookie (`nosko_at`), `path=/`, `Max-Age` matching the token TTL, on every `login` /
  `mfaVerify` / `refresh` response. `@effect/rpc`'s middleware for every non-auth group
  (`accounts`, `cycles`, …) reads it straight from the request's `Cookie` header — there is no
  `Authorization` header anywhere in this app.
- **Refresh token** (opaque, 30 day TTL): set the same way as `nosko_rt`, but scoped to
  `path=/api/http/auth` — the only endpoints that ever need to read it (`refresh`, `logout`,
  `revokeSession`). Narrower path means it is never sent alongside ordinary RPC calls.
- **Why the 4 cookie-writing auth endpoints (`login`, `mfaVerify`, `refresh`, `logout`) live in
  the `auth` `HttpApi` group, not `@effect/rpc`:** `@effect/platform` ships a matching primitive,
  `HttpApiSecurity.apiKey({ in: "cookie" })` + `HttpApiBuilder.securitySetCookie`, purpose-built
  for reading/writing an httpOnly session cookie from a typed handler. `login`/`mfaVerify`/
  `refresh` set `nosko_at` (+ `nosko_rt` for `login`/`mfaVerify`); `logout` clears both
  (`Max-Age=0`). Every other use-case in `auth` (signup, verify, resend, passwordReset,
  listSessions, revokeSession, revokeAllSessions) and all of `household` stay on `@effect/rpc` as
  usual — they only ever *read* the session, which `RpcMiddleware` does from the `Cookie` header
  it already receives. Revoking a session (including the caller's own current one) still works
  without touching the cookie: the next request simply fails auth once the session row is gone.
- **CSRF:** same-origin only (CloudFront proxies `/api/*` to the same distribution as the SPA, so
  there is no cross-origin case to support) plus `SameSite=Strict` means the cookie is never sent
  on a cross-site request, and every mutating call is JSON (`Content-Type: application/json`),
  which a cross-site `<form>` cannot forge. No separate CSRF token scheme.
- Session cookie names/options live in one place (`infra/auth/SessionCookies.ts`) so the two
  read sites (`RpcMiddleware`, the `auth` HttpApi group) and the two write sites (`login`/
  `mfaVerify`/`refresh` handlers, `logout`/`revokeSession` handlers) never drift.

## 12. Infrastructure as Code (Terraform, nosko modules)

Reuse nosko's capability modules (`compute/aws-lambda`, `api-routing/aws-apigw-v2`,
`secrets/aws-ssm`, `static-site/aws-s3-cloudfront`, `storage/aws-s3-private`) + Neon connection
in SSM. Environments `iac/environments/{test,prod}` (`test` deployed at U1; `prod` at U15); the
`nosko.app` domain is attached later from the management account. Region **eu-west-1**. Still to
add: an EventBridge schedule invoking the BFF (or a small Lambda) for the daily FX fetch (U5), and
SES sender/recipient verification (U3). Secrets in SSM, never in code.

## 13. Repository layout (monorepo)

```
nosko/
  backend/     Effect BFF + domain/data/infra (single deployable)  + CONVENTIONS.md
  web/         React + Vite + Tailwind + Effect client + locales/   + CONVENTIONS.md
  iac/         Terraform (modules + environments)                   + CONVENTIONS.md
  packages/contracts/   shared Schema + Rpc definitions (backend + web) + README
  documentation/        DLC artifacts (this folder) + glossary.md
```

`packages/contracts` gives end-to-end type safety (web imports the exact BFF types). The
per-directory `CONVENTIONS.md`/`README.md` split is specified in
`documentation/repo-structure-and-agreements.md`. On the web, RPC calls run through a small
`useRpc` hook (Effect program → React state: loading / typed error / value) chosen at U8; no
extra data-fetching library.

## 14. Testing strategy (strict, 100% coverage)

Runner: **Jest with `@swc/jest`** (SWC/Rust transform for fast TS test execution) across backend
and web — no Vitest. Effect programs are exercised with `Effect.runPromise`/`runPromiseExit` (a
small local `it.effect`-style helper stands in for `@effect/vitest`, which is Vitest-specific).

- **Unit** (all logic): Cycle Engine (parity with the proportional model), Projection Engine,
  RecurringDetector, **SubscriptionAuditEngine**, **EvaluationEngine**, FxConversion,
  IngestionRules (dedup/routing/transfer-pairing), parsers (fixtures), auth token logic, view-model
  mappers, i18n dictionary completeness.
- **Integration:** repositories against a disposable Postgres (local Docker `postgres:17` in CI
  and dev; RLS policies applied by the same migrations), including **privacy tests** (a partner's
  session never receives personal rows; RLS blocks a raw query without `app.user_id`).
  **Contract:** RPC/HttpApi schema round-trips + OpenAPI snapshot. **Web:**
  `@testing-library/react` + `jsdom` under the same Jest/`@swc/jest`.
- **Coverage: 100%** thresholds (statements/branches/functions/lines), **CI-enforced**. A minimal,
  documented exclusion list covers non-logic glue (Lambda entrypoint, layer wiring, config,
  generated types), which is exercised by integration tests instead — so 100% is a real gate on
  logic, not a vanity metric.
- Synthetic fixtures only — never real balances/PII.

## 15. Technology + versions

Backend: `effect`, `@effect/platform`, `@effect/platform-node`, `@effect/experimental`,
`@effect/rpc`, `@effect/sql`, `@effect/sql-pg`, `@effect-aws/lambda`, `pg`; `hash-wasm` (argon2id
password hashing — WASM, so no platform-specific native binary to bundle for Lambda, unlike
`@node-rs/argon2`), `otpauth` (TOTP), `jose` (JWT; ships ESM-only, needs a
`transformIgnorePatterns` entry for Jest — see `backend/CONVENTIONS.md`), `@aws-sdk/client-sesv2`
(mailer); `@electric-sql/pglite` (dev, embedded-Postgres migration/RLS check); **TypeScript 7**
(GA; native compiler shipped as `tsc`) for type-checking; **SWC** (`@swc/core`) for
transpile/emit; **Jest + `@swc/jest`** for tests; Node 24 locally (Lambda runtime pinned at U1).
Frontend: `effect`, `@effect/rpc` client, React
19, Vite (`@vitejs/plugin-react-swc`), Tailwind 4, typed i18n; Jest + `@swc/jest` +
`@testing-library/react` + `jsdom`. DB: Neon (pooled endpoint for Lambda). IaC: Terraform. Effect
pinned to one unified version line (v3 stable `3.22.x` at U0; v4-beta not used); exact versions
pinned (no `^`/`~`).

TypeScript 7 note: TS 7 is **GA** and pinned at `7.0.2`; the native compiler ships as the `tsc`
binary (so `tsc` here is TS 7, not the legacy compiler). Verified against Effect's advanced types
at U0 — all packages type-check clean. SWC is used everywhere for transpile/emit and, via
`@swc/jest`, for the test transform.

## References

- `@effect/rpc` API: https://github.com/Effect-TS/effect/blob/main/packages/rpc/README.md
- Effect HttpApi on Lambda: https://github.com/floydspace/effect-aws/blob/main/packages/lambda/README.md
