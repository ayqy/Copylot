# v4-1 第二次打开复用审计说明

## 审计目标

复核链路是否满足：

`首次 copy_success -> 快捷 Prompt 槽位曝光 -> 快捷 Prompt 槽位点击 -> 快捷 Prompt 槽位使用 -> 第二次 copy_success`

## 字段来源

- `copilot_growth_stats.firstSuccessfulCopyAt`
  - 来源：第一次复制成功后由 `growth-stats-increment-successful-copy` 写入。
- `copilot_growth_stats.secondSuccessfulCopyAt`
  - 来源：当 `successfulCopyCount` 从 `1` 增加到 `2` 时写入。
- `copilot_growth_stats.firstQuickPromptSlotShownAt`
  - 来源：首次成功后打开 Popup 或进入 Onboarding 复用步骤时写入。
- `copilot_growth_stats.quickPromptSlotShownCount`
  - 来源：每次在复用路径展示快捷 Prompt 主行动时递增。
- `copilot_growth_stats.firstQuickPromptSlotClickedAt`
  - 来源：Popup / Onboarding 中点击快捷 Prompt 槽位时写入。
- `copilot_growth_stats.quickPromptSlotClickedCount`
  - 来源：每次点击快捷 Prompt 槽位时递增。
- `copilot_growth_stats.firstQuickPromptSlotUsedAt`
  - 来源：快捷 Prompt 触发并完成复制成功时写入。
- `copilot_growth_stats.quickPromptSlotUsedCount`
  - 来源：快捷 Prompt 触发并完成复制成功时递增。
- `copilot_telemetry_events`
  - 相关事件：
    - `quick_prompt_slot_shown`
    - `quick_prompt_slot_clicked`
    - `quick_prompt_slot_used`
    - `prompt_used`
    - `copy_success`

## 判定口径

- “首次成功”：
  - `firstSuccessfulCopyAt` 有值，或 `successfulCopyCount >= 1`
- “快捷 Prompt 槽位曝光”：
  - `firstQuickPromptSlotShownAt` 有值，且匿名事件中存在 `quick_prompt_slot_shown`
- “快捷 Prompt 槽位点击”：
  - `firstQuickPromptSlotClickedAt` 有值，且匿名事件中存在 `quick_prompt_slot_clicked`
- “快捷 Prompt 槽位使用”：
  - `firstQuickPromptSlotUsedAt` 有值，且匿名事件中存在 `quick_prompt_slot_used`
- “第二次成功复制”：
  - `secondSuccessfulCopyAt` 有值，或 `successfulCopyCount >= 2`

## 隐私约束

- 不记录复制内容。
- 不记录网页原文、标题、URL。
- 只记录时间戳、计数、槽位编号、入口来源等本地匿名字段。

## 样例顺序

1. `firstSuccessfulCopyAt = 1710000001000`
2. `firstQuickPromptSlotShownAt = 1710000005000`
3. `firstQuickPromptSlotClickedAt = 1710000007000`
4. `firstQuickPromptSlotUsedAt = 1710000007100`
5. `secondSuccessfulCopyAt = 1710000007100`

以上顺序满足“首次成功 <= Prompt 复用 <= 第二次成功复制”。
