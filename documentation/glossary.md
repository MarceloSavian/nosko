# Glossary — English domain vocabulary

Canonical naming for all code, database columns, and API fields. The Portuguese terms come from
the `money-evaluation` source project and the generated UI, and appear only in user-facing
content / locale strings, never in code. This is the source of truth referenced by
`backend/CONVENTIONS.md`.

| Concept (pt) | English identifier |
|---|---|
| ciclo | cycle |
| renda / salários | income / salaries |
| bônus | bonus |
| participação na renda | contributionShare (income %, informational) |
| contas fixas / fixas | fixedBills / fixedTotal |
| gastos (variáveis) / pagamentos compartilhados | sharedPayments / variableTotal |
| categoria | category (household or personal scope) |
| teto (ciclo) | estimate (set-aside for unplanned shared payments) |
| teto (categoria) | cap |
| reserva | reserve |
| disponível | available |
| orçamento variável | variableBudget |
| saldo inicial | openingBalance |
| disponível após pagamentos | availableAfterPayments |
| saque | withdrawal (member transfer `to_personal`, user-defined) |
| aporte p/ casa | contribution (member transfer `to_household`) |
| sobra / falta | surplus (signed) |
| taxa de poupança | savingsRate |
| por categoria | byCategory |
| ritmo de gastos | burnRate |
| conta conjunta | joint account (ownership `joint`, owner + coOwner) |
| conta (visibilidade) | account (visibility: personal / shared) |
| meta / cofre | goal / vault |
| aporte (meta) | goal contribution / contribution plan |
| assinaturas | subscriptions |
| resumo | summary |
| pode gastar €X/dia | dailyAllowance |
| conta fixa recorrente (regra) | recurring rule / fixed-bill rule |
| ciclo âncora (dia) | cycle anchor day |
| câmbio | fxRate (quote per base) / amountBase |

Money is always represented as **integer minor units** (`amountMinor`) plus an ISO-4217
**`currency`**; cycle figures use the household base currency (`amountBase`).
