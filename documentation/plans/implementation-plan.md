# Implementation Plan — nosko

Phased execution of `design/units-of-work.md` (U0–U15), aligned to the generated UI and
`user-stories.md`. **U0 and U1 are done and committed; U1 is deployed** to the nosko-test account
(placeholder BFF). Everything below resumes at U2.

## Status

- **U0** ✅ monorepo + toolchain (TS7/SWC/Effect/Jest 100%/Biome).
- **U1** ✅ Terraform baseline deployed (API GW, BFF + migration Lambdas, SSM, uploads, S3+CF,
  strict cost controls). Placeholder BFF until U4/U5 code ships.
- Everything else: pending.

## Phase 1 — Foundation + core budget loop (U2–U10)

Goal: two users sign up, link into a household, register accounts (personal/shared), and run the
full budget loop — cycles, fixed bills, and the **couple ledger with split + settlement** — on the
Casa and Pessoal dashboards.

Key tasks
1. U2: Neon migrations for identity/household/settings/accounts/categories/caps with
   **owner_user_id + visibility** and **KMS envelope** for personal payloads; `SqlClient` layer;
   base repositories + integration-test harness (privacy tests: personal rows owner-only).
2. U3: auth (signup/verify/login/MFA/session) + household create/invite/accept + account
   visibility; SES mailer (localised).
3. U4: BFF — `RpcServer` + `HttpApi` in one layered Lambda; `packages/contracts`; typed client;
   OpenAPI; auth middleware with **household + owner scoping**; top-level error boundary.
4. U5: accounts domain + repos + `accounts.*` RPC (register, visibility toggle, summaries).
5. U6: **CycleEngine** (availableAfterPayments, savings rate, daily allowance, chaining) +
   cycles/incomes/**user-defined withdrawals** + fixed bills + recurring rules + RecurringDetector;
   parity tests vs money-evaluation.
6. U7: **SplitSettlementEngine** + shared payments + settlements; property tests (shares sum;
   settlement zeroes balance).
7. U8: web foundation (Vite+Tailwind+Effect client) + en/pt i18n + **Casa/Pessoal switcher** +
   Shared-Ledger theme + auth/onboarding screens.
8. U9: Casa screens — overview, shared accounts, payments (ledger), cycles + detail, fixed bills.
9. U10: Pessoal screens — overview, my accounts, my payments (private).

Definition of done: deployed to `test`; both users sign up, link, register accounts, and see a
correct core budget loop with split/settlement in both spaces; personal data never leaks to the
partner (repo privacy tests green); Cycle + Split/Settlement engine tests green; `biome` (+no-try/
catch), `tsc`, `jest --coverage` (100%), `vite build`, `terraform validate` all clean.

## Phase 2 — Ingestion (U11)

Key tasks: S3 upload + per-bank parsers (ING/Revolut/Nubank CSV; Amex/C6 PDF); dedup by hash;
**IBAN routing to personal/shared**; internal-transfer pairing (Wise EUR↔BRL); AI-assisted
categorisation; review queue; confirm shared → cycle, personal → private. Web import + review.

Definition of done: overlapping re-imports don't duplicate; transfers paired not counted; routing
keeps personal private and shared in Casa; confirming lands the payment in the right cycle; parser/
dedup/routing tests green; checks clean.

## Phase 3 — Evaluations & subscriptions (U12)

Key tasks: shared evaluations (monthly + category matrix); **SubscriptionAuditEngine** (recurring
detection, redundancy grouping, efficiency score) for the personal space; web views.

Definition of done: evaluation figures match hand calculations; subscription audit flags known
redundancies; personal audit stays private; checks clean.

## Phase 4 — Savings, investments, projection & goals (U13, U14)

Key tasks: personal savings accounts/events/holdings + `savings_monthly_v`; **ProjectionEngine**
(two-phase + Box 3 + inflation + saved scenarios) + web panels; shared **goals/vaults** with
per-member contributions + web.

Definition of done: projection series match money-evaluation behaviour; goals track contributions
and progress; checks clean.

## Phase 5 — Resumo, settings, export & hardening (U15)

Key tasks: WhatsApp resumo (with split + acerto); settings (categories/caps, fiscal params,
privacy, export/backup JSON); security review (owner/household scoping, KMS, no PII in logs);
promote `prod`.

Definition of done: resumo copies a correct summary; settings editable; export works; security
review passed; `prod` deployed; checks clean.

## Cross-phase practices

- Every PR: `biome` (incl. no-try/catch), `tsc --noEmit`, `jest --coverage` (100% gate),
  `vite build` (web), `terraform validate` (+ `plan` on infra changes).
- Conventional Commits; commit/push only when Marcelo asks; no AI trailers; no code comments;
  exact version pins; synthetic fixtures only (no real balances/PII).
- **Privacy is a standing gate:** every data unit includes tests that personal rows never appear
  in a partner's response.

## Risks & mitigations

- **PDF parsing (Amex/C6, password-protected):** highest-uncertainty parsers; timebox in U11,
  fall back to guided manual entry.
- **Personal encryption (KMS envelope):** keep crypto in one `infra` adapter; encrypt only the
  sensitive columns; cache the data key per request.
- **Split/settlement correctness:** property-based tests; money in integer minor units only.
- **Effect API surface:** pinned v3 stable; thin presentation adapters.

## Immediate next step

Resume at **U2** (data + visibility foundation on Neon). U1 `apply` cutover to the renamed
`nosko-*` stack + state bucket remains available when you want it (see iac scripts).
