# Backend Conventions (agreements)

Durable rules for `@nosko/backend`. Extracted from `documentation/design/architecture.md`.

## Effect

- Idiomatic `Effect<A, E, R>` everywhere. **No `try/catch`, no bare `Promise.catch`** (enforced by
  the root `no-try-catch` guard). All failures flow through the Effect error channel.
- Errors are tagged (`Data.TaggedError`). Endpoints declare a full typed error union; handling is
  exhaustive (`catchTags`). A top-level boundary catches defects (`catchAllCause`) and maps them
  to a safe `InternalError`.
- DI via `Layer`/`Context`; one `ManagedRuntime` reused across warm invocations.
- `effect/Schema` is the only contract/validation language (no Zod).

## DDD / Clean Architecture

- Layers: `domain` ← `data` ← `presentation`; `infra` implements `domain`/`data` ports; `main`
  wires layers. **Domain imports no infra.** Dependencies point inward.
- Pure engines (Cycle, Projection, RecurringDetector, SubscriptionAudit, Evaluation,
  FxConversion, IngestionRules) live in `domain/services` and are unit tested; the Cycle Engine to
  parity with money-evaluation.

## Naming

- **English identifiers only** — see `documentation/glossary.md`. Portuguese appears solely in
  user-facing content / locale.
- Money is `amountMinor` (integer minor units) + `currency` (ISO 4217).

## Persistence

- `@effect/sql-pg` repositories; one transaction per request with `SET LOCAL app.user_id` /
  `app.household_id`; **RLS is mandatory** on every financial table and every query also filters
  by `household_id` (and `owner_user_id` for personal rows). SQL migrations in `migrations/`; a
  migration that adds a financial table adds its policies.

## BFF

- `@effect/rpc` groups per section + `@effect/platform` `HttpApi` groups; return frontend-ready
  view models. Parsers return `Effect`-wrapped results with tagged failures.

## Testing

- **Jest + `@swc/jest`, 100% coverage** (CI-enforced). Effect programs run via
  `Effect.runPromise`/`runPromiseExit`/`Effect.flip`. Synthetic fixtures only — never real
  balances/PII.

## Toolchain & hygiene

- TypeScript 7 (`tsc`) type-check; SWC emit. Exact dependency pins (no `^`/`~`); vet new packages.
- No code comments. Secrets only via the config layer; never logged.
