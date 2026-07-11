# v4-8 交付简报

## 状态

- 已完成：把三条验证路线的真实打开与复制样本比较抽成共享纯逻辑，并保留脚本入口。
- 已完成：`Options -> Pro` 新增“三条路线样本比较”区块，支持复制 Markdown 摘要和下载 JSON 摘要。
- 已完成：`scripts/unit-tests.ts`、`scripts/ui-integration-tests.ts`、`e2e/options-pro-flow.spec.ts` 已覆盖新入口。
- 已完成：`docs/test-cases/v4-8.md`、`docs/evidence/v4-8/*`、`docs/roadmap.md`、`docs/roadmap_status.md` 已同步更新。

## 效果

- 三条路线的真实打开与复制样本不再散落在匿名事件与 CSV 导出里，而是成为扩展内可直接导出的比较能力。
- 当前阶段可以直接看清哪条路线在最近 7 天更接近真实付费价值，而不是继续凭主观感觉扩路线。
- 这轮仍没有越界到支付或收款实现，继续保持在 roadmap 允许的边界内。

## 修改范围

- 共享逻辑：`src/shared/pro-route-validation-comparison.ts`
- 脚本与入口：`scripts/build-pro-route-validation-comparison-pack.ts`、`src/options/options.ts`、`src/options/options.html`
- 本地化与测试：`_locales/en/messages.json`、`_locales/zh/messages.json`、`scripts/unit-tests.ts`、`scripts/ui-integration-tests.ts`、`e2e/options-pro-flow.spec.ts`
- 文档与证据：`prds/v4-8.md`、`docs/test-cases/v4-8.md`、`docs/evidence/v4-8/*`、`docs/reports/v4-8-report.md`

## 观察

- 现在界面里已经同时具备“路线样本比较”与“收费前门槛判断”两条摘要出口，后续 `v4-9` 可以直接围绕领先样本做回写，而不必重新整理底层统计口径。
- 样本比较只解决“哪条路线更值得写回去”，还没有解决“对外怎么写得最清楚”；因此下一轮重点应放在回写而不是继续扩统计按钮。
- 软件工厂入口 `make devo` 本轮再次无增量输出，中断栈停在 `studio/codex_runner.py -> run_with_retry(... sub_prd_plan)` 的退避等待阶段，因此本轮继续人工接管实现、验证与文档收尾。
