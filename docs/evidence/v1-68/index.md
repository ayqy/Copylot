# V1-68 CWS Listing ASO diff 证据包（可审计/可复核/可复用）

- 证据目录：`docs/evidence/v1-68/`
- 生成脚本：`scripts/build-cws-listing-diff-evidence-pack.ts`
- packVersion：`v1-67`
- exportedAt：`2026-03-21T00:00:00.000Z`
- extensionVersion：`1.1.28`
- baseline pack：`docs/evidence/v1-66/cws-listing-evidence-pack-1.1.28-2026-03-21-041147.json`
  - sha256：`14fa914dea405f79682ed0493888239137a0c2c157cc91aaf18b2af999010ce3`
- current pack：`docs/evidence/v1-68/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`c1e47d6b12da9759a1722a2ce81dee083ab83eabe82afc4532ea146d51327eb7`
- diff pack：`docs/evidence/v1-68/cws-listing-diff-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`158381627f3e4bcea1f7e701daf30fd5ccbc2d8368049566bc7721da3cac8694`

## 关键变更摘要（baseline -> current）

- keywords.enAdded：copy clean text, copy cleaner, copy webpage to text, web clipper markdown, web page to text
- keywords.enRemoved：ai friendly format, ai ready copy, web page to markdown
- keywords.zhAdded：一键复制, 网页内容提取, 网页复制助手, 网页转文本, 网页转纯文本
- keywords.zhRemoved：网页复制到 Markdown
- descriptions.enSha256：`892f93ec37c5ee9ecd5c7d704be9cd99f38f2d16a7c9e72fb7610fc36e29355a` -> `0e5ba6e42d46070e59f50a7f6345c6d7fbdb55c399704348b99664f33cbafdc5`
- descriptions.zhSha256：`33107aaf3f68c6505c6d69e9fa94b16656f15d6e65ff93130dca641cf533db1c` -> `29bf693c36657f4893337b6bddf1a2f9cde41a157aa1dafe2a5367ae08e320ab`
- screenshotPlan.changedIds：(none)
- assertions.changedKeys：(none)

## 红线断言结果（门禁）

- hasProWaitlistCta: PASS
- hasPrivacyClaims: PASS
- noOverclaimKeywords: PASS
- redlines: []

## 使用说明

- 生成（写入 `docs/evidence/v1-68/`）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir docs/evidence/v1-68`
- 门禁/可重复性（固定 exportedAt，便于 diff）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir docs/evidence/v1-68 --stable-exported-at`
- 指定 baseline pack（可选）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir docs/evidence/v1-68 --baseline-pack docs/evidence/v1-66/cws-listing-evidence-pack-<extensionVersion>-<utcCompact>.json`
- 复核 sha256（示例）：`shasum -a 256 docs/evidence/v1-68/*.json`
- 敏感信息搜索（示例）：`rg -n "CWS_|TOKEN|SECRET" docs/evidence/v1-68`

---

输出文件：
- `docs/evidence/v1-68/index.md`
- `docs/evidence/v1-68/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
- `docs/evidence/v1-68/cws-listing-diff-evidence-pack-1.1.28-2026-03-21-000000.json`

