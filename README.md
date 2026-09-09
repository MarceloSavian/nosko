# nosko

A private household finance manager for two people (Marcelo + Gabriele), hosted on AWS.

It **reimplements the proven functionality of `money-evaluation`** (couple budgeting cycles with
the proportional model, fixed bills, shared payments, evaluations, savings projections) as a real
two-user web application with a backend, database, and authentication — replacing the
hand-maintained `source.json` + static dashboard workflow. It reuses the **architecture lessons**
of the earlier nosko attempt (AWS Lambda, Clean Architecture, modular IaC) without carrying over
its code.

## Layout

```
backend/            Effect BFF + DDD core (single Lambda)
web/                React + Vite + Tailwind + Effect client (pt-BR / en)
packages/contracts/ shared Effect Schema + RPC contracts
iac/                Terraform (capability modules + environments)
documentation/      DLC artifacts: requirements, design, plan, state, generated UI
```

## Quickstart

```bash
pnpm install
pnpm verify        # biome + no-try/catch guard, tsc, jest (100% coverage), vite build
pnpm --filter @nosko/web dev
```

## Status

Construction. U0 (tooling) and U1 (infra baseline on the nosko-test account) are done; the next
unit is U2 (data + isolation foundation). See `documentation/state.md`.
