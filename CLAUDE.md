# Suomi

Suomi is a financial management app designed for couples.

Users can connect multiple bank accounts from different countries and currencies, upload their bank data, and plan their finances together or individually by month. The app provides a consolidated view comparing planned vs actual spending, shared couple planning, and per-person budgeting.

## Core Features

- Multiple bank accounts across multiple countries and currencies
- Shared accounts between partners (couple mode)
- Monthly financial planning — couple and individual
- Bank data upload per account
- Consolidated dashboard comparing planned vs actual (food, rent, etc.)

## Repository Structure

```
suomi/
├── backend/    # TypeScript REST API — Clean Architecture, Node.js, AWS Lambda
├── iac/        # Infrastructure as Code — cloud resources, deployment configuration
├── web/        # Web frontend
└── mobile/     # Kotlin Multiplatform — Android and web mobile app
```

### `backend/`
TypeScript backend running on AWS Lambda with PostgreSQL (Neon). Follows Clean Architecture with strict layer separation. See `backend/CONVENTIONS.md` for all architecture rules, coding standards, and patterns to follow when generating backend code.

### `iac/`
Terraform infrastructure using cloud-agnostic module patterns. Modules are named by capability (`compute`, `api-routing`, `secrets`), not by AWS service names, with provider-specific implementations nested inside (e.g., `modules/compute/aws-lambda/`). Environment roots in `environments/{env}/` wire modules together. See `iac/CONVENTIONS.md` for module design rules and patterns. Shared infra (domain, ACM cert) lives in a separate [terraform repo](https://github.com/MarceloSavian/terraform).

### `web/`
Web frontend application.

### `mobile/`
Kotlin Multiplatform project targeting Android and web. Shares business logic across platforms.
