# V1-106 Functional Iteration Brief

## 状态

- 已完成：Popup 新增 Pro 高意向直达卡片。
- 已完成：Options Pro 问卷支持预填 use case 和能力选择。
- 已完成：`pro_waitlist_survey_copied` 增加 `prefill_used / prefill_capability_count` 本地审计字段。
- 已完成：相关 i18n、单测、E2E、build 验证。

## 实现效果

- 高意向用户不再从空白问卷开始，而是可以先在 Popup 里表达“最想先解决什么”。
- 问卷样本现在能区分是否来自 Popup 预填直达，有利于后续判断最值得优先实现的 Pro 能力。
- 保持原有隐私边界：
  - 不记录用户原文
  - 不记录网页 URL / 标题 / 复制内容
  - 只记录布尔值和能力数量

## 验证

- `npm run type-check`
- `npm run check-i18n`
- `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts`
- `npm run build:e2e`
- `COPYLOT_E2E_SKIP_BUILD=1 npx playwright test --config=playwright.config.ts --project=main e2e/popup-flow.spec.ts e2e/options-pro-flow.spec.ts`
- `bash scripts/test.sh`

## 修改范围

- `src/popup/`
- `src/options/`
- `src/shared/`
- `_locales/`
- `e2e/`
- `docs/growth/telemetry-events.md`
- `docs/roadmap_status.md`
- `docs/test-cases/v1-106.md`
- `docs/reports/v1-106-report.md`
- `docs/reports/v1-106-functional-report.md`
- `prds/v3.md`
