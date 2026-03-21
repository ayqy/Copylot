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

node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-evidence-pack.ts --stable-exported-at
listing_pack_file=$(node --input-type=module -e "import fs from 'node:fs'; const md=fs.readFileSync('docs/evidence/v1-66/index.md','utf-8'); const m=md.match(/cws-listing-evidence-pack-[0-9A-Za-z._-]+\\.json/); if (!m) process.exit(2); console.log(m[0]);")
if [[ -z "${listing_pack_file}" ]]; then
  echo "Failed to resolve v1-66 listing evidence pack filename from docs/evidence/v1-66/index.md"
  exit 1
fi
before_listing_hash=$(shasum -a 256 docs/evidence/v1-66/index.md "docs/evidence/v1-66/${listing_pack_file}")
node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-evidence-pack.ts --stable-exported-at
after_listing_hash=$(shasum -a 256 docs/evidence/v1-66/index.md "docs/evidence/v1-66/${listing_pack_file}")
if [[ "$before_listing_hash" != "$after_listing_hash" ]]; then
  echo "CWS listing evidence pack outputs should be deterministic"
  exit 1
fi

node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --stable-exported-at
diff_pack_file=$(node --input-type=module -e "import fs from 'node:fs'; const md=fs.readFileSync('docs/evidence/v1-67/index.md','utf-8'); const m=md.match(/cws-listing-diff-evidence-pack-[0-9A-Za-z._-]+\\.json/); if (!m) process.exit(2); console.log(m[0]);")
if [[ -z "${diff_pack_file}" ]]; then
  echo "Failed to resolve v1-67 listing diff evidence pack filename from docs/evidence/v1-67/index.md"
  exit 1
fi
before_diff_hash=$(shasum -a 256 docs/evidence/v1-67/index.md "docs/evidence/v1-67/${diff_pack_file}")
node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --stable-exported-at
after_diff_hash=$(shasum -a 256 docs/evidence/v1-67/index.md "docs/evidence/v1-67/${diff_pack_file}")
if [[ "$before_diff_hash" != "$after_diff_hash" ]]; then
  echo "CWS listing diff evidence pack outputs should be deterministic"
  exit 1
fi

bash scripts/verify-prod-build.sh
