# V1-59 商业化证据索引（渠道分发/投放周报再降摩擦：一键复制本周获客效率复盘摘要（Markdown，按 campaign））

- 生成时间：2026-03-21T12:45:00+08:00
- 扩展版本号：`1.1.28`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip` 解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-59/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-59/screenshots/`，文件名规范见 `docs/test-cases/v1-59.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-privacy-pro-acq-eff-weekly-report-entry.png`
   - 断言：Options -> 隐私与可观测性 -> Pro 面板存在稳定入口 `#copy-pro-acquisition-efficiency-by-campaign-weekly-report`，且与 v1-58 的导出入口同区域。
2. `screenshots/02-privacy-pro-acq-eff-weekly-report-off-copied.png`
   - 断言：匿名使用数据 OFF 时，仍允许复制 Markdown；内容包含明确 OFF 提示与 Env 区块，且不读取/不推断本地 events（不出现统计表格）。
3. `screenshots/03-privacy-pro-acq-eff-weekly-report-on-copied.png`
   - 断言：匿名使用数据 ON 时，可成功复制含表格/Insights/Privacy 的周报 Markdown；表格口径与 v1-58 合并 CSV 一致且可互证复算。

## 样例（必须落盘，脱敏、可审计、可复核）
- `pro-acq-eff-by-campaign-weekly-report.off.md`：匿名 OFF 示例（OFF 提示 + Env 区块 + Privacy 声明；不包含统计表格）
- `pro-acq-eff-by-campaign-weekly-report.on.md`：匿名 ON 示例（至少 2 个 campaign + `空 campaign` 行；含 `distCopies=0 -> N/A`；含 Insights）

## 口径与可审计说明（重要）

1) 数据来源（隐私红线）
- 匿名 ON：仅来源于本地匿名事件日志 `copilot_telemetry_events`（白名单 + 枚举校验 + FIFO window）。
- 匿名 OFF：不读取/不推断本地事件；仅输出环境信息（用于可审计）。
- 不新增扩展权限；不联网发送数据；不采集用户复制内容；周报不包含网页内容/URL/标题/复制内容。

2) 7d window 口径（与 v1-51/v1-54/v1-57/v1-58 保持一致，便于互证）
- `windowTo = exportedAt`（ms）
- `windowFrom = exportedAt - 7d`（ms）
- 过滤规则：`ts < windowFrom` 排除，`ts = windowFrom/windowTo` 均包含。

3) campaign 维度（空桶复用 v1-58 文案）
- `campaign` 仅来源于用户手动输入/本地设置且通过既有校验（不得包含敏感信息）。
- 当事件 `props.campaign` 缺失/空字符串时，归入 `空 campaign` 桶（用于发现投放/分发漏填导致不可归因）。

4) 指标定义（必须可复核，且与 v1-58 一致）
- `leads = pro_waitlist_copied + pro_waitlist_survey_copied`（按 campaign 聚合）
- `distCopies`：事件 `pro_distribution_asset_copied` 按 action 求和（按 campaign 聚合）
- `leadsPerDistCopy = leads / distCopies`
  - 当 `distCopies = 0` 时输出 `N/A`
  - 小数格式固定为 4 位（例如 `0.5000`），便于审计对比与单测断言

## 与 v1-58 合并 CSV 的互证步骤（必须可执行）
1. 匿名使用数据 ON。
2. 导出 v1-58：点击 `#export-pro-acquisition-efficiency-by-campaign-7d-csv` 下载合并 CSV。
3. 复制 v1-59：点击 `#copy-pro-acquisition-efficiency-by-campaign-weekly-report` 复制 Markdown。
4. 核对 Env 区块中的 `windowFrom/windowTo` 一致（同一时间窗口径）。
5. 在表格中按 `campaign` 对齐 CSV 与 Markdown，并逐行核对：
   - `leads`、`distCopies`、`leadsPerDistCopy` 均必须一致（分母为 0 时均为 `N/A`）。

