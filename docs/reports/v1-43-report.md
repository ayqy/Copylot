# V1-43 WOM 小实验：分享/评价/反馈入口低打扰优化 + 可量化证据导出 简报

## 状态
- 已完成：子 PRD `prds/v1-43.md` 全部“具体任务”落地并满足验收标准
  - UTM 口径统一（Popup / Options / 评分引导）：`utm_source=copylot-ext`、`utm_campaign=v1-43`、`utm_medium=popup|options|rating_prompt`
  - Options -> 隐私与可观测性新增「WOM 摘要」面板：刷新 / 复制摘要 / 复制 WOM Evidence Pack（字段白名单、可审计）
  - 商业化证据资产落盘：`docs/evidence/v1-43/`（含 telemetry off 对照 + 截图索引）
  - 测试用例文档：`docs/test-cases/v1-43.md`
  - 商业化进度落盘：更新 `docs/roadmap_status.md`（将「WOM 小实验（v1-43）」标记为已完成，并刷新 Top3/当前进度）
- 扩展版本号：`1.1.20`（见 `manifest.json`）

## 交付效果（低打扰 + 可量化 + 可审计）
1) WOM 入口 UTM 统一且可核验
- Popup：分享/去评价入口打开 CWS 链接携带 `utm_medium=popup`；复制分享文案中的商店链接与分享入口一致
- Options：分享/去评价入口打开 CWS 链接携带 `utm_medium=options`；复制分享文案中的商店链接与分享入口一致
- 评分引导：点击 “Rate/去评价” 打开 CWS 评价页携带 `utm_medium=rating_prompt`

2) WOM 摘要 + 证据包（本地可审计、可对比）
- 摘要 JSON：按 `props.source` 分组统计 `wom_*` / `rating_prompt_*` 的 count/lastTs，并派生关键转化率：
  - `share_copied_per_share_opened`
  - `rating_prompt_rate_clicked_per_prompt_shown`
- Evidence Pack：结构固定为 `meta/settings/womSummary/events`；events 严格字段白名单过滤（仅 `name/ts/props.source/action`），不包含 URL/标题/网页内容/复制内容
- 匿名开关关闭时：不记录/不导出（`events=[]`），且 UI 明确提示“未开启，不记录/不导出”

3) 可发布门禁通过
- `bash scripts/test.sh` 全量回归 PASS（lint/type-check/check-i18n/unit-tests/build:prod/verify）

## 关键证据索引（截图 + JSON）
- 证据索引入口：`docs/evidence/v1-43/index.md`
- 证据资产清单：`docs/evidence/v1-43/`（摘要/证据包/关闭态导出/截图索引）

## 修改范围（目录/文件）
- `src/shared/word-of-mouth.ts`
- `src/shared/telemetry.ts`
- `src/shared/wom-summary.ts`
- `src/popup/popup.ts`
- `src/options/options.html`
- `src/options/options.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/growth/telemetry-events.md`
- `docs/test-cases/v1-43.md`
- `docs/evidence/v1-43/`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-20.md`
- `docs/reports/v1-43-report.md`
- `prds/v1-43-1.md`
- `prds/v1-43-2.md`
- `prds/v1-43-3.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 最近执行日期：2026-03-20
- 结论：PASS
