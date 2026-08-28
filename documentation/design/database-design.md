# Database Design — finance-app (PostgreSQL / Neon)

Relational model for `requirements.md`, accessed via `@effect/sql-pg` and evolved with SQL
migrations. **All identifiers are English** (see architecture §4 vocabulary). Derived cycle
figures and projections are **computed in the domain layer, not stored** (architecture §5/§7);
this schema holds **raw inputs + configuration + audit data**.

## Conventions

- PKs: `uuid` (`gen_random_uuid()`, `pgcrypto`).
- Money: **`amount_minor bigint`** (integer minor units) + **`currency char(3)`** (ISO 4217).
  Never floats. Rates/percentages: `numeric(10,6)`.
- Timestamps: `timestamptz`; `created_at`/`updated_at` (trigger-maintained).
- Every household-owned table carries `household_id` (app scoping + optional RLS via
  `current_setting('app.household_id')`).
- Enums as Postgres `enum` types (inline). snake_case names.

## Entity overview (text ERD)

```
users ──< household_members >── households ──1:1── household_settings
users ──< auth_tokens / user_sessions
households ──< household_invitations
households ──< categories
households ──< recurring_rules            (fixed-bill templates + categorisation rules)
households ──< cycles ──< cycle_incomes            (member salaries/bonus)
                    │  ──< cycle_withdrawals        (actual withdrawal, per member)
                    │  ──< fixed_bills ──< fixed_bill_items      (fixed_bills.recurring_rule_id?)
                    │  ──< expenses ──(optional)── transactions  (transactions.expense_id?)
households ──< bank_accounts ──< transactions >── statement_uploads
households ──< savings_accounts ──< savings_events / savings_rate_history / holdings
households ──< projection_settings (1:1)
households ──< evaluation_months
households ──< evaluation_categories ──< evaluation_category_values
```

Cycle chaining (estimate ← prev variableTotal, openingBalance ← prev surplus) is an **ordering
over `cycles`** resolved by the Cycle Engine, not a stored FK.

---

## Tables

### Identity & auth

**users** — `id` pk · `email` citext unique · `password_hash` (argon2id) · `name` ·
`preferred_locale` text null (per-user UI language, overrides household default) · `email_verified`
bool · `mfa_enabled` bool · `mfa_secret` text null (encrypted) · `created_at`/`updated_at`.

**auth_tokens** — `id` pk · `user_id` fk · `type` enum(`email_verify`,`password_reset`,`mfa_otp`)
· `token_hash` · `expires_at` · `consumed_at` null · `created_at`.

**user_sessions** — `id` pk · `user_id` fk · `refresh_token_hash` · `user_agent`/`ip` null ·
`expires_at` · `revoked_at` null · `created_at`.

### Household & configuration

**households** — `id` pk · `name` · `base_currency` char(3) default 'EUR' · `created_by` fk users
· `created_at`/`updated_at`.

**household_settings** (1:1 — the primary configuration surface)
| column | type | notes |
|---|---|---|
| household_id | uuid pk fk households | |
| cycle_anchor_day | int not null default 23 | configurable cycle start day |
| locale | text not null default 'pt-BR' | default UI language (`pt-BR`/`en`) |
| base_currency | char(3) not null default 'EUR' | mirrors households for convenience |
| reserve_default_minor | bigint not null default 10000 | default cycle reserve (€100) |
| updated_at | timestamptz | |

**household_members** — `(household_id, user_id)` pk · `role` enum(`owner`,`member`) ·
`display_name` (e.g. "Marcelo"/"Gabriele") · `joined_at`.

**household_invitations** — `id` pk · `household_id` fk · `email` citext · `token_hash` ·
`invited_by` fk users · `status` enum(`pending`,`accepted`,`revoked`,`expired`) default 'pending'
· `expires_at` · `accepted_by` fk users null · `created_at`.

**categories** (configurable) — `id` pk · `household_id` fk · `name` text · `sort_order` int
default 0 · unique(`household_id`, `name`). Seeded on household creation using the household
`locale` (e.g. pt: Mercado/Lazer/Outros; en: Groceries/Leisure/Other). Names are user data.

**recurring_rules** (fixed-bill templates **and** categorisation rules)
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| household_id | uuid fk households | |
| match_type | enum(`vendor_exact`,`vendor_contains`,`counterparty`) not null | |
| matcher | text not null | pattern to match transaction description/counterparty |
| expected_amount_minor | bigint null | for fixed bills |
| currency | char(3) null | |
| category | text null | auto-assigned category on match |
| cadence | enum(`monthly`,`yearly`,`irregular`) not null default 'monthly' | |
| is_fixed_bill | boolean not null default false | generate a fixed bill each cycle |
| active | boolean not null default true | |
| source | enum(`auto_detected`,`user_defined`) not null | |
| confidence | numeric(10,6) null | detector score (auto only) |
| created_at / updated_at | timestamptz | |

### Budgeting

**cycles**
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| household_id | uuid fk households | |
| cycle_key | text not null | e.g. `2026-04-23` (anchor-dated) |
| title | text not null | e.g. "23 Apr – 22 May" (localised on the client) |
| start_date | date not null | anchor day (from settings, overridable) |
| end_date | date not null | day before next anchor |
| reserve_minor | bigint not null | defaults from household_settings |
| seed_estimate_minor | bigint null | first/seeded cycle only; else chained |
| seed_opening_balance_minor | bigint null | first/seeded cycle only; else chained |
| created_at / updated_at | timestamptz | |
| unique | (household_id, cycle_key) | |
| index | (household_id, start_date) | chaining order |

**cycle_incomes** — `id` pk · `cycle_id` fk · `member_user_id` fk users null (null = household
bonus) · `kind` enum(`salary`,`bonus`) · `amount_minor` · `currency` default 'EUR'.

**cycle_withdrawals** (raw actual withdrawal per member; suggested is derived) — `id` pk ·
`cycle_id` fk · `member_user_id` fk users · `amount_minor` · `currency` default 'EUR'.

**fixed_bills**
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| cycle_id | uuid fk cycles | |
| recurring_rule_id | uuid fk recurring_rules null | template that generated it, if any |
| label | text not null | |
| amount_minor | bigint not null | |
| currency | char(3) not null default 'EUR' | |
| paid | boolean not null default false | |
| paid_on_day | int null | |
| auto_paid | boolean not null default false | set when matched by an ingested transaction |
| sort_order | int not null default 0 | |
| created_at / updated_at | timestamptz | |

**fixed_bill_items** — `id` pk · `fixed_bill_id` fk · `item_date` date null · `description` ·
`amount_minor` · `category` null.

**expenses** (variable expenses — formerly "gastos")
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| cycle_id | uuid fk cycles | |
| household_id | uuid fk households | denormalised for isolation/queries |
| description | text not null | |
| amount_minor | bigint not null | may be negative (reimbursement) |
| currency | char(3) not null default 'EUR' | |
| category | text not null | references categories.name (soft) |
| day | int null | day-of-month |
| source | enum(`manual`,`ingested`) not null default 'manual' | |
| transaction_id | uuid fk transactions null | link when created from ingestion |
| created_at / updated_at | timestamptz | |

### Ingestion

**bank_accounts** — `id` pk · `household_id` fk · `institution`
enum(`ing`,`revolut`,`amex`,`nubank`,`c6`) · `label` · `kind`
enum(`checking`,`credit`,`savings`,`brokerage`,`investment`) · `currency` · `owner_user_id` fk
users null (null = joint) · `is_joint` bool default false · `created_at`.

**statement_uploads** — `id` pk · `household_id` fk · `bank_account_id` fk null · `institution`
enum · `file_key` (S3) · `original_filename` · `format` enum(`csv`,`pdf`) · `period_start`/
`period_end` date null · `status` enum(`uploaded`,`parsing`,`parsed`,`failed`) default 'uploaded'
· `error` text null · `uploaded_by` fk users · `uploaded_at`.

**transactions**
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| household_id | uuid fk households | |
| bank_account_id | uuid fk bank_accounts | |
| upload_id | uuid fk statement_uploads null | |
| external_id | text null | e.g. Nubank UUID |
| booked_date | date not null | |
| description | text not null | |
| counterparty | text null | |
| amount_minor | bigint not null | |
| currency | char(3) not null | |
| direction | enum(`debit`,`credit`) not null | |
| category | text null | assigned on review (or by a recurring_rule) |
| is_transfer | boolean not null default false | self-transfer flag |
| linked_transaction_id | uuid fk transactions null | matched other leg (Wise EUR↔BRL) |
| status | enum(`staged`,`confirmed`,`ignored`,`duplicate`) not null default 'staged' | |
| expense_id | uuid fk expenses null | set when confirmed into a cycle |
| matched_rule_id | uuid fk recurring_rules null | fixed-bill/categorisation match |
| dedup_hash | text not null | per-source identity hash |
| created_at | timestamptz | |
| unique | (household_id, dedup_hash) | dedupe guarantee |
| index | (household_id, bank_account_id, booked_date) | |

### Savings & investments

**savings_accounts** — `id` pk · `household_id` fk · `name` · `kind`
enum(`cash_savings`,`cdb`,`brokerage`) · `currency` · `current_balance_minor` · `as_of` date ·
`annual_rate` numeric null · `monthly_contribution_minor` bigint null · `net_redemption_minor`
bigint null (CDB net-of-tax) · `total_invested_minor` bigint null (CDB principal) · `note` null ·
`created_at`/`updated_at`.

**savings_events** — `id` pk · `savings_account_id` fk · `event_date` date · `type`
enum(`deposit`,`withdrawal`,`interest`) · `amount_minor` · `balance_minor` (running) ·
`created_at`. Monthly rollups are a derived view `savings_monthly_v` over this table.

**savings_rate_history** — `id` pk · `savings_account_id` fk · `effective_date` date · `rate`
numeric(10,6).

**holdings** (brokerage positions) — `id` pk · `savings_account_id` fk null · `household_id` fk ·
`name` · `currency` · `quantity` numeric(18,6) null · `unit_cost_minor` bigint null ·
`value_minor` bigint · `as_of` date · `note` null.

**projection_settings** (1:1) — `household_id` pk fk · `reserve_target_minor` bigint default
2400000 (€24k) · `post_reserve_rate` numeric default 0.10 · `wealth_tax_allowance_minor` bigint
default 5700000 (~€57k) · `wealth_tax_rate` numeric default 0.0216 (Box 3) · `default_horizon_years`
int default 20.

### Evaluations

**evaluation_months** — `id` pk · `household_id` fk · `month` text `YYYY-MM` ·
`inflow_minor`/`outflow_minor`/`net_minor` bigint null · `top_categories`/`biggest`/`recurring`/
`watch`/`suggestions`/`notes` jsonb default '[]' · unique(`household_id`, `month`).

**evaluation_categories** — `id` pk · `household_id` fk · `name`.
**evaluation_category_values** — `id` pk · `category_id` fk · `month` · `amount_minor` ·
unique(`category_id`, `month`). (avg / latestVsAvg computed in the domain layer.)

---

## Isolation, integrity, indexing

- **Household isolation:** repositories filter by the authenticated member's `household_id`;
  optional Postgres **RLS** on household-owned tables keyed to `app.household_id` GUC set per
  request by the BFF.
- **Referential integrity:** cascade from `cycles` to children; `restrict` from `households`.
- **Indexes:** `cycles(household_id, start_date)`; `expenses(cycle_id)`;
  `transactions(household_id, dedup_hash)` unique; `transactions(bank_account_id, booked_date)`;
  `savings_events(savings_account_id, event_date)`; `evaluation_category_values(category_id, month)`;
  `recurring_rules(household_id, active)`.
- **Extensions:** `pgcrypto`, `citext`.

## Migrations & seeding

- SQL migrations under `backend/migrations/` (nosko convention), run by the `@effect/sql`
  migrator (or a light SQL migrator) in deploy/CI.
- On household creation: seed `household_settings`, `projection_settings`, and default
  `categories` in the chosen `locale`.

## Notes vs money-evaluation

- Portuguese domain fields are renamed to English (architecture §4). Derived figures
  (`suggestedWithdrawal`, `available`, `variableBudget`, `surplus`, `byCategory`, chained
  `estimate`) are **domain computations**, keeping the DB normalised to raw inputs.
- The **cycle boundary is configurable** via `household_settings.cycle_anchor_day` (default 23),
  with per-cycle date overrides.
- **Fixed bills** can be **auto-identified** (`recurring_rules.source = auto_detected`) or
  **user-defined**; active `is_fixed_bill` rules generate per-cycle `fixed_bills` and are
  auto-marked paid by matching ingested transactions.
- Multi-currency is first-class; no conversion persisted. Optional `fx_rates(date, base, quote,
  rate)` can back comparison views later.
