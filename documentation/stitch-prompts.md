# Google Stitch Prompts — nosko UI

Copy-ready prompts for [Google Stitch](https://stitch.withgoogle.com) to generate the nosko web
UI. nosko is a **private finance app for a couple** (Marcelo + Gabriele), base currency **EUR**
with a secondary **BRL** (Brazil) side.

## The model — read first (it drives every screen)

nosko has **two spaces**, and the boundary between them is the core idea:

- **Casa (Shared)** — the couple space. Joint accounts, shared payments, the shared monthly
  budget (cycles, running the 23rd → 22nd by default), shared fixed bills, and shared goals.
  **Both partners see everything here.**
- **Pessoal (Personal)** — your own space. Your personal accounts (e.g. Amex, Revolut, Nubank,
  C6), your personal payments, your personal savings/investments, your subscriptions. **This is
  private: your partner can never see your personal accounts or payments, and you can't see
  theirs.**

Onboarding reflects this: you **sign up, register your accounts, mark some as shared, then invite
your partner**; when they join they register their own accounts and share their side of the joint
ones. Each account a person adds is either **Pessoal (private)** or **Compartilhada (shared into
Casa)**. Every screen must make the space it belongs to obvious, and personal screens must clearly
signal privacy (a lock/"Só você vê" indicator).

## How to use

1. Start a Stitch project in **Web / Desktop** mode.
2. Paste **§0 Design System** first (set it as the project theme) so every screen shares one look.
3. Generate each screen from its own block. Each prompt is self-contained (repeats key style
   cues), so you can paste them individually.
4. Generate **light and dark** variants. Sample data is illustrative — keep the labels, swap
   numbers freely.
5. UI is **bilingual (pt-BR default, English secondary)** — prompts show Portuguese with English
   in parentheses so Stitch leaves room for both.

---

## 0. Design System (paste first / set as theme)

```text
Design a modern, clean personal-finance app called "nosko" — a private finance app for a couple.
The product has TWO spaces the UI must always distinguish: "Casa" (Shared — joint accounts and the
couple's shared budget, visible to both partners) and "Pessoal" (Personal — each person's own
accounts and payments, PRIVATE and never visible to the partner). Personal screens always show a
subtle privacy indicator: a small lock icon and the caption "Só você vê isto" (Only you can see
this). Shared screens show both members' avatars to signal it's joint.

Overall style: calm, precise, trustworthy fintech. Card-based layout, rounded 2xl corners, soft
shadows, thin neutral borders, generous spacing, but data-dense where numbers matter. Sans-serif
typography (Inter); tabular/monospaced numerals for money. Support light and dark themes.

Color system: neutral slate grays for surfaces and text; primary accent emerald/teal green
(positive balances, primary buttons, active nav); indigo as a secondary accent for links/charts.
Semantic: green = surplus/positive, rose/red = deficit/negative/overspend, amber = warning / "to
pay". A distinct visual treatment separates the two spaces — e.g. Casa uses the emerald accent,
Pessoal uses indigo — so you always know which space you're in. Category colors: Mercado
(groceries) green, Lazer (leisure) violet, Outros (other) slate.

Money formatting: European style with the currency symbol, e.g. "€1.234,56" (EUR) and "R$1.234,56"
(BRL). Always show the currency; negatives in rose with a minus.

Global chrome: a left collapsible sidebar with the nosko logo and a prominent SPACE SWITCHER at
the top toggling "Casa" (Shared) and "Pessoal" (Personal). The nav items change with the space:
- Casa: Visão geral, Contas compartilhadas, Pagamentos, Ciclos, Contas fixas, Metas, Resumo.
- Pessoal: Visão geral, Minhas contas, Meus pagamentos, Poupança e investimentos, Assinaturas.
Shared bottom items (both spaces): Importar, Configurações.
Top bar: current shared cycle "23 Ago – 22 Set" as a pill dropdown (Casa only), a language switch
(PT/EN), an EUR currency badge, and a user avatar menu. Responsive: sidebar collapses to a bottom
tab bar on mobile, with the space switcher as a segmented control at the top.

Reusable components: stat tiles, horizontal category bar lists, line charts, donut charts,
progress bars, checklists with paid/unpaid toggles, status badges/tags, segmented controls,
sliders, a file dropzone, review cards, account cards with a bank logo + Pessoal/Compartilhada
badge, and a privacy lock chip. Bilingual: pt-BR primary, English secondary.
```

---

## AUTH & ONBOARDING

## 1. Landing / sign-in entry (public)

```text
Design the public entry screen for "nosko", a private finance app for couples. Centered, minimal,
split layout: left a short brand line "Suas finanças, pessoais e do casal, num só lugar" (Your
finances — personal and shared — in one place) with three small bullets (Contas pessoais privadas
/ Contas do casal compartilhadas / Orçamento mensal juntos); right a card with two large buttons
"Entrar" (Log in) and "Criar conta" (Sign up), plus a PT/EN switch. Invite-only feel, emerald
accent, light + dark.
```

## 2. Sign up

```text
Design a sign-up screen for nosko. A single centered card "Criar conta" (Create account) with
fields: Nome (Name), Email, Senha (Password) with a strength meter, Confirmar senha. Primary
emerald "Criar conta" button; below, "Já tem conta? Entrar". A note: "Depois você adiciona suas
contas e convida seu parceiro(a)" (Next you'll add your accounts and invite your partner). Clean,
trustworthy, PT/EN switch, light + dark.
```

## 3. Log in

```text
Design a login screen for nosko. Centered card "Entrar" (Log in) with Email and Senha fields, a
"Esqueci minha senha" link, a primary emerald "Entrar" button, and a secondary "Criar conta" link.
Small note that MFA may follow. Minimal fintech, PT/EN switch, light + dark.
```

## 4. Email verification

```text
Design an email-verification screen for nosko. Centered card with a mail icon, heading "Verifique
seu email", body "Enviamos um link para marcelo@exemplo.com", an optional 6-digit code input, a
"Reenviar email" link with countdown, and a "Voltar ao login" link. Calm, reassuring, light +
dark.
```

## 5. MFA challenge

```text
Design a two-factor authentication screen for nosko. Centered card "Verificação em duas etapas"
with a segmented control (Autenticador / Código por email), a large 6-digit segmented code input,
"Confirmar" button, "Usar outro método" link, and a small "Encerrar outras sessões" security note.
Secure, focused, light + dark.
```

## 6. Forgot / reset password

```text
Design two nosko password screens. A "Recuperar senha": email + "Enviar link" + confirmation
state. B "Nova senha": new password + confirm with strength meter + "Salvar nova senha". Minimal,
trustworthy, light + dark.
```

---

## ACCOUNT SETUP & SHARING (onboarding)

## 7. Add your accounts (first run)

```text
Design a first-run "add your accounts" screen for nosko, shown after a user's first login. Heading
"Adicione suas contas" (Add your accounts) with helper text "Você controla o que é pessoal e o que
é compartilhado" (You control what's personal and what's shared). A grid of add-account cards for
common institutions with logos: ING (NL), Revolut, American Express, Nubank (BR), C6 (BR), and a
"＋ Outra conta" (Other) tile. Each added account appears in a list below as an account card
showing bank, account nickname, currency, and a Pessoal/Compartilhada (Personal/Shared) toggle
that defaults to Pessoal, with a lock icon on Pessoal. A "Continuar" button. Friendly onboarding,
indigo accent for the personal emphasis, light + dark.
```

## 8. Add / edit an account (drawer)

```text
Design an "add account" drawer/modal for nosko titled "Nova conta" (New account). Fields:
Instituição (Institution) selector with logos, Apelido (Nickname, e.g. "ING Conjunta"), Tipo
(Type: conta corrente/checking, cartão de crédito/credit, poupança/savings, corretora/brokerage,
investimento/CDB), Moeda (Currency EUR/BRL), and a prominent segmented "Visibilidade" control:
"Pessoal — só você vê" (Personal, with lock icon) vs "Compartilhada — visível para o casal"
(Shared). When Shared is chosen, show a note that it will appear in Casa for both partners.
"Salvar" / "Cancelar". Clear privacy framing, light + dark.
```

## 9. Create household & invite partner

```text
Design a "create household & invite" screen for nosko. Card "Crie sua casa" (Create your
household): Nome da casa (placeholder "Casa Marcelo & Gabriele"), Moeda base (EUR), Dia de início
do ciclo (Cycle anchor day, default 23, helper "do dia 23 ao 22"). Below, an "Convidar parceiro(a)"
(Invite partner) section: an email field + "Enviar convite" button, and a checklist "Contas para
compartilhar" (Accounts to share) listing your accounts with checkboxes — only checked ones become
joint/visible to the partner (e.g. check "ING Conjunta", leave Amex/Revolut unchecked/personal). A
reassurance line: "Suas contas pessoais continuam privadas" (Your personal accounts stay private).
Warm, collaborative, emerald accent, light + dark.
```

## 10. Accept invitation & share your accounts

```text
Design an "accept invitation" screen for nosko, for the invited partner (Gabriele). Card "Você foi
convidada" (You've been invited) showing the household "Casa Marcelo & Gabriele" and who invited
(Marcelo). Explain what's shared vs private: shared accounts, the couple budget, and bills are
visible to both; personal accounts and payments stay private to each person. Then a "Escolha o que
compartilhar" step listing the joiner's own accounts with Pessoal/Compartilhada toggles. Primary
"Aceitar e entrar", secondary "Recusar". Reassuring about privacy, light + dark.
```

---

## APP SHELL

## 11. App shell with space switcher

```text
Design the authenticated app shell for nosko. Left collapsible sidebar: nosko logo, then a
prominent SPACE SWITCHER (segmented or tabbed) toggling "Casa" (Shared, emerald) and "Pessoal"
(Personal, indigo). Below it, context-dependent nav — in Casa: Visão geral, Contas compartilhadas,
Pagamentos, Ciclos, Contas fixas, Metas, Resumo; in Pessoal: Visão geral, Minhas contas, Meus
pagamentos, Poupança e investimentos, Assinaturas; plus shared items Importar and Configurações.
Top bar: in Casa a cycle pill "23 Ago – 22 Set" (dropdown to switch cycles); a PT/EN language
switch; an EUR badge; and an avatar menu showing the two members. When in Pessoal, the top bar
shows a small lock chip "Espaço pessoal — privado" (Personal space — private). Main content is a
responsive card grid. On mobile the sidebar becomes a bottom tab bar with the space switcher on
top. Show light and dark. This frame hosts every other screen.
```

---

## CASA (SHARED SPACE — both partners see)

## 12. Shared overview (Casa dashboard)

```text
Design the Casa (Shared) overview dashboard for nosko, showing the couple's joint finances. Both
members' avatars in the header signal it's shared. Top stat tiles: "Renda do casal" (Household
income) €5.791,56; "Contas fixas" €2.843,97; "Disponível p/ variável" €1.075,12; "Sobra projetada"
+€886,10 (green). A prominent banner "Pode gastar ≈ €35,57/dia" for the remaining days of the
current cycle with a thin cycle-timeline progress bar. A "Situação atual — pago vs. a pagar" card:
a checklist of shared fixed bills (Aluguel €1.550 ✓, Plano de saúde €313,90 ✓, Luz e Gás €173 ✓,
NS transporte €70 ✓, Internet €25 ✓, Academia €100 …) with a "9/10 pagas · €173 a pagar" summary
and ring progress. A "Gasto compartilhado por categoria" donut (Mercado €582,61 / Lazer €321,25 /
Outros €276,73). A right rail listing recent shared payments (AH €48,29, Wok to Walk €38,40, Dirk
€12,56) each tagged with who paid (avatar). Data-dense, emerald accent, light + dark.
```

## 13. Shared accounts

```text
Design the "Contas compartilhadas" (Shared accounts) screen for nosko. A list of joint accounts as
account cards, each with a bank logo, nickname (e.g. "ING Conjunta"), masked number, currency,
current balance, a "Compartilhada" badge, and small avatars of both members. A header stat: total
balance across shared accounts. A "＋ Compartilhar uma conta" button that opens the account
visibility flow. Note that only accounts explicitly shared appear here; personal accounts live in
Pessoal. Clean, both-members framing, emerald accent, light + dark.
```

## 14. Shared payments

```text
Design the "Pagamentos" (Shared payments) screen for nosko — the couple's shared transactions. A
filterable table: data, descrição, conta (shared account), categoria chip (Mercado/Lazer/Outros),
quem pagou (who paid, avatar), valor. Filters for cycle, category, member, and account. A summary
strip: total shared spend this cycle, split contribution per member. Add/edit shared payment
action. Everything here is visible to both partners. Data-dense, scannable, emerald accent, light
+ dark.
```

## 15. Cycles list (shared budget)

```text
Design the "Ciclos" (Cycles) list for nosko — the couple's shared monthly budgets. A vertical list
of cycle cards, newest first: title "23 Ago – 22 Set", date range, renda €5.791,56, fixas
€2.843,97, variável €1.180,59, and a right-aligned sobra/falta chip (green + / rose −). The current
cycle has an emerald left border and "Ciclo atual" badge. A "＋ Novo ciclo" button that scaffolds
the next cycle. A small surplus-trend sparkline across cycles at the top. Shared space, light +
dark.
```

## 16. Cycle detail (shared budgeting)

```text
Design the shared Cycle Detail screen for nosko, cycle "23 Ago – 22 Set". Header with title, date
range, "Ciclo atual" badge, and both members' avatars. Section "Renda" (Income): per-member rows
Marcelo €4.191,56 and Gabriele €1.600,00 with a split bar (72% / 28%) and total €5.791,56. Section
"Saques" (Withdrawals to personal accounts): suggested vs actual per member. Section "Contas fixas":
a checklist with each bill's label, amount, paid/unpaid toggle, paid-on day, an "auto-paga" badge
when a shared imported transaction paid it, subtotal, "9/10 pagas". Section "Variável": header
"Disponível p/ variável €886,10 · Gasto €1.180,59 · Livre −€47,47" with a progress bar (overspend
in rose), a category bar list, and a table of shared expenses (data, descrição, categoria, quem
pagou, valor). Right summary rail: Disponível, Total gasto, Sobra/Falta (signed, colored), Próximo
saque sugerido. Dense, organized cards, emerald accent, light + dark.
```

## 17. Shared fixed bills & recurring rules

```text
Design the shared "Contas fixas" screen for nosko. Two tabs: "Contas do ciclo" (current cycle's
bills) and "Regras recorrentes". Tab 1: a checklist of the cycle's shared fixed bills with amount,
paid/unpaid toggle, paid-on day, and an "auto-paga" badge when a matched shared import paid it. Tab
2: recurring rules for shared accounts — matcher (vendor), expected amount, category, cadence
(Mensal), "É conta fixa" toggle, active toggle, and a source badge "Detectado automaticamente" or
"Definido por você". A top "Sugestões detectadas" section proposing recurring shared charges to
confirm (e.g. "Parece recorrente: Eneco €173/mês — Adicionar?"). Shared space, light + dark.
```

## 18. Shared goals

```text
Design a "Metas" (Shared goals) screen for nosko — couple savings goals (e.g. Viagem/Trip,
Reserva/Emergency fund). Cards per goal with a name, target amount, current progress ring, monthly
contribution, and projected completion date. A "＋ Nova meta" button. Optional link into the
shared reserve. Motivating but tidy, emerald accent, light + dark.
```

---

## PESSOAL (PERSONAL SPACE — private to you, partner can't see)

## 19. Personal overview (private)

```text
Design the Pessoal (Personal) overview for nosko — PRIVATE to the logged-in user; the partner can
never see this. Indigo accent (distinct from the emerald Casa space) and a clear privacy header: a
lock icon with "Espaço pessoal — só você vê" (Personal space — only you can see it). Top stat
tiles: "Saldo pessoal" (Personal balance across your personal accounts); "Gasto pessoal no mês"
(Personal spend this month); "Poupança pessoal" (Personal savings); "Assinaturas" (Subscriptions
monthly). A donut of personal spend by category, a line chart of personal monthly spend, and a
right rail of recent personal payments (from your Amex/Revolut/Nubank). Nothing here touches the
couple budget. Private, calm, indigo accent, light + dark.
```

## 20. My accounts (personal, private)

```text
Design the "Minhas contas" (My accounts) screen for nosko — the user's PERSONAL accounts, private.
Privacy header with lock "Só você vê isto". A list of personal account cards: bank logo, nickname
(Amex Gold, Revolut, Nubank, C6 CDB), masked number, currency (EUR/BRL), balance, and a "Pessoal"
badge with a lock. A "＋ Adicionar conta" button, and per-card an option "Compartilhar com o casal"
(Share with household) that would move it into Casa. Make it obvious the partner cannot see these.
Indigo accent, light + dark.
```

## 21. My payments (personal, private)

```text
Design the "Meus pagamentos" (My payments) screen for nosko — the user's PERSONAL transactions,
private to them. Privacy header with lock. A filterable table: data, descrição, conta (personal
card), categoria, valor, moeda. Filters by month, account, category. A summary strip: personal
spend this month, biggest personal categories (e.g. Uber Eats, Assinaturas, Roupas). A note that
these are never shared with the partner. Indigo accent, data-dense, light + dark.
```

## 22. Personal savings & investments (private)

```text
Design the personal "Poupança e investimentos" screen for nosko — private to the user. Privacy
header with lock. Stat tiles: "Reserva EUR" €3.604,68; "Corretora" €2.123,01; "CDB (BR)"
R$3.325,79; "Total". An EUR savings card with balance, annual rate, and a monthly rollup table
(mês, aportes, retiradas, juros, saldo, delta). A holdings card listing brokerage positions
(NVIDIA, MongoDB, Datadog, Nu Holdings, Adyen) with value and % change chips. A Brazil CDB card
(invested, current, net-of-tax). Buttons to open the projection panels (next screens). Indigo
accent, wealth-dashboard feel, tabular numbers, light + dark.
```

## 23. Personal savings projection (EUR two-phase + Box 3)

```text
Design the personal EUR "Projeção de poupança" panel for nosko (private space, indigo accent). A
large line chart with series "Plano" (Plan), "Só poupança" (Savings-only), and "Líquido após
imposto" (Net after tax). Left controls: Aporte mensal slider, Reserva alvo slider (default
€24.000), Rendimento pós-reserva slider (default 10%), and horizon buttons 1/5/10/15/20/30/40/50
anos. Stat row: Saldo final, Taxa "2% → 10%", "Atinge reserva em X anos", Imposto NL total (Box 3
~2,16% acima de ~€57k). A milestone table (ano, saldo, líquido). Note explaining the plan grows at
the savings rate until the reserve target, then the excess compounds at the stock return, minus NL
wealth tax. Compact money on axes (e.g. €7,09M). Sophisticated planning UI, light + dark.
```

## 24. Personal subscription audit (private)

```text
Design a personal "Assinaturas" (Subscription audit) screen for nosko — private to the user.
Privacy header with lock. A table of detected recurring personal subscriptions grouped by country
(NL / BR): name, card/source, monthly cost, annualized cost, and a recommendation badge
(Manter/Keep, Reavaliar/Review, Cancelar/Cancel). Highlight duplicates/overlaps (e.g. two Google
One plans, four streamers). A "Economia potencial ≈ €2.500/ano" tile and checkboxes to mark actions
taken. Insightful, indigo accent, light + dark.
```

---

## CROSS-CUTTING

## 25. Import statements (route to personal or shared)

```text
Design the "Importar" (Import statements) screen for nosko. A large drag-and-drop dropzone "Arraste
extratos aqui" accepting CSV and PDF. A per-bank grid of upload cards: ING (CSV), Revolut (CSV),
Amex (PDF, protegido por senha), Nubank conta + cartão (CSV), C6 (PDF), each showing the target
account and whether that account is Pessoal or Compartilhada (so the user sees where the
transactions will land). A recent-uploads table: banco, arquivo, período, conta (with
Pessoal/Compartilhada badge), status (Enviado/Processando/Processado/Falhou). Note that imports for
personal accounts stay private; imports for shared accounts feed Casa. Functional, light + dark.
```

## 26. Review queue (with privacy routing)

```text
Design a transaction "review queue" for nosko, shown after an import. A filterable table of staged
transactions: data, conta (with Pessoal/Compartilhada badge), descrição, contraparte, valor, moeda,
suggested category chip. Row actions: Confirmar, Ignorar, Categorizar. Self-transfers (e.g. Wise
EUR→BRL between your own accounts) are grouped and marked "Transferência — não contar"; duplicates
flagged "Duplicado". A top count bar (Novos / Confirmados / Ignorados / Duplicados) and a
"Confirmar selecionados" bulk action. A clear indicator that confirming a shared-account
transaction adds it to the couple's cycle (visible to both), while personal-account transactions
stay private. Efficient triage UI, light + dark.
```

## 27. Summary / resumo (shared cycle, WhatsApp copy)

```text
Design a "Resumo" screen for nosko that produces a WhatsApp-ready recap of the current SHARED
cycle. A phone-style preview card: title "💰 Resumo — 23 Ago – 22 Set", "Renda do casal €5.791,56",
"Contas fixas €2.843,97 (saem automático)", a "💸 Variável" block "Gasto €1.180,59 de €886,10
disponível", "📅 ≈ €35,57/dia nos próximos 12 dias", and "📊 Maiores variáveis: Mercado / Lazer /
Outros". A big "Copiar resumo" button and a "Copiado!" toast. A cycle selector. This summarizes the
shared budget only (no personal data). Playful but tidy, emerald accent, light + dark.
```

## 28. Settings (household, sharing & privacy)

```text
Design the "Configurações" (Settings) screen for nosko. Cards: "Casa" (Household) — name, base
currency (EUR), cycle anchor day (23), default reserve (€100); "Compartilhamento" (Sharing) — a
list of your accounts with a Pessoal/Compartilhada toggle each, so you can share or un-share
accounts, with a warning that un-sharing removes them from Casa; "Membros" (Members) — Marcelo
(owner) and Gabriele (member) with invite/remove; "Idioma" (Language) PT/EN per user; "Categorias"
— editable colored category list (Mercado, Lazer, Outros, +); "Projeções" (Projection defaults) —
reserve target €24.000, post-reserve return 10%, NL Box 3 allowance ~€57k and rate ~2,16%;
"Privacidade" (Privacy) — a clear explainer that personal accounts and payments are never visible
to the partner; "Segurança" — password, MFA, active sessions; "Dados" — export your data (JSON).
Inline editing with save toasts, clean settings layout, light + dark.
```

---

## Coverage map (screen → area)

| Screen | Area |
|---|---|
| 1–6 | Auth (signup, login, verify, MFA, reset) |
| 7–10 | Account setup & sharing (add accounts, visibility, create household + invite, accept + share) |
| 11 | App shell + Casa/Pessoal space switcher |
| 12–18 | **Casa (Shared):** overview, shared accounts, shared payments, cycles, cycle detail, fixed bills, goals |
| 19–24 | **Pessoal (Personal, private):** overview, my accounts, my payments, savings & investments, projection, subscriptions |
| 25–26 | Import + review queue (with personal/shared routing) |
| 27 | Shared summary / resumo |
| 28 | Settings (household, sharing, privacy, members, projections) |

The privacy boundary is the defining UX rule: **Casa = both see; Pessoal = only you**. Every screen
should make its space unmistakable (emerald = shared, indigo + lock = personal).

Once you generate designs you like, share them back and I'll build the React + Effect screens to
match, wired to the BFF.
```
