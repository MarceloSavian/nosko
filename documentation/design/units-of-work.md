# Units of Work — nosko

Dependency-ordered decomposition, aligned to the generated UI, `requirements.md`, and
`user-stories.md` (epics referenced as E1–E15). "Depends on" is the hard build order.

| Unit | Title | Delivers (epics / FRs) | Phase | Depends |
|---|---|---|---|---|
| U0 | Repo & tooling foundation | monorepo, TS7 (`tsc`), SWC (+`@swc/jest`), Effect, Biome, 100% coverage gate, no-try/catch guard, conventions/glossary | P1 | — |
| U1 | Infra baseline (Terraform) | Lambda, API GW, S3 static + uploads, SSM, state bucket, strict cost controls | P1 | U0 |
| U2 | Data + isolation foundation | Neon migrations (identity/household/settings/accounts incl. joint co-owner/categories/caps) with **owner_user_id + visibility** and **mandatory RLS policies**; `SqlClient` layer with the per-request transaction + `SET LOCAL app.*`; base repositories + integration harness (Docker Postgres) with privacy tests | P1 | U0 |
| U3 | Auth & Household | signup/verify/login/MFA (remember device)/sessions; create/invite/accept (max 2 members); SES verification; account visibility (E1, E2) | P1 | U2 |
| U4 | BFF skeleton + error boundary | `RpcServer` (+ minimal `HttpApi`), contracts pkg, typed client, OpenAPI, auth middleware, **household + owner scoping via RLS settings**, top-level error boundary; real Lambda artifact replaces the placeholder | P1 | U2, U3 |
| U5 | Accounts + FX | register/edit/remove, joint accounts (two owners), visibility toggle, credit-card fields, source/last-import, shared + personal summaries; `fx_rates` + daily ECB fetch (EventBridge) + FxConversion (E3, FR-X-1) | P1 | U4 |
| U6 | Cycle core | **CycleEngine** (proportional model: contribution shares, estimate, availableAfterPayments, user-defined withdrawals/contributions, savings rate, daily allowance, burn rate, close) + cycles/incomes/member_transfers + fixed bills + recurring rules + **RecurringDetector** (E5, E6) | P1 | U5 |
| U7 | Shared payments | shared payments from joint accounts (no payer/split), base-currency amount at confirmation, category caps, summaries, CSV export (E7) | P1 | U6 |
| U8 | Web foundation | React+Vite+Tailwind+Effect client (`useRpc`), **en/pt i18n**, **Casa/Pessoal space switcher**, Shared-Ledger theme, auth + onboarding screens (add accounts, create household, invite/accept) (E1–E3 UI); `web/CONVENTIONS.md` filled | P1 | U4 |
| U9 | Web: Casa core | overview, shared accounts, payments, cycles list, cycle detail, fixed bills (E5–E7 UI) | P1 | U5, U6, U7, U8 |
| U10 | Web: Pessoal core | personal overview (personal categories + cap), my accounts, my payments — private (E11 UI) | P1 | U5, U8 |
| U11 | Ingestion | file import (CSV; PDF for Amex/C6) parsers, dedup, **IBAN routing personal/shared**, internal-transfer pairing (incl. contributions), rule-based categorisation, **review queue** + web (E4) | P2 | U5, U6, U7 |
| U12 | Evaluations + subscriptions | **EvaluationEngine** (shared, computed) + month notes; **SubscriptionAuditEngine** (personal, redundancy + efficiency) + web (E9, E13) | P3 | U6, U11 |
| U13 | Savings, investments & projection | personal savings/events/holdings + **ProjectionEngine** (two-phase + Box 3 + inflation + scenarios) + web (E12) | P4 | U5, U8 |
| U14 | Goals & vaults | shared goals + contribution plans + contributions + linked vault + surplus destination + web (E8) | P4 | U6, U5 |
| U15 | Resumo + settings + export/backup + hardening | WhatsApp resumo, settings (categories/caps, fiscal, privacy, export), `prod` environment + domain, polish (E10, E14, E15) | P5 | U6, U7, U11, U13, U14 |

## Critical path

U0 → U1/U2 → U3 → U4 → U5 → U6 → U7, with U8 → U9/U10 in parallel after U4, completes a **usable
P1**: auth + household + accounts (personal/shared/joint) + the core budget loop with the
proportional model on both Casa and Pessoal screens. U11–U15 branch off after P1.

## Parity & correctness checkpoints

- U2: RLS tests — a raw query without `app.user_id` returns nothing; a partner session never
  receives personal rows; co-owners both read a joint account.
- U6: CycleEngine reproduces the money-evaluation cycle figures (surplus, byCategory,
  availableAfterPayments) for a fixture dataset; withdrawals are user-defined inputs.
- U7: shared payments in BRL land in the cycle in EUR with the stored rate; totals vs estimate
  and caps match hand calculations.
- U11: parser + dedup + IBAN-routing + transfer-pairing tests (personal vs shared destination;
  personal→joint pair becomes a contribution).
- U13: ProjectionEngine reproduces the two-phase + Box-3 + inflation series shapes.
- Every unit: **100% coverage gate**, no-try/catch guard, `tsc`, and (web) `vite build` pass.

## Privacy checkpoint (all data units)

Personal-scoped reads never leak to the partner: repository integration tests assert
`visibility='personal'` rows are only returned to `owner_user_id`, and every new financial table
ships with its RLS policies in the same migration.

## Assumptions

- Two users, one household. No bank sync (file import only). No legacy import (start empty).
- Effect v3 stable (`3.22.x`); Lambda `nodejs22.x` (switch to `nodejs24.x` if available at U4);
  region eu-west-1; nosko-test account.
