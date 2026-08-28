# @finance/contracts

Shared **Effect `Schema`** definitions and (later) `@effect/rpc` request/response contracts.
Imported by both `@finance/backend` and `@finance/web` so client and server share exact types —
no duplication, end-to-end type safety.

Source-only package (consumed via TypeScript source across the workspace); it has no build step.

## Agreement

- Contracts are **schemas and types only** — no business logic, no I/O.
- `effect/Schema` is the single contract language (no Zod).
- Money is always integer minor units + an ISO currency (`Money`, `Currency`).
- Backward-compatible changes only once a contract is consumed; breaking changes are versioned.

## Scripts

- `pnpm test` — Jest (`@swc/jest`), 100% coverage.
- `pnpm typecheck` — TypeScript 7 (`tsc --noEmit`).
