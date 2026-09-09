# Lifecycle State

- **Project:** nosko
- **Task size:** Large (confirmed — Q1=A)
- **Phase:** CONSTRUCTION
- **Current stage:** Phase 1 / **U0 + U1 committed; U1 applied** to the nosko-test account. The
  HTTP API, both Lambdas (placeholder handler), IAM, SSM, uploads bucket, and S3+CloudFront are
  live on default endpoints (real BFF replaces the placeholder at U4). Region `eu-west-1`, Node
  24 local, Lambda `nodejs22.x`.
- **U1 delivered (no apply):** reusable capability modules (`compute/aws-lambda` with an extra
  IAM-policy hook, `api-routing/aws-apigw-v2`, `secrets/aws-ssm`, `static-site/aws-s3-cloudfront`
  domain-optional, `storage/aws-s3-private`) + an `environments/test` root wiring a single **BFF
  Lambda** (`bff-v1`) behind an HTTP API ($default route), a `migration-v1` Lambda, SSM secrets
  (`DATABASE_URL`/`JWT_SECRET`), a private uploads bucket, and an S3+CloudFront SPA (default
  domain). Neon connection supplied via `database_url`. `iac/README.md` + `iac/CONVENTIONS.md`
  written. Verified with `terraform fmt` + `terraform init -backend=false` + `terraform validate`.
- **U1 targets the nosko-test account (`936834757679`):** deploys directly via
  `aws-vault exec nosko-test` (no provider `assume_role`). Remote state in the
  `nosko-tfstate-936834757679` S3 bucket in that account (S3-native locking;
  `iac/scripts/bootstrap-state.sh` creates it). `us_east_1` provider ready for a future domain.
- **`nosko.app` domain deferred:** its Route53 zone is in the management account, so a custom
  domain needs management-account creds; the baseline runs on default CloudFront / API-GW URLs.
- **U1 apply is gated:** needs Marcelo's go-ahead, the state bucket bootstrapped, built Lambda
  artifacts (wired at U4), and real `terraform.tfvars` (`database_url`, `jwt_secret`).
- **U0 delivered:** pnpm monorepo (`backend`, `web`, `packages/contracts`, `iac`) with the pinned
  toolchain — **TypeScript 7 `7.0.2` (`tsc`)**, **SWC** (emit + `@swc/jest`), **Effect `3.22.1`**,
  Biome, **Jest with a 100% coverage gate**, and a **no-try/catch guard**. Walking-skeleton
  samples prove the stack: `@nosko/contracts` (Effect `Schema` `Money`), backend Effect service
  with a tagged error + Effect error channel, web React app with the **en/pt i18n** baseline.
  Conventions stubs + `glossary.md` written.
- **Verification (green):** `pnpm check` (Biome + no-try/catch guard), `pnpm -r typecheck`
  (TS 7), `pnpm -r test` (**100% coverage** across all 3 packages), and `pnpm build` (web
  `vite build`) all pass.
- **Review-round changes folded in:** configurable cycle anchor day; **English code
  identifiers** (pt→en vocabulary in architecture §4 / `glossary.md`); fully **bilingual en/pt**
  UI; automatic + manual **fixed-bill identification** (recurring_rules); **configuration-first**
  settings surface; **exhaustive error handling** (NFR-ERR); the repo agreements map; and the
  toolchain — **TypeScript 7 (`tsc`)**, **SWC** (emit + `@swc/jest`), **100% coverage**.
- **UI review + requirements alignment (done):** reviewed both Stitch exports (~30 screens).
  Rewrote `requirements.md` and `design/database-design.md` to match the generated UI. New/expanded
  concepts folded in: strict **Casa (shared) vs Pessoal (personal, private)** with per-row
  `owner_user_id` + `visibility`; **accounts** with personal/shared **visibility**;
  **file import** (CSV; PDF for Amex/C6) with **IBAN routing** + internal-transfer pairing +
  categorisation; **goals/vaults** with per-member contributions; **subscription audit**
  (redundancy + efficiency score); **category caps**, **FX (EUR/BRL)**, NL Box-3 params,
  savings-rate/multi-cycle trends; a **Data Architecture** section + screen→data mapping. (The
  per-payment couple ledger introduced here was dropped in the 2026-09-09 review round.)
- **Decisions (resolved with Marcelo, superseded in part by the review round below):** (1) personal
  privacy = server-side isolation (now: mandatory RLS, no KMS); (2) **no bank sync** — file import
  only (CSV primarily; PDF for Amex/C6); Open Finance/sync UI removed on build; (3) **personal
  withdrawals are user-defined** after seeing `availableAfterPayments` (no forced suggestion);
  the per-payment split/settlement idea was dropped in the review round.
- **Propagation (done):** wrote `user-stories.md` (15 epics + the per-section actions/BFF
  surface); updated `design/architecture.md` (SubscriptionAudit, visibility, expanded BFF
  sections, file-only ingestion with IBAN routing, user-defined withdrawals),
  `design/units-of-work.md` (U0–U15), and `plans/implementation-plan.md` (phases re-scoped).
  Everything on GitHub (`MarceloSavian/nosko`).
- **Review round (2026-09-09, done):** full project check against the 30 generated screens.
  Decisions with Marcelo: **proportional model, no ledger** (income shares fund the joint
  budget; fixed bills → variable estimate → reserve → the remainder spread by user-defined
  withdrawals; **no per-payment payer/split/settlement**, Split/Settlement Engine removed);
  **joint accounts have two owners** (one row per household, `ownership=joint`, co-owner);
  **RLS mandatory**, threat model = outsiders, **KMS envelope dropped**; cycle math in base
  currency (BRL shared payments converted at confirmation); personal categories + personal cap
  per user, personal period = household cycle; cycle status + surplus destination (goal); member
  transfers in both directions; goal contribution plans; evaluations computed (no stored
  narratives); credit-card fields; deficit-from-reserve out of scope. Propagated to
  `requirements.md`, `database-design.md`, `architecture.md`, `user-stories.md`,
  `units-of-work.md`, `implementation-plan.md`, `glossary.md`, `ui/README.md`, conventions.
  Repo hygiene: legacy worktrees/branches/stash and untracked legacy files removed; Biome scoped
  to source (`documentation/**` excluded); Jest ignores `dist/`; `web/CONVENTIONS.md` stub added.
  `pnpm verify` green; `terraform init` for `test` needs a fresh `.terraform` (stale provider cache).
- **Next step:** **U2** — data + isolation foundation: Neon migrations for the schema
  (identity/household/settings/accounts incl. joint co-owner/categories/caps with
  `owner_user_id` + `visibility` + **RLS policies**), the `@effect/sql-pg` `SqlClient` layer with
  the per-request transaction (`SET LOCAL app.*`), and base repositories with privacy +
  integration tests on Docker Postgres.

## Locked decisions (from requirements-questions.md + chat)

- **Lifecycle:** Large / full inception. (Q1)
- **Name:** `nosko`. (Q2)
- **Delivery:** phased — core cycle/budget loop + fixed bills first, then evaluations, savings,
  resumo. (Q3)
- **Ingestion:** file upload + per-bank parsers (ING/Revolut/Amex/Nubank/C6), dedupe + confirm,
  manual add/edit always available. (Q4)
- **Auth:** reuse nosko's custom email+password+MFA (ported to Effect standards); full signup
  flow; two independent users that **link accounts into a household**. (Q5=B)
- **Database:** PostgreSQL on Neon (serverless). (Q6) — access via `@effect/sql-pg`.
- **IaC / hosting:** Terraform modular IaC, reusing nosko's capability modules
  (compute/api-routing/secrets/static-site) + shared domain/ACM repo. (Q7=B)
- **Frontend:** React + Effect on the client, **rebuilt from scratch** (C4=B); same feature set
  as money-evaluation, fresh components; mobile later. (Q8)
- **History import:** none — start empty. (Q9=B)
- **Brazil:** full BR support in v1 (accounts, cards, CDB). (Q10=B)

## Cross-cutting technical mandates (from chat)

- **Effect library, used at its best**, across backend and frontend. Idiomatic `Effect<A, E, R>`,
  `Layer`/`Context` for DI, tagged errors (`Data.TaggedError`), **no try/catch** — all failures
  flow through the Effect error channel.
- **Keep nosko's DDD / Clean Architecture** layering (domain / data / infra / handlers), but
  implement it with Effect services and layers rather than plain Promises.
- **Separate BFF Lambda at the front** that prepares all frontend responses (formatting, error
  shaping), structured **GraphQL-like with per-section calls** — exact technology chosen in
  clarification C1.

## Resolved clarifications

- C1=C — BFF uses **both**: `@effect/rpc` (frontend↔BFF, per-section) + `@effect/platform`
  `HttpApi` (documented surface, OpenAPI/Swagger).
- C2=A — Single layered deployable (BFF entrypoint, DDD domain in-process behind it).
- C3=A — **Effect `Schema`** everywhere (replaces Zod).
- C4=B — Frontend **rebuilt from scratch** (React + Effect).
- C5=A — Household linking via **email invite**.
