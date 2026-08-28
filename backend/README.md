# @finance/backend

The Effect BFF and DDD core (domain / data / infra / presentation) — a single layered deployable
(architecture §2, §3). Currently U0: toolchain + a proven Effect sample. Hosting/bundling arrives
at U1, the RPC/HttpApi surface at U4.

## Layout

```
src/
  domain/     models (Schema), usecases (ports), services (pure engines), errors (tagged)
  data/       usecase implementations, protocols (ports)
  infra/      repositories (@effect/sql-pg), auth, parsers, mailer, config
  presentation/  rpc (per-section groups), http (HttpApi groups)
  main/       layer wiring + Lambda entry (excluded from unit coverage)
```

## Scripts

- `pnpm test` — Jest (`@swc/jest`), enforced **100% coverage**.
- `pnpm typecheck` — TypeScript 7 (`tsc --noEmit`).

See `CONVENTIONS.md` for the coding agreements.
