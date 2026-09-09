# Database Design — nosko (PostgreSQL / Neon)

Storage model for `requirements.md`, aligned to the generated UI. Accessed via `@effect/sql-pg`,
evolved with SQL migrations. **All identifiers English.** The DB holds **raw inputs +
configuration + audit data**; derived figures (cycle math, projections, evaluations) are computed
in the domain layer and returned as view models.

## Conventions

- PKs `uuid` (`gen_random_uuid()`, `pgcrypto`). Money `amount_minor bigint` + `currency char(3)`
  (ISO 4217). Rates/percent `numeric(10,6)`. Timestamps `timestamptz`.
- **Ownership + visibility on financial rows:** `household_id` (scoping), `owner_user_id`, and
  `visibility` (`personal` | `shared`). Personal rows are readable only by the owner; shared rows
  by both members. Enforced in repositories **and by mandatory Postgres RLS** (policies on the
  `app.user_id` / `app.household_id` settings, see "Access & isolation").
- Enums as Postgres enum types (inline). snake_case. `citext` for emails.

## Entity overview (text ERD)

```
users ─< household_members (max 2) >─ households ─1:1─ household_settings
users ─1:1─ user_settings ; users ─< auth_tokens / user_sessions ; households ─< household_invitations
households ─< categories ─< category_caps            (household or personal scope; per-cycle caps)
users ─< accounts (owner; co_owner for joint)         (visibility; source manual|file_import)
accounts ─< transactions >─ statement_uploads        (owner + visibility; dedup_hash; transfer link)
households ─< cycles ─< cycle_incomes                 (per member)
                  │  ─< member_transfers             (withdrawals to personal / contributions to household)
                  │  ─< fixed_bills ─< fixed_bill_items (paying_account)
                  │  ─< shared_payments               (from joint accounts; base-currency amount + rate)
households ─< recurring_rules
households ─< goals ─< goal_contribution_plans / goal_contributions   (per member; linked vault account)
users ─< savings_accounts ─< savings_events / savings_rate_history / holdings   (personal)
users ─1:1─ projection_settings ; users ─< projection_scenarios
users ─< subscriptions                                (personal; NL/BR)
households ─< month_notes                             (optional free text for evaluations)
fx_rates                                              (reference)
```

---

## Identity, household & configuration

**users** — id · email citext unique · password_hash (argon2id) · name · preferred_locale ·
email_verified · mfa_enabled · mfa_secret (encrypted with the SSM app key) · created_at/updated_at.

**auth_tokens** — id · user_id · type(`email_verify`|`password_reset`|`mfa_otp`) · token_hash ·
expires_at · consumed_at.  **user_sessions** — id · user_id · refresh_token_hash · expires_at ·
revoked_at · device_label · mfa_trusted_until timestamptz null (remember-device, ≤ 30 days).

**households** — id · name · base_currency char(3) default 'EUR' · created_by · timestamps.

**household_settings** (1:1) — household_id pk · cycle_anchor_day int default 23 · locale default
'pt-BR' · base_currency · default_reserve_minor · **box3_allowance_minor** (~€57k) ·
**box3_rate** (~0.0216) · inflation_rate default 0 · updated_at.

**household_members** — (household_id, user_id) pk · role(`owner`|`member`) · display_name ·
joined_at. A trigger/constraint keeps **at most two rows per household**.
**household_invitations** — id · household_id · email · token_hash · invited_by ·
status(`pending`|`accepted`|`revoked`|`expired`) · expires_at · accepted_by.

**user_settings** (1:1) — user_id pk · personal_spend_cap_minor null · currency · updated_at.
(Locale lives on `users`; hide-values and last space are client-side preferences.)

**categories** — id · household_id · scope(`household`|`personal`) · owner_user_id null (set when
`personal`) · name · color · sort_order · unique(household_id, scope, owner_user_id, name).
**category_caps** — id · category_id · cycle_id · cap_minor · unique(category_id, cycle_id).

## Accounts

**accounts**
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| household_id | uuid fk | |
| owner_user_id | uuid fk users | who registered it |
| co_owner_user_id | uuid fk users null | second owner of a **joint** account |
| ownership | enum(`sole`,`joint`) not null default 'sole' | joint ⇒ visibility must be `shared` and co_owner set once the partner joined |
| visibility | enum(`personal`,`shared`) not null default 'personal' | shared = appears in Casa |
| institution | enum(`ing`,`revolut`,`amex`,`nubank`,`c6`,`abn`,`other`) | |
| nickname | text | e.g. "ING Conjunta" |
| type | enum(`checking`,`credit_card`,`savings`,`brokerage`,`investment`,`vault`) | |
| currency | char(3) | EUR/BRL |
| masked_id | text | masked IBAN/number; unique(household_id, masked_id) |
| balance_minor | bigint null | latest known |
| purpose | text null | e.g. "Moradia & Débitos" |
| statement_close_day | int null | credit cards |
| credit_limit_minor | bigint null | credit cards |
| autopay_account_id | uuid fk accounts null | credit cards: source account of the direct debit |
| source | enum(`manual`,`file_import`) not null default 'manual' | how data enters (no live sync) |
| last_import_at | timestamptz null | shown in the UI |
| created_at/updated_at | timestamptz | |
| index | (household_id, visibility), (owner_user_id), (co_owner_user_id) | |

A user "owns" an account when they are `owner_user_id` **or** `co_owner_user_id`; both owners can
edit it and import into it. No bank-sync/connection table.

## Transactions & shared payments

**statement_uploads** — id · household_id · account_id null · uploader owner_user_id · file_key
(S3) · original_filename · format enum(`csv`,`pdf`) · period_start/end ·
status(`uploaded`|`parsing`|`parsed`|`failed`) · error · uploaded_at.

**transactions** (normalised; staged → confirmed; personal or shared)
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| household_id | uuid fk | |
| account_id | uuid fk accounts | |
| owner_user_id | uuid fk users | derived from the account |
| visibility | enum(`personal`,`shared`) | derived from the account |
| upload_id | uuid fk statement_uploads null | |
| external_id | text null | e.g. Nubank UUID |
| booked_at | timestamptz | |
| description / counterparty | text | |
| amount_minor | bigint · currency char(3) | |
| direction | enum(`debit`,`credit`) | |
| category_id | uuid fk categories null | assigned on review or by a rule |
| category_confidence | numeric null | categoriser |
| is_transfer | boolean default false · linked_transaction_id uuid null | internal-transfer pair (may cross visibility: the shared leg is a member contribution) |
| matched_rule_id | uuid fk recurring_rules null | |
| status | enum(`staged`,`confirmed`,`ignored`,`duplicate`) default 'staged' | |
| shared_payment_id | uuid fk shared_payments null | set when a shared txn is confirmed |
| dedup_hash | text | unique(household_id, dedup_hash) |
| created_at | timestamptz | |
| index | (household_id, account_id, booked_at), (owner_user_id, visibility) | |

**shared_payments** (a confirmed or manually entered payment from a joint/shared account)
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| household_id | uuid fk · cycle_id fk cycles | cycle chosen by booked_at and the anchor boundary |
| account_id | uuid fk accounts (visibility shared) | |
| transaction_id | uuid fk transactions null | source, if ingested |
| booked_at · description · counterparty | | |
| amount_minor · currency | | source currency |
| amount_base_minor | bigint | in the household base currency; = amount_minor when currencies match |
| fx_rate | numeric(14,6) null | rate used (quote per base) when converted |
| category_id | uuid fk categories | household scope |
| created_by | uuid fk users | |
| created_at/updated_at | | |

No payer, no split, no settlements: every shared payment is paid by the household from a joint
account. Per-member contribution shares come from `cycle_incomes`.

## Cycles

**cycles** — id · household_id · cycle_key · title · start_date · end_date ·
status(`open`|`closed`) default 'open' · closed_at null · reserve_minor · estimate_minor null
(set-aside for unplanned shared payments; null ⇒ chained from the previous cycle's variableTotal)
· seed_opening_balance_minor null · surplus_goal_id fk goals null · surplus_destination_label text
null · timestamps · unique(household_id, cycle_key) · index(household_id, start_date).

**cycle_incomes** — id · cycle_id · member_user_id · kind(`salary`|`bonus`) · amount_minor ·
currency (base).

**member_transfers** — id · cycle_id · member_user_id · direction(`to_personal`|`to_household`) ·
amount_minor · currency · settled_at timestamptz null · method text null ·
transaction_id fk transactions null. `to_personal` = withdrawal (saque, user-defined after seeing
`availableAfterPayments`); `to_household` = contribution ("Transferir p/ Casa").

**fixed_bills** — id · cycle_id · recurring_rule_id fk null · label · amount_minor · currency ·
paid bool · paid_on_day int null · **paying_account_id** fk accounts null · due_day int null ·
auto_paid bool default false · category_id null · sort_order · timestamps.
**fixed_bill_items** — id · fixed_bill_id · item_date · description · amount_minor.

**recurring_rules** — id · household_id · match_type(`vendor_exact`|`vendor_contains`|
`counterparty`) · matcher · expected_amount_minor null · currency null · category_id null ·
cadence(`monthly`|`yearly`|`irregular`) · is_fixed_bill bool · active bool ·
source(`auto_detected`|`user_defined`) · confidence numeric null · timestamps.

## Goals & vaults (shared)

**goals** — id · household_id · name · category · target_minor · currency · deadline date null ·
status(`in_progress`|`achieved`|`paused`) · yield_rate numeric null · vault_account_id fk accounts
null · created_at/updated_at. Accumulated amount = sum of contributions (computed).
**goal_contribution_plans** — id · goal_id · member_user_id · amount_per_cycle_minor ·
unique(goal_id, member_user_id).
**goal_contributions** — id · goal_id · member_user_id · cycle_id null · amount_minor ·
contributed_at.

## Personal savings, investments & subscriptions (private)

**savings_accounts** — id · owner_user_id · household_id · account_id fk accounts null · name ·
kind(`cash_savings`|`cdb`|`brokerage`) · currency · current_balance_minor · as_of · annual_rate
null · monthly_contribution_minor null · net_redemption_minor null · total_invested_minor null ·
note null.
**savings_events** — id · savings_account_id · event_date · type(`deposit`|`withdrawal`|
`interest`) · amount_minor · balance_minor.  Monthly rollups via view `savings_monthly_v`.
**savings_rate_history** — id · savings_account_id · effective_date · rate.
**holdings** — id · owner_user_id · savings_account_id null · ticker · name · exchange text null ·
currency · quantity numeric · unit_cost_minor null · unit_cost_currency char(3) null ·
current_price_minor null · value_minor · custodian text null · as_of · note.

**projection_settings** (1:1 per user) — owner_user_id pk · reserve_target_minor default 2400000 ·
post_reserve_rate default 0.10 · base_rate default 0.02 · wealth_tax_allowance_minor default
5700000 · wealth_tax_rate default 0.0216 · inflation_rate default 0 · default_horizon_years 30.
**projection_scenarios** — id · owner_user_id · name · params jsonb · created_at (saved scenarios).

**subscriptions** — id · owner_user_id · name · country enum(`NL`|`BR`) · account_id fk null ·
monthly_minor · currency · cadence · next_charge_on date null · recommendation
enum(`keep`|`review`|`cancel`) null · action_taken bool default false · detected_from text null ·
active bool · created_at. Redundancy groups + efficiency score computed in the domain layer.

## Evaluations (shared) & reference

Evaluations are **computed** from `shared_payments` + `fixed_bills` (monthly inflow/outflow/net,
category matrix, averages, biggest vendors, recurring). Only free text is stored:
**month_notes** — id · household_id · month `YYYY-MM` · notes text · unique(household_id, month).

**fx_rates** — id · rate_date · base char(3) · quote char(3) · rate numeric · unique(rate_date,
base, quote). Fetched daily (ECB) by a scheduled job; used for display conversion and for
`shared_payments.amount_base_minor` at confirmation.

---

## Access, isolation & indexing

- **Casa vs Pessoal from one model:** the BFF opens a transaction per request and runs
  `SET LOCAL app.user_id = …; SET LOCAL app.household_id = …` (session-level `SET` does not survive
  Neon's pooled endpoint). RLS policies on every financial table then enforce: shared rows require
  `household_id = current_setting('app.household_id')`; personal rows additionally require
  `owner_user_id = current_setting('app.user_id')`; accounts also allow `co_owner_user_id`.
  Repositories add the same filters explicitly (defence in depth). The application role is **not**
  the table owner and has no `BYPASSRLS`.
- Cascade from `cycles`/`goals` to children; `restrict` from `households`.
- Indexes: `accounts(household_id, visibility)`, unique `(household_id, masked_id)`;
  `transactions(household_id, dedup_hash)` unique, `(account_id, booked_at)`,
  `(owner_user_id, visibility)`; `shared_payments(cycle_id)`, `(household_id, booked_at)`;
  `member_transfers(cycle_id)`; `savings_events(savings_account_id, event_date)`;
  `fx_rates(rate_date, base, quote)`.
- Extensions: `pgcrypto`, `citext`.

## Migrations & seeding

SQL migrations in `backend/migrations/` (run by the `@effect/sql` migrator via the migration
Lambda). Every migration that adds a financial table also adds its RLS policies. On household
creation: seed `household_settings`, `user_settings` + `projection_settings` per user, default
household `categories` (locale), and default personal categories per user.

## Notes vs money-evaluation

- The proportional model is money-evaluation's: income shares fund the joint account, fixed bills
  and the variable estimate come first, the remainder is withdrawn by decision. Withdrawals are
  user-defined instead of suggested. Personal vs shared **visibility**, joint accounts with two
  owners, credit-card fields, goals with contribution plans, subscriptions, category caps, FX,
  and projection scenarios are added to match the generated screens. Evaluations are computed
  instead of hand-written. Derived figures remain computed, not stored.
