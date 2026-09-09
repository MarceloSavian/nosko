# Units of Work — nosko

Dependency-ordered decomposition, aligned to the generated UI, `requirements.md`, and
`user-stories.md` (epics referenced as E1–E15). "Depends on" is the hard build order.

| Unit | Title | Delivers (epics / FRs) | Phase | Depends |
|---|---|---|---|---|
| U0 | Repo & tooling foundation | monorepo, TS7 (`tsc`), SWC (+`@swc/jest`), Effect, Biome, 100% coverage gate, no-try/catch guard, conventions/glossary | P1 | — |
| U1 | Infra baseline (Terraform) | Lambda, API GW, S3 static + uploads, SSM, state bucket, strict cost controls | P1 | U0 |
| U2 | Data + visibility foundation | Neon migrations (identity/household/settings/accounts/categories/caps) with **owner_user_id + visibility** and **KMS envelope** for personal payloads; `SqlClient` layer; base repositories + integration harness | P1 | U0 |
| U3 | Auth & Household | signup/verify/login/MFA/session; create/invite/accept; account visibility (E1, E2) | P1 | U2 |
| U4 | BFF skeleton + error boundary | `RpcServer` + `HttpApi`, contracts pkg, typed client, OpenAPI, auth middleware, **household + owner scoping**, top-level error boundary | P1 | U2, U3 |
| U5 | Accounts | register/edit/remove, visibility toggle, source/last-import, shared + personal summaries (E3) | P1 | U4 |
| U6 | Cycle core | **CycleEngine** (availableAfterPayments, savings rate, daily allowance) + cycles/incomes/**user-defined withdrawals** + fixed bills + recurring rules + **RecurringDetector** (E5, E6) | P1 | U4 |
| U7 | Couple ledger | shared payments + **SplitSettlementEngine** (payer, split equal/proportional/custom, inter-partner balance, settlements/acertos) (E7) | P1 | U6 |
| U8 | Web foundation | React+Vite+Tailwind+Effect client, **en/pt i18n**, **Casa/Pessoal space switcher**, Shared-Ledger theme, auth + onboarding screens (add accounts, create household, invite/accept) (E1–E3 UI) | P1 | U4 |
| U9 | Web: Casa core | overview, shared accounts, payments (ledger/split/settlement), cycles list, cycle detail, fixed bills (E5–E7 UI) | P1 | U5, U6, U7, U8 |
| U10 | Web: Pessoal core | personal overview, my accounts, my payments — private (E11 UI) | P1 | U5, U8 |
| U11 | Ingestion | file import (CSV; PDF for Amex/C6) parsers, dedup, **IBAN routing personal/shared**, internal-transfer pairing, AI categorisation, **review queue** + web (E4) | P2 | U5, U6, U7 |
| U12 | Evaluations + subscriptions | shared evaluations; **SubscriptionAuditEngine** (personal, redundancy + efficiency) + web (E9, E13) | P3 | U6, U11 |
| U13 | Savings, investments & projection | personal savings/events/holdings + **ProjectionEngine** (two-phase + Box 3 + inflation + scenarios) + web (E12) | P4 | U5, U8 |
| U14 | Goals & vaults | shared goals + per-member contributions + linked vault + web (E8) | P4 | U6, U5 |
| U15 | Resumo + settings + export/backup + hardening | WhatsApp resumo, settings (categories/caps, fiscal, privacy, export), polish (E10, E14, E15) | P5 | U6, U7, U11, U13, U14 |

## Critical path

U0 → U1/U2 → U3 → U4 → U5 → U6 → U7, with U8 → U9/U10 in parallel after U4, completes a **usable
P1**: auth + household + accounts (personal/shared) + the core budget loop with the **couple ledger
(split/settlement)** on both Casa and Pessoal screens. U11–U15 branch off after P1.

## Parity & correctness checkpoints

- U6: CycleEngine reproduces the money-evaluation cycle figures (surplus, byCategory,
  availableAfterPayments) for a fixture dataset; withdrawals are user-defined inputs (not
  suggested).
- U7: SplitSettlementEngine — property tests that per-member shares sum to the payment, and the
  suggested settlement zeroes the inter-partner balance.
- U11: parser + dedup + IBAN-routing + transfer-pairing tests (personal vs shared destination).
- U13: ProjectionEngine reproduces the two-phase + Box-3 + inflation series shapes.
- Every unit: **100% coverage gate**, no-try/catch guard, `tsc`, and (web) `vite build` pass.

## Privacy checkpoint (all data units)

Personal-scoped reads never leak to the partner: repository tests assert `visibility='personal'`
rows are only returned to `owner_user_id`, and personal payloads are KMS-encrypted at rest.

## Assumptions

- Two users, one household. No bank sync (file import only). No legacy import (start empty).
- Effect v3 stable (`3.22.x`); Lambda `nodejs22.x`; region eu-west-1; nosko-test account.
