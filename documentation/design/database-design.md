# Database Design — nosko (PostgreSQL / Neon)

Storage model for `requirements.md`, aligned to the generated UI. Accessed via `@effect/sql-pg`,
evolved with SQL migrations. **All identifiers English.** The DB holds **raw inputs +
configuration + audit data**; derived figures (cycle math, split/settlement, projections) are
computed in the domain layer and returned as view models.

## Conventions

- PKs `uuid` (`gen_random_uuid()`, `pgcrypto`). Money `amount_minor bigint` + `currency char(3)`
  (ISO 4217). Rates/percent `numeric(10,6)`. Timestamps `timestamptz`.
- **Ownership + visibility on financial rows:** `household_id` (scoping), `owner_user_id`, and
  `visibility` (`personal` | `shared`). Personal rows are readable only by the owner; shared rows
  by both members. Enforced in repositories (+ optional Postgres RLS on `app.user_id` /
  `app.household_id`).
- **Personal data encryption:** for `visibility='personal'` rows, sensitive columns
  (descriptions, counterparties, notes, balances) are stored via **KMS envelope encryption**
  (`enc_*` bytea + `enc_dek_id`), decrypted only for the owner in the BFF. Shared rows stored in
  plaintext columns (both members read them). See "Personal vault" note.
- Enums as Postgres enum types (inline). snake_case. `citext` for emails.

## Entity overview (text ERD)

```
users ─< household_members >─ households ─1:1─ household_settings
users ─< auth_tokens / user_sessions ; households ─< household_invitations
households ─< categories ─< category_caps            (per-cycle spend caps / tetos)
users ─< accounts                                    (owner + visibility; source manual|file_import)
accounts ─< transactions >─ statement_uploads        (owner + visibility; dedup_hash; transfer link)
households ─< cycles ─< cycle_incomes                 (per member)
                  │  ─< cycle_withdrawals             (saques to personal; settled_at)
                  │  ─< fixed_bills ─< fixed_bill_items (paying_account, paid_by)
                  │  ─< shared_payments ─< payment_splits   (payer + per-member share)
                  │  ─< settlements                   (acertos: inter-partner transfers)
households ─< recurring_rules
households ─< goals ─< goal_contributions             (linked vault account, per member)
users ─< savings_accounts ─< savings_events / savings_rate_history / holdings   (personal)
users ─1:1─ projection_settings ; users ─< projection_scenarios
users ─< subscriptions                                (personal; NL/BR)
households ─< evaluation_months / evaluation_categories ─< evaluation_category_values
fx_rates                                              (reference)
```

---

## Identity, household & configuration

**users** — id · email citext unique · password_hash (argon2id) · name · preferred_locale ·
email_verified · mfa_enabled · mfa_secret (encrypted) · created_at/updated_at.

**auth_tokens** — id · user_id · type(`email_verify`|`password_reset`|`mfa_otp`) · token_hash ·
expires_at · consumed_at.  **user_sessions** — id · user_id · refresh_token_hash · expires_at ·
revoked_at.

**households** — id · name · base_currency char(3) default 'EUR' · created_by · timestamps.

**household_settings** (1:1) — household_id pk · cycle_anchor_day int default 23 · locale default
'pt-BR' · base_currency · emergency_reserve_minor · **box3_allowance_minor** (~€57k) ·
**box3_rate** (~0.0216) · inflation_rate default 0 · updated_at.

**household_members** — (household_id, user_id) pk · role(`owner`|`member`) · display_name ·
joined_at.  **household_invitations** — id · household_id · email · token_hash · invited_by ·
status(`pending`|`accepted`|`revoked`|`expired`) · expires_at · accepted_by.

**categories** — id · household_id · name · color · sort_order · unique(household_id,name).
**category_caps** — id · category_id · cycle_id · cap_minor · unique(category_id,cycle_id).

## Accounts & connections

**accounts**
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| household_id | uuid fk | |
| owner_user_id | uuid fk users | who registered it |
| visibility | enum(`personal`,`shared`) not null default 'personal' | shared = appears in Casa |
| institution | enum(`ing`,`revolut`,`amex`,`nubank`,`c6`,`abn`,`other`) | |
| nickname | text | e.g. "ING Conjunta" |
| type | enum(`checking`,`credit_card`,`savings`,`brokerage`,`investment`,`vault`) | |
| currency | char(3) | EUR/BRL |
| masked_id | text | masked IBAN/number |
| balance_minor | bigint null | latest known |
| purpose | text null | e.g. "Moradia & Débitos" |
| source | enum(`manual`,`file_import`) not null default 'manual' | how data enters (no live sync) |
| last_import_at | timestamptz null | shown in the UI |
| created_at/updated_at | timestamptz | |
| index | (household_id, visibility), (owner_user_id) | |

No bank-sync/connection table: data comes from manual entry and imported statement files only.

## Transactions & the couple ledger

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
| description / counterparty | text (enc_* for personal) | |
| amount_minor | bigint · currency char(3) | |
| direction | enum(`debit`,`credit`) | |
| category | text null | assigned on review or by a rule |
| category_confidence | numeric null | AI auto-categoriser |
| is_transfer | boolean default false · linked_transaction_id uuid null | internal-transfer pair |
| matched_rule_id | uuid fk recurring_rules null | |
| status | enum(`staged`,`confirmed`,`ignored`,`duplicate`) default 'staged' | |
| shared_payment_id | uuid fk shared_payments null | set when a shared txn enters the ledger |
| dedup_hash | text | unique(household_id, dedup_hash) |
| created_at | timestamptz | |
| index | (household_id, account_id, booked_at), (owner_user_id, visibility) | |

**shared_payments** (a confirmed shared transaction in the couple ledger)
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| household_id | uuid fk · cycle_id fk cycles | |
| account_id | uuid fk accounts (shared) | |
| transaction_id | uuid fk transactions null | source, if ingested |
| booked_at · description · counterparty | | |
| amount_minor · currency | | |
| category | text | |
| payer_user_id | uuid fk users | who paid |
| split_method | enum(`equal`,`proportional`,`custom`) default 'equal' | |
| created_at/updated_at | | |

**payment_splits** — id · shared_payment_id fk · member_user_id fk · share_minor · unique(payment,
member). (Per-member owed share; sums to the payment amount.)

**settlements** (acertos — inter-partner transfers that rebalance the ledger)
| column | type | notes |
|---|---|---|
| id | uuid pk · household_id fk · cycle_id fk null | |
| from_user_id · to_user_id | uuid fk users | who pays whom |
| amount_minor · currency | | |
| status | enum(`suggested`,`recorded`,`settled`) default 'recorded' | |
| method | text null | e.g. SEPA/Tikkie |
| settled_at | timestamptz null · created_at | |

The running inter-partner balance and the *suggested* settlement are **computed** by the
Split/Settlement Engine from `payment_splits` vs `payer`; only recorded/settled acertos persist.

## Cycles

**cycles** — id · household_id · cycle_key · title · start_date · end_date · reserve_minor ·
seed_estimate_minor null · seed_opening_balance_minor null · reserve_destination text null ·
timestamps · unique(household_id, cycle_key) · index(household_id, start_date).

**cycle_incomes** — id · cycle_id · member_user_id null · kind(`salary`|`bonus`) · amount_minor ·
currency.

**cycle_withdrawals** (saques to personal accounts — **user-defined**, set after seeing the cycle's
`availableAfterPayments`) — id · cycle_id · member_user_id · amount_minor · currency · settled_at
timestamptz null · method text null.

**fixed_bills** — id · cycle_id · recurring_rule_id fk null · label · amount_minor · currency ·
paid bool · paid_on_day int null · **paying_account_id** fk accounts null · **paid_by_user_id** fk
users null · due_day int null · auto_paid bool default false · sort_order · timestamps.
**fixed_bill_items** — id · fixed_bill_id · item_date · description · amount_minor · category.

**recurring_rules** — id · household_id · match_type(`vendor_exact`|`vendor_contains`|
`counterparty`) · matcher · expected_amount_minor null · currency null · category null · cadence
(`monthly`|`yearly`|`irregular`) · is_fixed_bill bool · active bool · source(`auto_detected`|
`user_defined`) · confidence numeric null · timestamps.

## Goals & vaults (shared)

**goals** — id · household_id · name · category · target_minor · accumulated_minor · currency ·
deadline date null · status(`in_progress`|`achieved`|`paused`) · yield_rate numeric null ·
vault_account_id fk accounts null · created_at/updated_at.
**goal_contributions** — id · goal_id · member_user_id · cycle_id null · amount_minor ·
contributed_at.

## Personal savings, investments & subscriptions (private)

**savings_accounts** — id · owner_user_id · household_id · name · kind(`cash_savings`|`cdb`|
`brokerage`) · currency · current_balance_minor · as_of · annual_rate null ·
monthly_contribution_minor null · net_redemption_minor null · total_invested_minor null · note null.
**savings_events** — id · savings_account_id · event_date · type(`deposit`|`withdrawal`|
`interest`) · amount_minor · balance_minor.  Monthly rollups via view `savings_monthly_v`.
**savings_rate_history** — id · savings_account_id · effective_date · rate.
**holdings** — id · owner_user_id · savings_account_id null · name · currency · quantity ·
unit_cost_minor null · value_minor · custodian text null · as_of · note.

**projection_settings** (1:1 per user) — owner_user_id pk · reserve_target_minor default 2400000 ·
post_reserve_rate default 0.10 · base_rate default 0.02 · wealth_tax_allowance_minor default
5700000 · wealth_tax_rate default 0.0216 · inflation_rate default 0 · default_horizon_years 30.
**projection_scenarios** — id · owner_user_id · name · params jsonb · created_at (saved scenarios).

**subscriptions** — id · owner_user_id · name · country enum(`NL`|`BR`) · account_id fk null ·
monthly_minor · currency · cadence · recommendation enum(`keep`|`review`|`cancel`) null ·
detected_from text null · active bool · created_at. Redundancy groups + efficiency score computed
in the domain layer.

## Evaluations (shared) & reference

**evaluation_months** — id · household_id · month `YYYY-MM` · inflow/outflow/net_minor · jsonb
arrays (top_categories, biggest, recurring, watch, suggestions, notes) · unique(household_id,month).
**evaluation_categories** + **evaluation_category_values** — the category matrix (avg/vsAvg computed).

**fx_rates** — id · rate_date · base char(3) · quote char(3) · rate numeric · unique(rate_date,
base, quote). Used to convert BRL↔EUR for display and net-worth tiles.

---

## Access, isolation & indexing

- **Casa vs Pessoal from one model:** the BFF sets the caller's `user_id`/`household_id`; shared
  reads filter `visibility='shared' AND household_id=…`; personal reads add
  `owner_user_id=caller`. Never join personal rows into a partner's response.
- Cascade from `cycles`/`goals` to children; `restrict` from `households`.
- Indexes: `accounts(household_id, visibility)`; `transactions(household_id, dedup_hash)` unique,
  `(account_id, booked_at)`, `(owner_user_id, visibility)`; `shared_payments(cycle_id)`;
  `payment_splits(shared_payment_id)`; `settlements(household_id, cycle_id)`;
  `savings_events(savings_account_id, event_date)`; `fx_rates(rate_date, base, quote)`.
- Extensions: `pgcrypto`, `citext`.

## Personal vault (encryption) — resolved

**Server-side isolation + KMS envelope encryption.** Personal (`visibility='personal'`) rows are
owner-scoped, and sensitive columns are encrypted at rest with per-household KMS data keys. The BFF
decrypts only for the owner and can still compute personal projections/audits server-side. This
protects against DB/backup compromise and enforces partner-invisibility. Client-side zero-knowledge
E2EE is **not** pursued (it would force personal analytics onto the client and complicate imports);
the UI's "vault/E2E" language maps to this model.

## Migrations & seeding

SQL migrations in `backend/migrations/` (run by the `@effect/sql` migrator). On household
creation: seed `household_settings`, `projection_settings` per user, default `categories` (locale),
and default `recurring_rules` off.

## Notes vs money-evaluation

- The couple **ledger** (payer + split + settlement) is new and central; money-evaluation only had
  joint variable spend. Personal vs shared **visibility** is the new backbone. Accounts +
  connections, goals/vaults, subscriptions, category caps, FX, and projection scenarios are added
  to match the generated screens. Derived figures remain computed, not stored.
