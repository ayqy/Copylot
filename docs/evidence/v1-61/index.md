# V1-61 商业化证据索引（渠道获客效率证据包落盘再降摩擦：新增「下载证据包（JSON）」入口）

- 生成时间：2026-03-21T15:30:00+08:00
- 扩展版本号：`1.1.28`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip` 解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-61/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-61/screenshots/`，文件名规范见 `docs/test-cases/v1-61.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-privacy-pro-acq-eff-evidence-pack-download-entry.png`
   - 断言：Options -> 隐私与可观测性 -> Pro 面板存在稳定入口 `#download-pro-acquisition-efficiency-by-campaign-evidence-pack`，且与 v1-60/v1-58/v1-59 入口同区域。
2. `screenshots/02-privacy-pro-acq-eff-evidence-pack-off-downloaded.png`
   - 断言：匿名使用数据 OFF 时仍允许下载 evidence pack JSON；文件名为 `.off.json`；内容包含明确 OFF 提示 + Env；不读取/不推断本地 events（rows 为空；资产为空占位）。
3. `screenshots/03-privacy-pro-acq-eff-evidence-pack-on-downloaded.png`
   - 断言：匿名使用数据 ON 时可下载完整 evidence pack JSON：包含（1）v1-58 同口径 7d CSV（2）v1-59 同口径周报 Markdown（3）结构化 rows；三者可互证复算一致（`distCopies=0 -> N/A`）。

## 样例（必须落盘，脱敏、可审计、可复核）
- `copylot-pro-acq-eff-by-campaign-evidence-pack-2026-03-21.off.json`：匿名 OFF 示例（仅 Env + OFF 提示 + 空资产占位）
- `copylot-pro-acq-eff-by-campaign-evidence-pack-2026-03-21.on.json`：匿名 ON 示例（含至少 2 个 campaign + `空 campaign` 行；含 `distCopies=0 -> N/A`；含 CSV + Markdown + rows 互证）

## 口径与可审计说明（重要）

1) 数据来源（隐私红线）
- 匿名 ON：仅来源于本地匿名事件日志 `copilot_telemetry_events`（白名单 + 枚举校验 + FIFO window）。
- 匿名 OFF：不读取/不推断本地事件；仅输出环境信息与空资产占位（用于可审计）。
- 不新增扩展权限；不联网发送数据；不采集用户复制内容；证据包不包含网页内容/URL/标题/复制内容。

2) 7d window 口径（与 v1-51/v1-54/v1-57/v1-58/v1-59/v1-60 保持一致，便于互证）
- `windowTo = exportedAt`（ms）
- `windowFrom = exportedAt - 7d`（ms）
- 过滤规则：`ts < windowFrom` 排除，`ts = windowFrom/windowTo` 均包含。

3) campaign 维度（空桶复用 v1-58 文案）
- `campaign` 仅来源于用户手动输入/本地设置且通过既有校验（不得包含敏感信息）。
- 当事件 `props.campaign` 缺失/空字符串时，归入 `空 campaign` 桶（用于发现投放/分发漏填导致不可归因）。

4) 指标定义（必须可复核，且与 v1-58/v1-59/v1-60 一致）
- `leads = pro_waitlist_copied + pro_waitlist_survey_copied`（按 campaign 聚合）
- `distCopies`：事件 `pro_distribution_asset_copied` 按 action 求和（按 campaign 聚合）
- `leadsPerDistCopy = leads / distCopies`
  - 当 `distCopies = 0` 时输出 `N/A`
  - 小数格式固定为 4 位（例如 `0.5000`），便于审计对比与单测断言

5) 证据包 JSON schema（字段命名/顺序稳定，便于落盘与 diff）
- 顶层字段固定：`enabled/disabledReason/telemetryOffNotice/env/rows/csv/weeklyReportMarkdown`
- `env` 字段固定：`extensionVersion/exportedAt/lookbackDays/windowFrom/windowTo/isAnonymousUsageDataEnabled`
- `rows` 与 `csv` 与 `weeklyReportMarkdown` 表格字段一一对应，可互证复算

6) 下载文件命名规范（必须稳定、可按周归档）
- 文件名：`copylot-pro-acq-eff-by-campaign-evidence-pack-YYYY-MM-DD.off.json` / `copylot-pro-acq-eff-by-campaign-evidence-pack-YYYY-MM-DD.on.json`
- `YYYY-MM-DD` 取 `exportedAt` 的本地日期（与既有导出命名风格一致）
- 文件名不得包含 campaign/URL/标题/网页内容/复制内容等敏感信息

## 互证步骤（必须可执行）

### 1) 下载文件与 v1-60 复制输出互证（同口径、同 schema）
1. 匿名使用数据 OFF 或 ON（两态均可）。
2. 下载 v1-61：点击 `#download-pro-acquisition-efficiency-by-campaign-evidence-pack` 得到 JSON 文件。
3. 复制 v1-60：点击 `#copy-pro-acquisition-efficiency-by-campaign-evidence-pack` 得到剪贴板 JSON。
4. 分别 `JSON.parse(...)` 两份文本并逐字段核对值一致（允许末尾换行差异）。

### 2) 证据包内部互证（rows <-> csv <-> markdown）
1. 匿名使用数据 ON。
2. 下载 v1-61：点击 `#download-pro-acquisition-efficiency-by-campaign-evidence-pack` 得到 JSON 文件。
3. 核对 `env.windowFrom/windowTo` 与 `csv` 每行中的 `windowFrom/windowTo` 一致（同一时间窗）。
4. 按 `campaign` 对齐 `rows` 与 `csv` 中的 `leads/distCopies/leadsPerDistCopy`，逐行核对一致。
5. 在 `weeklyReportMarkdown` 表格中按 `campaign` 对齐并逐行核对一致（分母为 0 时均为 `N/A`）。

### 3) 与 v1-58/v1-59 的互证（同口径、可审计）
1. 匿名使用数据 ON。
2. 导出 v1-58：点击 `#export-pro-acquisition-efficiency-by-campaign-7d-csv` 下载合并 CSV。
3. 复制 v1-59：点击 `#copy-pro-acquisition-efficiency-by-campaign-weekly-report` 复制周报 Markdown。
4. 下载 v1-61：点击 `#download-pro-acquisition-efficiency-by-campaign-evidence-pack` 下载 evidence pack JSON 文件。
5. 核对三份资产 Env 中的 `windowFrom/windowTo` 一致（同一时间窗口径）。
6. 按 `campaign` 逐行核对 `leads/distCopies/leadsPerDistCopy` 一致（分母为 0 时均为 `N/A`）。

