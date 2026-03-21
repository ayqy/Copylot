# V1-67 CWS Listing ASO diff 证据包（可审计/可复核/可复用）

- 证据目录：`docs/evidence/v1-67/`
- 生成脚本：`scripts/build-cws-listing-diff-evidence-pack.ts`
- packVersion：`v1-67`
- exportedAt：`2026-03-21T00:00:00.000Z`
- extensionVersion：`1.1.28`
- baseline pack：`docs/evidence/v1-66/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`c1e47d6b12da9759a1722a2ce81dee083ab83eabe82afc4532ea146d51327eb7`
- current pack：`docs/evidence/v1-67/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`c1e47d6b12da9759a1722a2ce81dee083ab83eabe82afc4532ea146d51327eb7`
- diff pack：`docs/evidence/v1-67/cws-listing-diff-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`4d29ddff5943fb4b95ee4c9c7a24c3de358f6e5ef65b51365ff65bd246edc91e`

## 关键变更摘要（baseline -> current）

- keywords.enAdded：(none)
- keywords.enRemoved：(none)
- keywords.zhAdded：(none)
- keywords.zhRemoved：(none)
- descriptions.enSha256：`0e5ba6e42d46070e59f50a7f6345c6d7fbdb55c399704348b99664f33cbafdc5` -> `0e5ba6e42d46070e59f50a7f6345c6d7fbdb55c399704348b99664f33cbafdc5`
- descriptions.zhSha256：`29bf693c36657f4893337b6bddf1a2f9cde41a157aa1dafe2a5367ae08e320ab` -> `29bf693c36657f4893337b6bddf1a2f9cde41a157aa1dafe2a5367ae08e320ab`
- screenshotPlan.changedIds：(none)
- assertions.changedKeys：(none)

## 红线断言结果（门禁）

- hasProWaitlistCta: PASS
- hasPrivacyClaims: PASS
- noOverclaimKeywords: PASS
- redlines: []

## 使用说明

- 生成（写入 `docs/evidence/v1-67/`）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir docs/evidence/v1-67`
- 门禁/可重复性（固定 exportedAt，便于 diff）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir docs/evidence/v1-67 --stable-exported-at`
- 指定 baseline pack（可选）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir docs/evidence/v1-67 --baseline-pack docs/evidence/v1-66/cws-listing-evidence-pack-<extensionVersion>-<utcCompact>.json`
- 复核 sha256（示例）：`shasum -a 256 docs/evidence/v1-67/*.json`
- 敏感信息搜索（示例）：`rg -n "CWS_|TOKEN|SECRET" docs/evidence/v1-67`

---

输出文件：
- `docs/evidence/v1-67/index.md`
- `docs/evidence/v1-67/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
- `docs/evidence/v1-67/cws-listing-diff-evidence-pack-1.1.28-2026-03-21-000000.json`

