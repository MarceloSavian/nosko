#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/backend"

npm run generate:openapi
npm run build

cd ../iac/environments/prod
terraform apply
