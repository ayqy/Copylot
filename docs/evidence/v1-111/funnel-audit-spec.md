# v1-111 首次成功漏斗审计规范

## 漏斗定义

1. 安装入口
   - 以 `docs/evidence/v1-111/official-links.json` 中的商店安装页 UTM 样例为准。
2. 首次 Popup 打开
   - 以 `copilot_growth_stats.firstPopupOpenedAt` 为准。
3. 首次 `copy_success`
   - 以 `copilot_growth_stats.firstSuccessfulCopyAt` 或 `successfulCopyCount > 0` 为准。

## 本地数据源

- `chrome.storage.local.copilot_growth_stats`
  - `installedAt`
  - `firstPopupOpenedAt`
  - `firstSuccessfulCopyAt`
  - `successfulCopyCount`
- `chrome.storage.local.copilot_telemetry_events`
  - 若开启匿名使用数据，可辅助复核 `popup_opened`、`copy_success`
  - 若关闭匿名使用数据，本轮仍以 `copilot_growth_stats` 为主口径

## 导出路径

1. 自动化回归
   - 执行：`bash scripts/test.sh`
   - 关键覆盖：
     - `e2e/popup-flow.spec.ts`
     - `e2e/popup-growth-flow.spec.ts`
     - `e2e/options-pro-flow.spec.ts`
2. 手工审计
   - 打开扩展并完成一次第一次干净复制。
   - 在扩展页面 DevTools 或测试驱动里读取 `chrome.storage.local`。
   - 导出并记录 `copilot_growth_stats` 快照。

## 对账规则

1. `installedAt <= firstPopupOpenedAt <= firstSuccessfulCopyAt`
2. 若 `successfulCopyCount > 0`，则 Popup 首屏状态必须切换到“第一次干净复制已完成”
3. 当匿名使用数据开启时：
   - `popup_opened` 数量至少为 1
   - `copy_success` 数量至少为 1
4. 当匿名使用数据关闭时：
   - 允许 `copilot_telemetry_events` 为空
   - 仍要求 `copilot_growth_stats` 能证明首次成功已发生

## 人工复核步骤

1. 核对 Popup 首屏、商店说明、截图顺序和安装指引是否都把第一次目标指向长文 / 表格 / 代码块。
2. 按 `first-copy-install-guide.md` 复现一次第一次干净复制。
3. 导出 `copilot_growth_stats`，检查时间字段与计数是否符合对账规则。
4. 若开启匿名使用数据，再导出 `copilot_telemetry_events` 做辅助复核。
