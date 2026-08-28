# finance-app — Agent Instructions

Personal project. No ticket workflow, no work worktree rules.

## What this is

A private, two-user household finance manager on AWS. It reimplements the functionality of
`~/Documents/money-evaluation` (couple budgeting cycles, evaluations, savings projections) as a
real web application. It borrows architecture patterns — not code — from `../nosko`.

Read [`documentation/`](./documentation/) before changing anything. The project is being built
with the Development Lifecycle (DLC); requirements, design, and state live there.

## Conventions

- Clean Architecture with strict layer separation (`domain` / `data` / `infra` /
  `presentation` or `handlers`), matching the pattern used across Marcelo's projects.
- TypeScript. Validation and contracts via Zod; API docs auto-generated from Zod schemas.
- Do not add code comments unless explicitly asked; code should be self-explanatory.
- Pin exact dependency versions (no `^`/`~`). Verify any new package is legitimate before adding.
- Conventional Commits. Never commit or push unless Marcelo explicitly asks. No AI attribution
  trailers.
- Keep changes minimal and pragmatic. Do not add memoization or abstractions by default.

## Money data is sensitive

This app stores real financial data for real people. Never expose balances, transactions,
account identifiers, or personal data in logs, summaries, or committed fixtures. Never read
`.env` or secret stores.
