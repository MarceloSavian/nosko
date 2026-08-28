# Requirements Questions — finance-app

Answer each question by filling the letter after `[Answer]:`. Pick "Other" (last option) and
write free text if none fit. Each option lists a recommendation where I have one; you can often
just accept the recommended (first) option. Add notes after the letter if useful.

When done, tell me "done" and I'll write the full requirements, the database design, the
architecture/design docs, the units of work, and the implementation plan.

---

## Question 1 — Task size / lifecycle depth
This is a new full application (backend + DB + auth + hosting + frontend). I'm treating it as
**Large** (full inception: requirements → architecture/design → units of work → plan → approval
→ implement).

A) Large — full lifecycle with design + units of work (Recommended)

B) Medium — lighter: requirements + one plan, then implement

C) Other (describe after [Answer]:)

[Answer]: A

## Question 2 — Project name
`finance-app` is a placeholder folder name. What should the app / repo be called? (I'll rename
the folder and repo to match.)

A) Keep `finance-app`

B) Reuse a name you like — write it after [Answer]: (e.g. a fresh brand)

C) Other (describe after [Answer]:)

[Answer]: A

## Question 3 — v1 scope / phasing
money-evaluation has: (1) couple budgeting cycles, (2) fixed-bill tracking, (3) evaluations
(spend/subscription analysis), (4) savings + projection engine, (5) the WhatsApp resumo. You
said you want *all* of it. How should we sequence delivery?

A) Phased: ship the **core cycle/budget loop + fixed bills** first (usable end-to-end), then add
evaluations, then savings/projections, then resumo. All features still planned up front.
(Recommended — this is the lesson from why nosko stalled)

B) All at once: build the full feature set before first deploy

C) Other (describe after [Answer]:)

[Answer]: A

## Question 4 — Transaction / statement ingestion (most important)
Today you manually edit `source.json` from bank CSVs/PDFs. How should the new app get data in?

A) **File upload + per-bank parsers**: upload ING/Revolut/Amex/Nubank/C6 exports (CSV/PDF), the
app parses, dedupes, and lets you confirm/categorise before saving. Manual add/edit always
available. No third-party costs. (Recommended — matches how you actually work)

B) **Manual entry only**: forms to add cycles, bills, gastos, savings events. Simplest to build;
you type everything (like editing source.json, but with a UI).

C) **Automated bank aggregation** (open-banking API like GoCardless/Tink/Plaid) for the EU
accounts, manual/upload for BR. Most automated, but costs money, adds compliance/complexity, and
coverage for Amex/Revolut/Brazil is uneven.

D) Hybrid: manual entry now, file-upload parsers added in a later phase

E) Other (describe after [Answer]:)

[Answer]: A

## Question 5 — Authentication (2 users, one household)
A) **AWS Cognito user pool** (2 users), integrated with API Gateway authorizer. AWS-native, low
maintenance, secure. (Recommended)

B) Custom email + password + MFA (like your `mmas` project) — more code you own, more to secure

C) Passwordless magic-link / email OTP

D) Other (describe after [Answer]:)

[Answer]: B, I think nosko already has this we can reuse it. I know it will be only us 2 for now but we should go trough all the signup fase and threat use as normal users where we have to also link our accounts

## Question 6 — Database
The data is relational (cycles → bills, gastos; savings events; evaluations). You emphasised
"held in my AWS".

A) **PostgreSQL on Neon** (serverless, generous free tier) — best fit for this relational model
and matches nosko. External to AWS but effectively free. (Recommended for pragmatism)

B) **Aurora Serverless v2 (PostgreSQL)** — same relational fit, fully inside your AWS, but has a
real monthly cost even at low usage

C) **DynamoDB** — fully in-AWS, serverless, near-zero cost at this scale, but the cycle
aggregations/relational queries are more awkward to model

D) Other (describe after [Answer]:)

[Answer]: A

## Question 7 — Hosting / Infrastructure-as-Code stack
Both your prior projects show two viable paths.

A) **SST v3** (like `mmas`) — fastest to build and deploy a serverless app (Lambda + API GW +
S3/CloudFront + secrets) with minimal IaC boilerplate. (Recommended for a 2-user app)

B) **Terraform modular IaC** (like `nosko`) — reuse your cloud-agnostic capability modules
(compute/api-routing/secrets/static-site) and your shared domain/ACM repo. More portable, more
setup.

C) Other (describe after [Answer]:)

[Answer]: B

## Question 8 — Frontend
A) **Carry the money-evaluation React dashboard forward** (React 19 + Vite + Tailwind + Zod,
same Clean Architecture), rebuilt to read the live API instead of a static dataset. Web only for
v1. (Recommended)

B) Same, **plus a mobile app** (Kotlin Multiplatform, like nosko) in a later phase

C) Rebuild the frontend from scratch with a different stack

D) Other (describe after [Answer]:)

[Answer]: I will like a mobile app in the future but now I specially want to use the library effect and all it's capabilities with very good error handling. With no try catches following the library standards. We should use the library at it's best

## Question 9 — Import existing history
Import your current `source.json` (5 cycles + savings + evaluations) as seed data into the new
database on first deploy?

A) Yes — write a one-time importer so the app opens with your real history (Recommended)

B) No — start empty and re-enter/ingest going forward

C) Other (describe after [Answer]:)

[Answer]: B

## Question 10 — Brazil (BRL) side in v1
The BR side (Nubank/C6 accounts, CDB investments, BR streaming) is real but secondary and never
enters the EUR household cycle.

A) Include BR **savings/investments only** (C6 CDB + brokerage) in v1; treat BR accounts/cards as
later. Keep multi-currency in the model from day one. (Recommended)

B) Full BR support in v1 (accounts, cards, CDB)

C) EUR-only for v1; add all BR later (but keep currency field in the schema)

D) Other (describe after [Answer]:)

[Answer]: B
