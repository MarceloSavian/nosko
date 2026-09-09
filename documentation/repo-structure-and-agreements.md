# Repo Structure & Agreements — what belongs in which README

This identifies which parts of the design become **repo agreements** (durable rules that live
next to the code, for humans and AI agents), versus **DLC design docs** (decisions/specs in
`documentation/`), versus **operational READMEs** (how to run things). Created as stubs at U0 and
filled as each unit lands.

## Three kinds of docs (don't mix them)

| Kind | Location | Answers | Audience |
|---|---|---|---|
| DLC design docs | `documentation/**` | why + what (requirements, architecture, DB, plan, state) | decision review |
| Agreements / conventions | `AGENTS.md`, `**/CONVENTIONS.md`, `glossary.md` | how we always write code here | every contributor + AI agent |
| Operational READMEs | root + per-package `README.md` | how to run / test / deploy | anyone running it |

Rule of thumb: **decisions** → `documentation/`; **durable coding rules** → `CONVENTIONS.md`;
**commands to run** → `README.md`. Agreements are extracted from the design so contributors don't
have to read the whole DLC set to follow the rules.

## File map

| File | Type | Contents (extracted from the design) |
|---|---|---|
| `README.md` (root) | Operational | What the app is, monorepo layout, quickstart, links to `documentation/` and each package |
| `AGENTS.md` (root, exists) | Agreement | Agent entry point; personal-project rules; pointers to per-package `CONVENTIONS.md`; money-data sensitivity |
| `documentation/glossary.md` | Agreement | The English domain vocabulary (architecture §4) — canonical naming; the pt→en map |
| `backend/README.md` | Operational | Install, migrate, run local, test, deploy the BFF |
| `backend/CONVENTIONS.md` | Agreement | The backend agreements (see below) |
| `web/README.md` | Operational | Install, run dev, build, test the SPA |
| `web/CONVENTIONS.md` | Agreement | The web agreements (see below) |
| `iac/README.md` | Operational | `terraform plan/apply` per environment, prerequisites |
| `iac/CONVENTIONS.md` | Agreement | The IaC agreements (see below) |
| `packages/contracts/README.md` | Agreement+Op | Shared `Schema`+`Rpc` contracts; both sides import it; backward-compat rule |

## `backend/CONVENTIONS.md` — agreements to capture

- Effect usage: idiomatic `Effect<A, E, R>`; **no try/catch, no bare `Promise.catch`**; tagged
  errors via `Data.TaggedError`; DI via `Layer`/`Context`; one `ManagedRuntime`.
- Schema-first: `effect/Schema` is the only contract/validation language (no Zod).
- **Total error-handling contract** (requirements NFR-ERR): typed error unions per endpoint,
  exhaustive `catchTags`, boundary `catchAllCause`/defect handling, safe client mapping.
- DDD layer boundaries + inward dependency direction (`presentation → data → domain`; `infra`
  implements ports; domain imports no infra).
- English identifiers everywhere; link to `glossary.md`.
- Repository patterns with `@effect/sql-pg`; per-request transaction + `SET LOCAL app.*`;
  **mandatory RLS** (every financial table ships policies in its migration); migrations location.
- BFF conventions: per-section `RpcGroup`s + `HttpApi` groups; return frontend-ready view models.
- Parser conventions: `Effect`-returning, tagged failures, fixture-driven tests.
- Testing: **Jest + `@swc/jest`, 100% coverage** (CI-enforced, documented exclusions);
  `Effect.runPromise` test helper; synthetic fixtures only; parity tests for engines.
- Toolchain: **TypeScript 7 (`tsc`)** type-check, **SWC** emit + `@swc/jest` tests; exact pins;
  package vetting; no code comments; secrets only via config.

## `web/CONVENTIONS.md` — agreements to capture

- React + Effect client: data fetching and error handling through Effect; **no try/catch**.
- **i18n agreement** (requirements FR-X-2): en + pt-BR, typed dictionaries, **no hardcoded
  user-facing strings**, key naming, money/date localisation, adding a language.
- Error UX: global error boundary + toasts; typed error channel handling; safe retries.
- Component/state conventions; Tailwind styling; basic accessibility; no default memoization.
- Import shared types from `packages/contracts`; never redefine BFF shapes.

## `iac/CONVENTIONS.md` — agreements to capture

- Cloud-agnostic **capability modules** (compute/api-routing/secrets/static-site) with AWS
  implementations nested; environments under `environments/{test,prod}`.
- Secrets only in SSM/Secrets Manager — **never in code or state in plaintext**; least-privilege
  IAM; resource tagging; remote state backend.
- Review `plan` before `apply`; shared domain/ACM referenced from the `personal/terraform` repo.

## Sequencing

Stubs for every `CONVENTIONS.md`/`README.md` and `glossary.md` are created in **U0**; each is
filled by the unit that introduces its area (backend rules with U4/U5, web/i18n rules with U8,
IaC rules with U1). This doc is the checklist for that.
