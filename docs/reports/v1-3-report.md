# V1-3 低打扰评价引导 MVP（触发条件计数 + 仅提示 1 次）交付简报

## 状态
- 已完成：本地增长统计存储（可审计、仅本地、隐私合规）、成功复制次数累计（成功才 +1；分享文案复制不计入）、Popup 一次性评价引导（满足条件触发且仅展示 1 次）、三按钮交互与落盘、i18n（中英文）、用例文档、单测最小补齐
- 自动化检查通过：`./scripts/test.sh`（包含 `npm run lint`、`npm run type-check`、`npm run check-i18n`、`scripts/unit-tests.ts`、`npm run build:prod`）

## 效果
- 新增 `chrome.storage.local` 统计项 `copilot_growth_stats`：仅包含时间戳/计数/枚举字段（不包含任何复制内容/页面内容/URL）
- 成功复制后累计 `successfulCopyCount`（覆盖：主复制 / Prompt 复制 / Convert Page / Append Mode；失败不累计；分享文案复制不计入）
- Popup 打开时评估触发条件：安装满 72 小时且成功复制 >= 20 且从未展示过 -> 展示评价引导卡片 `#rating-prompt`
- 引导出现即写入 `ratingPromptShownAt`，确保关闭 Popup 也不会重复提示（仅提示 1 次）
- 提供三个稳定按钮：`#rating-prompt-rate`（跳转 reviews + 落盘 action）、`#rating-prompt-later`、`#rating-prompt-never`（关闭卡片 + 落盘 action）
- 评价引导文案支持 i18n（至少中英文）

## 修改范围（目录/文件）
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `docs/test-cases/v1-3.md`
- `docs/reports/v1-3-report.md`
- `scripts/unit-tests.ts`
- `src/background.ts`
- `src/content/content.ts`
- `src/popup/popup.html`
- `src/popup/popup.ts`
- `src/popup/popup.css`
- `src/shared/growth-stats.ts`

