# V1-107 Functional Iteration Brief

## 状态

- 已完成：`Options -> Pro` 新增快捷诉求入口，避免直接进入 Pro 页的用户从空白问卷开始。
- 已完成：快捷诉求点击后自动预填 `use case + capability`，并滚动聚焦到问卷主体。
- 已完成：新增 `options_quick_intent_cta` 漏斗口径，用于区分这类入口的 `entry/start` 样本。
- 已完成：相关 i18n、类型检查、E2E 和构建验证。

## 实现效果

- 之前只有 Popup 入口具备“先表达诉求，再进入问卷”的低摩擦承接；现在 `Options -> Pro` 的直达用户也能快速进入结构化样本路径。
- 新增入口不会改写隐私边界：
  - 不抓网页内容
  - 不抓 URL / 标题
  - 不上传任何问卷内容
  - 仍然只记录本地匿名事件和布尔/计数字段
- 后续导出 `v1-100` 漏斗时，可以单独观察 `options_quick_intent_cta` 是否比原始 `options_survey_cta` 更容易形成提交样本。

## 验证

- `npm run type-check`
- `npm run check-i18n`
- `npm run build:e2e`
- `COPYLOT_E2E_SKIP_BUILD=1 npx playwright test --config=playwright.config.ts --project=main e2e/options-pro-flow.spec.ts`

## 修改范围

- `src/options/`
- `src/shared/`
- `_locales/`
- `e2e/options-pro-flow.spec.ts`
- `docs/test-cases/v1-107.md`
