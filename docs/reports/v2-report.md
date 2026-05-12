# V2 E2E 自动化与发布回归（简报）

## 状态
- 已完成：独立 E2E 构建产物与真实扩展加载链路
- 已完成：真实 content / context-menu / popup / options 主路径自动化
- 已完成：将所有自动化测试收口到 `npm run test`
- 已完成：总门禁对外仅保留 `npm run test`
- 已完成：`native-ui` 原生 toolbar icon / 原生右键入口自动化
- 已完成：补齐 HTML→Markdown snapshot 测试并并入统一测试链路

## 实现效果
- `npm run test` 现在是唯一对外测试入口，统一执行 lint / type-check / unit / HTML→Markdown snapshot / 交互测试 / 主 E2E
- 自动化会从真实网页选择、真实 popup 页面、background context menu handler、真实 options 页面覆盖核心用户路径
- `COPYLOT_TEST_ONLY_NATIVE_UI=1 npm run test` 会从打包并加载最新扩展开始，真实点击浏览器工具栏扩展按钮、真实打开扩展面板、真实触发系统右键菜单与 Prompt 子菜单
- popup 增长链路现在会稳定记录 share / feedback / rate / pro survey 等 telemetry，不再因为 popup 立即关闭而丢失
- settings 保存链路修复了部分字段 seed 时的静默失败，popup 设置与 onboarding 完成状态可以稳定落盘
- E2E 与 prod 构建产物隔离，避免 `dist/` 被测试污染

## 当前测试结论
- 主 Playwright 套件：`35 passed`
- `npm run test`：PASS
- `native-ui`：`3 passed`
- `COPYLOT_TEST_ONLY_NATIVE_UI=1 npm run test`：PASS

## 修改范围
- `scripts/inline-build.ts`
- `scripts/test.ts`
- `scripts/html-to-markdown-tests.ts`
- `playwright.config.ts`
- `src/background.ts`
- `src/popup/popup.ts`
- `src/shared/settings-manager.ts`
- `src/e2e/`
- `e2e/`
- `docs/test-cases/v2.md`
- `docs/evidence/v2/e2e-audit.md`
- `docs/reports/v2-report.md`
