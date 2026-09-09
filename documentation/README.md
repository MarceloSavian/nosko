# nosko — Feature Documentation

Development Lifecycle (DLC) workspace for building the nosko: a private, two-user
household finance manager on AWS that reimplements the functionality of `money-evaluation`
using the architecture lessons of `nosko`.

## Outcome

A deployed AWS web application, private to Marcelo + Gabriele, that replaces the hand-maintained
`money-evaluation` (`source.json` + static dashboard) with:
- multi-user auth and a real database;
- couple budgeting cycles (23rd→22nd) with the exact chaining/derived-figure logic;
- fixed-bill tracking, variable-spend categorisation;
- spend/subscription evaluations;
- savings tracking + the two-phase / Box-3 projection engine;
- transaction ingestion (method TBD) and imported historical data.

## Documents

| File | Purpose | Status |
|---|---|---|
| `reverse-engineering.md` | Capability capture from money-evaluation + nosko lessons | Done |
| `requirements-questions.md` | Product decisions | Answered |
| `requirements-clarification-questions.md` | Effect/BFF architecture decisions | Answered |
| `requirements.md` | Functional + non-functional requirements | Done |
| `design/architecture.md` | Effect + BFF + DDD + IaC architecture, cycle/projection specs | Done |
| `design/database-design.md` | PostgreSQL/Neon schema | Done |
| `design/units-of-work.md` | Dependency-ordered decomposition | Done |
| `repo-structure-and-agreements.md` | Which agreements go in which repo README/CONVENTIONS | Done |
| `plans/implementation-plan.md` | Phased execution plan | **Awaiting approval** |
| `state.md` | Current lifecycle stage and next step | Live |
| `verification.md` | Validation summary | Pending (post-implementation) |

## Task index

Tasks are defined after the architecture and units of work are agreed. Expected shape
(sequenced, dependency-ordered):

1. Infrastructure baseline (accounts/env, IaC, auth, DB).
2. Backend core: domain model + cycle engine + persistence + API (Zod/OpenAPI).
3. Data import (source.json → DB).
4. Frontend: dashboard rebuilt against the live API.
5. Ingestion (per chosen method).
6. Evaluations + savings/projection features.

## Reference projects (read-only, not modified)

- `~/Documents/money-evaluation` — functional source of truth.
- `~/Documents/projects/personal/nosko-legacy` — architecture reference.
