# V1-67 CWS Listing ASO diff 证据包（可审计/可复核/可复用）

- 证据目录：`docs/evidence/v1-67/`
- 生成脚本：`scripts/build-cws-listing-diff-evidence-pack.ts`
- packVersion：`v1-67`
- exportedAt：`2026-03-21T00:00:00.000Z`
- extensionVersion：`1.2.3`
- baseline pack：`docs/evidence/v1-66/cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`fcb742c4c3678af9515aca9c974b0b1500af89e815768ca8224d3a88f430262f`
- current pack：`docs/evidence/v1-67/cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`fcb742c4c3678af9515aca9c974b0b1500af89e815768ca8224d3a88f430262f`
- diff pack：`docs/evidence/v1-67/cws-listing-diff-evidence-pack-1.2.3-2026-03-21-000000.json`
  - sha256：`e15a1da070b2f44a49040d2227b8288ad112f81f47820d70bba416bb908918a8`

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

