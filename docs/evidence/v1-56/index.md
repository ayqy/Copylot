# V1-56 商业化证据索引（渠道周报一键生成：按 campaign 的本周复盘摘要 Markdown）

- 生成时间：2026-03-21T04:05:00+08:00
- 扩展版本号：`1.1.28`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip`（本次为 `plugin-1.1.28.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-56/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-56/screenshots/`，文件名规范见 `docs/test-cases/v1-56.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-privacy-pro-intent-by-campaign-weekly-report-entry.png`
   - 断言：Options -> 隐私与可观测性 -> Pro 意向漏斗摘要面板中存在入口「按 campaign 的本周复盘摘要（Markdown）」一键复制（稳定 DOM：`#copy-pro-intent-by-campaign-weekly-report`）。
2. `screenshots/02-privacy-pro-intent-by-campaign-weekly-report-telemetry-off.png`
   - 断言：匿名使用数据 OFF 时，复制输出包含提示 `匿名使用数据关闭（无可用事件）`，且仅包含环境信息 + 隐私声明（不包含任何事件计数/表格）。
3. `screenshots/03-privacy-pro-intent-by-campaign-weekly-report-telemetry-on.png`
   - 断言：匿名使用数据 ON 时，复制输出为 Markdown，包含 7d window、按 campaign 的汇总表（含 `空 campaign` 行）、`leads` 与 `leads_per_entry_opened` 等指标，可直接粘贴复盘。

## Markdown 样例（必须落盘，脱敏、可审计）
- `pro-intent-by-campaign-weekly-report.off.md`：匿名 OFF 的周报样例（不读取/不推断事件）
- `pro-intent-by-campaign-weekly-report.on.md`：匿名 ON 的周报样例（7d window 按 campaign 汇总 + leads/效率）

## 口径与可审计说明（重要）

1) 数据来源（隐私红线）
- 仅来源于本地匿名事件日志 `copilot_telemetry_events`（白名单 + source 枚举过滤 + FIFO window）。
- 周报不包含网页内容/复制内容/URL/标题；不联网发送数据。

2) 聚合维度：campaign（空桶必须存在）
- `campaign` 仅来源于用户手动输入/本地设置（需通过既有校验；不得包含敏感信息）。
- 当事件 `props.campaign` 缺失/空字符串时，归入 `空 campaign` 行（用于发现漏填与归因失真）。

3) 事件白名单与 source 过滤
- 仅统计以下 4 个 Pro 意向事件：
  - `pro_entry_opened`
  - `pro_waitlist_opened`
  - `pro_waitlist_copied`
  - `pro_waitlist_survey_copied`
- 仅统计 `source in ('popup','options')` 的事件。

4) 7d window 口径（与 v1-50/v1-51/v1-54 互证）
- `windowTo = exportedAt`（ms）
- `windowFrom = exportedAt - 7d`（ms）
- 过滤规则：`ts < windowFrom` 排除，`ts = windowFrom/windowTo` 均包含。

5) FIFO 截断上限（可审计）
- 本地匿名事件日志为 `TELEMETRY_MAX_EVENTS=100` FIFO 窗口：当 7d 内事件量超过 100 时，周报统计仅覆盖最近 100 条事件范围。

## 指标定义（用于复盘/互证）
- `leads = pro_waitlist_copied + pro_waitlist_survey_copied`
- `leads_per_entry_opened = leads / pro_entry_opened`（分母为 0 输出 `N/A`）

## 与 v1-51/v1-54 的互证（必须可执行）
- overall 互证：周报中所有 campaign 行按事件列求和，应与 v1-51 的 7d 明细 CSV（按 `eventName` 计数）一致。
- campaign 互证：周报中各 campaign 行应与 v1-54 的按 campaign 聚合 7d CSV 对应列一致（同一 window，同一白名单，同一 source 过滤）。
