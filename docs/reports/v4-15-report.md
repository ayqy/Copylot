# v4-15 交付简报

## 状态

- 已完成：新增单独的人类批准窗口 tracker 共享逻辑与脚本入口。
- 已完成：`Options -> Pro` 新增 tracker 区块，支持复制 Markdown 与下载 JSON。
- 已完成：自动化测试已覆盖三项检查同窗逻辑、`hold_validation` 分支和导出确定性。
- 已完成：`docs/test-cases/v4-15.md`、`docs/evidence/v4-15/*`、`docs/roadmap.md`、`docs/roadmap_status.md` 已同步更新。

## 效果

- 当前不再需要手工判断“是否已经接近人类批准窗口”，tracker 已明确要求 `payment audit`、`campaign review` 与 `messaging guard` 在同一窗口里同时通过。
- 本轮样例仍为 `tracker_status=hold_validation`，被 `payment audit` 和 `campaign review` blocker 拦下，避免误把话术守门单独对齐解释成收费放行。
- roadmap 中“人类批准门槛 tracker”已具备产品内导出能力，但收费实现规划仍未开始。

## 修改范围

- 共享逻辑与脚本：
  - `src/shared/pro-human-approval-window-tracker.ts`
  - `scripts/build-pro-human-approval-window-tracker-pack.ts`
- Options Pro 与本地化：
  - `src/options/options.html`
  - `src/options/options.ts`
  - `_locales/en/messages.json`
  - `_locales/zh/messages.json`
- 自动化测试：
  - `scripts/unit-tests.ts`
  - `scripts/ui-integration-tests.ts`
  - `e2e/options-pro-flow.spec.ts`
  - `scripts/test.ts`
- 文档与证据：
  - `prds/v4-15.md`
  - `docs/test-cases/v4-15.md`
  - `docs/evidence/v4-15/*`
  - `docs/roadmap.md`
  - `docs/roadmap_status.md`
  - `docs/reports/v4-15-report.md`

## 测试结果

- `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/test.ts`：通过。
- 汇总结果：`32 passed, 0 failed, 1 skipped`。
- 关键覆盖：
  - `build-pro-human-approval-window-tracker-pack`：通过
  - `unit-tests`：通过
  - `ui-integration-tests`：通过
  - `playwright:main`：`49 passed`
- 当前样例继续保持 `tracker_status=hold_validation`，验证了“tracker 落地”与“收费放行”仍然是两件事。
