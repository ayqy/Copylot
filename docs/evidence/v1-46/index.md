# V1-46 商业化证据索引（Pro 候补提示（低打扰）+ 漏斗取证补齐：曝光 -> 行动）

- 生成时间：2026-03-20T16:58:50+08:00
- 扩展版本号：`1.1.22`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip`（本次为 `plugin-1.1.22.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-46/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-46/screenshots/`，文件名在 `docs/test-cases/v1-46.md` 中有规范；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-popup-pro-waitlist-prompt.png`
   - 断言：Popup 内出现「Pro 候补（可选）」提示（不遮挡主操作，可折叠/可关闭），且包含 `加入候补名单/稍后/不再提示` 三个动作。
2. `screenshots/02-popup-pro-waitlist-prompt-never.png`
   - 断言：点击「不再提示」后提示隐藏；再次打开 Popup 仍不再出现（永久关闭）。
3. `screenshots/03-popup-pro-waitlist-prompt-later.png`
   - 断言：点击「稍后」后提示隐藏；snooze 未到期不再出现；到期后可再提示（总次数上限）。
4. `screenshots/04-privacy-telemetry-off-pro-funnel.png`
   - 断言：匿名使用数据 OFF：不记录、不导出；Pro 意向漏斗摘要/证据包为空且不补发。
5. `screenshots/05-privacy-telemetry-on-pro-funnel.png`
   - 断言：匿名使用数据 ON：导出包含 `pro_prompt_shown/pro_prompt_action`，并能计算“曝光 -> 行动”转化率。

## 证据文件清单（脱敏、可审计）
- `pro-funnel-summary.json`：匿名使用数据开启后导出的「Pro 意向漏斗摘要」落盘文件（包含 `pro_prompt_*`）
- `pro-funnel-evidence-pack.json`：匿名使用数据开启后导出的「Pro Funnel Evidence Pack」落盘文件（白名单字段、无敏感信息）
- `pro-funnel-summary-telemetry-off.json`：匿名使用数据关闭后的摘要导出（应为空/不可用）
- `pro-funnel-evidence-pack-telemetry-off.json`：匿名使用数据关闭后的证据包导出（`events=[]`；不补发）

## 新增事件与口径（曝光分母 -> 行动）
新增匿名事件（仅在“匿名使用数据”开关开启后写入本地 telemetry；默认关闭不记录）：
- `pro_prompt_shown`：提示曝光（`props: { source: 'popup' }`）
- `pro_prompt_action`：用户动作（`props: { source: 'popup', action: 'join' | 'later' | 'never' }`）

摘要/证据包中的关键转化率（与 Options -> 隐私页导出一致）：
- `entry_opened_per_prompt_shown = pro_entry_opened / pro_prompt_shown`
- `waitlist_opened_per_prompt_shown = pro_waitlist_opened / pro_prompt_shown`
- `waitlist_opened_per_entry_opened = pro_waitlist_opened / pro_entry_opened`
- `waitlist_copied_per_waitlist_opened = pro_waitlist_copied / pro_waitlist_opened`
- 分母为 0 时为 `null`

本次样例数据（见 `pro-funnel-summary.json`）：

| source | prompt_shown | prompt_action | entry_opened | waitlist_opened | waitlist_copied | entry/prompt | opened/prompt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| popup | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| options | 0 | 0 | 0 | 0 | 0 | null | null |
| overall | 1 | 1 | 1 | 1 | 1 | 1 | 1 |

## 与 v1-42/v1-44 基线的对比点（可量化、可审计）

1) 相比 `docs/evidence/v1-42/`（Pro 意向漏斗基线）
- v1-42 只有 “入口 -> 候补” 行为事件：`pro_entry_opened/pro_waitlist_opened/pro_waitlist_copied`，缺少“曝光分母”。
- v1-46 补齐 `pro_prompt_shown/pro_prompt_action`，使 Pro 候补 CTA 从“仅有入口”升级为“可量化漏斗（曝光 -> 行动）”。
- 证据包结构保持一致（仅扩展事件集合与 rates 字段），命名规范保持一致，可被 v1-45 的取证/复盘模板直接引用。

2) 相比 `docs/evidence/v1-44/`（WOM 基线）
- v1-44 为 WOM/评分引导的归因与转化口径基线，本轮不改 WOM 指标；仅补齐 Pro 候补漏斗的“曝光 -> 行动”证据链路。

