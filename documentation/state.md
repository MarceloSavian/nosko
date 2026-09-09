# Lifecycle State

- **Project:** nosko
- **Task size:** Large (confirmed — Q1=A)
- **Phase:** CONSTRUCTION
- **Current stage:** Phase 1 / **U0 + U1 committed; U1 applied** to the nosko-test account; **U2
  delivered (not yet applied — no live Neon database targeted this session)**. The HTTP API, both
  Lambdas (placeholder handler), IAM, SSM, uploads bucket, and S3+CloudFront are live on default
  endpoints (real BFF replaces the placeholder at U4). Region `eu-west-1`, Node 24 local, Lambda
  `nodejs22.x`.
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
- **U2 delivered (2026-09-09):** 7 migrations (`backend/migrations/0001`–`0007`: extensions,
  `app_role`, users/auth_tokens/user_sessions, households/settings/members/invitations,
  user_settings, categories, accounts) with RLS enabled + **forced** on every financial table;
  `@effect/sql-pg` `PgLive` layer (`DatabaseConfig.ts`) with `snakeToCamel`/`camelToSnake`
  transforms; `RequestScope.withRlsScope` (`select set_config('app.user_id'/'app.household_id',
  $1, true)` inside `sql.withTransaction`); a first repository slice (Users, Households —
  atomic create + seed settings + owner member, Accounts, Categories) over ports in
  `data/protocols/*`; `pnpm migrate` (Node 24 runs `.ts` migrations natively, no build step) and
  `pnpm verify:migrations` (embedded-Postgres check via `@electric-sql/pglite`, since Jest's VM
  sandbox blocks pglite's internal dynamic import). 41 tests, 100% coverage; `pnpm verify` green.
  Deferred to U3 (owned by the auth/invite use-cases that need them): repositories for
  `auth_tokens`, `user_sessions`, `household_invitations`.
  **Critical finding, fixed and verified:** Neon's console/CLI-created role inherits
  `neon_superuser`, which carries `BYPASSRLS` — `FORCE ROW LEVEL SECURITY` does nothing for it
  (confirmed empirically: a partner could read personal accounts through it). Fixed by having
  migration `0002_app_role.ts` create `app_role` by SQL (`NOSUPERUSER NOBYPASSRLS`, table-level
  grants only, no ownership) — the only way to get a role outside `neon_superuser` on Neon. This
  changes the IaC contract: **two Postgres connection strings**, `database_url` (admin, DDL,
  `migration-v1` only) and `app_database_url` (`app_role`, all runtime queries, `bff-v1` only);
  never point the BFF at `database_url`. `iac/` updated (`variables.tf`, `secrets.tf`,
  `compute.tf`, `terraform.tfvars.example`, `README.md`, `CONVENTIONS.md`) — **not yet applied**;
  first deploy needs a two-pass sequence documented in `iac/README.md` (apply once to get
  `app_role` provisioned and its password set, then fill in `app_database_url` and re-apply).
  Also fixed: a custom GUC reverts to `''` (not `NULL`) on `RESET`, and `''::uuid` raises instead
  of denying — every policy now guards with `nullif(current_setting(...), '')` before the cast.
- **U3 delivered (2026-09-09):** the `auth_tokens`/`user_sessions`/`household_invitations`
  repositories deferred from U2, plus `HouseholdsRepository.update`/`listMembers`/`removeMember`
  (the last two named in `user-stories.md` Epic 2 but never built). Auth primitives
  (`backend/src/infra/auth/`): `PasswordHasher` (argon2id via `hash-wasm` — WASM, so no
  platform-specific native binary to bundle for Lambda, unlike `@node-rs/argon2`); `TotpService`
  (`otpauth`, MFA enrollment + verification); `OpaqueTokens` (sha256 of a random token for
  links, or a 6-digit code for things a user types back in); `AccessTokens` (short-lived JWT via
  `jose`, which is ESM-only — `backend/jest.config.mjs` now transforms `.js` too and stops
  ignoring it under `node_modules`). Mailer (`infra/mailer/`): `Mailer` port +
  `SesMailerLive` (`@aws-sdk/client-sesv2`) + bilingual pt-BR/en templates for the four
  transactional emails (verify, reset, MFA OTP, invitation).
  Use-cases (`data/usecases/`): `SignUp` (signUp/verifyEmail/resendVerification), `Mfa`
  (mfaEnroll/mfaConfirmEnroll/mfaDisable/mfaChallenge), `Login` (login/mfaVerify — MFA accepts
  either a TOTP code or a valid emailed OTP; "remember this device" is modeled as the issued
  session's own refresh token carrying `mfaTrustedUntil`, checked at the next login rather than
  as a separate device-cookie mechanism), `Sessions` (issueSession/refreshSession/logout/
  revokeSession — ownership-checked/listSessions/revokeAllSessions), `PasswordReset`
  (requestPasswordReset never reveals whether an email is registered/resetPassword), and
  `HouseholdInvitations` (inviteMember rejects once the household has two members/
  acceptInvitation requires the accepting email to match the invitation/revokeInvitation).
  Introduced a shared `Locale` schema (`domain/models/Locale.ts`) and tightened
  `User.preferredLocale` to it. Extended `UserCredentials` (the one projection that keeps
  sensitive columns) with `preferredLocale`, `findCredentialsById`, since MFA/reset use-cases
  need the stored secret and locale that the public `User` never exposes.
  A real bug surfaced and was fixed along the way: the shared test fakes
  (`backend/src/test/fakeRepositories.ts`) stored plain `Date` objects where the real
  Schema-decoded ports return `DateTime.Utc`, so the `mfaTrustedUntil` comparison silently
  always failed — fixed by building fake dates via `DateTime.unsafeFromDate`. 159 tests, 100%
  coverage; `pnpm verify` green. Not yet wired to any transport (RPC/HttpApi is U4) and not
  exercised against a live database (still no Neon target this session).
- **Next step:** **U4** — BFF skeleton: `RpcServer` (+ minimal `HttpApi`) in one layered Lambda,
  `packages/contracts`, typed client, OpenAPI, auth middleware wiring `RequestScope` from the
  verified access token, top-level error boundary, and the build script producing
  `iac/environments/test/artifacts/bff-v1.zip` that replaces U1's placeholder.

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
