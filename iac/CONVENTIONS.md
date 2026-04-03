# Suomi IaC — Conventions

This document defines the patterns and rules for all infrastructure code in this project.

---

## Architecture: Cloud-Agnostic Modules

Modules are named by **capability**, not by cloud service. Each capability has provider-specific implementations nested inside.

```
iac/
├── modules/
│   ├── compute/
│   │   └── aws-lambda/        # Current implementation
│   ├── api-routing/
│   │   └── aws-apigw-v2/
│   └── secrets/
│       └── aws-ssm/
└── environments/
    └── prod/                  # Wires modules together
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
2. **Stable interface** — all implementations of a capability must expose the same variables and outputs
3. **Use `for_each` over maps** — prefer a single module call with a map over multiple identical module blocks
4. **No hardcoded values** — pass project name, environment, and configuration through variables

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Capability modules | kebab-case | `api-routing`, `compute` |
| Provider folders | `{cloud}-{service}` | `aws-lambda`, `aws-apigw-v2` |
| Environment files | by concern | `compute.tf`, `api-routing.tf`, `secrets.tf` |
| Resource names | `${var.project}-${var.environment}-{name}` | `suomi-prod-customer-v1` |
| SSM parameters | `/${project}/${environment}/${key}` | `/suomi/prod/DATABASE_URL` |

---

## Environment Structure

Each environment (e.g., `prod`) is a standalone Terraform root:

```
environments/prod/
├── main.tf          # provider + backend config
├── variables.tf     # all input variables
├── data.tf          # data sources for existing resources
├── secrets.tf       # secrets module wiring
├── compute.tf       # compute module wiring + handler definitions
└── api-routing.tf   # API routing module wiring + route map
```

### Secrets

- Secrets are stored in **SSM Parameter Store** (SecureString)
- Actual values go in `terraform.tfvars` (gitignored, never committed)
- Secrets are passed as Lambda environment variables at deploy time

### Shared Infrastructure

Resources shared across projects (Route53 zone, ACM certs for root domain, Resend DNS) live in a **separate terraform repo**, not here. Use `data` sources to reference them:

```hcl
data "aws_route53_zone" "main" { zone_id = "Z06808202W4XW561C8KYB" }
```

---

## Build & Deploy

### Lambda Artifacts

- Built by `backend/build.mjs` using esbuild
- Output: one zip per handler in `iac/environments/prod/artifacts/`
- Artifacts are **gitignored** — built before every `terraform apply`

### Deploy Steps

```bash
cd backend && npm run generate:openapi && npm run build   # generate spec + bundle handlers
cd iac/environments/prod && terraform apply               # deploy
```

### Migrations

Database migrations run via a dedicated `migration-v1` Lambda, not on cold start. Trigger with:

```bash
aws lambda invoke --function-name suomi-prod-migration-v1 --no-cli-pager /dev/stdout
```

---

## Rules Summary

1. Name modules by capability, not by cloud service
2. No provider blocks inside modules
3. Keep the same interface (variables/outputs) across provider implementations
4. Never commit secrets or `.tfvars` files
5. Use data sources to reference shared infrastructure from the separate terraform repo
6. Build artifacts before applying — Terraform only uploads, it doesn't build
7. One Lambda per API handler — keeps deployments independent
8. Migrations run via Lambda, never automatically
