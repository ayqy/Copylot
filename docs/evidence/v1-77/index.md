# V1-77 CWS Listing ASO diff 证据包（可审计/可复核/可复用）

- 证据目录：`docs/evidence/v1-77/`
- 生成脚本：`scripts/build-cws-listing-diff-evidence-pack.ts`
- packVersion：`v1-67`
- exportedAt：`2026-03-21T00:00:00.000Z`
- extensionVersion：`1.1.28`
- baseline pack：`docs/evidence/v1-68/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`c1e47d6b12da9759a1722a2ce81dee083ab83eabe82afc4532ea146d51327eb7`
- current pack：`docs/evidence/v1-77/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`cb20bf54f20a61b6e5b6c15c02bb36022eba4ddd59e2e7389479fc1c6d94db8d`
- diff pack：`docs/evidence/v1-77/cws-listing-diff-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`b028a7cd21ba8e98ba216fbc446b75ea700f6ac35fa80e55255882bfd51c80b3`

## 关键变更摘要（baseline -> current）

- keywords.enAdded：copy web page to markdown, webpage to text
- keywords.enRemoved：smart copy
- keywords.zhAdded：(none)
- keywords.zhRemoved：AI 友好格式, 去 Copy 文案（保守）
- descriptions.enSha256：`0e5ba6e42d46070e59f50a7f6345c6d7fbdb55c399704348b99664f33cbafdc5` -> `9d77013eb3ec54391b9bd5d775116f4dd1489885a7dc786cfa19f4d7b0bcff3d`
- descriptions.zhSha256：`29bf693c36657f4893337b6bddf1a2f9cde41a157aa1dafe2a5367ae08e320ab` -> `22bba47de6a5b41fe87cba18a79af21b73bab1713f8d3f9ff4588a1215bc84ac`
- screenshotPlan.changedIds：(none)
- assertions.changedKeys：(none)

## 红线断言结果（门禁）

- hasProWaitlistCta: PASS
- hasPrivacyClaims: PASS
- noOverclaimKeywords: PASS
- redlines: []

## 使用说明

- 生成（写入 `docs/evidence/v1-77/`）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir docs/evidence/v1-77`
- 门禁/可重复性（固定 exportedAt，便于 diff）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir docs/evidence/v1-77 --stable-exported-at`
- 指定 baseline pack（可选）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir docs/evidence/v1-77 --baseline-pack docs/evidence/v1-66/cws-listing-evidence-pack-<extensionVersion>-<utcCompact>.json`
- 复核 sha256（示例）：`shasum -a 256 docs/evidence/v1-77/*.json`
- 敏感信息搜索（示例）：`rg -n "CWS_|TOKEN|SECRET" docs/evidence/v1-77`

---

输出文件：
- `docs/evidence/v1-77/index.md`
- `docs/evidence/v1-77/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
- `docs/evidence/v1-77/cws-listing-diff-evidence-pack-1.1.28-2026-03-21-000000.json`

