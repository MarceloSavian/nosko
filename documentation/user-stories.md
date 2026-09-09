# User Stories & Actions — nosko

Derived from the generated UI (`ui/`), `requirements.md`, and the locked decisions. Grouped by
epic (each epic ≈ a BFF section). Each epic lists **user stories** (with brief acceptance notes and
the screens they satisfy) and the **actions/operations** the system exposes (the RPC surface;
HttpApi only where noted). Personas: **M** (Marcelo, owner), **G** (Gabriele, member);
"member" = either.

Global rules that constrain every story:
- **Two spaces**: `Casa` (shared, both members) vs `Pessoal` (personal, private to the owner).
  Personal data is never returned to the partner (RLS-enforced).
- **Proportional model, no ledger**: income shares fund the joint accounts; fixed bills, then the
  variable estimate and reserve are covered; the remainder is spread by user-defined withdrawals.
  Shared payments have **no payer and no split**.
- **No bank sync** — data enters via manual entry or **file import** (CSV; PDF for Amex/C6).
- Money is EUR base + BRL, integer minor units; cycle figures in EUR (converted at confirmation).
- Bilingual pt-BR/en; "hide values" toggle; English code identifiers.

---

## Epic 1 — Auth & session
Screens: entrada, criar_conta, entrar, verificar_e_mail, recuperar_senha, nova_senha.

Stories
- As a new user, I can **sign up** (name, email, password) and **verify my email** (link or
  6-digit code, 15 min) so I can access the app. AC: unverified users are blocked from data.
- As a user, I can **log in** and pass **MFA** (TOTP or email OTP), optionally **remembering this
  device** for 30 days, so my finances stay protected.
- As a user, I can **reset my password** (optionally revoking all other sessions) and
  **re-request verification** so I can recover access.
- As a user, I can **log out** and see/revoke **active sessions**.

Actions: `auth.signUp`, `auth.verifyEmail`, `auth.resendVerification`, `auth.login`,
`auth.mfaEnroll`, `auth.mfaConfirmEnroll`, `auth.mfaDisable` (the enroll/confirm/disable trio
implements `security.update2fa` from Epic 14), `auth.mfaChallenge`, `auth.mfaVerify` (with
`rememberDevice`), `auth.refresh`, `auth.logout`, `auth.requestPasswordReset`,
`auth.resetPassword` (with `revokeOtherSessions`), `auth.listSessions`, `auth.revokeSession`,
`auth.revokeAllSessions`.

## Epic 2 — Household & membership
Screens: crie_sua_casa_convite, voc_foi_convidada.

Stories
- As the first user, I can **create a household** (name, base currency EUR, cycle anchor day) so my
  couple's shared space exists.
- As an owner, I can **invite my partner by email** (tokenised link) and choose **which of my
  accounts to share**.
- As the invited partner, I can **accept the invitation**, join as the second (and last) member,
  choose **which of my accounts to share**, and be attached as **co-owner of the joint accounts**.
  AC: both see shared data; personal stays private.
- As a member, I can **see household members** and, as owner, **revoke** an invitation.

Actions: `household.create`, `household.get`, `household.update`, `household.invite`,
`household.listInvitations`, `household.revokeInvitation`, `household.acceptInvitation`,
`household.listMembers`, `household.removeMember`.

## Epic 3 — Accounts & visibility
Screens: adicione_suas_contas, onboarding_accounts_preview, nova_conta, contas_compartilhadas,
minhas_contas_cart_es.

Stories
- As a member, I can **register an account** (institution, nickname, type, currency, masked id,
  balance, purpose; credit-card closing day/limit/autopay) marked **personal or shared**. AC:
  personal defaults; only shared appears in Casa.
- As a member, I can register a **joint account** once for the household; both members are its
  owners (`ownership = joint`), it is always shared, and either owner can import into it.
- As a member, I can **toggle an account's visibility** (share / un-share) reversibly. AC:
  un-sharing removes it from Casa without deleting history; joint accounts cannot be un-shared.
- As a member, I can see **shared accounts** (balances, total, purpose, cycle commitment) in Casa
  and **my personal accounts** (net worth EUR+BRL, liquid vs invested, card invoices) in Pessoal.
- As a member, I can edit/remove an account and see its **last import** time.

Actions: `accounts.list` (scoped Casa/Pessoal), `accounts.create`, `accounts.update`,
`accounts.setVisibility`, `accounts.setCoOwner`, `accounts.remove`, `accounts.sharedSummary`,
`accounts.personalSummary`.

## Epic 4 — Ingestion (import → review → confirm)
Screens: importar_extratos, fila_de_revis_o.

Stories
- As a member, I can **upload statement files** (CSV; PDF for Amex/C6), for one or many banks, and
  have them parsed. AC: password-protected PDFs supported; a Nubank export can feed two accounts;
  parse failures surfaced; files stored as a private audit trail.
- As a member, imported transactions are **deduplicated** (by hash) so re-imports don't double up.
- As a member, transactions are **routed by account/IBAN** to the personal or shared destination.
- As a member, I get **suggested categories** (rule-based, with confidence) I can override.
- As a member, **internal transfers between my own accounts** (e.g. Wise EUR→BRL) are detected and
  paired as neutral; a personal→joint transfer is recorded as my **contribution to the household**.
- As a member, I can **review staged transactions** (counts: new/confirmed/ignored/duplicates/
  transfers), bulk-confirm/categorise; confirming a shared transaction creates the shared payment
  in the right cycle (in EUR) for both; personal ones stay private.

Actions: `ingestion.upload` (HttpApi multipart), `ingestion.listUploads`, `ingestion.parse`,
`ingestion.listStaged`, `ingestion.categorise`, `ingestion.pairTransfer`, `ingestion.confirm`,
`ingestion.ignore`, `ingestion.bulkConfirm`.

## Epic 5 — Casa: cycles & budget
Screens: casa_vis_o_geral, casa_vis_o_geral_do_or_amento, ciclos, detalhes_do_ciclo.

Stories
- As a member, I can see the **current cycle overview**: household income + **contribution shares**,
  fixed total, estimate for variable spend, available for variable, projected surplus, **daily
  allowance**, burn-rate chart, spend vs cap per category, and bills paid vs to-pay.
- As a member, I can enter **per-member income** (salary/bonus) for a cycle and see each share %.
- As a member, I can set/adjust the cycle **estimate** (`teto`) and **reserve**.
- As a member, I can see **`availableAfterPayments`** (what remains once fixed bills, the estimate
  and the reserve are covered) and **record my own withdrawal** (saque) to my personal account, or
  a **contribution** from my personal account to the household; mark it settled.
- As a member, I can **close a cycle**, browse **cycle history**, savings-rate & surplus
  **trends**, compare cycles, set the cycle's **surplus destination** (a goal or a label), and
  **scaffold the next cycle** (carry bills forward, chain estimate/opening balance).

Actions: `cycles.list`, `cycles.get`, `cycles.getCurrent`, `cycles.create`, `cycles.update`,
`cycles.close`, `cycles.setIncome`, `cycles.recordTransfer`, `cycles.settleTransfer`,
`cycles.trends`, `cycles.compare`.

## Epic 6 — Casa: fixed bills & recurring rules
Screens: contas_fixas_espa_o_casa.

Stories
- As a member, I can manage **fixed bills** per cycle (label, amount, paying account, due day,
  category) and toggle **paid/unpaid**; totals show predicted/paid/pending + next due.
- As a member, I get **auto-detected recurring charges** ("Inteligência nosko") proposed as fixed
  bills/rules to **confirm or ignore**.
- As a member, I manage **recurring rules** (matcher, expected amount, category, cadence, is-fixed,
  active); active rules **generate each cycle's bills** and a matching import **auto-marks paid**.

Actions: `bills.list`, `bills.create`, `bills.update`, `bills.setPaid`, `bills.remove`,
`rules.list`, `rules.create`, `rules.update`, `rules.deactivate`, `rules.suggestions`,
`rules.acceptSuggestion`, `rules.ignoreSuggestion`.

## Epic 7 — Casa: shared payments
Screens: pagamentos_espa_o_casa.

Stories
- As a member, I can add/edit a **shared payment** (date, merchant, joint account, category,
  amount, currency) so household variable spending is tracked. AC: no payer, no split; a BRL
  payment is converted to EUR at the booked-date rate and both amounts are shown.
- As a member, I see the cycle **total vs estimate**, **per-category totals vs caps**, and
  **average per day**.
- As a member, I can filter (cycle/account/category) and **export CSV**.

Actions: `payments.list`, `payments.create`, `payments.update`, `payments.remove`,
`payments.summary`, `payments.exportCsv` (HttpApi).

## Epic 8 — Casa: goals & vaults
Screens: metas_espa_o_casa.

Stories
- As a member, I can create a **shared goal** (name, category, target, deadline, optional yield,
  optional linked **vault account**) so we plan big purchases together.
- As a member, I can set a **contribution plan per member** (amount per cycle) and **contribute
  (aportar)**; progress, % to target, and projected completion update.
- As a member, I can pause/resume/complete goals and see the aggregate (total, % of global,
  combined planned contribution, next milestone).

Actions: `goals.list`, `goals.create`, `goals.update`, `goals.setContributionPlan`,
`goals.contribute`, `goals.setStatus`, `goals.remove`, `goals.summary`.

## Epic 9 — Casa: evaluations
(Analysis view inside the cycles/overview area; no dedicated mockup.)

Stories
- As a member, I can see **monthly inflow/outflow/net** and a **category matrix** across months
  with averages and vs-average deltas, biggest vendors, and recurring charges — all computed from
  shared payments and fixed bills — and add a free-text note per month.

Actions: `evaluations.summary`, `evaluations.month`, `evaluations.categoryMatrix`,
`evaluations.setNote`.

## Epic 10 — Casa: resumo (WhatsApp summary)
Screens: resumo_do_ciclo.

Stories
- As a member, I can generate a **WhatsApp-ready recap** of the current shared cycle (income +
  shares, fixed bills, variable vs estimate, daily allowance, top categories), pick
  emoji/short/detailed, **copy** it, and open WhatsApp. Shared data only; no settlement line.

Actions: `resumo.build` (cycleId, variant, locale).

## Epic 11 — Pessoal: overview, accounts & payments (private)
Screens: pessoal_vis_o_geral, minhas_contas_cart_es, (personal payments).

Stories
- As a member, I can see my **private overview**: personal balance, spend this cycle vs my
  **personal cap**, personal savings, subscriptions total, spend-by-category (personal
  categories), evolution across cycles. AC: never visible to partner.
- As a member, I can manage **my personal accounts & cards** (balances, invoices, net worth
  EUR+BRL) and **my personal payments** (add/edit/filter). AC: private.
- As a member, I can record a **contribution to the household** from here ("Transferir p/ Casa");
  the joint leg shows in Casa, my personal leg stays private.

Actions: `personal.overview`, `personal.accounts`, `personal.payments.list`,
`personal.payments.create`, `personal.payments.update`, `personal.payments.remove`,
`personal.settings.get`, `personal.settings.update` (cap), `personal.categories.*`.

## Epic 12 — Pessoal: savings, investments & projection (private)
Screens: poupan_a_e_investimentos, proje_o_de_poupan_a.

Stories
- As a member, I can track **EUR reserve** (balance, APY, monthly rollup aportes/retiradas/juros/
  saldo/delta, coverage months), **brokerage holdings** (ticker, exchange, quantity, average cost,
  value, %, custodian), and **BR CDB** (invested, current, % CDI, net-of-tax). Net worth EUR+BRL.
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
  an **efficiency score**, **redundancy warnings** (duplicate cloud, several streaming services),
  potential savings, and **keep/review/cancel** recommendations; I can add/edit and mark actions
  taken.

Actions: `subscriptions.list`, `subscriptions.audit`, `subscriptions.create`,
`subscriptions.update`, `subscriptions.setRecommendation`, `subscriptions.remove`.

## Epic 14 — Settings & privacy
Screens: configura_es.

Stories
- As a member, I can configure **household** (name, base currency, cycle anchor, default
  reserve), **account visibility + joint co-owner**, **members**, **language/region**,
  **categories & caps (household and personal)**, **fiscal parameters (NL Box 3)**,
  **security/2FA/sessions**, and **export/backup (JSON)**.
- As a member, I can read the **privacy** explainer (personal data never shown to the partner;
  isolation enforced in the database).

Actions: `settings.getHousehold`, `settings.updateHousehold`, `categories.list`,
`categories.upsert`, `categories.reorder`, `categories.setCap`, `settings.updateFiscal`,
`settings.export` (HttpApi), `security.update2fa`.

## Epic 15 — Cross-cutting
Stories
- As a member, I can **switch space** (Casa/Pessoal) and **language** (PT/EN), see amounts in EUR
  with BRL conversion via daily FX, and **hide values** on screen.

Actions: `fx.latest`, `me.preferences.get`, `me.preferences.update` (locale).

---

## Domain engines these stories require (pure, unit-tested to 100%)

- **CycleEngine** — contribution shares, fixedTotal/variableTotal/byCategory vs caps, chained
  estimate, `availableAfterPayments`, withdrawals/contributions, variableBudget, surplus, savings
  rate, daily allowance, burn rate, current-cycle detection, next-cycle scaffold, close.
- **FxConversion** — base-currency conversion with the rate of a date.
- **ProjectionEngine** — two-phase + Box 3 + inflation; milestones; scenarios.
- **RecurringDetector** — periodic-charge detection → fixed-bill/rule suggestions.
- **SubscriptionAuditEngine** — recurring detection, redundancy grouping, efficiency score.
- **EvaluationEngine** — monthly series, category matrix, biggest vendors, recurring.
- **IngestionRules** — dedup hashing, IBAN→destination routing, internal-transfer pairing
  (incl. personal→joint contributions), rule-based category suggestion.

Each engine is pure and lives in `backend/src/domain/services`; the BFF composes them into the
per-section RPC view models above.
