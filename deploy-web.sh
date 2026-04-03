#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/web"

npm run build

BUCKET=$(cd ../iac/environments/prod && terraform output -raw static_site_bucket_name)
DISTRIBUTION_ID=$(cd ../iac/environments/prod && terraform output -raw static_site_distribution_id)

aws s3 sync dist/ "s3://${BUCKET}" --delete
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*"
