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
    ├─ domain:        use-cases + pure engines (Cycle, Split/Settlement, Projection,
    │                 RecurringDetector, SubscriptionAudit) + IngestionRules
    ├─ data:          service/repository ports
    └─ infra:         repositories (@effect/sql-pg), auth, parsers, mailer, config
    |            |               |
    v            v               v
Neon Postgres   S3 (uploads)    SES (email: verify/MFA/invite)
                                SSM / Secrets Manager (secrets)   [secrets module]
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
    services/      pure engines: CycleEngine, SplitSettlementEngine, ProjectionEngine,
                   RecurringDetector, SubscriptionAuditEngine, IngestionRules
    errors/        tagged errors
  data/
    usecases/      use-case implementations orchestrating ports (Effect)
    protocols/     repository/service port tags
  infra/
    repositories/  @effect/sql-pg implementations
    auth/          password hashing, TOTP, tokens
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
  `auth`, `household`, `accounts`, `cycles`, `bills`, `payments`/`ledger`, `goals`,
  `savings`/`projection`, `subscriptions`, `evaluations`, `ingestion`, `settings` (see
  `user-stories.md` for the actions per section). `RpcGroup.make(Rpc.make("CycleById", { success, error, payload }))`;
  handlers via `Group.toLayer`; typed client via `RpcClient.make`. Responses are **frontend-ready
  view models** (computed figures, formatting hints), so the client renders directly.
- **Documented surface: `@effect/platform` `HttpApi`** — `HttpApiGroup` per section → OpenAPI +
  Swagger. Same domain services back both channels.
- **Middleware** validates the session, loads member + household + **household settings**, and
  sets the household scope for repositories.

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
| saque | withdrawal (user-defined) |
| disponível após pagamentos | availableAfterPayments |
| sobra / falta | surplus (signed) |
| por categoria | byCategory |
| pagamentos compartilhados | sharedPayments (couple ledger) |
| rateio | split (equal / proportional / custom) |
| acerto | settlement |
| meta / cofre | goal / vault |
| assinaturas | subscriptions |
| conta (visibilidade) | account (visibility: personal / shared) |
| resumo | summary |
| pode gastar €X/dia | dailyAllowance |

This table is the source of truth for naming and is copied into `backend/CONVENTIONS.md` and a
`documentation/glossary.md` at implementation start (§13, and the agreements map).

## 5. Domain spec: the Cycle Engine (configurable, parity with money-evaluation)

`CycleEngine` is **pure**, computing a cycle's derived figures from raw inputs plus the previous
cycle's outputs (cycles ordered by `startDate`). Formulas ported from
`money-evaluation/_build_dataset.py`, renamed to English (money in minor units):

```
income          = sum(salaries) + bonus
pct[member]     = salary[member] / income          (0 if income = 0)
fixedTotal      = sum(fixedBills.amount)
variableTotal   = sum(expenses.amount)
reserve         = cycle.reserve (default from household settings)
estimate        = seed.estimate        if seeded else prev.variableTotal
estimate               = seed.estimate if seeded else prev.variableTotal
availableAfterPayments = openingBalance + income - fixedTotal - variableTotal - reserve
withdrawal[member]     = user-defined input (set after seeing availableAfterPayments; default 0)
withdrawalTotal        = sum(withdrawal)
openingBalance  = seed.openingBalance if seeded else prev.surplus
available       = openingBalance + income - withdrawalTotal
totalSpent      = fixedTotal + variableTotal
surplus         = available - totalSpent
variableBudget  = available - fixedTotal
byCategory      = sum(sharedPayments.amount) grouped by category
```

`prev` for the next cycle = `{ variableTotal, surplus }`. **Withdrawals are user-defined**, not
computed — the engine surfaces `availableAfterPayments` and each member sets their own withdrawal.

**Configurable cycle boundary.** The 23rd→22nd rule is not hardcoded. Each household sets a
`cycleAnchorDay` (default 23). A cycle spans `[anchorDay of month M, (anchorDay − 1) of month
M+1]`, with day-clamping when `anchorDay` exceeds a month's length. `startDate`/`endDate` are
stored per cycle so a household can also override an individual cycle's dates. Current-cycle
detection returns the cycle whose `[startDate, endDate]` contains today;
`dailyAllowance = (estimate − variableTotal) / max(daysUntilEnd, 1)`. Engine tests assert parity
with the five existing money-evaluation cycles (anchor 23).

## 5.1 Domain spec: the Split/Settlement Engine (the couple ledger)

`SplitSettlementEngine` is **pure**. For each **shared payment** it computes the per-member owed
`share` from the `split` method — `equal` (½ each), `proportional` (by the cycle income %), or
`custom` (given shares) — with the remainder cent assigned deterministically so shares sum exactly
to the amount. Over a cycle it computes, per member, `paid` (sum where `payer = member`) and `owed`
(sum of shares); the **inter-partner balance** = `paid − owed`. The **suggested settlement** is the
single transfer `from` the negative-balance member `to` the positive one for `|balance|`, which
zeroes the ledger. Splits affect **only the household's monthly shared payments**; recorded
`settlements` (acertos) persist and reset the balance. Property tests: shares sum to the amount;
the suggested settlement drives the balance to 0.

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
   ─► pair internal transfers (Wise EUR↔BRL / self between own accounts) as neutral
   ─► route by account/IBAN to PERSONAL (private) or SHARED destination
   ─► AI-assisted categorisation + apply recurring/categorisation rules ─► review queue (staged)
   ─► user confirms/categorises
   ─► shared ─► shared_payment in the correct cycle (anchor boundary); personal ─► private vault
   ─► fixed-bill rule match ─► auto-mark the cycle's fixed bill paid
```

Parsers are `infra/parsers/*` returning `Effect<Transaction[], InvalidStatement>` (no try/catch;
malformed rows → tagged failures). **No bank sync — file import only.** Dedup uses
`transactions.dedup_hash` (unique per household). Transfer pairing implements the money-flow rules
(Wise EUR↔BRL equivalence, self-transfers, internal moves). **Account/IBAN routing** sends each
transaction to the owner's personal (private) space or the shared couple ledger.

## 9. Configuration-first design & i18n

- **Household settings** (one editable surface, `settings` RPC/HttpApi section): `cycleAnchorDay`,
  `locale` (default), `baseCurrency`, `reserveDefault`, plus links to the other configurable
  collections: `categories`, `recurring_rules`, `projection_settings`.
- **Per-user preference:** `preferredLocale` (overrides household default in the UI).
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

Signup → email verification (SES) → login → MFA (TOTP or email OTP) → access token (short-lived)
+ refresh token (`user_sessions`); argon2id hashing. **Household linking (C5=A):** owner creates
a household, invites the partner by email (`household_invitations`), partner accepts as member.
All data scoped by `household_id`; per-member attribution preserved. Authorization enforced in
BFF middleware and again at the repository layer (household filter / optional RLS GUC).

## 11.1 Visibility & personal-data encryption

Every financial row carries `owner_user_id` + `visibility` (`personal` | `shared`). The BFF sets
the caller's `user_id`/`household_id`; **shared** reads filter `visibility='shared' AND
household_id=…`; **personal** reads additionally require `owner_user_id = caller`. Personal rows
are **never** joined into a partner's response — repository tests assert this. Sensitive columns on
personal rows (descriptions, counterparties, balances, notes) are **encrypted at rest** via a KMS
**envelope** (per-household data key; `enc_*` + `enc_dek_id` columns), decrypted only for the owner
in an `infra/crypto` adapter. This is the model behind the UI's "cofre / E2E" language; it is
**not** client-side zero-knowledge (the BFF still computes personal projections/audits). No bank
sync means no third-party account tokens to store.

## 12. Infrastructure as Code (Terraform, nosko modules)

Reuse nosko's capability modules (`compute/aws-lambda`, `api-routing/aws-apigw-v2`,
`secrets/aws-ssm`, `static-site/aws-s3-cloudfront`) + an uploads S3 bucket and Neon connection in
SSM. Environments `iac/environments/{test,prod}`; shared domain + ACM in the existing
`personal/terraform` repo. Region `eu-central-1` or `eu-west-1` (decide at infra setup). Secrets
in SSM/Secrets Manager, never in code.

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
`documentation/repo-structure-and-agreements.md`.

## 14. Testing strategy (strict, 100% coverage)

Runner: **Jest with `@swc/jest`** (SWC/Rust transform for fast TS test execution) across backend
and web — no Vitest. Effect programs are exercised with `Effect.runPromise`/`runPromiseExit` (a
small local `it.effect`-style helper stands in for `@effect/vitest`, which is Vitest-specific).

- **Unit** (all logic): Cycle Engine (parity), **Split/Settlement Engine** (shares sum;
  settlement zeroes balance), Projection Engine, RecurringDetector, **SubscriptionAuditEngine**,
  IngestionRules (dedup/routing/transfer-pairing), parsers (fixtures), auth token logic, view-model
  mappers, i18n dictionary completeness.
- **Integration:** repositories against a disposable Postgres, including **privacy tests**
  (personal rows returned only to the owner; KMS round-trip). **Contract:** RPC/HttpApi schema
  round-trips + OpenAPI snapshot. **Web:** `@testing-library/react` + `jsdom` under the same
  Jest/`@swc/jest`.
- **Coverage: 100%** thresholds (statements/branches/functions/lines), **CI-enforced**. A minimal,
  documented exclusion list covers non-logic glue (Lambda entrypoint, layer wiring, config,
  generated types), which is exercised by integration tests instead — so 100% is a real gate on
  logic, not a vanity metric.
- Synthetic fixtures only — never real balances/PII.

## 15. Technology + versions

Backend: `effect`, `@effect/platform`, `@effect/platform-node`, `@effect/rpc`, `@effect/sql`,
`@effect/sql-pg`, `@effect-aws/lambda`; **TypeScript 7** (GA; native compiler shipped as `tsc`)
for type-checking; **SWC** (`@swc/core`) for transpile/emit; **Jest + `@swc/jest`** for tests;
Node 24 locally (Lambda runtime pinned at U1). Frontend: `effect`, `@effect/rpc` client, React
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
