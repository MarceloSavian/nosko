#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-}"
if [[ -z "$ENV" || ! "$ENV" =~ ^(test|prod)$ ]]; then
  echo "Usage: $0 <test|prod>"
  exit 1
fi

VAULT_PROFILE="noskomgmt"
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "${REPO_ROOT}/web-admin"

echo "==> Building web-admin frontend..."
npm run build

echo "==> Fetching S3 bucket and CloudFront distribution from Terraform..."
BUCKET=$(aws-vault exec "$VAULT_PROFILE" -- terraform -chdir="${REPO_ROOT}/iac/environments/${ENV}" output -raw admin_site_bucket_name)
DISTRIBUTION_ID=$(aws-vault exec "$VAULT_PROFILE" -- terraform -chdir="${REPO_ROOT}/iac/environments/${ENV}" output -raw admin_site_distribution_id)

echo "==> Syncing dist/ to s3://${BUCKET}..."
aws-vault exec "$VAULT_PROFILE" -- aws s3 sync dist/ "s3://${BUCKET}" --delete

echo "==> Invalidating CloudFront cache..."
aws-vault exec "$VAULT_PROFILE" -- aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*" --no-cli-pager

echo "==> Web admin deployed to ${ENV}."
