# Requirements — nosko

Aligned to the generated UI (see `stitch-prompts.md` and `ui/`) and the locked decisions in
`state.md`. IDs are referenced by the design, the data architecture (§ Data Architecture below +
`design/database-design.md`), and the implementation plan.

## Product model (the core idea)

nosko is a **private finance app for a couple** (Marcelo + Gabriele), base currency **EUR** with a
secondary **BRL**. It has **two spaces**, and the boundary between them is the defining rule:

- **Casa (Shared)** — joint accounts (owned by both members), shared payments, the shared monthly
  budget (cycles running a configurable anchor day → the day before, default 23→22), shared fixed
  bills, and shared goals. Both partners see everything here.
- **Pessoal (Personal)** — each person's own accounts, payments, savings/investments, and
  subscriptions. **Never shown to the partner.** Personal analytics (projections, subscription
  audit) live only here.

### How the household money flows in a cycle (the proportional model)

This is the rule every Casa screen and the Cycle Engine implement:

1. **Income enters proportionally.** Each member's salary (+ bonus) for the cycle is recorded. Each
   member's **contribution share** = their income ÷ household income. This share is informational
   (it explains who funds what); it is not a per-payment split.
2. **Planned shared payments are covered first.** The cycle's shared **fixed bills** (rent, health
   insurance, utilities, subscriptions of the house) are paid from the joint accounts.
3. **An amount is set aside for unplanned shared payments** — the cycle's **estimate** (`teto`) for
   market, restaurants, transport, pets, etc. It chains from the previous cycle's actual variable
   spend and can be edited.
4. **A reserve** is held back: a per-cycle buffer (default from household settings). It is not
   a goal contribution; goals have their own contribution plans.
5. **What remains is the couple's to decide.** `availableAfterPayments` = opening balance + income −
   fixed bills − estimate − reserve. Each member records the **withdrawal** they move to their
   personal account (user-defined; no forced proportional suggestion). Money not withdrawn stays in
   the joint account and rolls into the next cycle's opening balance via the surplus.

During the cycle, actual shared variable spend is tracked against the estimate (daily allowance,
category caps); at cycle close the surplus/deficit chains into the next cycle. **There is no
per-payment payer, split (rateio), or inter-partner settlement (acerto)** — every shared payment
comes from a joint account owned by both, so "who paid" does not exist. The generated screens that
show payer avatars, 50/50 chips, "Registrar acerto", and "Compensação sugerida" are **dropped**
when implementing (see FR-X-3).

Each account a user adds has a **visibility**: `personal` (private) or `shared` (visible in Casa).
Joint accounts are shared and have **two owners**. Onboarding: sign up → add your accounts (set
visibility) → create household → invite partner → partner joins, adds their accounts, and is
attached as co-owner of the joint ones.

## Personas

- **Marcelo** — primary user, NL resident, EUR income, plus BR accounts (Nubank/C6).
- **Gabriele** — partner, second member, EUR income into the joint budget.
- Both are independent users who link into one **household** of exactly two members; personal
  data stays private per user.

## Scope & phasing

| Phase | Theme | Requirements |
|---|---|---|
| P1 | Foundation + core budget loop | Infra, auth + household + account visibility, accounts (incl. joint), manual entry, cycles with the proportional flow, fixed bills, shared payments, Casa + Pessoal overviews |
| P2 | Ingestion | File import (CSV primarily; PDF for Amex/C6), dedup, IBAN routing (personal/shared), internal-transfer pairing, rule-based categorisation, review queue |
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

- FR-AUTH-1: Sign up (name, email, password); email verification (link or 6-digit code, 15-minute
  validity, resend with cooldown) before full access.
- FR-AUTH-2: Login + **MFA** (TOTP or email OTP); "remember this device" skips MFA on that device
  for 30 days; password reset (short-lived token) with an option to revoke all other sessions.
- FR-AUTH-3: Session management (short-lived access + refresh tokens, revocable per session and
  all-at-once).
- FR-AUTH-4: Create a **household** (owner) with name, base currency (EUR), and cycle anchor day.
- FR-AUTH-5: Invite the partner **by email** (tokenised link); on acceptance they join as a member.
  A household has **at most two members**; invitations are revocable and expire.
- FR-AUTH-6: All household-scoped data is visible to both members; **personal-scoped data is
  visible only to its owner** (enforced server-side; see NFR-PRIV).

### Accounts (FR-ACC) — P1

- FR-ACC-1: A user registers **accounts**: institution (ING, Revolut, Amex, Nubank, C6, ABN, …),
  nickname, type (checking / credit card / savings / brokerage / investment/CDB / vault), currency
  (EUR/BRL), masked identifier (IBAN/number), optional balance, optional purpose label.
- FR-ACC-2: Each account has a **visibility**: `personal` (default, private) or `shared` (appears
  in Casa for both). Visibility is toggleable ("Compartilhar com a casa" / un-share) and reversible;
  un-sharing removes it from Casa without deleting history.
- FR-ACC-3: **Joint accounts** have **two owners** (`ownership = joint`, both members) and are
  always `shared`. A joint account is registered once per household (unique masked identifier);
  the partner is attached as co-owner on invitation acceptance or from the account's settings.
  Both owners can import statements into it and edit it.
- FR-ACC-4: **Shared accounts** screen: joint/shared accounts with balance, purpose, masked IBAN,
  cycle commitment (fixed bills that debit this account vs balance), and total joint balance.
  **My accounts** screen: the owner's personal accounts, personal net worth (EUR + BRL
  converted), liquid vs invested, card invoices — private.
- FR-ACC-5: **Credit-card accounts** carry statement closing day, credit limit, and an optional
  autopay source account; the UI shows the current invoice and closing date.
- FR-ACC-6: Each account records its data **source** (`manual` or `file_import`) and a
  **last-import** timestamp shown in the UI. **No live bank sync/linking.**
- FR-ACC-7: Balances and account state feed the Casa/Pessoal overviews and the net-worth tiles.

### Shared payments (FR-PAY) — P1

- FR-PAY-1: A **shared payment** records: date/time, merchant/description, counterparty, shared
  account, category, currency, amount, and the cycle it belongs to (by booked date and the anchor
  boundary). **No payer and no split** — it is paid from a joint account owned by both.
- FR-PAY-2: Non-EUR shared payments (e.g. a BRL joint account) are converted to the base currency
  at the FX rate of the booked date **when confirmed**, and the converted amount is stored with the
  rate used, so cycle totals are deterministic and in EUR.
- FR-PAY-3: The Payments screen lists cycle transactions with filters (cycle, account, category),
  cycle total vs estimate (`teto`), per-category totals vs caps, average/day, and CSV export.
  Add/edit/remove manually (P1) or confirm from the review queue (P2).
- FR-PAY-4: Categories are configurable with defaults seen in the UI: Mercado & Feira,
  Moradia & Fixas, Lazer & Restaurantes, Transporte, Saúde & Pets, Subscrições, Outros.
- FR-PAY-5: Each member's **contribution share** (income %) is shown on the overview and cycle
  detail as the explanation of how the joint budget is funded. It is never used to split
  individual payments.

### Budgeting Cycles (FR-CYC) — P1

- FR-CYC-1: Cycles run on a **configurable anchor day** (default 23; options include 1/15/23/28),
  spanning `[anchorDay of month M, (anchorDay − 1) of M+1]`, with per-cycle date overrides.
- FR-CYC-2: Raw inputs per cycle: per-member salaries + bonus (in base currency); `reserve`;
  `estimate` (chained from the previous cycle's variable spend, editable); optional `seed`
  (`estimate`, `openingBalance`) for the first cycle.
- FR-CYC-3: Derived figures (computed, never hand-edited): income total + per-member
  **contribution share %**, `fixedTotal`, `variableTotal`, `byCategory`, **`availableAfterPayments`**
  (opening balance + income − fixed bills − estimate − reserve — what the couple decides how to
  spread), `withdrawalTotal`, `available`, `variableBudget`, `surplus` (signed), **savings rate %**,
  the **daily allowance** ("pode gastar €X/dia" for remaining days), and the burn-rate series
  (cumulative variable spend per day vs the estimate).
- FR-CYC-4: Cycles **chain** (estimate ← prev variableTotal, openingBalance ← prev surplus).
- FR-CYC-5: **Withdrawals to personal accounts** (`saques`) are **user-defined per member**: after
  seeing `availableAfterPayments`, each member records how much they move to their personal
  account. Records amount + settled status/timestamp/method. Unwithdrawn money stays in the joint
  account. **Contributions in the other direction** (a member moving personal money into the
  household, "Transferir p/ Casa") are recorded the same way with the opposite direction.
- FR-CYC-6: Cycle **status**: `open` (current or future) or `closed`. Closing freezes the figures
  and the next cycle chains from them. The cycles list shows history, **multi-cycle
  surplus/savings trends**, average savings over N cycles, yearly total saved, and the cycle's
  **surplus destination** (a shared goal or a free label, e.g. house down payment). Compare cycles.
  Create/scaffold the next cycle (carry active fixed-bill rules forward).
- FR-CYC-7: Per-category **caps (tetos)** configurable per cycle for shared categories; the UI
  shows spend vs cap per category.
- FR-CYC-8: Out of scope for v1: covering a deficit cycle from a reserve/goal automatically (the
  generated cycles screen shows it; a deficit simply chains into the next opening balance).

### Fixed bills & recurring rules (FR-BILL) — P1

- FR-BILL-1: Per cycle, shared fixed bills: label, amount, currency, paid/unpaid toggle, paid-on
  day, **paying account** (joint), due day, optional items. No "paid by member".
- FR-BILL-2: "Situação atual" totals: predicted, paid, pending (with next due bill).
- FR-BILL-3: **Recurring rules** (household-level): matcher (vendor/counterparty), expected
  amount, category, cadence, "is fixed bill", active, source (auto-detected/user-defined).
- FR-BILL-4: **Auto-detection** ("Inteligência nosko"): scan recent confirmed transactions (e.g.
  last 90 days) for periodic same-vendor charges and propose them as fixed bills / recurring rules
  to confirm or ignore.
- FR-BILL-5: Active `isFixedBill` rules generate each cycle's bills; a matching imported
  transaction **auto-marks the bill paid** (with the paying account and paid-on day).

### Shared goals & vaults (FR-GOAL) — P4

- FR-GOAL-1: Shared **goals** (metas): name, category, target amount, accumulated amount, progress
  %, deadline/projected completion, status (in-progress/achieved/paused), optional **yield rate**.
- FR-GOAL-2: A **contribution plan** per goal: planned amount per cycle per member; contributions
  ("aportar") are recorded as events (member, cycle, amount) and drive progress + projection.
- FR-GOAL-3: A goal may be backed by a **vault/reserve account** (linked shared account) providing
  liquidity + yield; the UI shows accumulated vs target.
- FR-GOAL-4: Aggregate: total accumulated across goals, % of a global target, combined planned
  contribution per cycle, next milestone. A cycle's surplus destination may point at a goal
  (FR-CYC-6).

### Personal space (FR-PER) — private (P1 overview; P3/P4 depth)

- FR-PER-1: **Personal overview** (private): personal balance across personal accounts, personal
  spend in the current period vs a **personal cap**, personal savings, subscriptions total,
  spend-by-category, period-over-period evolution. The personal period is the **household cycle**
  (one period concept across the app). Action "Transferir p/ Casa" records a contribution transfer
  (FR-CYC-5) — it does not share the account.
- FR-PER-2: **Personal payments** (private): the owner's transactions on personal accounts;
  filters; never shared with the partner. **Personal categories** are per user (separate from the
  household categories), with a per-user personal spend cap.
- FR-PER-3: **Personal savings & investments** (private): EUR reserve (balance, APY, monthly
  rollup: aportes/retiradas/juros/saldo/delta, coverage months), brokerage holdings (ticker,
  exchange, quantity, average cost, current value, % change, custodian), BR CDB (invested, current,
  % CDI, net-of-tax, liquidity). Net worth EUR + BRL.
- FR-PER-4: **Personal savings projection** (private): two-phase model (grow at reserve rate to a
  configurable **reserve target** default €24k, then excess compounds at a **post-reserve return**
  default 10%), **NL Box-3 wealth tax** (~2.16% above ~€57k allowance), optional **inflation
  adjustment**, horizon 1/5/10/15/20/30/40/50y, monthly contribution, comparison lines, milestone
  table, **save scenario**, export PDF.
- FR-PER-5: **Personal subscription audit** (private): detected recurring charges grouped by
  country (NL/BR), monthly + annualised cost, **redundancy detection** (duplicate cloud plans,
  several streaming services), an **efficiency score**, potential savings, and recommendations
  (keep/review/cancel) the user can mark as done. No usage-minutes data (not available).

### Evaluations (shared) (FR-EVAL) — P3

- FR-EVAL-1: Shared monthly analysis **computed from shared payments and fixed bills**:
  inflow/outflow/net per month, category matrix across months with averages and vs-average deltas,
  biggest vendors, recurring charges. Nothing hand-written is stored except an optional free-text
  note per month. Rendered inside the cycles/overview area (no dedicated mockup exists).

### Ingestion (FR-ING) — P2

- FR-ING-1: Import **exported statement files — CSV primarily** (ING/Revolut/Nubank), plus **PDF
  for banks that only export PDF** (Amex, C6; incl. password-protected); multiple files at once;
  per-institution presets with a target account. A Nubank export may map to **two accounts**
  (account + card) from one file. **No live/link sync.**
- FR-ING-2: Parse to normalised transactions; **deduplicate by hash** (per-source identity).
- FR-ING-3: **Route each transaction by account/IBAN to the personal or shared destination**;
  personal-account transactions stay private, shared-account transactions become shared payments.
- FR-ING-4: **Auto-categorisation**, rule-based first (recurring rules + the last category used
  for the same counterparty) with a confidence indicator; user overrides. An LLM categoriser is a
  later, optional add-on.
- FR-ING-5: **Internal-transfer pairing**: detect matching out/in legs across the user's own
  accounts (e.g. Wise EUR→BRL) and mark the pair a neutral transfer. A personal→joint transfer is
  paired across the visibility boundary: the joint leg is visible in Casa as a member contribution,
  the personal leg stays private.
- FR-ING-6: **Review queue**: staged transactions with counts (new/confirmed/ignored/duplicates/
  internal-transfers), per-row destination (Casa/Pessoal) + suggested category, bulk confirm/
  categorise; confirming a shared transaction creates the shared payment in the right cycle (base
  currency, FR-PAY-2) for both members.
- FR-ING-7: Uploaded files stored (private S3) as an audit trail; parse failures surfaced.

### Summary / resumo (FR-RES) — P5

- FR-RES-1: WhatsApp-ready recap of the current **shared** cycle: household income + contribution
  shares, fixed bills, variable used vs estimate, daily allowance, top categories. Emoji/short/
  detailed variants. Copy-to-clipboard + open-in-WhatsApp. Shared data only; no settlement line.

### Cross-cutting product (FR-X)

- FR-X-1: **Multi-currency** EUR (base) + BRL; store amounts in source currency (integer minor
  units); convert for display via a daily **FX rate** shown in the UI ("1 EUR = R$X"). Cycle
  figures are always in the base currency (FR-PAY-2). FX rates are fetched daily from a public
  source (ECB) by a scheduled job and cached in the database.
- FR-X-2: **Bilingual** UI (pt-BR default, English), user-switchable; household default locale +
  per-user override; localised server text (emails, resumo).
- FR-X-3: Web dashboard (React + Effect), the Casa/Pessoal **space switcher**, matching the
  generated design (Shared-Ledger theme). When implementing, **drop** from the generated screens:
  Open Finance / sync / "Sincronizado" affordances; payer avatars, 50/50 chips, "Registrar
  acerto" / "Compensação sugerida"; the couple join code on the landing page (invites are email
  links); "keys generated in the browser" / E2E copy; OFX/QIF/XLSX/MT940 formats; streaming
  usage minutes; "real-time sync & auto-save".
- FR-X-4: A documented internal API surface (OpenAPI/Swagger) alongside the typed RPC channel.
- FR-X-5: **Configuration-first** settings: household (name, base currency, cycle anchor, default
  reserve), account visibility + joint co-owner, members, language/region, categories & caps
  (household and personal), **fiscal parameters (NL Box 3)**, security/2FA/sessions,
  **export/backup (JSON)**.
- FR-X-6: **English code identifiers** everywhere (see `glossary.md`); Portuguese only in content.
- FR-X-7: "Hide values" toggle to blur monetary figures on screen (client-side preference).

---

## Non-Functional Requirements

### Privacy (NFR-PRIV) — defining requirement

**By design, each member's personal accounts and data are hidden from the other member**; this
is enforced in the application and in the database (RLS), not by cryptography. The cryptographic
threat model (encryption at rest, secrets) is **people outside the household**.

- NFR-PRIV-1: Personal-scoped data (accounts, transactions, savings, subscriptions, personal
  categories) is **never returned to the partner** by any endpoint. Authorization is enforced at
  the BFF (owner check) **and** by **mandatory Postgres Row-Level Security**: every financial table
  has policies on `app.user_id` / `app.household_id`, set per request inside a transaction. The
  BFF connects as a role created by SQL specifically for this (`app_role`, `NOSUPERUSER
  NOBYPASSRLS`) — never as Neon's console/CLI-created role, which inherits `neon_superuser`
  (`BYPASSRLS`) and would make every policy above a no-op.
- NFR-PRIV-2: Encryption at rest is provided by Neon (storage-level) and S3 (SSE); no
  application-level envelope encryption. Secrets that must never be readable from the database
  (MFA secrets, tokens) are stored hashed or encrypted with a key from SSM.
- NFR-PRIV-3: The UI's "vault / E2E / keys in the browser" copy is dropped (FR-X-3).

### Security (NFR-SEC)

- NFR-SEC-1: Every endpoint authenticated; all data scoped to the caller's household and, for
  personal data, to the owner (defence in depth: app scoping + RLS).
- NFR-SEC-2: Argon2id password hashing; MFA; short-lived + revocable tokens; trusted-device
  cookies for MFA are bound to the session and expire in 30 days.
- NFR-SEC-3: Secrets in SSM; never logged. No balances/PII/statement contents in logs.
- NFR-SEC-4: TLS in transit; uploads in a private S3 bucket; SES sender verified.

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
  Projection Engine, RecurringDetector, dedup/transfer pairing, parsers, subscription audit, FX
  conversion), integration for repositories **including RLS tests**, contract tests for
  RPC/HttpApi.

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
  the same tables with a single access rule, enforced by **RLS**. Joint accounts add a co-owner.
- **Derived figures are never stored** — the Cycle Engine and Projection Engine compute them on
  read. Exceptions: monthly savings rollups are SQL **views**; the base-currency amount + FX rate
  of a shared payment is stored at confirmation (an input, not a derivation).
- **FX rates** stored daily (`fx_rates`) to convert BRL↔EUR.

### Core entities (columns in database-design.md)

- **Identity/household:** `users`, `auth_tokens`, `user_sessions`, `households`,
  `household_members` (max 2), `household_invitations`, `household_settings` (cycle anchor,
  locale, base currency, default reserve, fiscal params), `user_settings` (personal cap),
  `categories` (household or personal scope) + `category_caps` (per cycle).
- **Accounts:** `accounts` (owner, co-owner for joint, ownership, visibility, institution, type,
  currency, masked id, balance, credit-card fields, **source** manual/file_import,
  **last_import_at**).
- **Transactions & shared payments:** `transactions` (owner/visibility, account, date,
  description, counterparty, amount, currency, direction, category, dedup_hash, status,
  is_transfer + linked leg, source), `statement_uploads`. Shared confirmed transactions become
  **`shared_payments`** (amount in source currency + `amount_base_minor` + `fx_rate`) linked to a
  cycle.
- **Cycles:** `cycles` (status, estimate, reserve, surplus destination), `cycle_incomes` (per
  member salary/bonus), `member_transfers` (withdrawals to personal / contributions to household;
  user-defined amount + settled_at), `fixed_bills` (+ paying account), `fixed_bill_items`,
  `recurring_rules`.
- **Goals/vaults:** `goals`, `goal_contribution_plans` (per member, per cycle amount),
  `goal_contributions` (events), optional link to a vault `account`.
- **Savings/investments (personal):** `savings_accounts`, `savings_events`,
  `savings_rate_history`, `holdings`, `projection_settings`, `projection_scenarios`.
- **Subscriptions:** `subscriptions` (recurring charges, country, cost, recommendation); redundancy
  + efficiency computed in the domain layer.
- **Reference:** `fx_rates`, `month_notes` (optional free text per month for evaluations).

### Screen → data mapping (representative)

| Screen | Reads | Computed by |
|---|---|---|
| Casa overview | cycle + incomes + fixed_bills + shared_payments + category_caps | Cycle Engine (availableAfterPayments, surplus, daily allowance, burn rate, byCategory vs caps, contribution shares) |
| Shared accounts | accounts(visibility=shared) + fixed_bills(paying_account) | balance aggregation, cycle commitment |
| Payments | shared_payments + categories + caps | totals vs estimate, per category, average/day |
| Cycles list/detail | cycles + incomes + member_transfers + fixed_bills + shared_payments (+ goals) | Cycle Engine (+ multi-cycle trends, savings rate) |
| Fixed bills | fixed_bills + recurring_rules + recent transactions | RecurringDetector |
| Goals | goals + plans + contributions + linked vault account | progress/projection |
| Personal overview/accounts/payments | accounts/transactions/categories where owner=caller, visibility=personal + user_settings | owner-only aggregations vs personal cap |
| Personal savings/investments | savings_accounts + events + holdings + fx_rates | rollup views + net worth |
| Personal projection | projection_settings/scenarios | Projection Engine (two-phase + Box 3 + inflation) |
| Subscriptions | subscriptions + personal transactions | audit (redundancy, efficiency score) |
| Review queue | transactions(status=staged) + accounts (routing) + fx_rates | dedup + transfer pairing + categoriser + base conversion |
| Resumo | current shared cycle | Cycle Engine → localised text |
| Settings | household_settings + user_settings + accounts + members + categories + projection_settings | — |

### Decisions (resolved)

1. **Privacy** — hidden from the partner by design, enforced by the app and by mandatory RLS
   (not cryptography); encryption at rest/in transit is the separate, narrower defence against
   outsiders. No KMS envelope, no client-side E2EE. RLS must run under a genuinely restricted
   Postgres role (`NOSUPERUSER NOBYPASSRLS`), not Neon's console/CLI-created role, which inherits
   `neon_superuser` (`BYPASSRLS`) and would bypass every policy — see `database-design.md` § Access.
2. **No bank sync** — file import only (CSV primarily; PDF for Amex/C6).
3. **Proportional model, no ledger** — income shares fund the joint budget; fixed bills, then the
   variable estimate and reserve are covered; the remainder is split by the couple's decision
   (user-defined withdrawals). No per-payment payer/split/settlement.
4. **Joint accounts** have two owners and are registered once per household.
5. **Cycle math in base currency** — non-EUR shared payments store the converted amount + rate at
   confirmation.
6. **Personal period = household cycle**; personal categories and cap are per user.
7. **Deficit coverage from a reserve** is out of scope for v1 (FR-CYC-8).
