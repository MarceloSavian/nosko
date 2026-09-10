# @nosko/e2e-web

Browser end-to-end tests for `@nosko/web`, using **Playwright** — a real browser engine, not
jsdom. That matters: several real bugs in U8 (a missing CORS `allow-credentials` header, API
Gateway not answering `OPTIONS` preflights for the strict `HttpApi` routes, `SameSite=Strict`
session cookies never being sent from `localhost` to the deployed API) are all things only a real
browser enforces. `@testing-library/react` + jsdom cannot catch any of them — this suite is the
regression guard specifically for that class of bug.

## Running

Copy `e2e/web/.env.example` to `e2e/web/.env` and fill in `DATABASE_URL` (same Neon admin/owner
connection as `e2e/backend/.env` — see that package's README for why), then:

```bash
pnpm test:e2e:web
```

The Playwright config starts `web`'s own Vite dev server on a dedicated port (4173) with
`webServer`, reusing one already running locally. Requests go through Vite's dev-server proxy
(`web/vite.config.ts`) to the real deployed API (`https://test.api.nosko.app`) — the same setup
a developer's `pnpm dev` uses, so this exercises the real local-dev path end to end, cookies and
all, not an approximation of it.

## Cleanup

Each spec file creates its own users/households in a `beforeAll`/inline setup and deletes them in
`afterAll` via `src/helpers/cleanup.ts` — only what that run created. `households(id)`/
`users(id) ON DELETE CASCADE` cover the rest. Every test email is
`e2e-web+<label>-<uuid>@nosko.test`, so a leftover row from a crashed run is still identifiable
and safe to delete manually.

## How it recovers codes

Same technique as `e2e/backend`: verification/invitation/reset codes are unsalted SHA-256 of a
6-digit number, so `src/helpers/codes.ts` reads the stored hash directly from Postgres (the same
admin connection used for cleanup) and brute-forces the 1,000,000-candidate space locally — no
debug endpoint on the deployed backend, nothing to secure.

`src/helpers/*` is intentionally duplicated from `e2e/backend/src/*` rather than shared — it's a
small, stable amount of code, and extracting a shared package is the natural move once a third
consumer (`e2e/app`) needs the same thing, not before.

## Structure

- `tests/01-auth.spec.ts` — landing page, signup (+ duplicate-email rejection, password-match
  validation), email verification (+ wrong-code rejection, resend), login (+ unverified-email and
  wrong-password rejection), forgot/reset password.
- `tests/02-onboarding.spec.ts` — create household, invite partner, add a personal and a shared
  account through the real account form (institution/type/currency/visibility), skip options.
- `tests/03-accept-invitation.spec.ts` — two independent browser contexts: an owner invites a
  partner, the partner accepts (+ wrong-code rejection) in their own session.
- `tests/04-shell-and-guards.spec.ts` — every auth guard (unauthenticated → `/entrar`,
  authenticated → away from the public pages, no-household → onboarding), the Casa/Pessoal space
  switcher, nav links, logout.

`src/helpers/uiFlows.ts`'s `signUpVerifyAndLand` is the one flow nearly every spec needs (a fresh,
logged-in user with no household yet) — reuse it rather than re-deriving it inline. Note that
verifying an email does **not** create a session (only `login`/`mfaVerify`/`refresh` write
cookies), so the real flow is signup → verify → **log in** → land in onboarding, not signup →
verify → onboarding directly; this was itself a real bug the suite caught on its first run.

## Adding coverage for a new feature

Same convention as `e2e/backend`: when a new screen or flow ships in `web/`, add or extend a spec
in the same turn — the happy path and its realistic error states, driven through the real UI, not
a shortcut around it. Reach for a direct API call (see `data/usecases/*` usage patterns, or just
`fetch` against the deployed RPC endpoint) only to set up a *supporting* actor whose own UI isn't
what that spec is testing.
