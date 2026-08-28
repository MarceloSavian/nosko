# Glossary — English domain vocabulary

Canonical naming for all code, database columns, and API fields. The Portuguese terms come from
the `money-evaluation` source project and appear only in user-facing content / locale strings,
never in code. This is the source of truth referenced by `backend/CONVENTIONS.md`.

| Concept (pt, money-evaluation) | English identifier |
|---|---|
| ciclo | cycle |
| renda / salários | income / salaries |
| bônus | bonus |
| contas fixas / fixas | fixedBills / fixedTotal |
| gastos (variáveis) | expenses / variableTotal |
| categoria | category |
| reserva | reserve |
| estimativa | estimate |
| disponível | available |
| orçamento variável | variableBudget |
| saldo inicial | openingBalance |
| saque (sugerido / real) | withdrawal (suggested / actual) |
| próximo saque sugerido | nextSuggestedWithdrawal |
| sobra / falta | surplus (signed) |
| por categoria | byCategory |
| resumo | summary |
| pode gastar €X/dia | dailyAllowance |
| conta fixa recorrente (regra) | recurring rule / fixed-bill rule |
| ciclo âncora (dia) | cycle anchor day |

Money is always represented as **integer minor units** (`amountMinor`) plus an ISO-4217
**`currency`**.
