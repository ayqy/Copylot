# V1-6 匿名本地事件埋点清单（仅本地、可审计、隐私优先）

## 范围与原则
- **仅本地**：本阶段不做任何联网发送，不引入第三方分析 SDK。
- **开关控制**：Options 页“匿名使用数据”默认关闭；仅在开启时写入本地匿名事件日志。
- **严格字段**：事件只允许 `name/ts/props(白名单)`；`props` 仅保留白名单 key 且值为 `string|number|boolean`。
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
| `rating_prompt_shown` | 评价引导展示 | `src/popup/popup.ts` `maybeShowRatingPrompt()` | 无 | 不包含任何用户内容 | 仅在满足条件且展示时记录 |
| `rating_prompt_action` | 评价引导按钮点击 | `src/popup/popup.ts` 评价引导按钮点击 | `{ action: 'rate' \| 'later' \| 'never' }` | 不包含任何用户内容 | 记录用户选择 |
| `wom_feedback_opened` | 打开反馈入口 | `src/popup/popup.ts` 点击“反馈” | 无 | 不包含任何用户内容 | 打开 GitHub Issue |
| `wom_share_opened` | 打开分享入口 | `src/popup/popup.ts` 点击“分享” | 无 | 不包含任何用户内容 | 打开商店详情页 |
| `wom_share_copied` | 复制分享文案成功 | `src/popup/popup.ts` 点击“复制分享文案”且写入剪贴板成功 | 无 | 不包含任何用户内容 | 仅在写入成功时记录 |
| `wom_rate_opened` | 打开去评价入口 | `src/popup/popup.ts` 点击“去评价” | 无 | 不包含任何用户内容 | 打开商店评价页 |
| `copy_success` | 确认写入剪贴板成功 | `src/content/content.ts`：主复制、Prompt 复制、右键菜单/消息链路复制、追加模式复制成功路径 | 无 | 不包含任何用户内容 | 仅在写入成功后记录 |
| `prompt_used` | Prompt 链路触发且复制成功 | `src/content/content.ts`：Prompt 菜单复制 / `PROCESS_*_WITH_PROMPT*` 消息链路复制成功路径 | 无 | 不包含任何用户内容 | 与 `copy_success` 同次成功复制配对出现 |
| `pro_entry_opened` | 打开 Pro 入口（升级 Pro / Pro Tab） | Popup：`src/popup/popup.ts` 点击 `#upgrade-pro-entry`；Options：`src/options/options.ts` 激活 `#pro-tab` | `{ source: 'popup' \| 'options' }` | 不包含任何用户内容 | 仅记录意向入口触达 |
| `pro_waitlist_opened` | 打开候补登记页 | Popup：`src/popup/popup.ts` 点击 `#popup-pro-waitlist`；Options：`src/options/options.ts` 点击 `#pro-waitlist-button` | `{ source: 'popup' \| 'options' }` | 不包含任何用户内容；候补链接仅预填环境信息与占位提示 | 打开 GitHub `issues/new` |
| `pro_waitlist_copied` | 复制候补文案成功 | Options：`src/options/options.ts` 点击 `#pro-waitlist-copy` 且写入剪贴板成功 | `{ source: 'options' }` | 不包含任何用户内容；复制内容为候补模板（仅环境信息 + 占位提示） | 仅在写入成功时记录 |

## 开关与清理
- 开关字段：`Settings.isAnonymousUsageDataEnabled`
- Options 开关实现：`src/options/options.ts`（`anonymous-usage-data-switch`）
- 关闭开关后清空：`src/options/options.ts` 调用 `clearTelemetryEvents()`；同时 `src/shared/telemetry.ts` 监听 `chrome.storage.sync` 变更，检测从开到关时也会触发清空（兜底）。
