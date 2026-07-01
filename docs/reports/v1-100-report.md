# V1-100 Pro 意向转化最小增量简报

## 状态

- 已完成：三入口 CTA attribution 统一到 `source / medium / content / campaign`。
- 已完成：Popup 问卷最短路径埋点，新增 `pro_intent_form_start / pro_intent_form_submit`。
- 已完成：隐私页新增 v1-100 JSON / CSV 下载入口。
- 已完成：离线证据脚本 `scripts/build-pro-intent-v1-100-evidence.ts`，可落盘 `docs/evidence/v1-100/`。

## 效果

- 入口归因更细：现在能区分 `popup_upgrade_cta / popup_waitlist_cta / popup_survey_cta / options_*`。
- 问卷最短路径更清晰：Popup 深链进入问卷时，`form_start -> form_submit` 可直接复盘。
- 证据闭环更完整：`intent-funnel-summary-v1-100.json` 与 `intent-funnel-v1-100.csv` 可直接展示转化漏斗。

## 测试

- `npm run type-check`
- `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts`
- `npx playwright test --config=playwright.config.ts --project=main e2e/options-pro-flow.spec.ts`
- `bash scripts/test.sh`

## 修改范围

- `src/popup/`
- `src/options/`
- `src/shared/`
- `_locales/`
- `scripts/`
- `e2e/`
- `prds/v1-100-*.md`
- `docs/evidence/v1-100/`
- `docs/test-cases/v1-100.md`
- `docs/growth/executions/v1-100-pro-intent.md`
- `docs/reports/v1-100-report.md`
