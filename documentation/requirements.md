# Requirements — nosko

Derived from `reverse-engineering.md` (functional scope from money-evaluation) plus the locked
answers in `state.md`. IDs are referenced by the design and the implementation plan.

## Personas

- **Marcelo** — primary user, technical, in the Netherlands. Earns in EUR (PostNL), maintains BR
  accounts (Nubank/C6) and investments.
- **Gabriele** — partner, second household member. Contributes EUR income into the joint budget.
- Both are **normal, independent users** who sign up separately and **link** into one household.
  No single shared login.

## Goals

- Replace the hand-maintained `money-evaluation` (`source.json` + static dashboard) with a real,
  private, multi-user web app on AWS.
- Reproduce money-evaluation's proven functionality: couple budgeting cycles, fixed-bill
  tracking, variable-spend categorisation, spend/subscription evaluations, savings + projections,
  and the WhatsApp summary (the "resumo").
- Support EUR (base) and BRL from day one, with the Brazil side (accounts, cards, CDB) fully in
  scope for v1.

## Scope

In scope (v1, delivered in phases): everything in the Functional Requirements below.

Out of scope (v1): mobile app (planned later), automated open-banking aggregation (ingestion is
file-upload + manual), importing the legacy `source.json` history (start empty), admin/multi-
household tenancy beyond the two users' single household.

## Delivery phases

| Phase | Theme | Requirements |
|---|---|---|
| P1 | Foundation + core budget loop | Infra baseline, auth + household, cycles, fixed bills, variable spend, Overview + Cycles UI (manual entry) |
| P2 | Ingestion | Statement upload + per-bank parsers, dedupe, transfer-linking, confirm-to-expense |
| P3 | Evaluations | Spend/subscription analysis views |
| P4 | Savings + projections | Savings accounts/events, EUR two-phase + Box-3 projection, BR CDB, brokerage holdings |
| P5 | Summary + BR completion + polish | WhatsApp summary, finalise BR accounts/cards, hardening |

Multi-currency (EUR + BRL) is present in the data model from P1. "Full BR support" (Q10) is
threaded across P2 (Nubank/C6 parsers), P4 (C6 CDB, BR holdings), and P5.

---

## Functional Requirements

### Auth & Household (FR-AUTH) — P1

- FR-AUTH-1: Users sign up with email + password; email verification required before full access.
- FR-AUTH-2: Login with email + password; **MFA** (TOTP or email OTP) as a second factor.
- FR-AUTH-3: Password reset and email re-verification flows.
- FR-AUTH-4: Session management (short-lived access token + refresh token; revticable).
- FR-AUTH-5: A user can **create a household** (becomes owner) with a base currency (EUR).
- FR-AUTH-6: The owner **invites the partner by email**; the partner accepts to join the
  household as a member (per C5=A).
- FR-AUTH-7: Household members share all household data (cycles, bills, expenses, savings,
  evaluations). Per-member attribution is preserved (income split, withdrawals).
- FR-AUTH-8: Every data operation is scoped to the caller's household; no cross-household access.

### Budgeting Cycles (FR-CYC) — P1

- FR-CYC-1: Cycles run on a **configurable anchor day** (default 23), spanning `[anchorDay of
  month M, (anchorDay − 1) of month M+1]` with day-clamping; per-cycle date overrides allowed.
  The 23rd→22nd behaviour is the default, not a hardcode.
- FR-CYC-2: Per cycle, capture raw inputs: per-member salaries + bonus; `reserve` (default 100);
  optional `seed` (`estimate`, per-member `actualWithdrawal`, `openingBalance`) for the
  first/new cycle.
- FR-CYC-3: The system **computes derived figures** exactly as money-evaluation's builder does
  (see design's Cycle Engine): income total + per-member pct split; `fixedTotal`,
  `variableTotal`, `byCategory`; chained `estimate`; `totalToReserve`; `suggestedWithdrawal` per
  member; `available`; `variableBudget`; `surplus`; `nextSuggestedWithdrawal`.
- FR-CYC-4: Cycles **chain**: a cycle's `estimate` defaults to the previous cycle's actual
  variable spend, and its `openingBalance` to the previous cycle's `surplus`. Derived figures are
  never hand-edited.
- FR-CYC-5: Detect the **current cycle** (the cycle whose 22nd-end contains today) and surface a
  "can spend €X/day for the remaining days" figure.
- FR-CYC-6: Create the next cycle by scaffolding from the current one (carry forward fixed bills
  as unpaid, seed estimate/openingBalance).
- FR-CYC-7: The 22nd/23rd boundary rule: spend dated the 22nd belongs to the closing cycle.

### Fixed Bills (FR-BILL) — P1

- FR-BILL-1: Per cycle, a list of fixed bills (`label`, `value`, `paid`, `paidOn`, optional
  itemised sub-lines).
- FR-BILL-2: Mark a bill paid/unpaid with a paid-on day; marking paid must **not** change
  `surplus` (it is already in `fixedTotal`).
- FR-BILL-3: "Situação atual" summary: N/M paid, total paid vs total remaining.
- FR-BILL-4: Recurring NL obligations are the default carry-forward set (rent, CZ health,
  Eneco, Odido, Waternet/Waterschap, Swapfiets, De Unie, ING fee, card auto-debits).
- FR-BILL-5: **Automatic identification** — the app detects recurring charges from transactions
  (periodic same-vendor, stable amount) and proposes them as fixed bills for the user to confirm.
- FR-BILL-6: **Manual identification** — the user can mark any transaction or vendor as a fixed
  bill. Both paths create a reusable recurring rule.
- FR-BILL-7: Active fixed-bill rules generate each new cycle's fixed bills (carry-forward), and a
  matching ingested transaction **auto-marks the bill paid**.

### Variable Spend / Expenses (FR-VAR) — P1

- FR-VAR-1: Per cycle, variable expenses (`description`, `amount`, `category`, `day`).
- FR-VAR-2: Categories are configurable; defaults seeded by locale (pt: Mercado/Lazer/Outros;
  en: Groceries/Leisure/Other).
- FR-VAR-3: `byCategory` totals and variable total are computed.
- FR-VAR-4: Manual add/edit/delete of expenses is always available (independent of ingestion).
- FR-VAR-5: An expense may originate from a confirmed ingested transaction (link preserved).

### Ingestion (FR-ING) — P2

- FR-ING-1: Upload statement files per institution: ING (CSV), Revolut (CSV), Amex (PDF, password
  `089862`), Nubank account + credit (CSV), C6 (PDF, password `089862`).
- FR-ING-2: Per-bank parsers normalise rows into transactions (date, description, counterparty,
  amount, currency, direction) using the documented schema crib-notes.
- FR-ING-3: **Deduplicate** using each source's identity rule (e.g. ING: date + amount +
  description + resulting balance; Nubank account: UUID; Amex: statement close-date; etc.).
- FR-ING-4: Detect and **link self-transfers** (Wise EUR↔BRL, "MARCELO SAVIAN" counterparty,
  Revolut internal moves) so they are not double-counted as spend and income.
- FR-ING-5: Only **joint ING** transactions feed household variable spend; personal cards
  (Amex/Revolut) feed evaluations, not the cycle budget.
- FR-ING-6: Review queue: user confirms/categorises staged transactions before they persist;
  confirming a household variable transaction creates a linked expense in the right cycle
  (respecting the 22nd boundary).
- FR-ING-7: Overlapping re-exports must not create duplicates; the newer CSV is authoritative
  over a screenshot/PDF for the same window.
- FR-ING-8: Uploaded files are stored (S3) as an audit trail; parsing failures are surfaced.

### Evaluations (FR-EVAL) — P3

- FR-EVAL-1: Monthly summary: inflow, outflow, net per month.
- FR-EVAL-2: Category matrix across months with computed `avg` and `latestVsAvg`.
- FR-EVAL-3: Per-month narrative: top categories, biggest vendors, recurring subscriptions,
  watch items, suggestions, notes.
- FR-EVAL-4: Subscription audit view (the FINDINGS.md lens): recurring charges, duplicates
  across countries, cancellation candidates.

### Savings & Projections (FR-SAV) — P4

- FR-SAV-1: EUR savings account: current balance, annual rate, rate history, events
  (deposit/withdrawal/interest with running balance), monthly rollups (derived).
- FR-SAV-2: Brazil C6 CDB: current balance, `liquidoResgate`, `totalInvestido`, annual rate,
  monthly contribution.
- FR-SAV-3: Brokerage holdings (`otherHoldings`): named positions with currency, quantity,
  value, note.
- FR-SAV-4: **EUR projection engine**: two-phase emergency-fund model (grow at savings rate to a
  configurable **reserve target**, default €24k; excess compounds at a configurable
  **post-reserve stock return**, default 10%), plus **NL Box-3 wealth-tax** modelling
  (~2.16%/yr above ~€57k allowance, deducted monthly) producing a net-of-tax line.
- FR-SAV-5: Projection controls: horizon 1/5/10/15/20/30/40/50 years, contribution slider,
  reserve-target + post-reserve-rate sliders, comparison line, milestone table, compact money
  formatting for large values.
- FR-SAV-6: **BR CDB projection**: single-rate model with its own contribution slider and
  "só aportes" comparison.

### Summary / resumo (FR-RES) — P5

- FR-RES-1: Generate a WhatsApp-ready text summary of the current cycle (renda, contas fixas,
  variable used vs estimated, "livres", €/day for remaining days, top variable categories).
- FR-RES-2: One-click copy to clipboard.

### Cross-cutting product (FR-X)

- FR-X-1: Multi-currency: amounts stored in source currency; convert only for comparison. EUR is
  household base; BRL secondary. (P1 model, used throughout.)
- FR-X-2: **Fully bilingual UI — English and Portuguese (pt-BR)**, user-switchable, with a
  household default locale and a per-user override. No hardcoded user-facing strings; server text
  (emails, summary) is localised via templates. (P1 baseline.)
- FR-X-3: Web dashboard, **rebuilt from scratch** (C4=B) in React + Effect, covering Overview,
  Cycles, Evaluations, Savings, and summary. Same feature set, fresh components.
- FR-X-4: A documented internal API surface (OpenAPI/Swagger) alongside the typed RPC channel.
- FR-X-5: **Configuration-first** — a settings surface exposes the configurable knobs: cycle
  anchor day, locale, base currency, reserve default, categories, recurring/fixed-bill rules, and
  projection parameters. Configurability is concrete knobs, not a speculative plugin framework.
- FR-X-6: **English code identifiers** — all code, database columns, and API fields use English
  names (see architecture §4 vocabulary); Portuguese appears only in user-facing content/locale.

---

## Non-Functional Requirements

### Security & privacy (NFR-SEC)

- NFR-SEC-1: Every endpoint authenticated; all data scoped to the caller's household (defence in
  depth: application scoping + Postgres row filtering by household).
- NFR-SEC-2: Passwords hashed (argon2/bcrypt); MFA required; tokens short-lived + revocable.
- NFR-SEC-3: Secrets in AWS SSM/Secrets Manager; never in code or logs. Bank-file passwords and
  financial data never logged.
- NFR-SEC-4: Encryption in transit (TLS) and at rest (Neon-managed, S3 SSE).
- NFR-SEC-5: Uploaded statements in a private S3 bucket; least-privilege IAM.

### Cost (NFR-COST)

- NFR-COST-1: Minimise running cost for a two-user app. Serverless (Lambda), Neon free tier,
  S3 + CloudFront, SES. Target near-zero idle cost.

### Performance & availability (NFR-PERF)

- NFR-PERF-1: Read endpoints p95 < 500 ms at this data scale (handful of cycles, thousands of
  transactions). Cold starts acceptable.
- NFR-PERF-2: Single AWS region (candidate `eu-central-1` or `eu-west-1` — confirm at infra
  setup). Best-effort availability; no multi-region.

### Technical constraints (NFR-TECH)

- NFR-TECH-1: **Effect** used idiomatically end-to-end (backend + frontend). `Effect<A, E, R>`,
  `Layer`/`Context` for DI, tagged errors (`Data.TaggedError`). **No try/catch** — all failures
  flow through the Effect error channel.
- NFR-TECH-2: **DDD / Clean Architecture** layering from nosko (domain / data / infra /
  handlers), implemented with Effect services and layers.
- NFR-TECH-3: **Effect `Schema`** is the single contract/validation language (replaces Zod),
  used for API contracts, encode/decode, and OpenAPI derivation.
- NFR-TECH-4: **BFF**: `@effect/rpc` for the typed, per-section frontend↔BFF channel **and**
  `@effect/platform` `HttpApi` for the documented internal API surface, both served from one
  layered Lambda (C1=C, C2=A).
- NFR-TECH-5: **Database** PostgreSQL on Neon, accessed via `@effect/sql-pg`; SQL migrations.
- NFR-TECH-6: **IaC** Terraform, reusing nosko's cloud-agnostic capability modules
  (compute/api-routing/secrets/static-site) + shared domain/ACM repo.
- NFR-TECH-7: **Frontend** React 19 + Vite + Tailwind + Effect client.
- NFR-TECH-8: Pin exact dependency versions; verify new packages; no code comments.
- NFR-TECH-9: Effect ecosystem pinned to a single unified version (latest stable line; Effect v4
  beta is opt-in and decided at implementation start, not assumed).
- NFR-TECH-10: **TypeScript 7** (GA; native compiler `tsc`) for type-checking; **SWC** for
  transpile/emit; **Jest + `@swc/jest`** (Rust-backed transform) as the test runner. No Vitest.

### Testing (NFR-TEST) — strict, 100% coverage

- NFR-TEST-1: Test runner is **Jest with `@swc/jest`** (SWC/Rust transform) across backend and
  web; no Vitest. Effect programs run via `Effect.runPromise`/`runPromiseExit` with a small local
  `it.effect`-style helper.
- NFR-TEST-2: **Very strict unit testing — 100% coverage** thresholds
  (statements/branches/functions/lines), **CI-enforced**, with a minimal, documented exclusion
  list for non-logic glue (Lambda entrypoint, layer wiring, config, generated types) covered by
  integration instead.
- NFR-TEST-3: Unit-test all domain logic — Cycle Engine, Projection Engine, RecurringDetector
  (parity with money-evaluation figures), dedup/transfer rules, parsers, auth, view-model
  mappers, i18n completeness.
- NFR-TEST-4: Integration tests for repositories against a disposable Postgres.
- NFR-TEST-5: Contract tests validating RPC/HttpApi schemas + OpenAPI snapshot.

### Error handling (NFR-ERR) — "really handle all errors"

- NFR-ERR-1: **No error path is unhandled.** Every RPC/HttpApi endpoint declares a full typed
  error union (Effect `Schema`); domain use-cases return tagged errors; handling is exhaustive
  (`catchTags`), compiler-enforced.
- NFR-ERR-2: A **top-level boundary** in the Lambda handler catches known errors (→ typed,
  localisable client responses) and unexpected defects (`catchAllCause`/`catchAllDefect` → logged
  with a correlation id → generic `InternalError` with no internals). The handler never throws.
- NFR-ERR-3: Validation (Schema decode) failures become a safe `ValidationError` with field
  detail, not a 500.
- NFR-ERR-4: **No `try/catch` and no bare `Promise.catch`** anywhere (lint-enforced), client or
  server; the Effect client consumes success + typed error channels explicitly and renders
  user-friendly, localised messages.

### Configurability (NFR-CFG)

- NFR-CFG-1: Behavioural defaults (cycle anchor, reserve, categories, locale, projection
  parameters, recurring/fixed-bill rules) are **data, not code** — editable via settings and
  persisted per household.

### Observability (NFR-OBS)

- NFR-OBS-1: Structured logging via Effect's logger; request/trace correlation; **never** log
  balances, PII, or bank-file contents.
- NFR-OBS-2: Errors logged with tagged types + correlation id; mapped to safe client messages.

### Data lifecycle (NFR-DATA)

- NFR-DATA-1: Neon point-in-time recovery/backups; documented restore.
- NFR-DATA-2: Household data export (JSON) for portability and personal backup.
