# Requirements — nosko

Aligned to the generated UI (see `stitch-prompts.md` and the two Stitch exports) and the locked
decisions in `state.md`. IDs are referenced by the design, the data architecture (§ Data
Architecture below + `design/database-design.md`), and the implementation plan.

## Product model (the core idea)

nosko is a **private finance app for a couple** (Marcelo + Gabriele), base currency **EUR** with a
secondary **BRL**. It has **two spaces**, and the boundary between them is the defining rule:

- **Casa (Shared)** — joint accounts, shared payments, the shared monthly budget (cycles running a
  configurable anchor day → the day before, default 23→22), shared fixed bills, and shared goals.
  Both partners see everything here. Shared spending is a **couple ledger**: every payment records
  who paid and how it is split, and nosko tracks the running inter-partner balance and suggests
  settlements.
- **Pessoal (Personal)** — each person's own accounts, payments, savings/investments, and
  subscriptions. **Private: never visible to the partner.** Personal analytics (projections,
  subscription audit) live only here.

Each account a user adds has a **visibility**: `personal` (private) or `shared` (visible in Casa).
Onboarding: sign up → add your accounts (set visibility) → create household → invite partner →
partner joins and shares their side of the joint accounts.

## Personas

- **Marcelo** — primary user, NL resident, EUR income (PostNL), plus BR accounts (Nubank/C6).
- **Gabriele** — partner, second member, EUR income into the joint budget.
- Both are independent users who link into one **household**; personal data stays private per user.

## Scope & phasing

| Phase | Theme | Requirements |
|---|---|---|
| P1 | Foundation + core budget loop | Infra, auth + household + account visibility, accounts, manual entry, cycles, fixed bills, shared payments **with payer+split+settlement**, Casa + Pessoal overviews |
| P2 | Ingestion | File import (CSV primarily; PDF for Amex/C6), dedup, IBAN routing (personal/shared), internal-transfer pairing, AI-assisted categorisation, review queue |
| P3 | Evaluations & subscriptions | Spend analysis, subscription/recurring audit (personal + shared), recurring-rule auto-detection |
| P4 | Savings, investments & goals | Personal savings/investments, projection engine (two-phase + Box 3 + inflation), BR CDB, shared goals/vaults |
| P5 | Summary & polish | WhatsApp resumo, hardening, export/backup |

Multi-currency (EUR + BRL) and the personal/shared visibility model are present from P1.
**No live bank sync / account linking** — data comes from **manual entry and exported statement
files only** (CSV primarily; PDF for banks that only export PDF). The generated UI shows "Open
Finance / sync" affordances; **those are removed when implementing** (see FR-X-3).

---

## Functional Requirements

### Auth & Household (FR-AUTH) — P1

- FR-AUTH-1: Sign up (name, email, password); email verification before full access.
- FR-AUTH-2: Login + **MFA** (TOTP or email OTP); password reset; email re-verification.
- FR-AUTH-3: Session management (short-lived access + refresh tokens, revocable).
- FR-AUTH-4: Create a **household** (owner) with name, base currency (EUR), and cycle anchor day.
- FR-AUTH-5: Invite the partner **by email**; on acceptance they join as a member.
- FR-AUTH-6: All household-scoped data is visible to both members; **personal-scoped data is
  visible only to its owner** (enforced server-side; see NFR-SEC/NFR-PRIV).

### Accounts & Connections (FR-ACC) — P1 (+ sync P5)

- FR-ACC-1: A user registers **accounts**: institution (ING, Revolut, Amex, Nubank, C6, ABN, …),
  nickname, type (checking / credit card / savings / brokerage / investment/CDB / vault), currency
  (EUR/BRL), masked identifier (IBAN/number), and optional balance.
- FR-ACC-2: Each account has a **visibility**: `personal` (default, private) or `shared` (appears
  in Casa for both). Visibility is toggleable ("Compartilhar com a casa" / un-share) and
  reversible; un-sharing removes it from Casa without deleting history.
- FR-ACC-3: **Shared accounts** screen: joint accounts with balance, purpose, masked IBAN, cycle
  commitment %, and total joint balance. **My accounts** screen: the owner's personal accounts,
  personal net worth (EUR + BRL converted), liquid vs invested, card invoices — private.
- FR-ACC-4: Each account records its data **source** (`manual` or `file_import`) and a
  **last-import** timestamp shown in the UI. **No live bank sync/linking** — data comes from manual
  entry and imported statement files only.
- FR-ACC-5: Balances and account state feed the Casa/Pessoal overviews and the net-worth tiles.

### Shared payments — the couple ledger (FR-LEDGER) — P1

- FR-LEDGER-1: A **shared payment** records: date/time, merchant/description, shared account,
  category, currency, amount, **payer (which member paid)**, and a **split** (`rateio`): `equal`
  (50/50), `proportional` (by income), or `custom` per-member share. The split applies **only to
  the household's monthly shared payments** (it does not drive personal withdrawals).
- FR-LEDGER-2: nosko computes per-member **contribution totals and percentages** for the cycle,
  and a running **inter-partner balance** (who has advanced more than their share).
- FR-LEDGER-3: nosko computes a **suggested settlement** (`acerto`): the transfer that rebalances
  the ledger (e.g. "Gabriele → Marcelo €30"). The user can **record/settle** an `acerto`, which
  resets the balance and is itself logged.
- FR-LEDGER-4: The Payments screen lists cycle transactions with filters (cycle, account,
  category, member), a cycle total vs ceiling, the split summary, average/day, and CSV export.
- FR-LEDGER-5: Categories are configurable with defaults seen in the UI: Mercado & Feira,
  Moradia & Fixas, Lazer & Restaurantes, Transporte, Saúde & Pets, Subscrições, Outros.

### Budgeting Cycles (FR-CYC) — P1

- FR-CYC-1: Cycles run on a **configurable anchor day** (default 23; options include 1/15/23/28),
  spanning `[anchorDay of month M, (anchorDay − 1) of M+1]`, with per-cycle date overrides.
- FR-CYC-2: Raw inputs per cycle: per-member salaries + bonus; `reserve`; optional `seed`
  (`estimate`, per-member `actualWithdrawal`, `openingBalance`) for the first/seeded cycle.
- FR-CYC-3: Derived figures (computed, never hand-edited): income total + per-member split %,
  `fixedTotal`, `variableTotal`, `byCategory`, chained `estimate`, **`availableAfterPayments`**
  (household income − shared fixed bills − shared variable payments − reserve — the leftover shown
  so each member can decide their withdrawal), `variableBudget`, `surplus`, **savings rate %**, and
  the **daily allowance** ("pode gastar €X/dia" for remaining days).
- FR-CYC-4: Cycles **chain** (estimate ← prev variableTotal, openingBalance ← prev surplus).
- FR-CYC-5: **Withdrawals to personal accounts** (`saques`) are **user-defined per member**: after
  seeing `availableAfterPayments` (the leftover once the month's household payments are covered),
  each member **decides how much to move** to their personal account — there is no forced
  suggestion. Records the amount + settlement status/timestamp (e.g. "liquidado via SEPA").
- FR-CYC-6: The per-member income split % informs the **proportional `rateio`** option for shared
  payments only. It does **not** dictate withdrawals (those are user-defined, FR-CYC-5).
- FR-CYC-7: Cycles list with history, **multi-cycle surplus/savings trends**, average savings over
  N cycles, yearly total saved, and a **reserve destination** label (e.g. house down payment).
  Compare cycles. Create/scaffold the next cycle.
- FR-CYC-8: Per-category **caps (tetos)** configurable; the UI shows "teto" per category and cycle.

### Fixed bills & recurring rules (FR-BILL) — P1

- FR-BILL-1: Per cycle, shared fixed bills: label, amount, currency, paid/unpaid toggle, paid-on
  day, **paying account**, **paid-by member**, due date, optional items.
- FR-BILL-2: "Situação atual" totals: predicted, paid, pending (with next due bill).
- FR-BILL-3: **Recurring rules** (household-level): matcher (vendor/counterparty), expected
  amount, category, cadence, "is fixed bill", active, source (auto-detected/user-defined).
- FR-BILL-4: **Auto-detection** ("Inteligência nosko"): scan recent transactions (e.g. last 90
  days) for periodic same-vendor charges and propose them as fixed bills / recurring rules to
  confirm or ignore.
- FR-BILL-5: Active `isFixedBill` rules generate each cycle's bills; a matching imported/synced
  transaction **auto-marks the bill paid** (with the paying account + payer).

### Shared goals & vaults (FR-GOAL) — P4

- FR-GOAL-1: Shared **goals** (metas): name, category, target amount, accumulated amount, progress
  %, **monthly contribution split per member**, deadline/projected completion, status
  (in-progress/achieved/paused), and an optional **yield rate**.
- FR-GOAL-2: A goal may be backed by a **vault/reserve account** (linked account) providing
  liquidity + yield; the UI shows accumulated vs target and "aportar" (contribute).
- FR-GOAL-3: Aggregate: total accumulated across goals, % of a global target, combined monthly
  contribution, next milestone.

### Personal space (FR-PER) — private (P1 overview; P3/P4 depth)

- FR-PER-1: **Personal overview** (private): personal balance across personal accounts, personal
  monthly spend vs cap, personal savings, subscriptions total, spend-by-category, monthly
  evolution. A "Transferir p/ Casa" action to share.
- FR-PER-2: **Personal payments** (private): the owner's transactions on personal accounts;
  filters; never shared with the partner.
- FR-PER-3: **Personal savings & investments** (private): EUR reserve (balance, APY, monthly
  rollup: aportes/retiradas/juros/saldo/delta, coverage months), brokerage holdings (positions,
  value, % change, custodian), BR CDB (invested, current, % CDI, liquidity). Net worth EUR + BRL.
- FR-PER-4: **Personal savings projection** (private): two-phase model (grow at reserve rate to a
  configurable **reserve target** default €24k, then excess compounds at a **post-reserve return**
  default 10%), **NL Box-3 wealth tax** (~2.16% above ~€57k allowance), optional **inflation
  adjustment**, horizon 1/5/10/15/20/30/40/50y, monthly contribution, comparison lines, milestone
  table, **save scenario**, export PDF.
- FR-PER-5: **Personal subscription audit** (private): detected recurring charges grouped by
  country (NL/BR), monthly + annualised cost, **redundancy detection** (duplicate cloud plans,
  "streaming fatigue"), an **efficiency score**, potential savings, and recommendations
  (keep/review/cancel).

### Evaluations (shared) (FR-EVAL) — P3

- FR-EVAL-1: Shared monthly analysis: inflow/outflow/net, category matrix across months with
  computed averages and vs-average deltas, biggest vendors, recurring charges.

### Ingestion (FR-ING) — P2 (sync P5)

- FR-ING-1: Import **exported statement files — CSV primarily** (ING/Revolut/Nubank), plus **PDF
  for banks that only export PDF** (Amex, C6; incl. password-protected); multiple banks at once;
  per-institution presets. **No live/link sync** — file export only.
- FR-ING-2: Parse to normalised transactions; **deduplicate by hash** (per-source identity).
- FR-ING-3: **Route each transaction by account/IBAN to the personal or shared destination**;
  personal-account transactions stay private, shared-account transactions feed the couple ledger.
- FR-ING-4: **AI-assisted auto-categorisation** with a confidence indicator; user overrides.
- FR-ING-5: **Internal-transfer pairing**: detect matching out/in legs across the user's own
  accounts (e.g. Wise EUR→BRL) and mark the pair a neutral transfer (not spend/income).
- FR-ING-6: **Review queue**: staged transactions with counts (new/confirmed/ignored/duplicates/
  internal-transfers), per-row destination (Casa/Pessoal) + suggested category, bulk confirm/
  categorise; confirming a shared transaction adds it to the current cycle for both members.
- FR-ING-7: Uploaded files stored (private) as an audit trail; parse failures surfaced.

### Summary / resumo (FR-RES) — P5

- FR-RES-1: WhatsApp-ready recap of the current **shared** cycle: household income, fixed bills,
  variable used vs ceiling, daily allowance, top categories, **and the 50/50 split + suggested
  acerto**. Emoji/short/detailed variants. Copy-to-clipboard + open-in-WhatsApp. Shared data only.

### Cross-cutting product (FR-X)

- FR-X-1: **Multi-currency** EUR (base) + BRL; store amounts in source currency (integer minor
  units); convert for display via a daily **FX rate** shown in the UI ("1 EUR = R$X").
- FR-X-2: **Bilingual** UI (pt-BR default, English), user-switchable; household default locale +
  per-user override; localised server text (emails, resumo).
- FR-X-3: Web dashboard (React + Effect), the Casa/Pessoal **space switcher**, matching the
  generated design (Shared-Ledger theme: emerald primary, indigo secondary/personal, rose). When
  implementing, **drop the Open Finance / bank-sync affordances** from the generated screens (no
  live sync — imports are file-based).
- FR-X-4: A documented internal API surface (OpenAPI/Swagger) alongside the typed RPC channel.
- FR-X-5: **Configuration-first** settings: household (name, base currency, cycle anchor,
  emergency reserve), account visibility, members, language/region, categories & caps, **fiscal
  parameters (NL Box 3)**, privacy/keys, security/2FA, **export/backup (JSON)**.
- FR-X-6: **English code identifiers** everywhere (see `glossary.md`); Portuguese only in content.
- FR-X-7: "Hide values" toggle to blur monetary figures on screen.

---

## Non-Functional Requirements

### Privacy of the personal space (NFR-PRIV) — defining requirement

- NFR-PRIV-1: Personal-scoped data (accounts, transactions, savings, subscriptions) is **never
  returned to the partner** by any endpoint. Authorization is enforced by owner at the BFF and
  again at the repository (row filter by `owner_user_id` + `visibility='personal'`).
- NFR-PRIV-2: Personal financial payloads are **encrypted at rest** using envelope encryption
  (AWS KMS data keys), so DB/backup compromise does not expose plaintext personal data.
- NFR-PRIV-3: **Resolved** — personal privacy uses **server-side isolation + KMS envelope
  encryption** (the BFF can still compute personal projections/audits). True zero-knowledge
  client-side E2EE is **not** pursued. The UI's "vault/E2E" language maps to this model.

### Security (NFR-SEC)

- NFR-SEC-1: Every endpoint authenticated; all data scoped to the caller's household and, for
  personal data, to the owner (defence in depth: app scoping + Postgres row filtering / RLS).
- NFR-SEC-2: Argon2id password hashing; MFA; short-lived + revocable tokens.
- NFR-SEC-3: Secrets in SSM/Secrets Manager; personal payloads encrypted via KMS envelope; never
  logged. No balances/PII/statement contents in logs.
- NFR-SEC-4: TLS in transit; encryption at rest (Neon + KMS envelope for personal payloads);
  uploads in a private S3 bucket.

### Cost, performance, tech, testing, error handling (unchanged mandates)

- NFR-COST-1: Minimise cost (serverless; strict API throttling + account concurrency cap; monthly
  budget alerts — already in the infra).
- NFR-PERF-1: Read endpoints p95 < 500 ms at this scale; single AWS region (eu-west-1).
- NFR-TECH-1..10: **Effect** end-to-end (no try/catch, tagged errors); **DDD/Clean Architecture**;
  **Effect `Schema`** contracts; **BFF** = `@effect/rpc` + `@effect/platform` HttpApi in one
  layered Lambda; **Neon Postgres** via `@effect/sql-pg`; **Terraform**; **TypeScript 7 (`tsc`)** +
  **SWC** (emit + `@swc/jest`); pinned exact versions; no code comments.
- NFR-ERR-1..4: Exhaustive typed error handling; top-level boundary; no `try/catch`/bare
  `.catch`; safe localised client messages.
- NFR-TEST-1..5: **Jest + `@swc/jest`, 100% coverage** (CI-enforced) on logic (Cycle Engine,
  **Split/Settlement Engine**, Projection Engine, RecurringDetector, dedup/transfer pairing,
  parsers, subscription-audit), integration for repositories, contract tests for RPC/HttpApi.

---

## Data Architecture (how data is stored to serve the clients)

Goal: store **raw inputs + configuration + audit data**, and **compute derived, screen-ready view
models in the domain layer** so each screen gets exactly what it renders. Full schema in
`design/database-design.md`; this is the storage strategy and the screen→data mapping.

### Storage principles

- **PostgreSQL (Neon)**, accessed via `@effect/sql-pg`. Money = `bigint` minor units +
  `currency char(3)`; rates/percent = `numeric`. English identifiers.
- **Visibility & ownership on every financial row**: `household_id` for scoping, plus
  `owner_user_id` + `visibility` (`personal`/`shared`) so the BFF can serve Casa vs Pessoal from
  the same tables with a single access rule. Personal rows filter to the owner; shared rows are
  visible to both members.
- **Derived figures are never stored** — the Cycle Engine, Split/Settlement Engine, and Projection
  Engine compute them on read (cheap at this scale) and the BFF returns view models. Exception:
  monthly rollups are exposed as SQL **views**.
- **Personal payloads encrypted at rest** via KMS envelope (per NFR-PRIV-2); shared data stored
  normally (both members may read it).
- **FX rates** stored daily (`fx_rates`) to convert BRL↔EUR for display and net-worth tiles.

### Core entities (columns in database-design.md)

- **Identity/household:** `users`, `auth_tokens`, `user_sessions`, `households`,
  `household_members`, `household_invitations`, `household_settings` (cycle anchor, locale, base
  currency, emergency reserve, fiscal params), `categories` (+ per-cycle caps).
- **Accounts:** `accounts` (owner, visibility, institution, type, currency, masked id, balance,
  **source** manual/file_import, **last_import_at**). No live-sync / connection table.
- **Transactions & ledger:** `transactions` (owner/visibility, account, date, description,
  counterparty, amount, currency, direction, category, dedup_hash, status, is_transfer + linked
  leg, source), `statement_uploads`. Shared confirmed transactions become **`shared_payments`**
  with `payer_user_id` + `split` (method + per-member shares) linked to a cycle; **`settlements`**
  (acertos) record inter-partner transfers.
- **Cycles:** `cycles`, `cycle_incomes` (per member salary/bonus), `cycle_withdrawals` (saques:
  **user-defined amount** + settled_at), `fixed_bills` (+ paying account, paid_by),
  `fixed_bill_items`, `recurring_rules`.
- **Goals/vaults:** `goals` (target, status, deadline, yield), `goal_contributions` (per member,
  per cycle), optional link to a vault `account`.
- **Savings/investments (personal):** `savings_accounts` (cash/CDB/brokerage), `savings_events`,
  `savings_rate_history`, `holdings`, `projection_settings`, `projection_scenarios`.
- **Subscriptions:** `subscriptions` (recurring charges, country, cost, recommendation); redundancy
  + efficiency computed in the domain layer.
- **Reference:** `fx_rates`.

### Screen → data mapping (representative)

| Screen | Reads | Computed by |
|---|---|---|
| Casa overview | cycle + incomes + fixed_bills + shared_payments | Cycle Engine (available, surplus, daily allowance, byCategory) |
| Shared accounts | accounts(visibility=shared) + connections | balance aggregation |
| Payments (ledger) | shared_payments + splits | Split/Settlement Engine (per-member totals, balance, suggested acerto) |
| Cycles list/detail | cycles + incomes + withdrawals + fixed_bills + shared_payments | Cycle Engine (+ multi-cycle trends) |
| Fixed bills | fixed_bills + recurring_rules + recent transactions | RecurringDetector |
| Goals | goals + goal_contributions + linked vault account | progress/projection |
| Personal overview/accounts/payments | accounts/transactions where owner=caller, visibility=personal | owner-only aggregations |
| Personal savings/investments | savings_accounts + events + holdings + fx_rates | rollup views + net worth |
| Personal projection | projection_settings/scenarios | Projection Engine (two-phase + Box 3 + inflation) |
| Subscriptions | subscriptions + personal transactions | audit (redundancy, efficiency score) |
| Review queue | transactions(status=staged) + accounts (routing) | dedup + transfer pairing + categoriser |
| Resumo | current shared cycle + split | Cycle + Settlement Engines → localised text |
| Settings | household_settings + accounts(visibility) + members + categories + projection_settings | — |

### Decisions (resolved)

1. **Personal vault** — server-side isolation + KMS envelope encryption; no client-side E2EE.
2. **No bank sync** — file import only (CSV primarily; PDF for Amex/C6). The Open Finance / sync
   affordances in the generated UI are removed when implementing.
3. **Split & withdrawals** — split methods `equal`/`proportional`/`custom` apply **only** to the
   household's monthly shared payments; settlements (acertos) are first-class inter-partner
   transfers. **Personal withdrawals are user-defined** after seeing `availableAfterPayments` — no
   forced/proportional suggestion.
