# @nosko/e2e-backend

End-to-end tests for the deployed backend. These call the real, deployed API
(`https://test.api.nosko.app` by default) through the same `@effect/rpc` client the real apps
use, plus plain `fetch` for the 4 cookie-writing auth endpoints and CSV export. They are not
unit tests and are not part of `pnpm test` / `pnpm verify` — they need network access to a live
test environment and its database, so they are run deliberately.

## Running

Copy `e2e/backend/.env.example` to `e2e/backend/.env` (already gitignored) and fill in
`DATABASE_URL`, then:

```bash
pnpm test:e2e:backend
```

`test:e2e` loads `e2e/backend/.env` automatically via Node's `--env-file-if-exists`. You can also
export `DATABASE_URL` in the shell instead of using a file — either way works.

`DATABASE_URL` must be the Neon **admin/owner** connection (never `APP_DATABASE_URL`/`app_role`).
Two things need it:

- **Code recovery**: verification codes, MFA email OTPs, password-reset codes and household
  invitation codes are 6-digit numbers hashed with unsalted SHA-256
  (`backend/src/infra/auth/OpaqueTokens.ts`). Rather than expose a debug endpoint on the deployed
  backend to read these back (a real attack surface, even gated by env var), the harness reads
  the stored hash directly from Postgres and brute-forces the 1,000,000-candidate space locally
  (`src/helpers/codes.ts`) — under a second, no backend changes, nothing to secure.
- **Category seeding**: there is no `categories` RPC group yet, so cycles/bills/rules/payments
  flows insert a category directly via SQL (`src/helpers/categories.ts`).

Override the target API with `E2E_API_BASE_URL` if needed.

## Cleanup

Every flow file creates its own users/household in a `before` hook and deletes them in `after`
via `src/helpers/cleanup.ts`, which only deletes the household/user ids that flow created
(`households(id)`/`users(id)` cascades cover everything else — accounts, categories, cycles,
bills, payments, sessions, tokens, invitations). A test run never touches data it didn't create.
If a run crashes before `after` fires, leftover rows are still identifiable: every test email is
`e2e+<label>-<uuid>@nosko.test`.

## Structure

Each file under `src/flows/` is a self-contained `node:test` suite — `node --test` isolates each
file in its own process, so state is never shared across files (only within one file's `before`
hooks and closures). `src/support/fixtures.ts` provides `setupCouple()`, the realistic baseline
most flows build on: two verified, logged-in members sharing a household.

- `01-auth.test.ts` — signup, verification, login, MFA enrollment/challenge/disable, sessions,
  password reset.
- `02-household.test.ts` — create/update, invite/accept/revoke, membership, the 2-member cap.
- `03-accounts.test.ts` — personal vs. shared accounts, visibility, co-owner, summaries, and the
  partner-cannot-see-owner's-personal-account privacy check.
- `04-cycles-bills-rules.test.ts` — cycle lifecycle, income, transfers, category caps, fixed
  bills, recurring rules.
- `05-payments-export.test.ts` — shared payment CRUD, category summary, CSV export.
- `06-privacy-rls.test.ts` — cross-**household** isolation: two unrelated households, asserting
  one cannot read or mutate the other's accounts/cycles/bills/rules/payments by id even when the
  id is known. This is the non-negotiable one — every new id-addressed RPC should get a case here.

## Adding coverage for a new feature

When a backend feature/RPC group ships, add or extend a flow file in the same turn: the happy
path, its realistic error cases, and — if the new RPC is addressed by id — a case in
`06-privacy-rls.test.ts` proving a user outside the household gets a "not found" error rather
than another household's data. Run `pnpm test:e2e:backend` against the deployed test environment
once the feature's own unit tests and `pnpm verify` are green.
