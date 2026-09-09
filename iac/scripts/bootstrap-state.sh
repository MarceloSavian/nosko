#!/usr/bin/env bash
# One-time: create the Terraform state bucket in the nosko-test account.
# Run from the repo root with the deploy profile:
#   aws-vault exec nosko-test -- iac/scripts/bootstrap-state.sh
set -euo pipefail

BUCKET="nosko-tfstate-936834757679"
REGION="eu-west-1"

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "Bucket $BUCKET already exists."
else
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
  echo "Created $BUCKET."
fi

aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

echo "State bucket $BUCKET is ready in $REGION."
