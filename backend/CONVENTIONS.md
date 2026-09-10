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
- **Session-mutating auth ops (`login`, `mfaVerify`, `refresh`, `logout`) are `HttpApi`, not
  RPC** — they're the only ones that write/clear the `nosko_at`/`nosko_rt` cookies, and
  `HttpApiBuilder`'s response-building lets a handler return a full `HttpServerResponse`
  (`HttpServerResponse.json(...)` piped through `setAccessTokenCookie`/`setRefreshTokenCookie`/
  `clearSessionCookies`). Everything else in `auth` and all of `household` is `@effect/rpc`,
  authenticated by `AuthMiddleware` reading the same cookie from the request headers.
- **A use-case's `SqlError` that isn't part of the RPC/HttpApi contract's declared error union
  must become a defect, not leak** — pipe it through `dieOnSqlError`
  (`presentation/rpc/dieOnSqlError.ts`) at the presentation boundary. The compiler enforces this:
  a raw `SqlError` in a handler's return type fails to satisfy the group's declared
  `HandlersFrom<...>` shape.
- **`app.household_id` is not known upfront for most authenticated requests** — a user's
  household is discovered per-request from `household_members` (`AuthMiddleware`, via
  `RequestScope.withAuthenticatedScope`), not carried in the JWT, since it can change (a user can
  create or join a household after already holding a valid session). The few flows where the
  identity itself isn't known until mid-use-case either (`signUp`, `login`,
  `requestPasswordReset`) rely on the affected repositories self-scoping `app.user_id` right
  before their own write (see `UsersRepositoryLive.create`, `AuthTokensRepositoryLive.create`,
  `UserSessionsRepositoryLive.create`) rather than the presentation layer knowing the id upfront.
- **When composing `main/layers.ts`, provide a `PgClient`/`SqlClient`-producing layer
  (`PgLive`) as its own trailing `.pipe(Layer.provide(PgLive))`, never merged into a
  `Layer.mergeAll(...)` alongside several other service layers before a single `Layer.provide`.**
  TypeScript's inference silently fails to discharge `SqlClient` from the remaining requirement
  when `PgLive`'s dual-tag output (`PgClient | SqlClient`) is bundled into a large union first —
  the resulting type still shows `SqlClient` as unmet with no explanatory error pointing at the
  real cause. Splitting the two `Layer.provide` calls (see `provideInfra` in `main/layers.ts`)
  resolves it and is otherwise semantically identical.

## Testing

- **Jest + `@swc/jest`, 100% coverage** (CI-enforced). Effect programs run via
  `Effect.runPromise`/`runPromiseExit`/`Effect.flip`. Synthetic fixtures only — never real
  balances/PII.
- Repository tests exercise the real `SqlClient`/compiler against a fake in-memory connection
  (`src/test/sqlClientTestkit.ts`), so generated SQL is checked for real. Use-case tests mock at
  the port boundary instead (`src/test/fakeRepositories.ts`, `fakeMailer.ts`) — SQL correctness is
  already covered one layer down, so use-case tests focus on orchestration and error handling.
  Fakes must build dates via `DateTime.unsafeFromDate`, matching what Schema-decoded repositories
  actually return — a plain `Date` there passes typecheck but silently breaks any `DateTime`
  comparison in the code under test.

## Toolchain & hygiene

- TypeScript 7 (`tsc`) type-check; SWC emit. Exact dependency pins (no `^`/`~`); vet new packages.
- No code comments. Secrets only via the config layer; never logged.
- Some npm packages ship ESM-only, with no `require` condition (e.g. `jose`). Jest's default
  transform only covers `.tsx?`; such a package needs its own `transformIgnorePatterns` entry
  (`node_modules/(?!.*\bPACKAGE\b)`) so `@swc/jest` compiles it too — check a new dependency's
  `package.json` `exports` map before assuming it works.
