# Implementation Plan — nosko

Phased execution of `design/units-of-work.md` (U0–U15), aligned to the generated UI and
`user-stories.md`. **U0 and U1 are done and committed; U1 is deployed** to the nosko-test account
(placeholder BFF). Everything below resumes at U2.

## Status

- **U0** ✅ monorepo + toolchain (TS7/SWC/Effect/Jest 100%/Biome).
- **U1** ✅ Terraform baseline deployed (API GW, BFF + migration Lambdas, SSM, uploads, S3+CF,
  strict cost controls). Placeholder BFF until U4 code ships.
- **U2** ✅ delivered (migrations, `app_role`, `SqlClient` layer, first repository slice,
  `pnpm verify:migrations`); **not yet applied** — no live Neon database targeted. Terraform gained
  a second connection string (`app_database_url`) that needs a two-pass first deploy; see
  `iac/README.md`.
- **U3** ✅ delivered (auth primitives, mailer, all auth/household use-cases, the repositories
  U2 deferred). Not yet wired to any transport (that's U4) and, like U2, not exercised against a
  live database.
- **U4** ✅ delivered: `@nosko/contracts` auth/household `RpcGroup`s + a 4-endpoint auth
  `HttpApi` group; the RPC/HttpApi handlers wired to every U3 use-case; cookie-based session
  delivery (`nosko_at`/`nosko_rt`, httpOnly/Secure/SameSite=Strict — the frontend never touches a
  token); `AuthMiddleware` (wrap-style) that verifies the access-token cookie and opens the
  per-request RLS transaction; `main/layers.ts` + `main/handler.ts` (`LambdaHandler.fromHttpApi`)
  replacing U1's placeholder; a real `pnpm build` (esbuild + `archiver`) producing
  `iac/environments/test/artifacts/bff-v1.zip`. Found and fixed two real RLS bootstrapping gaps
  along the way (migrations `0008`/`0009`): a member couldn't discover their own household
  membership, and an invitee couldn't read/accept their own invitation, before `app.household_id`
  was ever set. **Not yet exercised against a live database** (same caveat as U2/U3) and
  `migration-v1.zip` is still the placeholder — wrapping `migrate.ts` as a Lambda handler was not
  part of this unit's scope.
- **U5** ✅ delivered: `accounts.*` RPC group (list scoped Casa/Pessoal, create, update,
  setVisibility, setCoOwner, remove, sharedSummary, personalSummary) wired to an extended
  `AccountsRepository`; joint accounts force `visibility=shared` on create and refuse to be
  un-shared (`JointAccountVisibilityLocked`); `fx_rates` table + `FxRatesRepository` + the pure
  `FxConversion` domain service (`{amountBase, rate}`, falls back to the latest earlier rate);
  an ECB daily-reference-rate fetcher (`infra/fx/EcbFetcher`) and the `fetchAndStoreDailyRates`
  use-case; a real `fx-rates-v1` Lambda (`main/fetchFxRates.ts`) on a daily EventBridge schedule
  (new `schedule_expression` support in the `compute/aws-lambda` module). Also fixed a latent bug
  found while adding `fx_rates`: Postgres `numeric` columns come back from `pg` as strings, not
  numbers, so every `Schema.Number`-typed numeric column (including U2/U3's already-shipped
  `household_settings.box3_rate`/`inflation_rate`, never yet exercised) would have failed to
  decode — fixed once, globally, via a `pg` type parser in `DatabaseConfig.ts`. Net worth math
  (`sharedSummary`/`personalSummary`) is a first-pass interpretation of the UI description
  (liquid = checking/savings/vault, invested = brokerage/investment, credit cards excluded) —
  worth revisiting once real UI wireframes are consulted at U9/U10. Not yet exercised against a
  live database or a live ECB fetch.
- **U6** ✅ delivered: pure `CycleEngine` (`computeCycleFigures` — proportional model: income,
  contributionShare, estimate/openingBalance chaining off the previous cycle, availableAfterPayments,
  withdrawalTotal, available, surplus, variableBudget, savingsRate, dailyAllowance —
  `computeCycleWindow` for the household's anchor-day cycle boundary) with fully synthetic,
  hand-verified test fixtures (no money-evaluation figures committed, per the standing money/PII
  fixture rule); `cycles`/`cycle_incomes`/`member_transfers`/`recurring_rules`/`fixed_bills`/
  `category_caps` tables (household-scoped RLS, no visibility split) + repositories; `cycles.*`
  RPC (list/get/getCurrent/create/update/close/setIncome/recordTransfer/settleTransfer/
  setCategoryCaps/trends/compare), `bills.*` (list/create/update/setPaid/remove), `rules.*`
  (list/create/update/deactivate — the manual `user_defined` path only); `cycles.create` scaffolds
  fixed bills from active `is_fixed_bill` recurring rules ("scaffold next cycle"). A pure
  `RecurringDetector` (matcher grouping, monthly-cadence + amount-stability heuristics, confidence
  score) ships fully unit-tested but unwired — its real input (confirmed transactions) doesn't
  exist until U11, so `rules.suggestions`/`acceptSuggestion`/`ignoreSuggestion` are deferred there
  too (U6's `variableTotal` was hardcoded to 0, since `shared_payments` didn't exist yet — fixed in
  U7 below). `fixed_bill_items` (line-item breakdown) is deferred — no FR or RPC action
  references it yet.
  `verify:migrations` gained a cross-household RLS isolation check for the new household-scoped
  tables. Not yet exercised against a live database.
- **U7** ✅ delivered: `shared_payments` table (household-scoped RLS, same no-visibility-split
  shape as U6's tables) + `SharedPaymentsRepository`; `payments.*` RPC
  (list/create/update/remove/summary) plus a `payments.exportCsv` `HttpApi` endpoint (CSV isn't a
  clean RPC response, same reasoning as auth's 4 cookie-writing ops — merged into one combined
  `NoskoHttpApi` alongside auth's group, since `HttpApiBuilder.api` can only mount a single
  `HttpApi` per app). `payments.create` resolves the owning cycle from the booked date
  (`CyclesRepository.findCurrent`, now actually exercised — previously wired but uncalled from
  U6), requires a `visibility=shared` account, and converts a non-base-currency amount **once, at
  confirmation** (`FxConversion` + `FxRatesRepository.findOnOrBefore`, storing `amountBaseMinor` +
  `fxRate` rather than recomputing on every read, unlike accounts' live/on-read conversion) — a
  missing rate is a real, propagated `NoFxRate` failure here, not swallowed to `null`.
  `CycleEngine.computeByCategory` (new pure helper) drives `payments.summary`'s per-category spend
  vs cap. **`figuresForAllCycles`'s `variableTotal` is no longer hardcoded to 0** — it now sums
  each cycle's real `shared_payments.amountBaseMinor`, so `CycleFigures.surplus`/`variableBudget`/
  `dailyAllowance` reflect real spend for the first time. Not yet exercised against a live
  database.
- **U4–U7 are now applied and exercised against a live database** (`test.nosko.app` on the
  nosko-test AWS account, live Neon database) — the "not yet exercised" caveats in each unit's
  note above are stale as of 2026-09-10.
- **U8** ✅ delivered (2026-09-10): web foundation. React app (Vite + Tailwind +
  `@effect-atom/atom-react`) DDD-layered like the backend (domain/data/infra/validation/
  presentation/main); auth screens (signup, email verify via OTP, login, MFA, forgot/reset
  password), household + accounts onboarding, invitation acceptance, and an authenticated app
  shell with the Casa/Pessoal switcher (section routes stubbed "coming soon" pending U9/U10).
  Every route authenticated except the public auth pages. English URL paths, pt-BR/en UI copy
  unchanged. `e2e/web` (Playwright, 13 tests against the live deployed backend through a real
  browser) added alongside it, catching two real CORS bugs and a session-cookie bug along the
  way (both fixed and redeployed — see `state.md`). Also delivered opportunistically while
  wiring U8 against the live API: `auth.me` RPC endpoint, SES→Resend mailer swap (SES was never
  actually configured), and the `test.nosko.app` custom domain.
- **U9** ✅ delivered (2026-09-10): Casa screens — overview, shared accounts, payments, cycles
  list, cycle detail, fixed bills — real views replacing U8's "coming soon" placeholders over
  the U5–U7 RPC surface. Discovered and fixed a gap along the way: nothing exposed categories
  to any client despite `payments.create`/`bills.create` requiring one, so a `categories.list`
  RPC and FR-PAY-4's seven default household categories (seeded on `household.create`) were
  added. `e2e/web` gained a spec covering the full loop (start a cycle, fixed bill, payment,
  transfer, close) against the live backend.
- **U10** ✅ delivered (2026-09-10): Pessoal screens — personal overview
  (`accounts.personalSummary`) and my accounts (add/list/remove, scope=personal). My payments
  stays "coming soon": the documented model routes personal spend through U11's file-import
  `transactions` table, not manual entry, confirmed with Marcelo before building. Also fixed a
  bug found after U9 shipped: `household.listMembers` showed a raw user id instead of a name in
  the Casa contribution-share chips. `e2e/web` gained coverage for the personal account
  add/verify/remove flow.
- Everything else: pending.

## Phase 1 — Foundation + core budget loop (U2–U10)

Goal: two users sign up, link into a household, register accounts (personal/shared/joint), and run
the full budget loop — cycles with the **proportional model**, fixed bills, shared payments,
user-defined withdrawals — on the Casa and Pessoal dashboards.

Key tasks
1. U2 ✅: Neon migrations for identity/household/settings/accounts/categories with
   **owner_user_id + visibility** and **forced RLS policies**; a genuinely restricted `app_role`
   (Neon's console/CLI role inherits `neon_superuser`/`BYPASSRLS` and cannot be used at runtime);
   `SqlClient` layer with the per-request transaction + `set_config(..., true)`; a first
   repository slice (users, households, accounts, categories); `pnpm verify:migrations`
   (pglite-backed privacy/RLS checks — Jest's VM sandbox blocks pglite's dynamic import, so this
   runs as a plain script, not under `pnpm test`). `category_caps` deferred to U6 (FKs `cycles`);
   `auth_tokens`/`user_sessions`/`household_invitations` repositories deferred to U3.
2. U3 ✅: auth primitives (`infra/auth`: argon2id password hashing via `hash-wasm`, TOTP via
   `otpauth`, opaque tokens, JWT access tokens via `jose`) and mailer (`infra/mailer`: SES
   adapter + bilingual templates); the `auth_tokens`/`user_sessions`/`household_invitations`
   repositories deferred from U2, plus `HouseholdsRepository.update`/`listMembers`/`removeMember`;
   use-cases for signup/verify/resend, login + MFA enroll/verify (remember device via the
   session's own refresh token), refresh/logout/sessions, password reset, and household
   invite/accept/revoke (max 2 members, DB-enforced). Sender verification in SES itself is a
   manual AWS console step, not code.
3. U4 ✅: BFF — `RpcServer` (auth minus the 4 cookie-writing ops, + household) mounted on the
   same router as a minimal `HttpApi` (auth's `login`/`mfaVerify`/`refresh`/`logout`, the only
   ops that read/write the session cookies) in one layered Lambda; `AuthMiddleware` opens the
   per-request RLS transaction (`app.user_id`, and `app.household_id` once discovered); build
   script producing `iac/environments/test/artifacts/bff-v1.zip`; OpenAPI auto-generated from the
   `HttpApi` schemas (`HttpApiBuilder.middlewareOpenApi`). The RPC typed client is deferred to
   when `web` (U8) actually needs it, to avoid building unused plumbing.
4. U5 ✅: accounts domain + repos + `accounts.*` RPC (register, joint co-owner, visibility
   toggle, summaries); `fx_rates` + daily ECB fetch (EventBridge) + FxConversion.
5. U6 ✅: **CycleEngine** (contribution shares, estimate/openingBalance chaining, available,
   availableAfterPayments, user-defined withdrawals/contributions, savings rate, daily allowance) +
   cycles/incomes/member_transfers + fixed bills + recurring rules (manual path) + `category_caps`
   + pure RecurringDetector (unwired; needs U11's transaction feed).
6. U7 ✅: `shared_payments` (no payer/split) + base-currency conversion at confirmation
   (`FxConversion`, stored not recomputed) + `payments.*` RPC + `payments.exportCsv` HttpApi +
   `computeByCategory` cap-vs-spend summaries; `variableTotal` now real.
7. U8 ✅: web foundation (Vite+Tailwind+Effect client via `@effect-atom/atom-react`) + en/pt
   i18n + **Casa/Pessoal switcher** + auth/onboarding screens; `e2e/web` Playwright suite added
   alongside it.
8. U9 ✅: Casa screens — overview, shared accounts, payments, cycles + detail, fixed bills;
   `categories.list` RPC + default household categories added along the way.
9. U10 ✅: Pessoal screens — overview, my accounts. My payments deferred to U11 (needs the
   `transactions` table; no manual-entry path exists for personal spend by design).

Definition of done: deployed to `test`; both users sign up, link, register accounts (incl. one
joint account with two owners), and see a correct core budget loop in both spaces; personal data
never leaks to the partner (RLS + repo privacy tests green); Cycle Engine tests green; `biome`
(+no-try/catch), `tsc`, `jest --coverage` (100%), `vite build`, `terraform validate` all clean.

## Phase 2 — Ingestion (U11)

Key tasks: S3 upload + per-bank parsers (ING/Revolut/Nubank CSV, Nubank two-account mapping;
Amex/C6 PDF); dedup by hash; **IBAN routing to personal/shared**; internal-transfer pairing (Wise
EUR↔BRL; personal→joint = contribution); rule-based categorisation; review queue; confirm shared →
cycle in EUR, personal → private. Web import + review.

Definition of done: overlapping re-imports don't duplicate; transfers paired not counted; routing
keeps personal private and shared in Casa; confirming lands the payment in the right cycle with the
right base amount; parser/dedup/routing tests green; checks clean.

## Phase 3 — Evaluations & subscriptions (U12)

Key tasks: **EvaluationEngine** (monthly series + category matrix, computed) + month notes;
**SubscriptionAuditEngine** (recurring detection, redundancy grouping, efficiency score) for the
personal space; web views.

Definition of done: evaluation figures match hand calculations; subscription audit flags known
redundancies; personal audit stays private; checks clean.

## Phase 4 — Savings, investments, projection & goals (U13, U14)

Key tasks: personal savings accounts/events/holdings + `savings_monthly_v`; **ProjectionEngine**
(two-phase + Box 3 + inflation + saved scenarios) + web panels; shared **goals/vaults** with
contribution plans, contributions, surplus destination + web.

Definition of done: projection series match money-evaluation behaviour; goals track contributions
and progress; checks clean.

## Phase 5 — Resumo, settings, export & hardening (U15)

Key tasks: WhatsApp resumo; settings (categories/caps, fiscal params, privacy, export/backup JSON);
security review (RLS coverage, owner/household scoping, no PII in logs); `prod` environment +
`nosko.app` domain.

Definition of done: resumo copies a correct summary; settings editable; export works; security
review passed; `prod` deployed; checks clean.

## Cross-phase practices

- Every PR: `biome` (incl. no-try/catch), `tsc --noEmit`, `jest --coverage` (100% gate),
  `vite build` (web), `terraform validate` (+ `plan` on infra changes).
- Conventional Commits; commit/push only when Marcelo asks; no AI trailers; no code comments;
  exact version pins; synthetic fixtures only (no real balances/PII).
- **Privacy is a standing gate:** every data unit includes RLS policies and tests that personal
  rows never appear in a partner's response.

## Risks & mitigations

- **PDF parsing (Amex/C6, password-protected):** highest-uncertainty parsers; timebox in U11,
  fall back to guided manual entry.
- **RLS on a pooled connection:** always `set_config(..., true)` inside the request transaction;
  `pnpm verify:migrations` asserts a reset scope denies rather than errors and that the connecting
  role is genuinely non-superuser/`NOBYPASSRLS` (Neon's console/CLI role is neither).
- **Multi-currency cycle math:** convert once at confirmation, store the rate; money in integer
  minor units only.
- **Effect API surface:** pinned v3 stable; thin presentation adapters; RPC only for the web.

## Immediate next step

Resume at **U11** (Ingestion) — Phase 1 is now complete: U0–U10 all delivered and, from U4
onward, exercised end to end against the live `test.nosko.app`/`test.api.nosko.app` backend via
`e2e/web`. U11 (file import + per-bank parsers, dedup, IBAN routing, transfer pairing,
categorisation, review queue) is also what finally backs a real "my payments" screen for
Pessoal — U10 left that nav entry pointing at a placeholder specifically because personal
spend has no data source until this unit lands. Add `e2e/web` coverage for each new screen as
it lands, per its README's convention.
