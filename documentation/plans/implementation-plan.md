# Implementation Plan — nosko

Phased execution of `design/units-of-work.md` (U0–U15), aligned to the generated UI and
`user-stories.md`. **U0 and U1 are done and committed; U1 is deployed** to the nosko-test account
(placeholder BFF). Everything below resumes at U2.

## Status

- **U0** ✅ monorepo + toolchain (TS7/SWC/Effect/Jest 100%/Biome).
- **U1** ✅ Terraform baseline deployed (API GW, BFF + migration Lambdas, SSM, uploads, S3+CF,
  strict cost controls). Placeholder BFF until U4 code ships.
- Everything else: pending.

## Phase 1 — Foundation + core budget loop (U2–U10)

Goal: two users sign up, link into a household, register accounts (personal/shared/joint), and run
the full budget loop — cycles with the **proportional model**, fixed bills, shared payments,
user-defined withdrawals — on the Casa and Pessoal dashboards.

Key tasks
1. U2: Neon migrations for identity/household/settings/accounts/categories/caps with
   **owner_user_id + visibility** and **RLS policies**; `SqlClient` layer with the per-request
   transaction + `SET LOCAL app.user_id/app.household_id`; base repositories + Docker-Postgres
   integration harness (privacy tests: personal rows owner-only, raw query blocked).
2. U3: auth (signup/verify/login/MFA + remember device/sessions) + household create/invite/accept
   (max 2 members) + account visibility; SES mailer (localised), sender verified.
3. U4: BFF — `RpcServer` (+ minimal `HttpApi`) in one layered Lambda; `packages/contracts`; typed
   client; OpenAPI; auth middleware with **household + owner scoping**; top-level error boundary;
   build script producing `iac/environments/test/artifacts/bff-v1.zip`.
4. U5: accounts domain + repos + `accounts.*` RPC (register, joint co-owner, visibility toggle,
   summaries); `fx_rates` + daily ECB fetch + FxConversion.
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
- **RLS on a pooled connection:** always `SET LOCAL` inside the request transaction; an
  integration test asserts a query outside the transaction sees nothing.
- **Multi-currency cycle math:** convert once at confirmation, store the rate; money in integer
  minor units only.
- **Effect API surface:** pinned v3 stable; thin presentation adapters; RPC only for the web.

## Immediate next step

Resume at **U2** (data + isolation foundation on Neon).
