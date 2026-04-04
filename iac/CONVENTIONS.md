# Nosko IaC — Conventions

This document defines the patterns and rules for all infrastructure code in this project.

---

## AWS Organizations — Multi-Account Setup

Infrastructure runs across three AWS accounts managed by AWS Organizations:

| Account | Purpose | Domain |
|---------|---------|--------|
| **Management** | Organizations, Route53 zone, state bucket | — |
| **Prod** | Production workloads | `nosko.app`, `api.nosko.app` |
| **Test** | Test workloads | `test.nosko.app`, `test.api.nosko.app` |

### Cross-Account Provider Pattern

Terraform authenticates as the management account IAM user. Environment roots use `assume_role` to deploy into child accounts, and an `aws.mgmt` provider (no assume_role) for DNS records in the management account's Route53 zone.

```hcl
provider "aws" {
  region = var.aws_region
  assume_role {
    role_arn = "arn:aws:iam::${var.account_id}:role/OrganizationAccountAccessRole"
  }
}

provider "aws" {
  alias  = "mgmt"
  region = var.aws_region
}
```

DNS records and ACM validation records use `provider = aws.mgmt`. All other resources use the default provider (child account).

---

## Architecture: Cloud-Agnostic Modules

Modules are named by **capability**, not by cloud service. Each capability has provider-specific implementations nested inside.

```
iac/
├── modules/
│   ├── compute/
│   │   └── aws-lambda/
│   ├── api-routing/
│   │   └── aws-apigw-v2/
│   ├── secrets/
│   │   └── aws-ssm/
│   └── static-site/
│       └── aws-s3-cloudfront/
└── environments/
    ├── mgmt/                  # Management account (org, DNS)
    ├── prod/                  # Production workloads
    └── test/                  # Test workloads
```

### Adding a New Provider Implementation

To swap providers (e.g., Lambda → ECS), add a new folder under the same capability with the **same interface** (variables and outputs):

```
modules/compute/
├── aws-lambda/       # existing
└── aws-ecs/          # new — same variables.tf and outputs.tf interface
```

Then change one `source` line in the environment root.

---

## Module Design Rules

1. **No provider blocks in modules** — modules inherit the provider from the calling environment root
2. **No Route53 records in modules** — DNS records are created in the environment root using `aws.mgmt` provider (cross-account)
3. **Stable interface** — all implementations of a capability must expose the same variables and outputs
4. **Use `for_each` over maps** — prefer a single module call with a map over multiple identical module blocks
5. **No hardcoded values** — pass project name, environment, and configuration through variables

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Capability modules | kebab-case | `api-routing`, `compute` |
| Provider folders | `{cloud}-{service}` | `aws-lambda`, `aws-apigw-v2` |
| Environment files | by concern | `compute.tf`, `api-routing.tf`, `secrets.tf` |
| Resource names | `${var.project}-${var.environment}-{name}` | `nosko-prod-customer-v1` |
| SSM parameters | `/${project}/${environment}/${key}` | `/nosko/prod/DATABASE_URL` |

---

## Environment Structure

Each environment is a standalone Terraform root:

```
environments/{env}/
├── main.tf          # provider + backend config (cross-account assume_role)
├── variables.tf     # all input variables
├── data.tf          # Route53 zone data, ACM certs, DNS records
├── secrets.tf       # secrets module wiring
├── compute.tf       # compute module wiring + handler definitions
├── api-routing.tf   # API routing module wiring + route map
├── static-site.tf   # static site module wiring (S3 + CloudFront)
└── monitoring.tf    # SNS alarms
```

The management environment (`mgmt/`) has a simpler structure: organization, DNS zone, and outputs.

### Secrets

- Secrets are stored in **SSM Parameter Store** (SecureString) in each child account
- Actual values go in `terraform.tfvars` (gitignored, never committed)
- Secrets are passed as Lambda environment variables at deploy time

### Shared Infrastructure

The Route53 hosted zone for `nosko.app` lives in the **management account** (`environments/mgmt/`). Child environments reference it via `data` sources using the `aws.mgmt` provider:

```hcl
data "aws_route53_zone" "main" {
  provider = aws.mgmt
  name     = "nosko.app"
}
```

---

## Build & Deploy

### Deployment Order

1. `terraform apply` in `environments/mgmt/` (creates org, accounts, DNS zone)
2. `terraform apply` in `environments/test/` or `environments/prod/`

### Lambda Artifacts

- Built by `backend/build.mjs` using esbuild
- Output: one zip per handler in `iac/environments/{env}/artifacts/`
- Artifacts are **gitignored** — built before every `terraform apply`

### Deploy Steps

```bash
cd backend && npm run generate:openapi && npm run build
cd iac/environments/{env} && terraform apply
```

### Web App Deployment

```bash
cd web && npm run build
aws s3 sync dist/ s3://nosko-{env}-static-site --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

### Migrations

Database migrations run via a dedicated `migration-v1` Lambda, not on cold start. Trigger with:

```bash
aws lambda invoke --function-name nosko-{env}-migration-v1 --no-cli-pager /dev/stdout
```

---

## Terraform State

State is stored in S3 in the **management account**:

- Bucket: `nosko-terraform-state` (us-east-1)
- Lock table: `nosko-terraform-locks` (DynamoDB)
- State keys: `nosko/{env}/terraform.tfstate`

---

## Rules Summary

1. Name modules by capability, not by cloud service
2. No provider blocks inside modules
3. No Route53 records inside modules — DNS is managed cross-account in environment roots
4. Keep the same interface (variables/outputs) across provider implementations
5. Never commit secrets or `.tfvars` files
6. Build artifacts before applying — Terraform only uploads, it doesn't build
7. One Lambda per API handler — keeps deployments independent
8. Migrations run via Lambda, never automatically
