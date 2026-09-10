#!/usr/bin/env bash
# Builds throwaway placeholder Lambda zips so the infra can be applied before the real backend
# bundles exist. bff-v1 has a real build (`pnpm --filter @nosko/backend build`, U4); migration-v1
# and fx-rates-v1 don't yet — this script covers all three so a first `terraform apply` never
# fails on a missing artifact.
# Run from anywhere: iac/scripts/build-placeholder-artifacts.sh
set -euo pipefail

IAC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$IAC_DIR/scripts/placeholder-handler.mjs"
OUT="$IAC_DIR/environments/test/artifacts"
mkdir -p "$OUT"

for fn in bff-v1 migration-v1 fx-rates-v1; do
  tmp="$(mktemp -d)"
  cp "$SRC" "$tmp/index.mjs"
  (cd "$tmp" && zip -q "$OUT/$fn.zip" index.mjs)
  rm -rf "$tmp"
  echo "built $OUT/$fn.zip"
done
