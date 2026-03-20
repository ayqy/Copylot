# V1-53 商业化证据索引（Pro 意向渠道归因最小闭环：campaign 字段 + 可导出可复核）

- 生成时间：2026-03-21T23:59:59+08:00
- 扩展版本号：以 `manifest.json` 为准（本目录样例以当期版本演示）
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip` 解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-53/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-53/screenshots/`，文件名规范见 `docs/test-cases/v1-53.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-options-pro-campaign-field.png`
   - 断言：Options -> Pro Tab 存在渠道输入项（稳定 DOM：`#pro-intent-campaign`），并提示“不要填写敏感信息 + 取值约束（短字符串/字符集）”。
2. `screenshots/02-options-pro-waitlist-copy-with-campaign.png`
   - 断言：campaign 非空时，点击 `复制候补文案` 的文本中可复核 `campaign: <value>`；campaign 为空时不写该行。
3. `screenshots/03-options-pro-waitlist-open-with-campaign.png`
   - 断言：campaign 非空时，点击 `加入候补名单` 打开的 GitHub new issue body 中可复核 `campaign: <value>`；为空时不写该行。
4. `screenshots/04-options-pro-survey-copy-with-campaign.png`
   - 断言：campaign 非空时，点击 `复制问卷（含环境信息）` 的 Markdown 中可复核 `campaign: <value>`；为空时不写该行。
5. `screenshots/05-privacy-pro-evidence-pack-campaign.png`
   - 断言：匿名使用数据 ON 时，隐私页「Pro 意向漏斗证据包」events 明细中可复核 `props.campaign`（值仅来源于用户输入/本地设置）。
6. `screenshots/06-privacy-weekly-digest-campaign-breakdown.png`
   - 断言：匿名使用数据 ON 时，隐私页「复制本周 Pro 意向证据摘要」Markdown 末尾包含 campaign 拆分统计（至少覆盖 `pro_waitlist_copied/pro_waitlist_survey_copied` 的计数）。

## 摘要示例（必须落盘，脱敏、可审计）
- `pro-intent-weekly-digest.campaign.on.md`：匿名使用数据 ON 的 weekly digest 示例（含 campaign 拆分表格）

## 证据包示例（必须落盘，脱敏、可审计）
- `pro-funnel-evidence-pack.campaign.json`：Pro 意向漏斗证据包导出样例（events 中含 `props.campaign`）

## 最小复盘口径（按 campaign 可在表格中复算）
事件口径（与 weekly digest 一致）：
- `pro_entry_opened`
- `pro_waitlist_opened`
- `pro_waitlist_copied`
- `pro_waitlist_survey_copied`

campaign 拆分统计（weekly digest 末尾表格）：
- 对 `pro_waitlist_copied/pro_waitlist_survey_copied` 两个事件，按 `props.campaign` 聚合计数。
- `props.campaign` 为空：事件 props 不写入该字段；摘要表格会以 `(none)` 归档（用于与 overall 计数对齐复核）。

渠道留资效率（可选复算，分母为 0 输出 `N/A`）：
- `survey_copied_per_waitlist_copied_by_campaign = pro_waitlist_survey_copied / pro_waitlist_copied`

