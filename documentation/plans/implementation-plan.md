# Implementation Plan — finance-app

Phased execution of the units in `design/units-of-work.md`. **This plan is the approval gate: no
application code is written until it is approved.** Each phase has a definition of done and the
checks to run (NFR-TEST + build/lint/typecheck + `terraform validate/plan`).

## Approval gate

Because this introduces new architecture, new dependencies (Effect stack), and cloud
infrastructure, implementation starts only after Marcelo replies **"approved"** (or requests
changes). On approval, Phase 1 begins with U0.

## Phase 1 — Foundation + core budget loop (U0–U7)

Goal: a deployed, private app where the household can sign up, link, and run the full 23rd→22nd
budget loop (cycles, fixed bills, variable spend) with manual entry, viewed on Overview + Cycles.

Key tasks
1. U0: scaffold monorepo (`backend/`, `web/`, `iac/`, `packages/contracts/`); **TypeScript 7
   (`tsc`)**; Effect pinned (v3 stable `3.22.x`); Biome with a **lint rule banning
   `try/catch` and bare `Promise.catch`**; **Jest + `@swc/jest` with a 100% coverage gate**; root
   check scripts; **CONVENTIONS/README/glossary stubs** per `repo-structure-and-agreements.md`.
2. U1: Terraform baseline from nosko modules (compute/api-routing/secrets/static-site) + uploads
   bucket + Neon connection in SSM; `test` env first.
3. U2: Neon migrations for identity/household/budgeting **+ household_settings/categories/
   recurring_rules**; `SqlClient` layer; base repositories + integration test harness.
4. U3: auth (signup/verify/login/MFA/session) + household create/invite/accept + settings
   section; SES mailer (localised templates).
5. U4: BFF skeleton — `RpcServer` + `HttpApi` in one layered Lambda; `packages/contracts`
   (Schema + Rpc defs); typed client; OpenAPI/Swagger; auth middleware + household scoping;
   **top-level error boundary** (typed errors + defect catch-all).
6. U5: Cycle Engine (ported formulas, **configurable anchor day**, English identifiers) +
   cycles/fixed-bills/expenses domain, repos, RPC sections; parity unit tests vs money-evaluation.
7. U6: web foundation (Vite + Tailwind + Effect client) + **en/pt i18n dictionaries + switcher**
   + auth screens + shell.
8. U7: Overview + Cycles pages with manual add/edit; current-cycle + daily-allowance banner.

Definition of done: deployed to `test`; two accounts can sign up, link, set the cycle anchor +
locale, create cycles/fixed-bills/expenses, and see correct derived figures in both languages;
Cycle Engine parity tests green; the error boundary returns typed/safe responses; `biome` (incl.
the no-try/catch rule), `tsc --noEmit`, `jest --coverage` (100% gate), `vite build`, and
`terraform validate/plan` all clean.

## Phase 2 — Ingestion (U8)

Goal: upload bank exports and turn them into confirmed gastos without double-counting.

Key tasks: S3 upload + `statement_uploads`; per-bank parsers (ING, Revolut, Amex, Nubank
account+credit, C6) as `Effect`-returning modules with fixtures; dedup via `dedup_hash`;
transfer-linking (Wise EUR↔BRL, self-transfers, Revolut internal); **RecurringDetector** proposing
fixed-bill/categorisation rules + manual "mark as fixed bill"; active rules generate per-cycle
fixed bills and **auto-mark them paid** on match; review queue; confirm-to-expense respecting the
anchor boundary and joint-account-only rule; web review UI.

Definition of done: re-importing overlapping exports creates no duplicates; self-transfers are
linked not counted; recurring charges are proposed as fixed bills and a matching import auto-marks
the bill paid; confirming a joint-account transaction lands the expense in the right cycle;
parser + dedup + detector tests green; standard checks clean.

## Phase 3 — Evaluations (U9)

Goal: the spend/subscription analysis lens.

Key tasks: evaluation domain (monthly inflow/outflow/net; category matrix with computed
avg/latestVsAvg; per-month narrative arrays); repos; RPC section; web views incl. subscription
audit.

Definition of done: monthly + category + narrative views render from stored data; avg/latestVsAvg
match hand calculations in tests; checks clean.

## Phase 4 — Savings & Projections (U10)

Goal: savings tracking + the projection engine (the most sophisticated feature).

Key tasks: savings accounts/events/holdings + `savings_monthly_v` view; Projection Engine (EUR
two-phase + Box-3 net line; BR CDB single-rate) with `projection_settings`; RPC section; web
panels with horizon/contribution/reserve/post-reserve controls, comparison lines, milestone
table, compact money formatting.

Definition of done: projection series match money-evaluation behaviour in tests; BR CDB included;
controls work; checks clean.

## Phase 5 — Resumo + BR completion + hardening (U11)

Goal: close v1.

Key tasks: current-cycle resumo builder + copy-to-clipboard; finalise BR accounts/cards support;
security review (auth scoping, secrets, no PII in logs), household data export, backups/restore
doc; promote `prod` environment.

Definition of done: resumo copies a correct summary; full BR support present; security review
passed; `prod` deployed; checks clean.

## Cross-phase practices

- Every PR runs `biome` (incl. no-try/catch), `tsc --noEmit`, `jest --coverage` (100% gate),
  `vite build` (web), and `terraform validate` (+ `plan` on infra changes).
- Conventional Commits; no commits/pushes without explicit ask; no AI attribution trailers.
- No code comments; pin exact dependency versions; verify new packages.
- Synthetic fixtures only; never commit real financial data or `.env`.

## Risks & mitigations

- **Effect API drift (v4 beta):** pin one version at U0; keep presentation adapters thin; the
  `@effect-aws/lambda` adapter is verified but re-checked at U1/U4.
- **TypeScript 7:** GA and pinned at `7.0.2`; the native compiler ships as the `tsc` binary (so
  `tsc` here is TS 7, not the legacy compiler). Verified against Effect at U0 — all packages
  type-check clean. 100% coverage is gated on logic with documented glue exclusions.
- **PDF parsing (Amex/C6, password-protected):** highest-uncertainty parsers; timebox as a spike
  in U8 and fall back to guided manual entry for those sources if needed.
- **Neon + Lambda connections:** use Neon's pooled endpoint; keep the `SqlClient` layer at
  runtime scope to reuse across warm invocations.
- **Cost creep:** stay serverless; single region; Neon free tier; watch SES/log volume.

## Immediate next step (on approval)

Begin Phase 1 / U0: scaffold the monorepo and pin the Effect toolchain, then U1 infra `test`
environment. I will not start until you approve this plan.
