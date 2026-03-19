# V1-15 设置页补齐“重新查看新手引导”入口：从 Options 一键打开 Popup 三步引导 简报

## 状态
- 已完成：子 PRD `prds/v1-15.md` 全部“具体任务”落地（Options 入口/UI i18n/一键打开逻辑/Popup deeplink/用例文档/简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- Options -> Prompt 管理（`#prompts-tab`）顶部新增“新手引导”提示区块 `#options-onboarding-panel`，按钮 `#options-onboarding-open` 稳定可发现、可 i18n
- 用户点击后使用 `chrome.tabs.create` 在新 Tab 打开 `src/popup/popup.html#onboarding`，Popup 初始化后强制展示 3 步引导（可跳过/可完成/可回看）
- 未携带 `#onboarding` 时，Popup 仍按既有 `shouldAutoShowOnboarding(currentSettings)` 规则仅对未完成用户自动展示，不影响现有首次体验与其它设置

## 修改范围（目录/文件）
- `src/options/options.html`
- `src/options/options.css`
- `src/options/options.ts`
- `src/popup/popup.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `docs/worklog/2026-03-19.md`
- `docs/test-cases/v1-15.md`
- `docs/reports/v1-15-report.md`
- `prds/v1-15-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
