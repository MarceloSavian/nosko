# Web Conventions (agreements)

Durable rules for `@nosko/web`. Stub created at U0; filled at U8 per
`documentation/repo-structure-and-agreements.md`.

- React + Effect client: data fetching and error handling through Effect (`useRpc`); **no
  try/catch, no bare `Promise.catch`**.
- i18n: en + pt-BR typed dictionaries; **no hardcoded user-facing strings**; money/date
  localisation on the client.
- Error UX: global error boundary + toasts; typed error channel handling; safe retries.
- Import shared types from `@nosko/contracts`; never redefine BFF shapes.
- Tailwind styling per the Shared-Ledger theme; no default memoization; basic accessibility.
