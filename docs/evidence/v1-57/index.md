# V1-57 商业化证据索引（渠道分发工具包升级：商店安装链接/完整投放包一键复制 + 分发动作取证导出）

- 生成时间：2026-03-21T12:00:00+08:00
- 扩展版本号：`1.1.28`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip`（当前为 `plugin-1.1.28.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-57/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-57/screenshots/`，文件名规范见 `docs/test-cases/v1-57.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-pro-distribution-toolkit-entry.png`
   - 断言：Options -> Pro 的「渠道分发工具包」存在 4 个复制入口（稳定 DOM：`#pro-waitlist-url-copy` / `#pro-waitlist-recruit-copy` / `#pro-store-url-copy` / `#pro-distribution-pack-copy`）。
2. `screenshots/02-pro-distribution-toolkit-disabled.png`
   - 断言：campaign 为空/非法时，4 个按钮均置灰，且提示 `#pro-waitlist-distribution-campaign-required` 可见。
3. `screenshots/03-pro-distribution-toolkit-enabled.png`
   - 断言：campaign 合法时，4 个按钮均可用；复制内容仅为固定模板 + campaign + 商店/候补链接（不包含网页内容/复制内容/URL/标题）。
4. `screenshots/04-pro-distribution-toolkit-copied.png`
   - 断言：复制成功后按钮短暂变为“已复制”（取证用户完成了“分发动作”）。
5. `screenshots/05-privacy-pro-distribution-export-disabled.png`
   - 断言：匿名使用数据 OFF 时，导出入口 `#export-pro-distribution-by-campaign-7d-csv` 置灰且不读取/不推断本地 events。
6. `screenshots/06-privacy-pro-distribution-export-success.png`
   - 断言：匿名使用数据 ON 时，可导出过去 7 天按 campaign 聚合 CSV（字段顺序稳定、无 BOM、含 `空 campaign` 桶）。

## 样例（必须落盘，脱敏、可审计、可复核）
- `store-url.sample.txt`：商店安装链接样例（含 UTM + campaign，可解码复核）
- `distribution-pack.sample.md`：完整投放包样例（Markdown，包含商店安装链接 + 候补链接 + 招募文案 + 可选问卷引导）
- `pro-distribution-by-campaign-7d.sample.csv`：按 campaign 聚合 7d 分发动作导出样例

## 口径与可审计说明（重要）

1) 数据来源（隐私红线）
- 分发动作取证仅来源于本地匿名事件日志 `copilot_telemetry_events`（白名单 + 枚举校验）。
- 不新增扩展权限；不联网发送数据；不采集用户复制内容；不包含网页内容/当前网页 URL/标题等。

2) 事件白名单与 props 枚举（可复核）
- 事件名：`pro_distribution_asset_copied`
- 仅统计 `props.source='options'` 且 `props.action in ('waitlist_url','recruit_copy','store_url','distribution_pack')` 的事件。
- `campaign` 仅来源于用户在 Options -> Pro Tab 的手动输入（需通过既有校验；不得包含敏感信息）。

3) 7d window 口径（与 v1-51/v1-54 保持一致，便于互证）
- `windowTo = exportedAt`（ms）
- `windowFrom = exportedAt - 7d`（ms）
- 过滤规则：`ts < windowFrom` 排除，`ts = windowFrom/windowTo` 均包含。

4) 聚合维度：campaign（空桶必须存在）
- 当事件 `props.campaign` 缺失/空字符串时，归入 `空 campaign` 桶。

5) 指标定义（用于复盘/对齐）
- `distCopies = waitlistUrlCopied + recruitCopyCopied + storeUrlCopied + distributionPackCopied`
- `leads_per_dist_copy = leads / distCopies`（分母为 0 输出 `N/A`）
  - 其中 `leads` 来自 v1-54 的「Pro 意向按 campaign 聚合 7d CSV 导出」。

## 与 v1-54 的对齐复算（必须可执行）
- 导出 v1-54：`#export-pro-intent-by-campaign-7d-csv` 得到 `leads`（按 campaign）。
- 导出 v1-57：`#export-pro-distribution-by-campaign-7d-csv` 得到 `distCopies`（按 campaign）。
- 在表格中按 campaign 对齐两份 CSV，复算 `leads_per_dist_copy = leads / distCopies`（分母为 0 输出 `N/A`）。

