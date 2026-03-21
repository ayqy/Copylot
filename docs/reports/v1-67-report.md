# V1-67 CWS Listing ASO 迭代证据化 v2：证据包 diff + 变更摘要一键生成（简报）

## 状态
- 已完成：子 PRD `prds/v1-67.md` 全部“具体任务”落盘并满足验收标准（离线可推进、可审计、可复核、可复用）
  - 一键生成脚本：`scripts/build-cws-listing-diff-evidence-pack.ts`
  - diff 证据目录与索引：`docs/evidence/v1-67/` + `docs/evidence/v1-67/index.md`
  - 样例 diff 证据包（JSON，可 `JSON.parse`）：`docs/evidence/v1-67/cws-listing-diff-evidence-pack-1.1.28-2026-03-21-000000.json`
  - 门禁：`bash scripts/test.sh` 已接入 v1-67 diff 证据包生成 + 可重复性校验（`--stable-exported-at`）
  - 用例：`docs/test-cases/v1-67.md`（含一次回归记录）
  - 自动化：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 具体任务完成情况（按 PRD）
- 任务 1（diff 证据包一键生成脚本）：已完成（`scripts/build-cws-listing-diff-evidence-pack.ts`），支持 `--stable-exported-at/--baseline-pack/--evidence-dir`；默认从 `docs/evidence/v1-66/index.md` 自动解析 baseline，并即时生成 current pack（`requireDistManifest=true`）；输出 `docs/evidence/v1-67/`（diff JSON + index.md + current pack）。
- 任务 2（自动化测试 + 门禁）：已完成（更新 `scripts/unit-tests.ts` 覆盖 schema/红线/基线解析/可重复性；更新 `scripts/test.sh` 接入 v1-67 diff 证据包 determinism 校验）。
- 任务 3（用例/证据/汇报闭环）：已完成（`docs/test-cases/v1-67.md`、`docs/evidence/v1-67/`、`docs/reports/v1-67-report.md`；并更新 `docs/roadmap_status.md`/`docs/growth/blocked.md` 保持商业化进度与阻塞不断档）。

## 商业化证据（可审计/可复核/可复用）
- v1-67 diff 证据包输出（最小字段稳定，便于长期 diff 与审计）：
  - `packVersion=v1-67`
  - `baseline/current`：packPath + sha256 + extensionVersion + exportedAt + assertions（可互证复核）
  - `diff.keywords.*`：EN/ZH 关键词集合增删（added/removed）
  - `diff.descriptions.*Sha256`：长描述内容指纹（from -> to，可复核）
  - `diff.screenshotPlan.changedIds`：截图顺序/标题/断言要点的变化标记（按 id）
  - `diff.assertions.changedKeys`：关键断言 true/false 的变化键
  - `redlines`：商业化/合规门禁枚举（命中即退出码非 0 阻断）
- 红线门禁（当前仓库素材下均 PASS，`redlines=[]`）：
  - Pro 候补 CTA 未丢：`hasProWaitlistCta`
  - 隐私口径未破：`hasPrivacyClaims`
  - 无“已上线 Pro/订阅/付费”等误导性宣称：`noOverclaimKeywords`

## 本轮效果（对获客入口/风险控制）
- 把 Listing ASO 迭代从“手工对比/不可审计/容易跑偏”升级为“可一键生成 diff 证据 + 变更摘要 + 红线门禁 + 可重复性”，确保每次物料调整都能提供可验证的商业化推进证据，并能回归复盘。
- 作为 Top1/Top2（真实发布/商店端取证）网络恢复后的衔接资产：发布证据可引用 v1-66 基线与 v1-67 diff，证明“物料一致性/变更点可追溯”。

## 风险/阻塞
- Top1/Top2「真实 CWS 发布 + 商店端取证」仍受网络可达性阻塞：需要可用代理/VPN + 商店可达（已在 `docs/roadmap_status.md` 与 `docs/growth/blocked.md` 不断档记录）。

## 修改范围（目录/文件）
- `scripts/build-cws-listing-diff-evidence-pack.ts`
- `scripts/unit-tests.ts`
- `scripts/test.sh`
- `docs/evidence/v1-67/`
- `docs/test-cases/v1-67.md`
- `docs/reports/v1-67-report.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`
