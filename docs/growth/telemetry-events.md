# V1-6 匿名本地事件埋点清单（仅本地、可审计、隐私优先）

## 范围与原则
- **仅本地**：本阶段不做任何联网发送，不引入第三方分析 SDK。
- **开关控制**：Options 页“匿名使用数据”默认关闭；仅在开启时写入本地匿名事件日志。
- **严格字段**：事件只允许 `name/ts/props(白名单)`；`props` 仅保留白名单 key 且值为 `string|number|boolean`。
- **枚举收敛**：对枚举型 props（如 `source/action`）做固定取值校验；非法值会在 `sanitizeTelemetryEvent` 中丢弃（事件保留，但 `props` 可能变为 `undefined`）。
- **渠道归因（campaign，可选）**：仅用于 Pro 意向事件的可选 `props.campaign`；只允许短字符串（`1-32`，字符集 `[A-Za-z0-9._-]`，且必须以字母/数字开头）；仅来源于用户在 Options -> Pro Tab 的手动输入/本地设置，不允许从网页内容/复制内容/URL/标题中派生。
- **隐私约束**：不得包含任何用户复制内容/页面内容/URL/标题等。
- **保留策略**：最多保留最近 `100` 条，超出后 FIFO 丢弃最旧；关闭开关后立刻清空本地日志。

## 存储位置
- Storage：`chrome.storage.local`
- Key：`copilot_telemetry_events`
- Max：`100`
- 过滤与裁剪实现：`src/shared/telemetry.ts`（`sanitizeTelemetryEvent` / `trimTelemetryEvents`）

## 事件列表
| 事件名 | 触发时机 | 触发位置（文件/交互） | props（白名单） | 隐私约束 | 备注 |
|---|---|---|---|---|---|
| `popup_opened` | Popup 打开 | `src/popup/popup.ts` `initialize()` | 无 | 不包含任何用户内容 | 仅记录打开动作 |
| `onboarding_shown` | 新手引导展示 | `src/popup/popup.ts` `openOnboardingModal(source)` | `{ source: 'auto' \| 'manual' }` | 不包含任何用户内容 | `auto`=自动弹出；`manual`=手动重开 |
| `onboarding_completed` | 新手引导结束 | `src/popup/popup.ts` `completeOnboarding(action)` | `{ source: 'auto' \| 'manual', action: 'finish' \| 'skip' }` | 不包含任何用户内容 | `finish`=完成；`skip`=关闭/跳过/ESC/点击遮罩 |
| `rating_prompt_shown` | 评价引导展示 | `src/popup/popup.ts` `maybeShowRatingPrompt()` | `{ source: 'rating_prompt' }` | 不包含任何用户内容 | 仅在满足条件且展示时记录（source 用于与 popup/options 口径拆分） |
| `rating_prompt_action` | 评价引导按钮点击 | `src/popup/popup.ts` 评价引导按钮点击 | `{ source: 'rating_prompt', action: 'rate' \| 'later' \| 'never' }` | 不包含任何用户内容 | 记录用户选择（rate=打开商店评价页） |
| `wom_feedback_opened` | 打开反馈入口 | Popup：`src/popup/popup.ts` 点击“反馈”；Options：`src/options/options.ts` 点击 `#wom-feedback-open` | `{ source: 'popup' \| 'options' }` | 不包含任何用户内容 | 打开 GitHub Issue |
| `wom_share_opened` | 打开分享入口 | Popup：`src/popup/popup.ts` 点击“分享”；Options：`src/options/options.ts` 点击 `#wom-share-open` | `{ source: 'popup' \| 'options' }` | 不包含任何用户内容 | 打开商店详情页 |
| `wom_share_copied` | 复制分享文案成功 | Popup：`src/popup/popup.ts` 点击“复制分享文案”且写入剪贴板成功；Options：`src/options/options.ts` 点击 `#wom-share-copy` 且写入剪贴板成功 | `{ source: 'popup' \| 'options' }` | 不包含任何用户内容 | 仅在写入成功时记录 |
| `wom_rate_opened` | 打开去评价入口 | Popup：`src/popup/popup.ts` 点击“去评价”；Options：`src/options/options.ts` 点击 `#wom-rate-open` | `{ source: 'popup' \| 'options' }` | 不包含任何用户内容 | 打开商店评价页 |
| `copy_success` | 确认写入剪贴板成功 | `src/content/content.ts`：主复制、Prompt 复制、右键菜单/消息链路复制、追加模式复制成功路径 | 无 | 不包含任何用户内容 | 仅在写入成功后记录 |
| `prompt_used` | Prompt 链路触发且复制成功 | `src/content/content.ts`：Prompt 菜单复制 / `PROCESS_*_WITH_PROMPT*` 消息链路复制成功路径 | 无 | 不包含任何用户内容 | 与 `copy_success` 同次成功复制配对出现 |
| `pro_prompt_shown` | Popup 内 Pro 候补提示曝光 | `src/popup/popup.ts` `maybeShowProWaitlistPrompt()`（仅在展示时记录） | `{ source: 'popup' }` | 不包含任何用户内容 | 仅用于计算“曝光分母 -> 行动”漏斗；开关关闭不记录 |
| `pro_prompt_action` | Popup 内 Pro 候补提示用户动作 | `src/popup/popup.ts` Pro 候补提示按钮点击 | `{ source: 'popup', action: 'join' \| 'later' \| 'never' }` | 不包含任何用户内容 | `join`=打开 Options -> Pro Tab；`later`=按策略延迟再提示；`never`=永久不再提示 |
| `pro_entry_opened` | 打开 Pro 入口（升级 Pro / Pro Tab） | Popup：`src/popup/popup.ts` 点击 `#upgrade-pro-entry`；Options：`src/options/options.ts` 激活 `#pro-tab` | `{ source: 'popup' \| 'options', campaign?: string }` | `campaign` 仅来源于用户输入（Options -> Pro Tab），不包含网页内容/复制内容/URL/标题 | `campaign` 为空不写入 props |
| `pro_waitlist_opened` | 打开候补登记页 | Popup：`src/popup/popup.ts` 点击 `#popup-pro-waitlist`；Options：`src/options/options.ts` 点击 `#pro-waitlist-button` | `{ source: 'popup' \| 'options', campaign?: string }` | 不包含任何用户内容；候补链接仅预填环境信息与占位提示；`campaign` 仅来源于用户输入 | 打开 GitHub `issues/new` |
| `pro_waitlist_copied` | 复制候补文案成功 | Popup：`src/popup/popup.ts` 点击 `#popup-pro-waitlist-copy` 且写入剪贴板成功；Options：`src/options/options.ts` 点击 `#pro-waitlist-copy` 且写入剪贴板成功 | `{ source: 'popup' \| 'options', campaign?: string }` | 不包含任何用户内容；复制内容为候补模板（仅环境信息 + 占位提示）；`campaign` 仅来源于用户输入 | 仅在写入成功时记录 |
| `pro_waitlist_survey_copied` | 复制“付费意向问卷（可选）”成功 | Options：`src/options/options.ts` 点击 `#pro-waitlist-survey-copy` / `#pro-waitlist-survey-copy-open` 且写入剪贴板成功 | `{ source: 'options', campaign?: string }` | 不包含任何网页内容/复制内容/URL/标题；复制内容为“环境信息 + 用户手动填写问卷”Markdown；`campaign` 仅来源于用户输入 | `campaign` 为空不写入 props |
| `pro_distribution_asset_copied` | 渠道分发工具包资产复制成功 | Options：`src/options/options.ts` 点击 `#pro-waitlist-url-copy` / `#pro-waitlist-recruit-copy` / `#pro-store-url-copy` / `#pro-distribution-pack-copy` 且写入剪贴板成功 | `{ source: 'options', campaign: string, action: 'waitlist_url' \| 'recruit_copy' \| 'store_url' \| 'distribution_pack' }` | 不包含任何网页内容/复制内容/URL/标题；复制内容仅为固定模板 + 环境信息（如有）+ campaign + 商店/候补链接 | 仅在写入成功时记录；仅在匿名开关 ON 时记录 |

## 开关与清理
- 开关字段：`Settings.isAnonymousUsageDataEnabled`
- Options 开关实现：`src/options/options.ts`（`anonymous-usage-data-switch`）
- 关闭开关后清空：`src/options/options.ts` 调用 `clearTelemetryEvents()`；同时 `src/shared/telemetry.ts` 监听 `chrome.storage.sync` 变更，检测从开到关时也会触发清空（兜底）。
