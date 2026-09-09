# IaC Conventions (agreements)

Durable Terraform rules for nosko. Uses the nosko module patterns and the nosko AWS org.

## AWS account & state

- Terraform deploys **directly into the nosko-test account** via `aws-vault exec nosko-test`
  (which already assumes `OrganizationAccountAccessRole`) — **no provider-level assume_role**.
- A `us_east_1` aliased provider exists for CloudFront ACM when a custom domain is added.
- State: `nosko-tfstate-<account-id>` S3 bucket in that account, key
  `nosko/{env}/terraform.tfstate`, **S3-native locking** (`use_lockfile`), no DynamoDB.
  Bootstrap the bucket once with `scripts/bootstrap-state.sh`.
- The `nosko.app` custom domain needs management-account creds for the Route53 zone — added later.
- **Personal org only** — never the PostNL work accounts.

## Modules

- Named by **capability**, not cloud service (`compute`, `api-routing`, `secrets`,
  `static-site`, `storage`); provider implementation nested as `{cloud}-{service}`
  (`aws-lambda`, `aws-apigw-v2`, …). To swap a provider, add a sibling folder with the **same
  variables/outputs interface** and change one `source` line.
- **No provider blocks in modules** — they inherit from the environment root.
- **No hardcoded values** — pass `project`, `environment`, and config via variables.
- Resource names: `${project}-${environment}-{name}`. SSM keys: `/${project}/${environment}/KEY`.

## Environments

- Each `environments/{env}/` is a standalone root, split by concern (`compute.tf`,
  `api-routing.tf`, `secrets.tf`, `static-site.tf`, `storage.tf`, `outputs.tf`).
- Single account: the default `aws` provider targets `var.aws_region` (eu-west-1); a
  `us_east_1` alias exists only for CloudFront ACM when a custom domain is used.
- `default_tags` stamps every resource with Project/Environment/ManagedBy.

## Secrets & security

- Secrets live in **SSM SecureString**; real values go in `terraform.tfvars` (**gitignored,
  never committed**) and are surfaced to Lambda via env + `ssm:GetParameter` (least privilege).
- Never commit `*.tfvars` or state. Commit `.terraform.lock.hcl`.
- **Two Postgres connections, never conflated:** `database_url` (admin/owner, `migration-v1`
  only) and `app_database_url` (`app_role`, `bff-v1` only). Neon's console/CLI-created role
  inherits `neon_superuser`, which carries **BYPASSRLS** — RLS is silently skipped for it
  regardless of `FORCE ROW LEVEL SECURITY`. `app_role` is created by SQL inside the migrations
  (not via Neon's console/CLI), which is the only way to get a role outside `neon_superuser`, and
  is granted table-level privileges only. If a new secret ever looks like "the database
  connection", check which of the two it actually is before wiring it to a Lambda.

## Build & deploy

- Terraform **only uploads** Lambda artifacts (`artifacts/*.zip`); it never builds them. Build
  from `backend/` before `apply`.
- Migrations run via the `migration-v1` Lambda (invoked explicitly), never on cold start.
- Review `terraform plan` before every `apply`. Deploys are gated on Marcelo's explicit go-ahead.

## Verification

- `terraform fmt -recursive -check` and `terraform init -backend=false && terraform validate`
  run in CI and locally; no state or credentials required to validate.
