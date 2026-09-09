# iac — Terraform infrastructure

Serverless AWS baseline for nosko, region **eu-west-1**. Capability modules (reused from
the nosko pattern) wired per environment.

## AWS account (nosko-test)

Terraform deploys **directly into the nosko-test account** (`936834757679`) — `aws-vault exec
nosko-test` already assumes `OrganizationAccountAccessRole`, so there is **no provider-level
assume_role**. Remote state lives in the `nosko-tfstate-936834757679` S3 bucket **in that
account** (create once via `scripts/bootstrap-state.sh`), with S3-native locking. This is a
**personal** org — never the PostNL work accounts.

The `nosko.app` custom domain is a later addition: that Route53 zone is in the **management**
account, so attaching it needs management-account credentials for the DNS + ACM-validation
records. The baseline runs on the default CloudFront / API Gateway URLs.

## Layout

```
modules/
  compute/aws-lambda/        Lambda functions + IAM (logs, SSM read, extra policy)
  api-routing/aws-apigw-v2/  HTTP API + routes + integrations (+ optional custom domain)
  secrets/aws-ssm/           SSM SecureString parameters
  static-site/aws-s3-cloudfront/  S3 + CloudFront for the SPA (domain optional)
  storage/aws-s3-private/    private bucket (bank-statement uploads)
environments/
  test/                      the test environment root
```

## What `test` provisions

- One **BFF Lambda** (`bff-v1`, `nodejs22.x`) behind an **HTTP API** ($default route → BFF; the
  Effect app routes `/api/rpc` and `/api/http/*` internally).
- A **migration** Lambda (`migration-v1`), invoked directly (not via the API). It runs DDL as the
  Neon admin/owner role and provisions `app_role` (see below).
- **SSM** SecureString secrets (`DATABASE_URL`, `APP_DATABASE_URL`, `APP_DB_PASSWORD`,
  `JWT_SECRET`); the actual values reach each Lambda as plain environment variables set by
  Terraform, matching the source variables below.
- A private **uploads** S3 bucket; the BFF role can read/write it and send email via SES.
- **S3 + CloudFront** static site for the SPA (default CloudFront domain unless `web_domain` set).
- Neon Postgres is external, with **two connections**:
  - `database_url` (admin/owner) — used only by `migration-v1` to run DDL and to set `app_role`'s
    password. Neon's console/CLI-created role inherits `neon_superuser`, which has **BYPASSRLS**.
  - `app_database_url` (app_role) — used by `bff-v1` for every runtime query. `app_role` is
    created by SQL in the migrations (`NOSUPERUSER NOBYPASSRLS`, table-level grants only), so
    Row-Level Security actually applies to it. **The BFF must never use `database_url`.**

Custom domains are **off by default** (default endpoints). Set `web_domain`/`api_domain` (+ a
us-east-1 ACM cert for CloudFront) to attach them later.

## Cost controls (strict)

Designed so a compromised app can't run up a bill:
- **API Gateway throttling** — `throttling_rate_limit` (default 5 req/s) + `throttling_burst_limit`
  (default 10). Bounds the request rate hard.
- **Account concurrency limit** — the nosko-test account caps total concurrent Lambdas at **10**
  (AWS default), a natural parallelism ceiling across everything. `bff_reserved_concurrency`
  (default -1 = unreserved) can reserve a per-function slice once that account limit is raised.
- **AWS Budget** — set `budget_email` to get emailed at 50% (forecast) / 80% / 100% of
  `monthly_budget_usd` (default $5). Budgets are free and are the fast anomaly alarm.

Tune all of these in `terraform.tfvars`. Note: these bound worst-case abuse to a few dollars/month
and alert you within hours — a true hard $0 auto-cutoff would need a budget *action* (auto-disable)
or a request quota, which we can add if you want it.

## Usage

```bash
cd environments/test
cp terraform.tfvars.example terraform.tfvars   # fill in secrets (gitignored)

# validate without touching a backend/state (no creds needed)
terraform init -backend=false && terraform validate
```

First deploy needs two passes because `app_role`'s password only exists after the migration runs:
1. Set `database_url` + `app_db_password` (a fresh random value) in `terraform.tfvars`; set
   `app_database_url` to the same host/db with `app_role` and that same password. `apply`, then
   invoke `migration-v1` once (creates `app_role` and sets its password to `app_db_password`).
2. From then on, `app_database_url` is correct and `bff-v1` can query normally. The migrator
   tracks migrations by id and never reruns one, so rotating the password later means changing
   `app_db_password`, adding a new migration file that repeats the `ALTER ROLE app_role WITH
   PASSWORD` step from `0002_app_role.ts` under a fresh id, running `migration-v1`, and updating
   `app_database_url` to match before the next `apply`.

Real commands use the aws-vault `nosko-test` profile (run the bootstrap once, from the repo root):

```bash
aws-vault exec nosko-test -- iac/scripts/bootstrap-state.sh        # one-time: create state bucket
cd iac/environments/test
aws-vault exec nosko-test -- terraform init
aws-vault exec nosko-test -- terraform plan     # needs terraform.tfvars + built artifacts
aws-vault exec nosko-test -- terraform apply
```

Lambda artifacts (`artifacts/*.zip`) are built from `backend/` at U4 (not committed). Terraform
only uploads them; it does not build.

## State

Remote state in the `nosko-tfstate-936834757679` S3 bucket in the nosko-test account
(key `nosko/test/terraform.tfstate`, eu-west-1, **S3-native locking** — no DynamoDB).
Create the bucket once with `scripts/bootstrap-state.sh`, then `terraform init`. Validation still
uses `terraform init -backend=false` (no state/creds).
