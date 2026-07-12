# V1-67 CWS Listing ASO diff 证据包（可审计/可复核/可复用）

- 证据目录：`docs/evidence/v1-67/`
- 生成脚本：`scripts/build-cws-listing-diff-evidence-pack.ts`
- packVersion：`v1-67`
- exportedAt：`2026-03-21T00:00:00.000Z`
- extensionVersion：`1.2.3`
- baseline pack：`docs/evidence/v1-66/cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`913bf1f83b4a7cd18e5ef4fa368c978d9e15548243753b7a90339db186e24a7e`
- current pack：`docs/evidence/v1-67/cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`913bf1f83b4a7cd18e5ef4fa368c978d9e15548243753b7a90339db186e24a7e`
- diff pack：`docs/evidence/v1-67/cws-listing-diff-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`02c6b8709b3fcbb7c28b5b433d2849917008e0e31ad30b0bc562985f9c6f1f3e`

## 关键变更摘要（baseline -> current）

- keywords.enAdded：(none)
- keywords.enRemoved：(none)
- keywords.zhAdded：(none)
- keywords.zhRemoved：(none)
- descriptions.enSha256：`e939f6d58cf780d1e1fb48348a6ea6b68456e91a9c8057e06d16abbda32458c2` -> `e939f6d58cf780d1e1fb48348a6ea6b68456e91a9c8057e06d16abbda32458c2`
- descriptions.zhSha256：`99fb6176346338dee75afb37321a94e010ecb5f765ec9b7ffd43ef22b958e545` -> `99fb6176346338dee75afb37321a94e010ecb5f765ec9b7ffd43ef22b958e545`
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

