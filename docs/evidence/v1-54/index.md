# V1-54 商业化证据索引（渠道分发/投放最小试验：Pro 意向按 campaign 聚合 7d CSV）

- 生成时间：2026-03-21T02:31:35+08:00
- 扩展版本号：`1.1.26`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip`（本次为 `plugin-1.1.26.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-54/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-54/screenshots/`，文件名规范见 `docs/test-cases/v1-54.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-privacy-pro-intent-by-campaign-csv-entry.png`
   - 断言：Options -> 隐私与可观测性 -> Pro 意向漏斗摘要面板中存在入口 `导出过去 7 天 Pro 意向按 campaign 聚合（CSV）`（DOM：`#export-pro-intent-by-campaign-7d-csv`）。
2. `screenshots/02-privacy-pro-intent-by-campaign-csv-exported-file.png`
   - 断言：匿名使用数据 ON 时可成功下载 CSV；文件名符合规范；CSV 包含固定字段（含 `campaign` 与 `leads`）。

## CSV 样例（必须落盘，脱敏、可审计）
- `copylot-pro-intent-by-campaign-7d-2026-03-21.csv`：匿名使用数据 ON 的导出样例（7d window 按 campaign 聚合；仅计数与环境信息）

## 导出文件清单与命名规范（证据落盘/复盘对齐）
必选（本轮 v1-54）：
- `copylot-pro-intent-by-campaign-7d-YYYY-MM-DD.csv`：过去 7 天 Pro 意向按 campaign 聚合（匿名 ON）

配套（用于互证与审计，来自既有能力，不新增口径）：
- `copylot-pro-intent-events-7d-YYYY-MM-DD.csv`：过去 7 天 Pro 意向明细（v1-51，固定字段不变）
- `pro-funnel-evidence-pack*.json`：Pro 意向漏斗证据包（events 含 `props.campaign`，用于按 campaign 复核）

## 口径与可审计说明（重要）
1) 数据来源（隐私红线）
- 仅来源于本地匿名事件日志 `copilot_telemetry_events`（白名单 + 枚举过滤 + FIFO window）。
- CSV 不包含网页内容/复制内容/URL/标题等可识别信息。

2) 聚合维度：campaign（空桶）
- `campaign` 仅来源于用户手动输入/本地设置（不得包含网页内容/复制内容/URL/标题）。
- 当事件 `props.campaign` 缺失时，聚合到 `空 campaign` 行（用于发现分发/投放漏填）。

3) 事件白名单与 source 过滤
- 仅统计以下 4 个 Pro 意向事件：
  - `pro_entry_opened`
  - `pro_waitlist_opened`
  - `pro_waitlist_copied`
  - `pro_waitlist_survey_copied`
- 仅统计 `source in ('popup','options')` 的事件。

4) 7d window 口径（与 v1-50/v1-51 一致）
- `windowTo = exportedAt`（ms）
- `windowFrom = exportedAt - 7d`（ms）
- 过滤规则：`ts < windowFrom` 排除，`ts = windowFrom/windowTo` 均包含。

5) FIFO 截断上限（可审计）
- 本地匿名事件日志为 `TELEMETRY_MAX_EVENTS=100` FIFO 窗口：当 7d 内事件量超过 100 时，导出的聚合仅覆盖最近 100 条事件范围。

## 最小复盘口径（按 campaign 可直接复算留资数/效率）
字段说明：
- `leads = proWaitlistCopied + proWaitlistSurveyCopied`（留资总数，可直接用于渠道对比）

建议复盘表格（按 campaign）：
- 留资总数：`leads`
- 渠道漏斗对比（可选，分母为 0 输出 `N/A`）：
  - `leads_per_entry_opened = leads / proEntryOpened`
  - `leads_per_waitlist_opened = leads / proWaitlistOpened`

互证与审计（必须可执行）：
- overall 互证：将本 CSV 所有 campaign 行按事件列求和，应与 v1-51 的 7d 明细 CSV（按 `eventName` 计数）一致。
- campaign 互证：从证据包 `events[]` 按 `props.campaign`（缺失归为 `空 campaign`）与 `name` 聚合计数，应与本 CSV 各 campaign 行一致。
