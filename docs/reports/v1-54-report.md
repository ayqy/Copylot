# V1-54 渠道分发/投放最小试验：Pro 意向按 campaign 聚合 7d 导出 + 复盘证据固化 简报

## 状态
- 已完成：子 PRD `prds/v1-54.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> 隐私与可观测性 -> Pro 意向漏斗摘要面板新增「按 campaign 聚合导出（7d CSV）」入口（稳定 DOM：`#export-pro-intent-by-campaign-7d-csv`）
  - 匿名使用数据 OFF：入口置灰，导出逻辑直接 return（不读取/不推断本地 events）
  - 匿名使用数据 ON：可导出 UTF-8（无 BOM）CSV，固定字段：`exportedAt/extensionVersion/windowFrom/windowTo/lookbackDays/campaign/proEntryOpened/proWaitlistOpened/proWaitlistCopied/proWaitlistSurveyCopied/leads`
  - 兼容性：未修改 v1-51 的 7d 明细 CSV 固定字段与既有统计口径；本轮为新增入口 + 新文件名

## 交付效果（收入第一：把“按 campaign 的留资效率对比”变成可导出证据资产）

1) 一键导出可复核（7d，按 campaign）
- 导出后可直接在表格中对比不同 campaign 的 `leads`（`proWaitlistCopied + proWaitlistSurveyCopied`）。
- campaign 为空：聚合到 `空 campaign` 行，用于发现分发/投放漏填。

2) 口径互证闭环（可审计）
- campaign 维度：可用隐私页「Pro 意向漏斗证据包」events（含 `props.campaign`）按 campaign+eventName 聚合复核，与本次聚合 CSV 逐行对齐。
- overall 维度：本次聚合 CSV 各 campaign 行按事件列求和，应与 v1-51 的 7d 明细 CSV（按 `eventName` 计数）一致。

3) 本轮导出样例摘要（用于复盘演示）
- 样例文件：`docs/evidence/v1-54/copylot-pro-intent-by-campaign-7d-2026-03-21.csv`
- leads 摘要（示例）：
  - `ph`：leads=2
  - `空 campaign`：leads=1
  - `twitter`：leads=0

## 下一步渠道试验动作建议（围绕留资增长）
1. 对外分发/投放时强制填写 `campaign`（短、安全、可审计字符串）；每个渠道/创意至少一个 campaign
2. 每周固定导出 3 件套证据：weekly digest（v1-50）+ 7d 明细 CSV（v1-51）+ 按 campaign 聚合 CSV（v1-54）
3. 用表格做按 campaign 的 leads 对比与趋势；优先保留 leads 更高/更稳定的渠道，并用 `空 campaign` 行反推“漏填导致无法归因”的损失

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `manifest.json`
- `plugin-1.1.26.zip`
- `src/options/options.html`
- `src/options/options.ts`
- `src/shared/pro-intent-by-campaign-csv.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-54.md`
- `docs/evidence/v1-54/`
- `docs/roadmap_status.md`
- `docs/reports/v1-54-report.md`

