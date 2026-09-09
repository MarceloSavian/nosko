# @nosko/backend

The Effect BFF and DDD core (domain / data / infra / presentation) — a single layered deployable
(architecture §2, §3). U2: data + isolation foundation (Neon migrations with mandatory RLS, the
`SqlClient` layer, and a first repository slice: users, households, accounts, categories). The
RPC/HttpApi surface arrives at U4.

## Layout

```
migrations/   SQL migrations (Effect programs run by the @effect/sql migrator)
src/
  domain/     models (Schema), usecases (ports), services (pure engines), errors (tagged)
  data/       protocols (repository ports)
  infra/      config (DatabaseConfig), db (RequestScope, Migrations), repositories (@effect/sql-pg)
  presentation/  rpc (per-section groups), http (HttpApi groups) — arrives at U4
  main/       layer wiring + Lambda entry + runnable scripts (excluded from unit coverage)
  test/       shared test-only helpers (excluded from unit coverage)
```

## Scripts

- `pnpm test` — Jest (`@swc/jest`), enforced **100% coverage**.
- `pnpm typecheck` — TypeScript 7 (`tsc --noEmit`).
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
wired to the migration and BFF Lambdas respectively.

See `CONVENTIONS.md` for the coding agreements.
