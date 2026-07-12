# v4-14 交付简报

## 状态

- 已完成：新增 `stay_validation` 外部话术守门共享逻辑与脚本入口。
- 已完成：`Options -> Pro` 新增守门区块，支持复制 Markdown 与下载 JSON。
- 已完成：`scripts/check-i18n.ts`、`scripts/unit-tests.ts`、`scripts/ui-integration-tests.ts`、`e2e/options-pro-flow.spec.ts`、`scripts/test.ts` 已覆盖规则常量、区块可见性和导出产物。
- 已完成：`docs/test-cases/v4-14.md`、`docs/evidence/v4-14/*`、`docs/roadmap.md`、`docs/roadmap_status.md` 已同步更新。

## 效果

- 当前不再需要人工逐句检查官网、商店和扩展内话术是否越界，可以直接导出一份守门包，看到每个对外 surface 的 `status`、命中的验证词和收费禁词命中情况。
- 本轮样例产物中四个 surface 全部 `aligned`，说明最新对外口径已经统一锁定为“当前优先验证方向 / stay_validation”。
- 这轮推进的是外部话术治理能力，不是收费实现；下一步仍然要优先补 `ph / reddit / seo` 样本。

## 修改范围

- 共享逻辑与脚本：
  - `src/shared/pro-stay-validation-messaging-guard.ts`
  - `scripts/build-pro-stay-validation-messaging-guard-pack.ts`
- Options Pro 与本地化：
  - `src/options/options.html`
  - `src/options/options.ts`
  - `_locales/en/messages.json`
  - `_locales/zh/messages.json`
- 自动化测试：
  - `scripts/check-i18n.ts`
  - `scripts/unit-tests.ts`
  - `scripts/ui-integration-tests.ts`
  - `e2e/options-pro-flow.spec.ts`
  - `scripts/test.ts`
- 文档与证据：
  - `prds/v4-14.md`
  - `docs/test-cases/v4-14.md`
  - `docs/evidence/v4-14/*`
  - `docs/roadmap.md`
  - `docs/roadmap_status.md`
  - `docs/reports/v4-14-report.md`

## 测试结果

- `npm run check-i18n`：通过。
- `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/test.ts`：通过。
- 汇总结果：`32 passed, 0 failed, 1 skipped`。
- 关键覆盖：
  - `build-pro-stay-validation-messaging-guard-pack`：通过
  - `unit-tests`：通过
  - `ui-integration-tests`：通过
  - `playwright:main`：`49 passed`
  - `html-to-markdown-tests`：`14 passed`
