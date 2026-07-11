# v4-7 交付简报

## 状态

- 已完成：把 `v1-81` 的收费前门槛判断纯逻辑抽到共享模块，并继续保留脚本入口。
- 已完成：`Options -> Pro` 新增“收费前门槛判断”区块，支持复制 Markdown 摘要和下载 JSON 摘要。
- 已完成：`scripts/unit-tests.ts`、`scripts/ui-integration-tests.ts`、`e2e/options-pro-flow.spec.ts` 已覆盖新入口。
- 已完成：`docs/test-cases/v4-7.md`、`docs/evidence/v4-7/*`、`docs/roadmap.md`、`docs/roadmap_status.md` 已同步更新。

## 效果

- “收费前门槛判断”不再停留在 `docs/monetization/pro-subscription-decision-thresholds.md` 与离线脚本里，而是成为扩展内可导出的真实能力。
- 当前阶段可以直接导出 `A / B / C` 摘要，明确现在应该继续收集、先调价值表达，还是已经具备进入下一步收费评估的条件。
- 这轮仍没有越界到支付或收款实现，继续保持在 roadmap 允许的边界内。

## 修改范围

- 共享逻辑：`src/shared/pro-intent-decision-pack.ts`
- 脚本与入口：`scripts/build-pro-intent-decision-pack.ts`、`src/options/options.ts`、`src/options/options.html`
- 本地化与测试：`_locales/en/messages.json`、`_locales/zh/messages.json`、`scripts/unit-tests.ts`、`scripts/ui-integration-tests.ts`、`e2e/options-pro-flow.spec.ts`
- 文档与证据：`prds/v4-7.md`、`docs/test-cases/v4-7.md`、`docs/evidence/v4-7/*`、`docs/reports/v4-7-report.md`

## 观察

- 共享纯逻辑后，脚本样例与界面入口终于站到同一口径，后续做 `v4-8` 比较和 `v4-9` 回写时不会再分裂成两套判断系统。
- 本轮仍需要在真实路线样本层面补证据；只有“门槛摘要”还不足以完成整个收费评估。
- 软件工厂入口 `make devo` 本轮再次无增量输出，中断栈停在 `studio/codex_runner.py -> run_with_retry(... sub_prd_plan)` 的退避等待阶段，因此本轮继续人工接管实现、验证与文档收尾。
