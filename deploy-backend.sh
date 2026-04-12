#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-}"
if [[ -z "$ENV" || ! "$ENV" =~ ^(test|prod)$ ]]; then
  echo "Usage: $0 <test|prod>"
  exit 1
fi

VAULT_PROFILE="noskomgmt"
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "${REPO_ROOT}/backend"

echo "==> Generating OpenAPI spec..."
npm run generate:openapi

echo "==> Building backend handlers for ${ENV}..."
node build.mjs "$ENV"

echo "==> Applying Terraform for ${ENV}..."
cd "${REPO_ROOT}/iac/environments/${ENV}"
aws-vault exec "$VAULT_PROFILE" -- terraform apply

echo "==> Backend deployed to ${ENV}."
