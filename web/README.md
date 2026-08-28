# @finance/web

The rebuilt React + Effect dashboard (bilingual en/pt). U0 ships the app shell, the i18n
baseline, and the toolchain; pages (Overview, Cycles, …) arrive from U6/U7 wired to the BFF.

## Stack

React 19 + Vite + Tailwind 4 + Effect (client data fetching + error handling). Tests: Jest +
`@swc/jest` + Testing Library + jsdom.

## Scripts

- `pnpm dev` — Vite dev server.
- `pnpm build` — production build.
- `pnpm test` — Jest, enforced **100% coverage**.
- `pnpm typecheck` — TypeScript 7.

See `CONVENTIONS.md` for the coding agreements.
