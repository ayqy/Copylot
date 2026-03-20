# V1-58 商业化证据索引（渠道分发/投放效率复盘一键化：按 campaign 合并导出 leads + distCopies + leads_per_dist_copy（7d））

- 生成时间：2026-03-21T12:30:00+08:00
- 扩展版本号：`1.1.28`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip` 解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-58/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-58/screenshots/`，文件名规范见 `docs/test-cases/v1-58.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-privacy-pro-acq-efficiency-entry.png`
   - 断言：Options -> 隐私与可观测性 -> Pro 面板存在稳定入口 `#export-pro-acquisition-efficiency-by-campaign-7d-csv`，且与 v1-54/v1-57 导出入口同区域。
2. `screenshots/02-privacy-pro-acq-efficiency-disabled.png`
   - 断言：匿名使用数据 OFF 时，入口置灰且不读取/不推断本地 events。
3. `screenshots/03-privacy-pro-acq-efficiency-export-success.png`
   - 断言：匿名使用数据 ON 时，可成功下载 7d 合并 CSV；文件名/字段顺序稳定；含 `空 campaign` 桶。

## 样例（必须落盘，脱敏、可审计、可复核）
- `pro-acquisition-efficiency-by-campaign-7d.sample.csv`：v1-58 合并导出样例（至少 2 个 campaign + `空 campaign` 行；含 `distCopies=0 -> N/A`）

## 口径与可审计说明（重要）

1) 数据来源（隐私红线）
- 仅来源于本地匿名事件日志 `copilot_telemetry_events`（白名单 + 枚举校验 + FIFO window）。
- 不新增扩展权限；不联网发送数据；不采集用户复制内容；导出不包含网页内容/URL/标题/复制内容。

2) 7d window 口径（与 v1-51/v1-54/v1-57 保持一致，便于互证）
- `windowTo = exportedAt`（ms）
- `windowFrom = exportedAt - 7d`（ms）
- 过滤规则：`ts < windowFrom` 排除，`ts = windowFrom/windowTo` 均包含。

3) campaign 维度（空桶必须存在）
- `campaign` 仅来源于用户手动输入/本地设置且通过既有校验（不得包含敏感信息）。
- 当事件 `props.campaign` 缺失/空字符串时，归入 `空 campaign` 桶（用于发现投放/分发漏填）。

4) 指标定义（必须可复核）
- `leads`（复用 v1-54）：`pro_waitlist_copied + pro_waitlist_survey_copied`，按 campaign 聚合（仅统计 `source in ('popup','options')` 且落在 7d window 内的事件）。
- `distCopies`（复用 v1-57）：事件 `pro_distribution_asset_copied` 按 `action` 聚合求和，再按 campaign 聚合（仅统计 `source='options'` 且 `action in ('waitlist_url','recruit_copy','store_url','distribution_pack')` 且落在 7d window 内的事件）。
- `leadsPerDistCopy = leads / distCopies`
  - 当 `distCopies = 0` 时输出 `N/A`（避免除零与误读）。
  - 小数格式固定为 4 位（例如 `0.5000`），便于审计对比与单测断言。

5) CSV 固定字段（顺序必须稳定）
- `exportedAt,extensionVersion,windowFrom,windowTo,lookbackDays,campaign,leads,distCopies,leadsPerDistCopy`

## 与 v1-54 / v1-57 的互证步骤（必须可执行）
1. 导出 v1-54：`#export-pro-intent-by-campaign-7d-csv` 得到 `leads`（按 campaign）。
2. 导出 v1-57：`#export-pro-distribution-by-campaign-7d-csv` 得到 `distCopies`（按 campaign）。
3. 导出 v1-58：`#export-pro-acquisition-efficiency-by-campaign-7d-csv` 得到合并表。
4. 在表格中按 `campaign` 对齐三份 CSV，并逐行复算：
   - `leadsPerDistCopy = leads / distCopies`（分母为 0 输出 `N/A`）。
5. 任意 campaign 行的 `leads/distCopies` 必须分别与 v1-54/v1-57 导出一致（可审计复核）。

