# Google Stitch Prompts — nosko UI

Copy-ready prompts for [Google Stitch](https://stitch.withgoogle.com) to generate the nosko
web UI. nosko is a **private couple's budgeting app** for two people (Marcelo + Gabriele),
base currency **EUR** with a secondary **BRL** (Brazil) side, organised around monthly **cycles**
(a configurable anchor day, default the 23rd → the 22nd).

## How to use

1. Start a Stitch project in **Web / Desktop** mode.
2. Paste **§0 Design System** first (set it as the project theme / first message) so every screen
   shares one look.
3. Then generate each screen from its own block below. Each prompt is self-contained (it repeats
   the key style cues), so you can also paste them individually.
4. Generate **light and dark** variants. Sample data is illustrative — keep the labels, swap
   numbers freely.
5. The UI is **bilingual (pt-BR default, English secondary)** — prompts show Portuguese labels
   with the English in parentheses so Stitch lays out room for both.

---

## 0. Design System (paste first / set as theme)

```text
Design a modern, clean personal-finance dashboard called "nosko" — a private budgeting app
for a couple. Overall style: calm, precise, trustworthy fintech. Card-based layout with rounded
2xl corners, soft shadows, thin neutral borders, generous spacing, but data-dense where numbers
matter. Sans-serif typography (Inter or similar); use tabular/monospaced numerals for all money
values. Support light and dark themes.

Color system: neutral slate grays for surfaces and text; a primary accent of emerald/teal green
(used for positive balances, primary buttons, active nav); indigo as a secondary accent for links
and charts; semantic colors — green for surplus/positive, rose/red for deficit/negative/overspend,
amber for warnings and "to pay". Category colors: Mercado (groceries) = green, Lazer (leisure) =
violet, Outros (other) = slate.

Money formatting: European style with the currency symbol, e.g. "€1.234,56" for EUR and
"R$1.234,56" for BRL. Always show the currency. Negative amounts in rose with a minus sign.

Global chrome: a left sidebar navigation (collapsible) with the nosko logo at top and items:
Visão geral (Overview), Ciclos (Cycles), Importar (Import), Avaliações (Evaluations), Poupança
(Savings), Resumo (Summary), Configurações (Settings). A top bar with the current cycle name, a
language switcher (PT / EN), a currency indicator (EUR), and a user avatar menu showing the two
household members. Responsive: the sidebar collapses to a bottom tab bar / hamburger on mobile.

Reusable components to establish: stat tiles (label + big number + small delta), horizontal
category bar lists, line charts, donut charts for category splits, progress bars, checklists with
paid/unpaid toggles, status badges/tags, segmented controls, sliders, a file dropzone, and review
cards. Bilingual: pt-BR primary, English secondary.
```

---

## 1. Landing / Sign-in entry (public)

```text
Design the public entry screen for "nosko", a private couple's budgeting app. Centered,
minimal, split layout: left side a short brand statement "Suas finanças do casal, num só lugar"
(Your household finances in one place) with 3 small feature bullets (Ciclos mensais / Contas fixas
/ Poupança e projeções); right side a card with two large buttons "Entrar" (Log in) and "Criar
conta" (Sign up), and a small language switch (PT/EN) in the corner. Clean fintech look, emerald
accent, light and dark. No marketing clutter — this app is invite-only for two users.
```

## 2. Sign up

```text
Design a sign-up screen for nosko. A single centered card titled "Criar conta" (Create
account) with fields: Nome (Name), Email, Senha (Password) with a strength meter, Confirmar senha
(Confirm password). A primary emerald "Criar conta" button, and below it "Já tem conta? Entrar"
(Already have an account? Log in). Note under the form: "Você receberá um email de verificação"
(You'll get a verification email). Clean, trustworthy, light + dark, language switch top-right.
```

## 3. Log in

```text
Design a login screen for nosko. Centered card "Entrar" (Log in) with Email and Senha
(Password) fields, a "Esqueci minha senha" (Forgot password) link, a primary emerald "Entrar"
button, and a secondary "Criar conta" link. Small note that MFA may be required next. Minimal,
fintech, light + dark, PT/EN switch.
```

## 4. Email verification

```text
Design an email-verification screen for nosko. Centered card with a mail icon, heading
"Verifique seu email" (Verify your email), body "Enviamos um link para marcelo@exemplo.com",
a 6-digit code input (optional path), a "Reenviar email" (Resend) link with a countdown, and a
"Voltar ao login" link. Calm, reassuring, light + dark.
```

## 5. MFA challenge

```text
Design a multi-factor authentication screen for nosko. Centered card "Verificação em duas
etapas" (Two-step verification) with a segmented control to choose method: Autenticador (TOTP app)
or Código por email (Email code). A large 6-digit segmented code input, a "Confirmar" button, a
"Usar outro método" link, and a small "Não foi você? Encerrar sessões" security note. Secure,
focused, light + dark.
```

## 6. Forgot / reset password

```text
Design two related screens for nosko password reset. Screen A "Recuperar senha": email
field + "Enviar link" button + confirmation state ("Se existir uma conta, enviaremos um link").
Screen B "Nova senha": new password + confirm password with strength meter + "Salvar nova senha"
button. Minimal, trustworthy, light + dark.
```

## 7. Create household (first run)

```text
Design a first-run "create household" screen for nosko, shown right after a user's first
login. Card titled "Crie sua casa" (Create your household) with: a Nome da casa (Household name)
field (placeholder "Casa Marcelo & Gabriele"), a Moeda base (Base currency) selector defaulting to
EUR, a Dia de início do ciclo (Cycle anchor day) numeric selector defaulting to 23 with helper
text "Seu ciclo vai do dia 23 ao 22" (Your cycle runs from the 23rd to the 22nd), and an Idioma
(Language) toggle PT/EN. Primary "Criar casa" button. Friendly onboarding tone, illustration or
subtle graphic, light + dark.
```

## 8. Invite partner

```text
Design an "invite partner" screen for nosko. Card "Convide seu parceiro(a)" (Invite your
partner) with an explanation that both people keep their own login and see the same household data.
An email field + "Enviar convite" (Send invite) button. Below, a list of pending invitations with
status badges (Pendente / Aceito / Expirado) and a "Reenviar" / "Cancelar" action per row. A
"Pular por enquanto" (Skip for now) link. Warm, collaborative, light + dark.
```

## 9. Accept invitation / join household

```text
Design an "accept invitation" screen for nosko for the invited partner. Card "Você foi
convidado(a)" (You've been invited) showing the household name "Casa Marcelo & Gabriele", who
invited them (Marcelo), and what joining means (shared cycles, bills, savings; personal income and
withdrawals tracked per member). Primary "Aceitar e entrar" (Accept and join) and secondary
"Recusar" (Decline). Reassuring, light + dark.
```

## 10. App shell / navigation

```text
Design the authenticated app shell for nosko (couple budgeting). Left collapsible sidebar
with logo and nav: Visão geral, Ciclos, Importar, Avaliações, Poupança, Resumo, Configurações,
each with an icon; the active item highlighted in emerald. Top bar shows the current cycle "23 Ago
– 22 Set" as a pill dropdown (to switch cycles), a PT/EN language switch, an EUR currency badge,
and a user avatar cluster showing two members (Marcelo, Gabriele) with a dropdown (Perfil, Sair).
Main content area is a responsive grid of cards. On mobile the sidebar becomes a bottom tab bar.
Show light and dark. This is the frame that hosts every other screen.
```

## 11. Overview (home dashboard)

```text
Design the Overview (Visão geral) home dashboard for nosko, inside the app shell. Top row of
stat tiles: "Renda do casal" (Household income) €5.791,56; "Contas fixas" (Fixed bills) €2.843,97;
"Disponível p/ variável" (Available for variable) €1.075,12; "Sobra projetada" (Projected surplus)
+€886,10 in green. A prominent banner card "Pode gastar ≈ €35,57/dia" (You can spend ≈ €35.57/day)
for the remaining days of the current cycle, with a thin progress bar of the cycle timeline.
A "Situação atual — pago vs. a pagar" (Current status — paid vs to pay) card: a checklist of fixed
bills (Aluguel/Rent €1.550 ✓, Plano de saúde/Health €313,90 ✓, Luz e Gás/Utilities €173 ✓, NS
transporte €70 ✓, Internet €25 ✓, Academia/Gym €100 …) with paid check icons and a summary "9/10
pagas · €173 a pagar" and a small ring progress. A "Variável por categoria" donut (Mercado €582,61
/ Lazer €321,25 / Outros €276,73). A right rail with recent expenses list (AH €48,29, Wok to Walk
€38,40, Dirk €12,56). Data-dense but clean, emerald/green positives, amber "a pagar", light + dark.
```

## 12. Cycles list

```text
Design the Cycles (Ciclos) list screen for nosko. A vertical list/table of monthly cycles,
newest first, each row a card: cycle title "23 Ago – 22 Set", date range, renda (income) €5.791,56,
fixas (fixed) €2.843,97, variável (variable) €1.180,59, and a right-aligned sobra/falta
(surplus/deficit) chip (green + or rose −). The current cycle is highlighted with an emerald left
border and a "Ciclo atual" badge. A "＋ Novo ciclo" (New cycle) button top-right that scaffolds the
next cycle. Small sparkline of surplus trend across cycles at the top. Clean, scannable, light +
dark.
```

## 13. Cycle detail

```text
Design the Cycle Detail screen for nosko for the cycle "23 Ago – 22 Set". Header with the
cycle title, date range, and a "Ciclo atual" badge. Section 1 "Renda" (Income): per-member rows
Marcelo €4.191,56 and Gabriele €1.600,00 with a small percentage split bar (72% / 28%) and total
€5.791,56. Section 2 "Saques" (Withdrawals): suggested vs actual per member (Sugerido/Real), e.g.
Marcelo €1.420,45, Gabriele €500. Section 3 "Contas fixas" (Fixed bills): a checklist with each
bill's label, amount, a paid/unpaid toggle and paid-on day, plus a subtotal and "9/10 pagas".
Section 4 "Variável" (Variable): a header showing "Disponível p/ variável €886,10 · Gasto €1.180,59
· Livre −€47,47" with a progress bar (over budget shown in rose), a category breakdown bar list
(Mercado / Lazer / Outros), and a scrollable table of expenses (data, descrição, categoria, valor)
with add/edit/delete. A right summary rail: Disponível, Total gasto, Sobra/Falta (signed, colored),
Próximo saque sugerido. Dense, organized into clear cards, light + dark.
```

## 14. Add / edit expense (drawer/modal)

```text
Design an "add expense" drawer/modal for nosko titled "Novo gasto" (New expense). Fields:
Descrição (Description, e.g. "Albert Heijn"), Valor (Amount) with an EUR/BRL currency toggle, a
category selector as colored chips (Mercado, Lazer, Outros, + custom), Dia (Day of month), and a
note that a negative value means a reimbursement. Primary "Salvar" and secondary "Cancelar". If the
expense came from an imported transaction, show a small linked-source badge. Compact, fast-entry
form, light + dark.
```

## 15. Fixed bills & recurring rules

```text
Design a "Fixed bills & recurring rules" management screen for nosko (Contas fixas). Two
tabs: "Contas do ciclo" (This cycle's bills) and "Regras recorrentes" (Recurring rules). Tab 1: a
checklist of the current cycle's fixed bills with amount, paid/unpaid toggle, paid-on day, and an
"auto-paga" badge when a matched imported transaction paid it. Tab 2: a list of recurring rules,
each showing the matcher (vendor text), expected amount, category, cadence (Mensal), a toggle
"É conta fixa" (Is a fixed bill), active toggle, and a source badge "Detectado automaticamente"
(Auto-detected) or "Definido por você" (User-defined). A highlighted section at top "Sugestões
detectadas" (Detected suggestions) with cards proposing recurring charges to confirm ("Parece uma
assinatura: Netflix R$44,90/mês — Adicionar como recorrente?"). Clean, trustworthy, light + dark.
```

## 16. Import statements (upload)

```text
Design a "Import statements" screen for nosko (Importar). A large drag-and-drop dropzone
"Arraste extratos aqui" (Drop statements here) accepting CSV and PDF. Below it, a per-bank grid of
upload cards: ING (CSV), Revolut (CSV), Amex (PDF, protegido por senha/password-protected), Nubank
conta + cartão (CSV), C6 (PDF). Each card shows the last import date and coverage range. A table of
recent uploads with columns: banco (institution), arquivo (file), período (period), status
(Enviado/Processando/Processado/Falhou with colored badges). Note that files are stored securely as
an audit trail. Functional, reassuring, light + dark.
```

## 17. Review queue (staged transactions)

```text
Design a transaction "review queue" for nosko, shown after an import. A filterable table of
staged transactions: data, banco, descrição, contraparte, valor, moeda, and a suggested category
chip. Each row has quick actions: Confirmar (Confirm), Ignorar (Ignore), Categorizar
(re-categorize). Rows detected as self-transfers (e.g. Wise EUR→BRL) are grouped/linked and marked
"Transferência — não contar" (Transfer — don't count). Duplicates are flagged "Duplicado". A top
bar shows counts (Novos / Confirmados / Ignorados / Duplicados) and a "Confirmar selecionados"
bulk action. A note explains only joint-account spending becomes household expenses; personal cards
feed Evaluations. Data-dense, efficient triage UI, light + dark.
```

## 18. Evaluations overview

```text
Design the Evaluations (Avaliações) screen for nosko — a spend/subscription analysis view.
Top: a line chart of monthly inflow vs outflow vs net over the last 12 months. Below: a category
matrix table (rows = categories like Mercado, Lazer, Assinaturas, Uber Eats, Transporte; columns =
months) with a computed "média" (average) column and a "vs média" delta badge (green below average,
rose above). A "Maiores gastos do mês" (Biggest expenses) list and a "Recorrentes" (Recurring)
list. Each month expandable into a narrative card with top categories, biggest vendors, watch
items, and suggestions. Analytical, chart-rich, light + dark.
```

## 19. Subscription audit

```text
Design a "Subscription audit" screen for nosko (Assinaturas). A table of detected recurring
subscriptions grouped by country (NL / BR): name, card/source, monthly cost, annualized cost, and a
recommendation badge (Manter/Keep, Reavaliar/Review, Cancelar/Cancel). Duplicate/overlapping subs
(e.g. two Google One plans, four streaming services) are highlighted with a warning. A summary tile
"Economia potencial ≈ €2.500/ano" (Potential savings). Checkboxes to mark actions taken. Insightful,
actionable, light + dark.
```

## 20. Savings overview

```text
Design the Savings (Poupança) overview for nosko. Top stat tiles: "Reserva EUR" €3.604,68;
"Corretora/Brokerage" €2.123,01; "CDB (BR)" R$3.325,79; "Total líquido" combined. A EUR savings
card with current balance, annual rate, and a monthly rollup table (mês, aportes/deposits,
retiradas/withdrawals, juros/interest, saldo/close, delta). A holdings card listing brokerage
positions (NVIDIA, MongoDB, Datadog, Nu Holdings, Adyen) with value and % change chips. A Brazil
CDB card with invested, current, and net-of-tax redemption values. Buttons to open the projection
panels. Wealth-dashboard feel, tabular numbers, light + dark.
```

## 21. Savings projection (EUR, two-phase + Box 3 tax)

```text
Design the EUR "Savings projection" panel for nosko. A large line chart with multiple series:
"Plano" (Plan), "Só poupança" (Savings-only comparison), and "Líquido após imposto" (Net after
tax). Left controls: an Aporte mensal (Monthly contribution) slider, a Reserva alvo (Reserve
target) slider defaulting to €24.000, a Rendimento pós-reserva (Post-reserve return) slider
defaulting to 10%, and horizon buttons 1/5/10/15/20/30/40/50 anos. A stat row: Saldo final, Taxa
"2% → 10%", "Atinge reserva em X anos", Imposto NL total (Box 3 ~2,16% acima de ~€57k). A milestone
table (ano, saldo, líquido). Explanatory note that the plan grows at the savings rate until the
reserve target, then the excess compounds at the stock return, minus NL wealth tax. Use compact
money on axes (e.g. €7,09M). Sophisticated financial-planning UI, light + dark.
```

## 22. BR CDB projection

```text
Design the Brazil CDB "projection" panel for nosko. A line chart with "Plano" vs "Só aportes
(sem rendimento)" (Contributions-only) to visualize the CDB yield. Controls: Aporte mensal (Monthly
contribution) slider in BRL, annual rate display (102% CDI), and horizon buttons. Stat row: saldo
final, total aportado, rendimento (earnings). Values in R$ with compact formatting on axes. Matches
the EUR projection panel style; single-rate model. Light + dark.
```

## 23. Summary / resumo (WhatsApp copy)

```text
Design a "Summary / resumo" screen for nosko that produces a WhatsApp-ready recap of the
current cycle. A phone-style preview card showing the formatted message: a title "💰 Resumo — 23
Ago – 22 Set", "Renda do casal €5.791,56", "Contas fixas €2.843,97 (saem automático)", a "💸
Variável" block "Gasto €1.180,59 de €886,10 disponível", "📅 ≈ €35,57/dia nos próximos 12 dias", and
"📊 Maiores variáveis: Mercado / Lazer / Outros". A big "Copiar resumo" (Copy summary) button and a
toast "Copiado!". A cycle selector to summarize any cycle. Playful but tidy, light + dark.
```

## 24. Settings (household configuration)

```text
Design the Settings (Configurações) screen for nosko — the configuration hub. Sections as
cards: "Casa" (Household) — name, base currency (EUR), cycle anchor day (23) with helper text,
default reserve (€100); "Idioma" (Language) — PT / EN with a per-user override; "Categorias"
(Categories) — an editable, reorderable list of expense categories with color chips (Mercado,
Lazer, Outros, + add); "Regras recorrentes" (link to the recurring rules screen); "Projeções"
(Projection defaults) — reserve target €24.000, post-reserve return 10%, NL Box 3 allowance ~€57k
and rate ~2,16%; "Membros" (Members) — Marcelo (owner) and Gabriele (member) with invite/remove;
"Segurança" (Security) — password, MFA, active sessions; "Dados" (Data) — export household data
(JSON). Everything editable inline, save toasts, clean settings layout, light + dark.
```

---

## Coverage map (screen → app feature)

| Screen | Feature area |
|---|---|
| 1–6 | Auth (signup, login, email verify, MFA, password reset) |
| 7–9 | Household create / invite / accept |
| 10 | App shell + navigation |
| 11 | Overview dashboard |
| 12–14 | Cycles (list, detail, expense entry) |
| 15 | Fixed bills + recurring rules (auto + manual) |
| 16–17 | Ingestion (upload, review queue) |
| 18–19 | Evaluations + subscription audit |
| 20–22 | Savings + projections (EUR two-phase/Box 3, BR CDB) |
| 23 | Summary / resumo |
| 24 | Settings / configuration |

Once you generate designs you like, share them back and I'll build the React + Effect screens to
match, wired to the BFF.
```
