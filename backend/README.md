# @nosko/backend

The Effect BFF and DDD core (domain / data / infra / presentation) — a single layered deployable
(architecture §2, §3). U2: data + isolation foundation (Neon migrations with mandatory RLS, the
`SqlClient` layer, and a first repository slice: users, households, accounts, categories). U3:
auth primitives, mailer, and every auth/household use-case (signup, login, MFA, sessions,
password reset, invitations). U4: the BFF itself — auth (minus its 4 cookie-writing ops) and
household as one `@effect/rpc` group, the 4 cookie-writing auth ops (`login`/`mfaVerify`/
`refresh`/`logout`) as a documented `HttpApi` group, `AuthMiddleware` opening the per-request RLS
transaction, and the real Lambda handler that replaces U1's placeholder.

## Layout

```
migrations/   SQL migrations (Effect programs run by the @effect/sql migrator)
src/
  domain/     models (Schema), usecases (ports), services (pure engines), errors (tagged)
  data/       protocols (repository/service port tags), usecases (implementations orchestrating them)
  infra/      config (DatabaseConfig), db (RequestScope, Migrations), repositories (@effect/sql-pg),
              auth (password hashing, TOTP, opaque tokens, JWT, session cookies), mailer (SES + templates)
  presentation/
    rpc/      AuthGroupLive, HouseholdGroupLive (the RpcGroup handlers), AuthMiddlewareLive,
              dieOnSqlError (SqlErrors outside a contract's declared union become defects)
    http/     AuthApiLive (the 4 cookie-writing auth endpoints)
  main/       layers.ts (composes every Live layer), handler.ts (Lambda entry), migrate.ts,
              verifyMigrations.ts (excluded from unit coverage — see Scripts)
  test/       shared test-only helpers: fake repositories, fake mailer, SqlClient testkit
              (excluded from unit coverage)
```

## Scripts

- `pnpm test` — Jest (`@swc/jest`), enforced **100% coverage**.
- `pnpm typecheck` — TypeScript 7 (`tsc --noEmit`).
- `pnpm build` — bundles `src/main/handler.ts` with esbuild (one minified `index.mjs`, Node 22
  ESM) and zips it with `archiver` into `../iac/environments/test/artifacts/bff-v1.zip`, replacing
  U1's placeholder. Not yet exercised in a real Lambda invocation (needs a live Neon database and
  a `terraform apply`); `migration-v1.zip` is still the placeholder — wrapping `migrate.ts` as its
  own Lambda handler is not part of this unit.
- `pnpm migrate` — runs `migrations/*.ts` against a real Postgres. Needs `DATABASE_URL` (the
  Neon admin/owner connection) and `APP_DB_PASSWORD` (the password to set on `app_role`) in the
  environment. Never point `DATABASE_URL` here at `app_role` — migrations need DDL rights.
- `pnpm verify:migrations` — applies every migration against an embedded Postgres
  (`@electric-sql/pglite`, no external service needed) and asserts RLS actually isolates a
  partner's personal data and that `app_role` cannot bypass or disable it. Run this after
  changing any migration or policy; it is not wired into `pnpm test` because pglite's internal
  dynamic `import()` does not run inside Jest's VM sandbox.

## Two Postgres connections

Every runtime query must go through `app_role` (`NOSUPERUSER NOBYPASSRLS`, created by SQL in
`migrations/0002_app_role.ts`), never through the connection used for migrations. Neon's
console/CLI-created role inherits `neon_superuser`, which carries `BYPASSRLS` — Row-Level
Security silently does nothing for it regardless of `FORCE ROW LEVEL SECURITY`. See
`iac/README.md` for how the two connection strings (`database_url`, `app_database_url`) are
wired to the migration and BFF Lambdas respectively — both land in the `DATABASE_URL` environment
variable at runtime (Terraform picks the value per-Lambda), so `infra/config/DatabaseConfig.ts`'s
`PgLive` is correct for both without change.

## Session cookies

The BFF is the only thing that ever reads or writes `nosko_at` (access token, 15 min, path `/`)
and `nosko_rt` (refresh token, 30 days, path `/api/http/auth`) — both `httpOnly`, `Secure`,
`SameSite=Strict`. The web client never stores or attaches a token itself; see
`documentation/design/architecture.md` §11.2 for the full rationale, and
`infra/auth/SessionCookies.ts` for where the two cookies are read and written.

See `CONVENTIONS.md` for the coding agreements.
