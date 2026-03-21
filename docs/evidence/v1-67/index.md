# V1-67 CWS Listing ASO diff 证据包（可审计/可复核/可复用）

- 证据目录：`docs/evidence/v1-67/`
- 生成脚本：`scripts/build-cws-listing-diff-evidence-pack.ts`
- packVersion：`v1-67`
- exportedAt：`2026-03-21T00:00:00.000Z`
- extensionVersion：`1.1.28`
- baseline pack：`docs/evidence/v1-66/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`40b9656a08bc351b527b0f9bb469cf3c619157907d52cccdc988a5ebe1905e93`
- current pack：`docs/evidence/v1-67/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`40b9656a08bc351b527b0f9bb469cf3c619157907d52cccdc988a5ebe1905e93`
- diff pack：`cws-listing-diff-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`b3268e609f6e7b1542ab55f27305e4fc756fe0d74fe52ac664a7d4d6c54a9e01`

## 关键变更摘要（baseline -> current）

- keywords.enAdded：(none)
- keywords.enRemoved：(none)
- keywords.zhAdded：(none)
- keywords.zhRemoved：(none)
- descriptions.enSha256：`892f93ec37c5ee9ecd5c7d704be9cd99f38f2d16a7c9e72fb7610fc36e29355a` -> `892f93ec37c5ee9ecd5c7d704be9cd99f38f2d16a7c9e72fb7610fc36e29355a`
- descriptions.zhSha256：`33107aaf3f68c6505c6d69e9fa94b16656f15d6e65ff93130dca641cf533db1c` -> `33107aaf3f68c6505c6d69e9fa94b16656f15d6e65ff93130dca641cf533db1c`
- screenshotPlan.changedIds：(none)
- assertions.changedKeys：(none)

## 红线断言结果（门禁）

- hasProWaitlistCta: PASS
- hasPrivacyClaims: PASS
- noOverclaimKeywords: PASS
- redlines: []

## 使用说明

- 生成（写入 `docs/evidence/v1-67/`）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts`
- 门禁/可重复性（固定 exportedAt，便于 diff）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --stable-exported-at`
- 指定 baseline pack（可选）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --baseline-pack docs/evidence/v1-66/cws-listing-evidence-pack-<extensionVersion>-<utcCompact>.json`
- 复核 sha256（示例）：`shasum -a 256 docs/evidence/v1-67/*.json`
- 敏感信息搜索（示例）：`rg -n "CWS_|TOKEN|SECRET" docs/evidence/v1-67`

---

输出文件：
- `docs/evidence/v1-67/index.md`
- `docs/evidence/v1-67/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
- `docs/evidence/v1-67/cws-listing-diff-evidence-pack-1.1.28-2026-03-21-000000.json`

