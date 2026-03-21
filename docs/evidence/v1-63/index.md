# V1-63 商业化证据索引（渠道跑数/复盘证据包再降摩擦：一键下载「周度渠道复盘证据包（JSON）」）

- 生成时间：2026-03-21T09:22:27+08:00
- 扩展版本号：`1.1.28`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip` 解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-63/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-63/screenshots/`，文件名规范见 `docs/test-cases/v1-63.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-privacy-pro-weekly-channel-ops-evidence-pack-download-entry.png`
   - 断言：Options -> 隐私与可观测性 -> Pro 面板存在稳定入口 `#download-pro-weekly-channel-ops-evidence-pack`，且与 v1-61/v1-57/v1-51 同区域便于互证回归。
2. `screenshots/02-privacy-pro-weekly-channel-ops-evidence-pack-off-downloaded.png`
   - 断言：匿名使用数据 OFF 时仍允许下载 evidence pack JSON；文件名为 `.off.json`；内容包含明确 OFF 提示 + Env；不读取/不推断本地 events（assets 为空/占位但可 JSON.parse）。
3. `screenshots/03-privacy-pro-weekly-channel-ops-evidence-pack-on-downloaded.png`
   - 断言：匿名使用数据 ON 时可下载完整 evidence pack JSON：包含（1）v1-61 同口径获客效率 evidence pack（CSV + Markdown + rows + Env）（2）v1-57 同口径分发动作 7d CSV（3）v1-51 同口径 Pro 意向明细 7d CSV（4）互证说明 `assets.verifyMarkdown`。

## 样例（必须落盘，脱敏、可审计、可复核）
- `copylot-pro-weekly-channel-ops-evidence-pack-2026-03-21.off.json`：匿名 OFF 示例（仅 Env + OFF 提示 + assets 空占位）
- `copylot-pro-weekly-channel-ops-evidence-pack-2026-03-21.on.json`：匿名 ON 示例（含至少 2 个 campaign + `空 campaign` 行；含互证资产）

## 口径与可审计说明（重要）

1) 数据来源（隐私红线）
- 匿名 ON：仅来源于本地匿名事件日志 `copilot_telemetry_events`（白名单 + 枚举校验 + FIFO window）。
- 匿名 OFF：不读取/不推断本地事件；仅输出环境信息与空资产占位（用于可审计）。
- 不新增扩展权限；不联网发送数据；不采集用户复制内容；证据包不包含网页内容/URL/标题/复制内容。

2) 7d window 口径（与 v1-51/v1-57/v1-61 保持一致，便于互证）
- `windowTo = exportedAt`（ms）
- `windowFrom = exportedAt - 7d`（ms）
- 过滤规则：`ts < windowFrom` 排除，`ts = windowFrom/windowTo` 均包含。

3) 指标定义（必须可复核）
- `leads`：来自 v1-61 `assets.acquisitionEfficiencyEvidencePack.rows[*].leads`（由 `pro_waitlist_copied + pro_waitlist_survey_copied` 聚合得到）
- `distCopies`：来自 v1-61 `assets.acquisitionEfficiencyEvidencePack.rows[*].distCopies`（由 `pro_distribution_asset_copied` 聚合得到）
- `leadsPerDistCopy = leads / distCopies`
  - 当 `distCopies = 0` 时输出 `N/A`
  - 小数格式固定为 4 位（例如 `0.5000`），便于审计对比与单测断言

4) 证据包 JSON schema（字段命名/顺序稳定，便于落盘与 diff）
- 顶层字段固定：`packVersion/enabled/disabledReason/telemetryOffNotice/env/assets`
- `packVersion` 固定为 `v1-63`
- `env` 字段固定：`extensionVersion/exportedAt/lookbackDays/windowFrom/windowTo/isAnonymousUsageDataEnabled`
- `assets` 字段固定：
  - `acquisitionEfficiencyEvidencePack`：v1-61 evidence pack（含 CSV + Markdown + rows + Env）
  - `proDistributionByCampaign7dCsv`：v1-57 CSV 文本（同 header）
  - `proIntentEvents7dCsv`：v1-51 CSV 文本（同 header）
  - `verifyMarkdown`：互证说明（最短可执行）

5) 下载文件命名规范（必须稳定、可按周归档）
- 文件名：`copylot-pro-weekly-channel-ops-evidence-pack-YYYY-MM-DD.off.json` / `copylot-pro-weekly-channel-ops-evidence-pack-YYYY-MM-DD.on.json`
- `YYYY-MM-DD` 取 `exportedAt` 的本地日期（与既有导出命名风格一致）
- 文件名不得包含 campaign/URL/标题/网页内容/复制内容等敏感信息

## 互证步骤（必须可执行）

1) 证据包内部互证（rows <-> 两份 CSV）
1. 匿名使用数据 ON。
2. 下载 v1-63：点击 `#download-pro-weekly-channel-ops-evidence-pack` 得到 JSON 文件。
3. 按 `assets.verifyMarkdown` 执行互证：
   - 复算 `assets.acquisitionEfficiencyEvidencePack.rows[*].leadsPerDistCopy` 并核对一致（`distCopies=0 -> N/A`，小数 4 位）。
   - 解析 `assets.proDistributionByCampaign7dCsv`，对每行 `distCopies` 求和，并与 rows 的 `distCopies` 求和一致。
   - 解析 `assets.proIntentEvents7dCsv`，统计 lead 事件（`pro_waitlist_copied/pro_waitlist_survey_copied`）行数，并与 rows 的 `leads` 求和一致。

