# Reverse Engineering — money-evaluation and nosko

This captures the functionality to reproduce (from `money-evaluation`) and the architecture
lessons to reuse (from `nosko`), so the new app's requirements have a concrete foundation.
Both source projects are read-only references; no code is carried over.

Sources analysed:
- `~/Documents/money-evaluation` — the working analysis project. Source of **all functional
  requirements**.
- `~/Documents/projects/personal/nosko` — the earlier, abandoned attempt at this same idea.
  Source of **architecture patterns and lessons**.

---

## 1. money-evaluation — what it does today

A single-household personal finance manager for a couple (Marcelo + Gabriele), base currency
**EUR**, with a secondary **BRL** (Brazil) side. It is currently a hand-maintained JSON file
(`source.json`) compiled by a Python script (`_build_dataset.py`) into a static dataset
(`dataset.json`) rendered by a React dashboard. There is no backend, database, auth, or
multi-user support — that is exactly the gap the new app closes.

### 1.1 Data sources (ingestion today = manual)

Marcelo exports statements from five institutions and hand-edits `source.json`:

| Source | Currency | Role | Format |
|---|---|---|---|
| ING (Netherlands) | EUR | Joint household account (since 23-Apr-2026) — rent, groceries, utilities, joint subs. Salaries land here. | CSV, semicolon-delimited, Dutch fields |
| Revolut (EU) | EUR/GBP/USD | Personal day-to-day card, FX, savings, brokerage | CSV, comma-delimited, English |
| Amex NL (Gold) | EUR | Personal card, monthly statements close on the 23rd | PDF, password-protected |
| Nubank (Brazil) | BRL | BR account + credit card | CSV |
| C6 (Brazil) | BRL | BR account + CDB fixed-income investments | PDF + screenshots |

Key ingestion rules the app must respect (from the README's "money-flow topology"):
- Self-transfers between the user's own accounts (Wise EUR→BRL, "MARCELO SAVIAN" counterparty,
  Revolut internal moves) must **not** be double-counted as both spend and income.
- The joint ING account only became shared on **23-Apr-2026**; earlier activity is personal.
- Only the **joint ING account** feeds household variable spend; personal cards (Amex/Revolut)
  feed the "evaluations" analysis, not the household cycle budget.
- Deduplication identity per source is well-defined (date + amount + description + resulting
  balance for ING; UUID for Nubank; statement close-date for Amex; etc.).

### 1.2 Core domain: budgeting Cycles (the heart of the app)

Budget is organised into **cycles running the 23rd → 22nd** of each month, aligned to when
salary lands. Each cycle (`cycleSchema`) carries raw inputs plus derived figures computed by
`_build_dataset.py` (never hand-edited):

Raw inputs (in `source.json`):
- `salaries`: `{ marcelo, gabriele, bonus }`
- `fixed[]`: fixed bills — `{ label, value, paid, paidOn, items[] }`
- `gastos[]`: variable expenses — `{ desc, value, category, day }` (categories seen: `Mercado`,
  `Lazer`, `Outros`)
- `reserva`: buffer held back (default 100)
- `seed` (first cycle / new cycle only): `{ estimativa, saqueReal:{marcelo,gabriele},
  saldoInicial }` — otherwise these auto-chain from the previous cycle.

Derived figures (computed):
- `income.total` and `pctMarcelo` / `pctGabriele` (proportional split of household income)
- `fixedTotal`, `variableTotal`, `totalGasto`, `byCategory` (sum per category)
- `estimativa` (variable budget target — chained from prior cycle's actual variable spend)
- `totalReservar` = fixas + estimativa + reserva
- `saqueSugerido` (suggested withdrawal per person = `(income − totalReservar) × pct`)
- `saqueReal` (actual withdrawals taken to personal accounts)
- `saldoInicial` (carryover from previous cycle's `sobra`)
- `disponivel` = saldoInicial + income − saqueRealTotal
- `orcamentoVariavel` = disponivel − fixedTotal  (what's truly left for variable spend; last
  month's overspend flows in automatically via `saldoInicial`)
- `sobraFalta` / `sobraReal` = disponivel − totalGasto  (surplus/deficit)
- `variaveisVsEstimado`, `saqueSugeridoProximo`

The cycle-chaining logic (each cycle seeds the next) is the trickiest business rule and must be
reproduced faithfully server-side.

### 1.3 Fixed bills tracking

Per cycle, a checklist of recurring obligations (rent, health insurance, utilities, mobile,
water, bike, union dues, bank fee, card auto-debits). Each bill has `paid` / `paidOn` state and
optional itemised sub-lines. The Overview page shows "situação atual — pago vs a pagar"
(N/M paid, € remaining). Recurring NL obligations are documented (rent ~1,550, CZ health
~313.90, Eneco, Odido, Waternet/Waterschap, Swapfiets, De Unie, ING fee).

### 1.4 Evaluations (spend/subscription analysis)

A monthly analysis layer (`evaluationsSchema`):
- `summary`: months[], income/outflow/net per month, and `categories[]` each with per-month
  values, computed `avg`, and `latestVsAvg`.
- `monthly[]`: per-month narrative — `inflow/outflow/net`, `topCategories`, `biggest` vendors,
  `recurring` subscriptions, `watch`, `suggestions`, `notes`.

This is the "where does the money go" review that produced `FINDINGS.md` (subscription audit,
Uber Eats as top discretionary line, BR-arbitrage notes, savings-allocation critique).

### 1.5 Savings and projections

`savingsSchema` tracks:
- EUR savings: `currentBalance`, `annualRate`, `rateHistory[]`, `events[]`
  (Deposit/Withdrawal/Interest with running balance), `monthly[]` rollups
  (open/deposits/withdrawals/interest/close/delta).
- `brazil`: C6 CDB fixed income — `currentBalance`, `liquidoResgate`, `totalInvestido`,
  `annualRate`, `monthlyContribution`.
- `otherHoldings[]`: brokerage positions (individual stocks: NVIDIA, MongoDB, Datadog, Nu
  Holdings, Adyen, etc.).

**Savings projection engine** (`ComputeSavingsProjection`) — the most sophisticated feature:
- Two-phase emergency-fund model: balance grows at the savings rate until it hits a tweakable
  **reserve target** (default €24k), after which the excess compounds at a **post-reserve stock
  return** (default 10%).
- NL **Box 3 wealth tax** modelling: ~2.16% annual levy on the balance above the ~€57k
  allowance, deducted monthly so the drag compounds; produces a net-of-tax line.
- Horizon selector 1/5/10/15/20/30/40/50 years, contribution slider, comparison line
  ("só poupança" / "só aportes"), milestone table, compact money formatting for large values.
- BR CDB single-rate projection with its own contribution slider.

### 1.6 Presentation (React dashboard)

Stack: React 19, Vite, Tailwind 4, Zod, Biome, Vitest. Clean Architecture folders
(`domain` / `data` / `infra` / `main` / `presentation`). Pages:
- **Overview** — current cycle summary + bills paid-vs-to-pay.
- **Cycles / CycleDetail** — per-cycle detail, "current cycle" detection (the cycle whose
  22nd-end contains today), "pode gastar €X/dia" banner.
- **Evaluations** — the spend/subscription analysis views.
- **Savings** — projection panels (EUR two-phase + BR CDB).
- **"Copiar resumo"** — builds a WhatsApp-ready text summary of the current cycle (also a
  standalone `resumo.py`).

Reusable components: `BarList`, `Card`, `LineChart`, `StatTile`, `SummaryCard`, `Tag`,
`format` helpers, `currentCycle` / `buildSummary` helpers (unit-tested).

### 1.7 Non-obvious rules worth preserving

- Two-person proportional split of income and withdrawals (not 50/50 — driven by each salary).
- The 22nd/23rd cycle-boundary off-by-one (spend on the 22nd belongs to the closing cycle).
- Multi-currency without conversion in storage: amounts stay in source currency; convert only
  for comparison.
- BR side never flows into the EUR household cycle; it lives only in savings + evaluations.
- Derived figures are always recomputed, never stored by hand.

---

## 2. nosko — architecture lessons to reuse (not the code)

`nosko` was the earlier, more ambitious attempt at exactly this idea ("financial management app
for couples… multiple bank accounts… shared planning… planned vs actual"). It was abandoned but
established patterns worth reusing:

- **Backend:** TypeScript on AWS Lambda, Clean Architecture with strict layers
  (`domain/usecases`, `domain/models`, `data/services`, `infra/repositories`,
  `handlers/api`, `handlers/factories`). Same pattern appears in `mmas` and
  `bank_account_backend` — this is Marcelo's signature backend shape.
- **Contracts/docs:** Zod schemas as the single source of truth, auto-generated OpenAPI via
  `@asteasolutions/zod-to-openapi`, co-located `*.meta.ts`, Swagger UI served by a `docs`
  Lambda. Keep this.
- **Database:** PostgreSQL (Neon serverless) with SQL migrations.
- **IaC:** Terraform, cloud-agnostic modules named by capability (`compute`, `api-routing`,
  `secrets`, `static-site`, `admin-site`) with AWS implementations nested inside, wired per
  environment (`test` / `prod` / `mgmt`). A shared infra repo holds domain + ACM cert.
- **Frontend:** React app under `web/` following the same Clean Architecture layering; an
  `admin` variant; and a Kotlin Multiplatform `mobile/` target (likely out of scope for v1).
- **Discipline:** pin exact dependency versions, verify packages before install, no code
  comments.

### Why nosko stalled (lessons)

- Scope was too broad up front (web + admin + KMP mobile + i18n + full IaC) before the core
  budgeting loop existed. The new app should ship the **core cycle/budget loop first**, then
  layer evaluations, savings projections, and any mobile.
- `money-evaluation` was built precisely to discover the **real** required feature set — so the
  new app should treat money-evaluation's feature list as the authoritative scope and resist
  re-expanding into nosko's speculative surface area.

---

## 3. Consolidation — what the new app is

The new app = **money-evaluation's proven functionality** delivered through **nosko's proven
architecture**, built fresh:

- Multi-user (2 users, one household) with authentication.
- A real database replacing hand-edited `source.json`.
- Cycle-based couple budgeting with the exact chaining/derived-figure logic, moved server-side.
- Fixed-bill tracking, variable-spend categorisation, evaluations, savings + projections.
- Transaction ingestion (method to be decided — see requirements questions) replacing manual
  JSON editing.
- The React dashboard carried forward, but reading a live API instead of a static bundle.
- Existing `source.json` history imported as seed data.
- Hosted on AWS, private to the two users.
