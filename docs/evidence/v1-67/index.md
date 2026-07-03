# V1-67 CWS Listing ASO diff 证据包（可审计/可复核/可复用）

- 证据目录：`docs/evidence/v1-67/`
- 生成脚本：`scripts/build-cws-listing-diff-evidence-pack.ts`
- packVersion：`v1-67`
- exportedAt：`2026-03-21T00:00:00.000Z`
- extensionVersion：`1.2.3`
- baseline pack：`docs/evidence/v1-66/cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`1d0d2dfa5f803b05ee1d11643122c891915dc8ee09126affda2711484095f43c`
- current pack：`docs/evidence/v1-67/cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`1d0d2dfa5f803b05ee1d11643122c891915dc8ee09126affda2711484095f43c`
- diff pack：`docs/evidence/v1-67/cws-listing-diff-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`30ee745e2b490ca5cc02e9a641526752afdc5db6c93df9eb003a60420b20c145`

## 关键变更摘要（baseline -> current）

- keywords.enAdded：(none)
- keywords.enRemoved：(none)
- keywords.zhAdded：(none)
- keywords.zhRemoved：(none)
- descriptions.enSha256：`9d77013eb3ec54391b9bd5d775116f4dd1489885a7dc786cfa19f4d7b0bcff3d` -> `9d77013eb3ec54391b9bd5d775116f4dd1489885a7dc786cfa19f4d7b0bcff3d`
- descriptions.zhSha256：`22bba47de6a5b41fe87cba18a79af21b73bab1713f8d3f9ff4588a1215bc84ac` -> `22bba47de6a5b41fe87cba18a79af21b73bab1713f8d3f9ff4588a1215bc84ac`
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
- `docs/evidence/v1-67/cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`
- `docs/evidence/v1-67/cws-listing-diff-evidence-pack-1.2.3-2026-03-21-000000.json`

