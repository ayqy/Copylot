# V1-51 商业化证据索引（Pro 意向明细 CSV：过去 7 天 7d window）

- 生成时间：2026-03-20T20:26:49+08:00
- 扩展版本号：`1.1.24`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip`（本次为 `plugin-1.1.24.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-51/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-51/screenshots/`，文件名规范见 `docs/test-cases/v1-51.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-privacy-pro-intent-events-csv-entry.png`
   - 断言：Options -> 隐私与可观测性 -> Pro 意向漏斗摘要面板中存在入口 `导出过去 7 天 Pro 意向明细（CSV）`（DOM：`#export-pro-intent-events-7d-csv`）。
2. `screenshots/02-privacy-pro-intent-events-csv-telemetry-off.png`
   - 断言：匿名使用数据 OFF：`#export-pro-intent-events-7d-csv` 按钮置灰（disabled），且不导出任何事件明细。

## CSV 样例（必须落盘，脱敏、可审计）
- `copylot-pro-intent-events-7d-2026-03-20.csv`：匿名使用数据 ON 的导出样例（7d window 明细；仅事件名/时间戳/来源 + 环境信息）

## 导出文件清单与命名规范（证据落盘/复盘对齐）
必选（本轮 v1-51）：
- `copylot-pro-intent-events-7d-YYYY-MM-DD.csv`：过去 7 天 Pro 意向明细（匿名 ON）

建议归档（配套 v1-50 weekly digest，便于互相印证）：
- `weekly-digest-YYYY-MM-DD--telemetry-on.md`：本周摘要（匿名 ON，v1-50）
- `weekly-digest-YYYY-MM-DD--telemetry-off.md`：本周摘要（匿名 OFF，用于隐私/开关行为审计，v1-50）

## 口径与可审计说明（重要）
1) 数据来源（隐私红线）
- 仅来源于本地匿名事件日志 `copilot_telemetry_events`（白名单 + 枚举过滤 + FIFO window）。
- CSV 不包含网页内容/复制内容/URL/标题等可识别信息。

2) 事件白名单与 source 过滤
- 仅导出以下事件：
  - `pro_entry_opened`
  - `pro_waitlist_opened`
  - `pro_waitlist_copied`
  - `pro_waitlist_survey_copied`
- 仅导出 `source in ('popup','options')` 的事件。

3) 7d window 口径（与 v1-50 一致）
- `windowTo = exportedAt`（ms）
- `windowFrom = exportedAt - 7d`（ms）
- 过滤规则：`ts < windowFrom` 排除，`ts = windowFrom/windowTo` 均包含。

4) FIFO 截断上限（可审计）
- 本地匿名事件日志为 `TELEMETRY_MAX_EVENTS=100` FIFO 窗口：当 7d 内事件量超过 100 时，“摘要（v1-50）”与“明细（v1-51）”均只覆盖最近 100 条事件范围。
- 审计建议：对比 weekly digest 的窗口 from/to 与 CSV 中的 `windowFrom/windowTo`，并在复盘记录中明确是否可能触达上限（例如事件数接近 100）。

## 最小复盘口径（可从 CSV 直接复算/出图）
聚合口径（7d overall + bySource）：
- overall：按 `eventName` 计数
- bySource：按 `source,eventName` 计数

关键转化率（分母为 0 记为 `N/A`/空值）：
- `waitlist_opened_per_entry_opened = pro_waitlist_opened / pro_entry_opened`
- `waitlist_copied_per_waitlist_opened = pro_waitlist_copied / pro_waitlist_opened`
- `survey_copied_per_entry_opened = pro_waitlist_survey_copied / pro_entry_opened`

与 v1-50 摘要互证（必须可执行）：
- CSV 的 `eventName` 聚合计数应与 weekly digest 中的 overall 计数一致（同一白名单、同一 source 过滤、同一 7d window、同一 FIFO 上限）。

