#!/usr/bin/env bash
set -euo pipefail

npm run lint
npm run type-check
npm run check-i18n

node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts

node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-weekly-channel-ops-trend.ts docs/evidence/v1-65
before_trend_hash=$(shasum -a 256 docs/evidence/v1-65/index.md docs/evidence/v1-65/trend.csv)
node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-weekly-channel-ops-trend.ts docs/evidence/v1-65
after_trend_hash=$(shasum -a 256 docs/evidence/v1-65/index.md docs/evidence/v1-65/trend.csv)
if [[ "$before_trend_hash" != "$after_trend_hash" ]]; then
  echo "Weekly channel ops trend outputs should be deterministic"
  exit 1
fi

node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/verify-weekly-channel-ops-evidence-pack.ts docs/evidence/v1-64
node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/verify-weekly-channel-ops-evidence-pack.ts docs/evidence/v1-65

npm run build:prod

bash scripts/verify-prod-build.sh
