# V1-50 商业化证据索引（每周 Pro 意向证据摘要：7d window 一键生成）

- 生成时间：2026-03-20T23:59:59+08:00
- 扩展版本号：`1.1.23`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip`（本次为 `plugin-1.1.23.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-50/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-50/screenshots/`，文件名规范见 `docs/test-cases/v1-50.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-privacy-pro-weekly-digest-entry.png`
   - 断言：Options -> 隐私与可观测性 -> Pro 意向漏斗摘要面板中存在一键入口 `复制本周 Pro 意向证据摘要`（DOM：`#copy-pro-intent-weekly-digest`）。
2. `screenshots/02-privacy-weekly-digest-telemetry-off.png`
   - 断言：匿名使用数据 OFF：摘要明确提示“匿名使用数据关闭（无可用事件）”，且仅包含环境信息与隐私声明（不包含事件统计明细）。
3. `screenshots/03-privacy-weekly-digest-telemetry-on.png`
   - 断言：匿名使用数据 ON：摘要为 Markdown，包含时间窗（from/to）、关键事件计数（overall + bySource）、关键转化率与环境信息；隐私声明不包含网页内容/复制内容/URL/标题。

## 摘要示例（必须落盘，脱敏、可审计）
- `pro-intent-weekly-digest.off.md`：匿名使用数据 OFF 的示例（不读取/不推断历史）
- `pro-intent-weekly-digest.on.md`：匿名使用数据 ON 的示例（7d window 统计 + 转化率）

## 导出文件清单与命名规范（建议）
必选（本轮 v1-50）：
- `weekly-digest-YYYY-MM-DD--telemetry-on.md`：本周摘要（匿名 ON）
- `weekly-digest-YYYY-MM-DD--telemetry-off.md`：本周摘要（匿名 OFF，用于隐私/开关行为审计）

可选（用于与既有口径互相印证）：
- `pro-funnel-summary.json`：Options -> 隐私页「Pro 意向漏斗摘要」导出
- `pro-funnel-evidence-pack.json`：Options -> 隐私页「Pro 漏斗证据包」导出（含 `events[]`，可按 `from/to` 自行过滤复核 7d 计数）
- `telemetry-events.json`：Options -> 隐私页「本地匿名事件日志」导出（仅 name/ts/props 白名单）

## 最小复盘口径（可从 weekly digest 直接复核）
口径（与摘要字段一致）：
- 入口触达：`pro_entry_opened`
- 候补打开：`pro_waitlist_opened`
- 候补复制：`pro_waitlist_copied`
- 问卷复制：`pro_waitlist_survey_copied`

转化率（分母为 0 输出 `N/A`）：
- `waitlist_opened_per_entry_opened = pro_waitlist_opened / pro_entry_opened`
- `waitlist_copied_per_waitlist_opened = pro_waitlist_copied / pro_waitlist_opened`
- `survey_copied_per_entry_opened = pro_waitlist_survey_copied / pro_entry_opened`

本次样例数据（见 `pro-intent-weekly-digest.on.md`）：

| 指标 | 值 |
| --- | --- |
| pro_entry_opened | 10 |
| pro_waitlist_opened | 6 |
| pro_waitlist_copied | 3 |
| pro_waitlist_survey_copied | 2 |
| waitlist_opened_per_entry_opened | 0.6 |
| waitlist_copied_per_waitlist_opened | 0.5 |
| survey_copied_per_entry_opened | 0.2 |
