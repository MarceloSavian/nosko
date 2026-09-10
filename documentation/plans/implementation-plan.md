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
5. U6: **CycleEngine** (contribution shares, estimate, availableAfterPayments, user-defined
   withdrawals/contributions, savings rate, daily allowance, burn rate, close, chaining) +
   cycles/incomes/member_transfers + fixed bills + recurring rules + RecurringDetector; parity
   tests vs money-evaluation.
6. U7: shared payments (no payer/split) + base-currency conversion at confirmation + caps +
   summaries + CSV export.
7. U8: web foundation (Vite+Tailwind+Effect client + `useRpc`) + en/pt i18n + **Casa/Pessoal
   switcher** + Shared-Ledger theme + auth/onboarding screens; fill `web/CONVENTIONS.md`.
8. U9: Casa screens — overview, shared accounts, payments, cycles + detail, fixed bills.
9. U10: Pessoal screens — overview (personal categories + cap), my accounts, my payments.

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

Resume at **U6** (Cycle core). Applying U2's Terraform changes to nosko-test (the two-pass
`app_role` deploy in `iac/README.md`), then re-running `terraform apply` with U4/U5's real
Lambda artifacts (`pnpm --filter @nosko/backend build` — `bff-v1.zip` and `fx-rates-v1.zip`) in
place of the placeholders, can happen whenever Marcelo wants a live Neon database and a real
deployed BFF; nothing in U6+ needs that to happen first to keep being written and unit-tested.
