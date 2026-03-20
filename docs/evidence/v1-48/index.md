# V1-48 商业化证据索引（Pro 候补留资降摩擦：Options 内嵌“付费意向问卷”+ 漏斗取证增强）

- 生成时间：2026-03-20T18:36:19+08:00
- 扩展版本号：`1.1.22`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip`（本次为 `plugin-1.1.22.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-48/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-48/screenshots/`，文件名在 `docs/test-cases/v1-48.md` 中有规范；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-options-pro-survey.png`
   - 断言：Options -> Pro Tab 存在“付费意向问卷（可选）”区块（可定位 `#pro-waitlist-survey`），并包含 `复制问卷（含环境信息）/复制并打开候补` 按钮。
2. `screenshots/02-options-pro-survey-copied.png`
   - 断言：点击复制后按钮反馈为 Copied/已复制（代表写入剪贴板成功）；复制内容不包含网页内容/复制内容/URL/标题。
3. `screenshots/03-privacy-telemetry-off-pro-funnel.png`
   - 断言：匿名使用数据 OFF：不记录、不导出；导出不包含 `pro_waitlist_survey_copied`（与既有隐私口径一致）。
4. `screenshots/04-privacy-telemetry-on-pro-funnel.png`
   - 断言：匿名使用数据 ON：Pro Funnel 摘要/证据包可导出，且包含新事件 `pro_waitlist_survey_copied` 的 `count/lastTs`（或至少在 `events[]` 中可见）。

## 证据文件清单（脱敏、可审计）
- `pro-funnel-summary.json`：匿名使用数据开启后导出的「Pro 意向漏斗摘要」落盘文件（包含 `pro_waitlist_survey_copied`）
- `pro-funnel-evidence-pack.json`：匿名使用数据开启后导出的「证据包」落盘文件（白名单字段、无敏感信息）
- `pro-funnel-summary-telemetry-off.json`：匿名使用数据关闭后的摘要导出（应为空/不可用）
- `pro-funnel-evidence-pack-telemetry-off.json`：匿名使用数据关闭后的证据包导出（`events=[]`；不补发）

## 最小复盘口径（可从导出结果复核）
口径定义（与 Options -> 隐私页导出一致）：
- 问卷复制次数：`pro_waitlist_survey_copied`
- 候补打开次数：`pro_waitlist_opened`
- 候补复制次数：`pro_waitlist_copied`

本次样例数据（见 `pro-funnel-summary.json`）：

| source | survey_copied | waitlist_opened | waitlist_copied |
| --- | --- | --- | --- |
| popup | 0 | 0 | 0 |
| options | 1 | 1 | 1 |
| overall | 1 | 1 | 1 |

