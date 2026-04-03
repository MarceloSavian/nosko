# Nosko

Nosko is a financial management app designed for couples.

Users can connect multiple bank accounts from different countries and currencies, upload their bank data, and plan their finances together or individually by month. The app provides a consolidated view comparing planned vs actual spending, shared couple planning, and per-person budgeting.

## Core Features

- Multiple bank accounts across multiple countries and currencies
- Shared accounts between partners (couple mode)
- Monthly financial planning — couple and individual
- Bank data upload per account
- Consolidated dashboard comparing planned vs actual (food, rent, etc.)

## Repository Structure

```
nosko/
├── backend/    # TypeScript REST API — Clean Architecture, Node.js, AWS Lambda
├── iac/        # Infrastructure as Code — cloud resources, deployment configuration
├── web/        # Web frontend
└── mobile/     # Kotlin Multiplatform — Android and web mobile app
```

## Git Workflow

Every change must be done in a **git worktree** branched off `main`. Never commit directly to `main`.

- Create the worktree at `../../git/worktrees/{name-of-the-change}/nosko` (relative to the repo root, i.e. `/home/marcelo/Documents/git/worktrees/{name-of-the-change}/nosko`)
- Branch name should match the worktree folder name (e.g. `feat/add-login-page`)
- After the branch is merged into `main`, delete the worktree and its branch

```bash
git worktree add -b feat/my-change ../../git/worktrees/feat/my-change/nosko main
# ... do work, commit, push, merge PR ...
git worktree remove ../../git/worktrees/feat/my-change/nosko
git branch -d feat/my-change
```

## Code Style

- Do not add comments to the code. The code should be self-explanatory. The only exception is `biome-ignore` directives required by the linter.

## Package Security

- Before installing any new npm package, verify the package is legitimate and not part of a supply chain attack (check publisher, download count, recent activity, known advisories).
- Always pin exact versions in `package.json` — no `^` or `~` prefixes. This prevents silent upgrades that could introduce compromised code.

### `backend/`
TypeScript backend running on AWS Lambda with PostgreSQL (Neon). Follows Clean Architecture with strict layer separation. See `backend/CONVENTIONS.md` for all architecture rules, coding standards, and patterns to follow when generating backend code.

API documentation is auto-generated from Zod schemas via `@asteasolutions/zod-to-openapi`. Each route file has a co-located `*.meta.ts` file with OpenAPI metadata. Run `npm run generate:openapi` to regenerate `openapi.json`. Swagger UI is served at `/v1/docs` by the `docs-v1` Lambda.

### `iac/`
Terraform infrastructure using cloud-agnostic module patterns. Modules are named by capability (`compute`, `api-routing`, `secrets`), not by AWS service names, with provider-specific implementations nested inside (e.g., `modules/compute/aws-lambda/`). Environment roots in `environments/{env}/` wire modules together. See `iac/CONVENTIONS.md` for module design rules and patterns. Shared infra (domain, ACM cert) lives in a separate [terraform repo](https://github.com/MarceloSavian/terraform).

### `web/`
Web frontend application.

### `mobile/`
Kotlin Multiplatform project targeting Android and web. Shares business logic across platforms.
