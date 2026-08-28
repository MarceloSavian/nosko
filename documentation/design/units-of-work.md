# Units of Work — finance-app

Dependency-ordered decomposition of the requirements. Each unit is independently reviewable and
maps to one or more phases from `requirements.md`. "Depends on" is the hard build order.

| Unit | Title | Delivers (FRs) | Phase | Depends on |
|---|---|---|---|---|
| U0 | Repo & tooling foundation | monorepo, **TypeScript 7 (`tsc`)**, **SWC** (emit + `@swc/jest`), Effect, Biome, **100% coverage gate**, CI checks; **CONVENTIONS/README/glossary stubs** (per `repo-structure-and-agreements.md`) | P1 | — |
| U1 | Infra baseline (Terraform) | Lambda, API GW HTTP, S3 static + S3 uploads, SSM, Neon wiring, env test/prod (NFR-TECH-6, NFR-COST) | P1 | U0 |
| U2 | Data + config foundation | Neon migrations (identity/household/budgeting + **household_settings/categories/recurring_rules**), `SqlClient` layer, base repositories (NFR-TECH-5, NFR-CFG) | P1 | U0 |
| U3 | Auth & Household | signup/verify/login/MFA/session, household create/invite/accept, settings section (FR-AUTH-*, FR-X-5) | P1 | U2 |
| U4 | BFF skeleton + error boundary | layered Lambda: `RpcServer` + `HttpApi`, contracts package, typed client, OpenAPI, auth middleware, **total error boundary** (FR-X-4, NFR-TECH-4, NFR-ERR) | P1 | U2, U3 |
| U5 | Budget core | Cycle Engine (**configurable anchor**) + cycles/fixed-bills/expenses domain + repos + RPC sections (FR-CYC-*, FR-BILL-1..4, FR-VAR-*) | P1 | U2, U4 |
| U6 | Web foundation + i18n | React+Vite+Tailwind+Effect client, **en/pt i18n dictionaries + switcher**, auth screens, app shell (FR-X-2, FR-X-3) | P1 | U4 |
| U7 | Web: Overview + Cycles | dashboard for the core loop, manual entry (FR-CYC-5, FR-BILL-3) | P1 | U5, U6 |
| U8 | Ingestion + recurring detection | uploads + per-bank parsers (incl. BR Nubank/C6) + dedup + transfer-linking + **RecurringDetector + auto/manual fixed-bill rules** + review queue + confirm-to-expense + review UI (FR-ING-*, FR-BILL-5..7) | P2 | U5 |
| U9 | Evaluations | domain + repos + RPC + web views (FR-EVAL-*) | P3 | U5 |
| U10 | Savings & Projections | accounts/events/holdings + Projection Engine + RPC + web panels (EUR two-phase/Box3, BR CDB) (FR-SAV-*) | P4 | U2, U4 |
| U11 | Summary + BR completion + hardening | summary (resumo) builder + copy, finalise BR accounts/cards, security review, export, backups (FR-RES-*, FR-X-1, NFR-DATA) | P5 | U5, U8, U10 |

## Critical path

U0 → U1/U2 → U3 → U4 → U5 → U7 completes a **usable P1** (auth + household + core budget loop +
dashboard). U8/U9/U10 branch off U5/U4 and can proceed in parallel after P1. U11 closes v1.

## Parity checkpoints (money-evaluation)

- U5: Cycle Engine unit tests reproduce the current dataset's `sobra`, `saqueSugerido`,
  `orcamentoVariavel`, `byCategory` for all five existing cycles.
- U10: Projection Engine reproduces the EUR two-phase + Box-3 series and BR CDB series shapes.
- U8: parser + dedup tests reproduce the documented dedup identities and transfer-linking rules.

## Assumptions

- Two users, one household (no multi-tenant complexity in v1).
- No legacy import (Q9=B) — schema is not constrained by `source.json` history.
- Effect unified version pinned at U0; v4-beta vs latest-stable decided there.
