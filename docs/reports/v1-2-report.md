# V1-2 新手引导 MVP（Popup 首次打开三步引导 + 可回看）交付简报

## 状态
- 已完成：Popup 三步引导（自动触发/可跳过/可回看/状态持久化）、引导内“一键应用推荐设置”、引导内跳转 Options（管理 Prompts）、i18n（中英文）、用例文档、统一测试入口可执行
- 自动化检查通过：`./scripts/test.sh`（包含 `npm run lint`、`npm run type-check`、`npm run check-i18n`、`scripts/unit-tests.ts`、`npm run build:prod`）

## 效果
- 新装或清空 `copilot_settings` 后首次打开 Popup：自动展示引导 Modal（不新开 Tab），支持上一步/下一步/跳过/完成，并显示 `1/3` 进度
- 完成/跳过后：不再自动弹出；Popup 内提供“新手引导”入口可随时手动回看
- Step1：支持“一键应用推荐设置”（仅基础开关：交互模式/悬停/输出格式/表格格式/附带标题/附带 URL；不改 Prompt/Chat 等存量数据）
- Step3：提供按钮跳转 Options 页（`chrome.runtime.openOptionsPage()`）继续管理 Prompts
- 以上文案支持 i18n（至少中英文）

## 修改范围（目录/文件）
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `docs/worklog/2026-03-18.md`
- `docs/test-cases/v1-2.md`
- `docs/reports/v1-2-report.md`
- `scripts/unit-tests.ts`
- `src/popup/popup.html`
- `src/popup/popup.ts`
- `src/popup/popup.css`
- `src/shared/settings-manager.ts`
