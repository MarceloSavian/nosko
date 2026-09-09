# User Stories & Actions — nosko

Derived from the generated UI (`ui/`), `requirements.md`, and the locked decisions. Grouped by
epic (each epic ≈ a BFF section). Each epic lists **user stories** (with brief acceptance notes and
the screens they satisfy) and the **actions/operations** the system exposes (the RPC/HttpApi
surface). Personas: **M** (Marcelo, owner), **G** (Gabriele, member); "member" = either.

Global rules that constrain every story:
- **Two spaces**: `Casa` (shared, both members) vs `Pessoal` (personal, private to the owner).
  Personal data is never returned to the partner.
- **No bank sync** — data enters via manual entry or **file import** (CSV; PDF for Amex/C6).
- Money is EUR base + BRL, integer minor units, converted for display via daily FX.
- Bilingual pt-BR/en; "hide values" toggle; English code identifiers.

---

## Epic 1 — Auth & session
Screens: entrada, criar_conta, entrar, verificar_e_mail, recuperar_senha, nova_senha.

Stories
- As a new user, I can **sign up** (name, email, password) and **verify my email** so I can access
  the app. AC: unverified users are blocked from data; verification link/code expires.
- As a user, I can **log in** and pass **MFA** (TOTP or email OTP) so my finances stay protected.
- As a user, I can **reset my password** and **re-request verification** so I can recover access.
- As a user, I can **log out** and see/revoke **active sessions**.

Actions: `auth.signUp`, `auth.verifyEmail`, `auth.resendVerification`, `auth.login`,
`auth.mfaChallenge`, `auth.mfaVerify`, `auth.refresh`, `auth.logout`, `auth.requestPasswordReset`,
`auth.resetPassword`, `auth.listSessions`, `auth.revokeSession`.

## Epic 2 — Household & membership
Screens: crie_sua_casa_convite, voc_foi_convidada.

Stories
- As the first user, I can **create a household** (name, base currency EUR, cycle anchor day) so my
  couple's shared space exists.
- As an owner, I can **invite my partner by email** and choose **which of my accounts to share**.
- As the invited partner, I can **accept the invitation**, join as a member, and choose **which of
  my accounts to share**. AC: both see shared data; personal stays private.
- As a member, I can **see household members** and, as owner, **revoke** a member/invitation.

Actions: `household.create`, `household.get`, `household.update`, `household.invite`,
`household.listInvitations`, `household.revokeInvitation`, `household.acceptInvitation`,
`household.listMembers`, `household.removeMember`.

## Epic 3 — Accounts & visibility
Screens: adicione_suas_contas, onboarding_accounts_preview, nova_conta, contas_compartilhadas,
minhas_contas_cart_es.

Stories
- As a member, I can **register an account** (institution, nickname, type, currency, masked id,
  balance) marked **personal or shared**. AC: personal defaults; only shared appears in Casa.
- As a member, I can **toggle an account's visibility** (share / un-share) reversibly. AC:
  un-sharing removes it from Casa without deleting history.
- As a member, I can see **shared accounts** (joint balances, total, purpose) in Casa and **my
  personal accounts** (net worth EUR+BRL, liquid vs invested, card invoices) privately in Pessoal.
- As a member, I can edit/remove an account and see its **last import** time.

Actions: `accounts.list` (scoped Casa/Pessoal), `accounts.create`, `accounts.update`,
`accounts.setVisibility`, `accounts.remove`, `accounts.sharedSummary`, `accounts.personalSummary`.

## Epic 4 — Ingestion (import → review → confirm)
Screens: importar_extratos, fila_de_revis_o.

Stories
- As a member, I can **upload statement files** (CSV; PDF for Amex/C6), for one or many banks, and
  have them parsed. AC: password-protected PDFs supported; parse failures surfaced; files stored
  as a private audit trail.
- As a member, imported transactions are **deduplicated** (by hash) so re-imports don't double up.
- As a member, transactions are **routed by account/IBAN** to the personal or shared destination.
- As a member, I get **AI-suggested categories** (with confidence) I can override.
- As a member, **internal transfers between my own accounts** (e.g. Wise EUR→BRL) are detected and
  paired as neutral (not spend/income).
- As a member, I can **review staged transactions** (counts: new/confirmed/ignored/duplicates/
  transfers), bulk-confirm/categorise, and confirming a shared transaction adds it to the current
  cycle for both; personal ones stay private.

Actions: `ingestion.upload`, `ingestion.listUploads`, `ingestion.parse`, `ingestion.listStaged`,
`ingestion.categorise`, `ingestion.pairTransfer`, `ingestion.confirm`, `ingestion.ignore`,
`ingestion.bulkConfirm`.

## Epic 5 — Casa: cycles & budget
Screens: casa_vis_o_geral, casa_vis_o_geral_do_or_amento, ciclos, detalhes_do_ciclo.

Stories
- As a member, I can see the **current cycle overview**: household income, fixed total, available
  for variable, projected surplus, **daily allowance**, and bills paid vs to-pay.
- As a member, I can enter **per-member income** (salary/bonus) for a cycle and see the split %.
- As a member, I can see **`availableAfterPayments`** (leftover after the month's household
  payments) and **set my own withdrawal** (saque) to my personal account; mark it settled.
- As a member, I can browse **cycle history**, savings-rate & surplus **trends**, compare cycles,
  and **scaffold the next cycle** (carry bills forward, chain estimate/opening balance).
- As a member, I can set a **reserve amount** and a **reserve destination** label.

Actions: `cycles.list`, `cycles.get`, `cycles.getCurrent`, `cycles.create`, `cycles.update`,
`cycles.setIncome`, `cycles.setWithdrawal`, `cycles.settleWithdrawal`, `cycles.trends`,
`cycles.compare`.

## Epic 6 — Casa: fixed bills & recurring rules
Screens: contas_fixas_espa_o_casa.

Stories
- As a member, I can manage **fixed bills** per cycle (label, amount, paying account, paid-by, due
  day) and toggle **paid/unpaid**; totals show predicted/paid/pending + next due.
- As a member, I get **auto-detected recurring charges** ("Inteligência nosko") proposed as fixed
  bills/rules to **confirm or ignore**.
- As a member, I manage **recurring rules** (matcher, expected amount, category, cadence, is-fixed,
  active); active rules **generate each cycle's bills** and a matching import **auto-marks paid**.

Actions: `bills.list`, `bills.create`, `bills.update`, `bills.setPaid`, `bills.remove`,
`rules.list`, `rules.create`, `rules.update`, `rules.deactivate`, `rules.suggestions`,
`rules.acceptSuggestion`, `rules.ignoreSuggestion`.

## Epic 7 — Casa: shared payments (the couple ledger)
Screens: pagamentos_espa_o_casa.

Stories
- As a member, I can add/edit a **shared payment** (merchant, account, category, amount, **payer**,
  **split**: equal/proportional/custom) so household spending is tracked with who paid.
- As a member, I see **per-member contribution totals & %**, the **running inter-partner balance**,
  and a **suggested settlement** (acerto). AC: split applies only to the month's shared payments.
- As a member, I can **record/settle an acerto** (who pays whom, method, settled-at) which
  rebalances the ledger.
- As a member, I can filter (cycle/account/category/member), see average/day, and **export CSV**.

Actions: `payments.list`, `payments.create`, `payments.update`, `payments.remove`,
`payments.setSplit`, `ledger.balance`, `ledger.suggestedSettlement`, `settlements.record`,
`settlements.settle`, `settlements.list`, `payments.exportCsv`.

## Epic 8 — Casa: goals & vaults
Screens: metas_espa_o_casa.

Stories
- As a member, I can create a **shared goal** (name, category, target, deadline, optional yield,
  optional linked **vault account**) so we plan big purchases together.
- As a member, I can set a **monthly contribution split per member** and **contribute (aportar)**;
  progress, % to target, and projected completion update.
- As a member, I can pause/resume/complete goals and see the aggregate (total, % of global,
  combined monthly, next milestone).

Actions: `goals.list`, `goals.create`, `goals.update`, `goals.setContributionSplit`,
`goals.contribute`, `goals.setStatus`, `goals.remove`, `goals.summary`.

## Epic 9 — Casa: evaluations
(Analysis view; screens shared with overview/cycles.)

Stories
- As a member, I can see **monthly inflow/outflow/net** and a **category matrix** across months
  with averages and vs-average deltas, biggest vendors, and recurring charges.

Actions: `evaluations.summary`, `evaluations.month`, `evaluations.categoryMatrix`.

## Epic 10 — Casa: resumo (WhatsApp summary)
Screens: resumo_do_ciclo.

Stories
- As a member, I can generate a **WhatsApp-ready recap** of the current shared cycle (income, fixed
  bills, variable vs ceiling, daily allowance, top categories, **split + suggested acerto**), pick
  emoji/short/detailed, **copy** it, and open WhatsApp. Shared data only.

Actions: `resumo.build` (cycleId, variant, locale).

## Epic 11 — Pessoal: overview, accounts & payments (private)
Screens: pessoal_vis_o_geral, minhas_contas_cart_es, (personal payments).

Stories
- As a member, I can see my **private overview**: personal balance, monthly spend vs cap, personal
  savings, subscriptions total, spend-by-category, monthly evolution. AC: never visible to partner.
- As a member, I can manage **my personal accounts & cards** (balances, invoices, net worth
  EUR+BRL) and **my personal payments** (add/edit/filter). AC: private.
- As a member, I can **share** a personal account to Casa from here ("Transferir p/ Casa").

Actions: `personal.overview`, `personal.accounts`, `personal.payments.list`,
`personal.payments.create`, `personal.payments.update`, `personal.payments.remove`.

## Epic 12 — Pessoal: savings, investments & projection (private)
Screens: poupan_a_e_investimentos, proje_o_de_poupan_a.

Stories
- As a member, I can track **EUR reserve** (balance, APY, monthly rollup aportes/retiradas/juros/
  saldo/delta, coverage months), **brokerage holdings** (positions, value, %, custodian), and
  **BR CDB** (invested, current, % CDI). Net worth EUR+BRL.
- As a member, I can add **savings events** (deposit/withdrawal/interest) and holdings.
- As a member, I can run the **projection** (two-phase: reserve rate → post-reserve return; NL
  **Box 3** tax; optional **inflation**; horizon 1–50y; monthly contribution), see comparison
  lines + milestones, **save a scenario**, and export a PDF.

Actions: `savings.list`, `savings.create`, `savings.addEvent`, `holdings.list`, `holdings.upsert`,
`projection.compute`, `projection.getSettings`, `projection.updateSettings`,
`projection.saveScenario`, `projection.listScenarios`.

## Epic 13 — Pessoal: subscriptions (private)
Screens: assinaturas_recorrentes.

Stories
- As a member, I can see **detected recurring subscriptions** (NL/BR) with monthly + annual cost,
  an **efficiency score**, **redundancy warnings** (duplicate cloud, streaming fatigue), potential
  savings, and **keep/review/cancel** recommendations; I can add/edit and mark actions taken.

Actions: `subscriptions.list`, `subscriptions.audit`, `subscriptions.create`,
`subscriptions.update`, `subscriptions.setRecommendation`, `subscriptions.remove`.

## Epic 14 — Settings & privacy
Screens: configura_es.

Stories
- As a member, I can configure **household** (name, base currency, cycle anchor, emergency
  reserve), **account visibility**, **members**, **language/region**, **categories & caps (tetos)**,
  **fiscal parameters (NL Box 3)**, **security/2FA**, and **export/backup (JSON)**.
- As a member, I can read the **privacy** explainer (personal data never shared; server-side
  isolation + KMS encryption).

Actions: `settings.getHousehold`, `settings.updateHousehold`, `categories.list`,
`categories.upsert`, `categories.reorder`, `categories.setCap`, `settings.updateFiscal`,
`settings.export`, `security.update2fa`.

## Epic 15 — Cross-cutting
Stories
- As a member, I can **switch space** (Casa/Pessoal) and **language** (PT/EN), see amounts in EUR
  with BRL conversion via daily FX, and **hide values** on screen.

Actions: `fx.latest`, `me.preferences.get`, `me.preferences.update` (locale, space, hideValues).

---

## Domain engines these stories require (pure, unit-tested to 100%)

- **CycleEngine** — income split, fixedTotal/variableTotal/byCategory, chained estimate,
  `availableAfterPayments`, variableBudget, surplus, savings rate, daily allowance, current-cycle
  detection, next-cycle scaffold.
- **SplitSettlementEngine** — per-payment share (equal/proportional/custom), per-member cycle
  totals, running inter-partner balance, suggested settlement.
- **ProjectionEngine** — two-phase + Box 3 + inflation; milestones; scenarios.
- **RecurringDetector** — periodic-charge detection → fixed-bill/rule suggestions.
- **SubscriptionAuditEngine** — recurring detection, redundancy grouping, efficiency score.
- **IngestionRules** — dedup hashing, IBAN→destination routing, internal-transfer pairing,
  category suggestion.

Each engine is pure and lives in `backend/src/domain/services`; the BFF composes them into the
per-section RPC/HttpApi view models above.
