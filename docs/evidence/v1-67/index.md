# V1-67 CWS Listing ASO diff 证据包（可审计/可复核/可复用）

- 证据目录：`docs/evidence/v1-67/`
- 生成脚本：`scripts/build-cws-listing-diff-evidence-pack.ts`
- packVersion：`v1-67`
- exportedAt：`2026-03-21T00:00:00.000Z`
- extensionVersion：`1.2.3`
- baseline pack：`docs/evidence/v1-66/cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`ec71f32c823afc70442ef6bd201b428b2fa83ad3df203bcbfc9b182f78b14a7a`
- current pack：`docs/evidence/v1-67/cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`ec71f32c823afc70442ef6bd201b428b2fa83ad3df203bcbfc9b182f78b14a7a`
- diff pack：`docs/evidence/v1-67/cws-listing-diff-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`3864444ca707e01f99eaf379591135147430198c4c155020af80f21fce736280`

## 关键变更摘要（baseline -> current）

- keywords.enAdded：(none)
- keywords.enRemoved：(none)
- keywords.zhAdded：(none)
- keywords.zhRemoved：(none)
- descriptions.enSha256：`bc6b5a4174b4a5d38bdcc35c86956665ff1d48b88f07279246f1e070777e77b1` -> `bc6b5a4174b4a5d38bdcc35c86956665ff1d48b88f07279246f1e070777e77b1`
- descriptions.zhSha256：`5a35de22f3000421d2eee0bfb0aa439b5d3a6cfaddf28e1b660e5f8d5e855962` -> `5a35de22f3000421d2eee0bfb0aa439b5d3a6cfaddf28e1b660e5f8d5e855962`
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

