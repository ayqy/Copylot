#!/usr/bin/env bash
set -euo pipefail

npm run lint
npm run type-check
npm run check-i18n

node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts

npm run build:prod

bash scripts/verify-prod-build.sh
