# V1-43 商业化证据索引（WOM 小实验：分享/评价/反馈低打扰优化 + 摘要/证据包）

- 生成时间：2026-03-20T14:54:52+08:00
- 扩展版本号：`1.1.20`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip`（本次为 `plugin-1.1.20.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-43/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-43/screenshots/`，文件名在 `docs/test-cases/v1-43.md` 中有规范；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-popup-wom-entry.png`
   - 断言：Popup 内“分享/复制文案/去评价/反馈”入口可见且可点击。
2. `screenshots/02-popup-wom-share-copy.png`
   - 断言：点击 Popup “复制文案”后按钮反馈为 Copied/已复制（代表写入剪贴板成功）；同时应记录 `wom_share_copied`（`props.source=popup`）。
3. `screenshots/03-popup-rating-prompt.png`
   - 断言：评价引导在满足条件时展示；点击 “Rate/去评价” 会打开商店评价页；并记录 `rating_prompt_shown`、`rating_prompt_action`（`props.source=rating_prompt`）。
4. `screenshots/04-options-wom-panel.png`
   - 断言：Options -> Pro Tab 的“口碑与支持”面板入口可用；点击按钮可在新标签打开（不新增权限）。
5. `screenshots/05-privacy-telemetry-off-wom.png`
   - 断言：Options -> 隐私与可观测性：匿名使用数据开关默认关闭；关闭状态下不记录/不导出（WOM 摘要面板提示不可用；导出应为空且不补发）。
6. `screenshots/06-privacy-telemetry-on-wom.png`
   - 断言：开启匿名使用数据后触发最短路径 WOM 事件；WOM 摘要面板可刷新并展示“分来源计数 + 转化率”；并可导出摘要与证据包（脱敏、可审计）。

## 证据文件清单（脱敏、可审计）
- `wom-summary.json`：匿名使用数据开启后导出的「WOM 摘要」落盘文件
- `wom-evidence-pack.json`：匿名使用数据开启后导出的「WOM Evidence Pack」落盘文件（白名单字段、无敏感信息）
- `wom-summary-telemetry-off.json`：匿名使用数据关闭后的摘要导出（应为空/不可用）
- `wom-evidence-pack-telemetry-off.json`：匿名使用数据关闭后的证据包导出（`events=[]`；不补发）

## 口径（UTM / 事件 / 转化率）
UTM 统一规则（用于商店端可核验来源拆分）：
- `utm_source=copylot-ext`
- `utm_campaign=v1-43`
- `utm_medium`（至少三类）：
  - `popup`（Popup WOM 入口）
  - `options`（Options WOM 入口）
  - `rating_prompt`（评分引导入口）

WOM 摘要口径（与隐私页导出一致）：
- 事件计数：`wom_share_opened/wom_share_copied/wom_rate_opened/wom_feedback_opened/rating_prompt_shown/rating_prompt_action`（按 `props.source` 分组）
- 转化率：
  - `share_copied_per_share_opened = wom_share_copied / wom_share_opened`
  - `rating_prompt_rate_clicked_per_prompt_shown = rating_prompt_action(action=rate) / rating_prompt_shown`
  - 分母为 0 时为 `null`

本次示例导出（见 `wom-summary.json`）：

| source | share_opened | share_copied | rate_opened | feedback_opened | share_copied/share_opened | rating_prompt_shown | rating_rate_clicked/prompt_shown |
| --- | --- | --- | --- | --- | --- | --- | --- |
| popup | 1 | 1 | 1 | 1 | 1 | 0 | null |
| options | 1 | 1 | 1 | 1 | 1 | 0 | null |
| rating_prompt | 0 | 0 | 0 | 0 | null | 1 | 1 |

