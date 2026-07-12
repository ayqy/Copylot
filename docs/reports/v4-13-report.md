# v4-13 交付简报

## 状态

- 已完成：新增跨 campaign 领先路线复核共享逻辑与脚本入口。
- 已完成：`Options -> Pro` 新增“跨 campaign 领先路线复核包”区块，支持复制 Markdown 与下载 JSON。
- 已完成：`scripts/unit-tests.ts`、`scripts/ui-integration-tests.ts`、`e2e/options-pro-flow.spec.ts`、`scripts/test.ts` 已覆盖新入口、分支与确定性产物。
- 已完成：`docs/test-cases/v4-13.md`、`docs/evidence/v4-13/*`、`docs/roadmap.md`、`docs/roadmap_status.md` 已同步更新。

## 效果

- 当前不再需要人工拼读 `stability` 与 `verdict`，可以直接导出一份跨 campaign 复核包，看到每个 campaign 的 leader、`reviewStatus`、`signalGap`、优先补样列表、阻塞项与证据链。
- 导出结果继续明确 `stay_validation` 边界，并显式区分 `acquisition_bias_unresolved`、`sample_still_thin` 与 `no_campaign_signals`，避免把单一获客来源的领先误判成稳定可收费需求。
- Roadmap 已把 `S4 跨 campaign 样本复核与增长纪律` 推进到 `3/4`；剩余未完成项只剩“在复核与收费评估连续过门槛后，再创建单独的人类批准与收费实现规划”。

## 修改范围

- 共享逻辑与脚本：
  - `src/shared/pro-route-validation-campaign-review.ts`
  - `scripts/build-pro-route-validation-campaign-review-pack.ts`
- Options Pro 与本地化：
  - `src/options/options.html`
  - `src/options/options.ts`
  - `_locales/en/messages.json`
  - `_locales/zh/messages.json`
- 自动化测试：
  - `scripts/test.ts`
  - `scripts/unit-tests.ts`
  - `scripts/ui-integration-tests.ts`
  - `e2e/options-pro-flow.spec.ts`
- 文档与证据：
  - `prds/v4-3-4.md`
  - `prds/v4-3-5.md`
  - `prds/v4-3-6.md`
  - `docs/test-cases/v4-13.md`
  - `docs/evidence/v4-13/*`
  - `docs/roadmap.md`
  - `docs/roadmap_status.md`
  - `docs/reports/v4-13-report.md`

## 测试结果

- `bash scripts/test.sh`：通过。
- 汇总结果：`27 passed, 0 failed, 3 skipped`。
- 跳过项：
  - `html-to-markdown-tests`：受管沙箱阻止本地监听。
  - `playwright:main`：受管沙箱阻止 Chromium extension launch（MachPort 权限）。
  - `playwright:native-ui`：未设置 `COPYLOT_TEST_NATIVE_UI=1`。

## commit / push 状态

- commit：已完成，本地提交为 `440a073 feat: add cross-campaign route review pack`。
- push：未完成；当前受管沙箱内执行 `git push` 失败，错误为 `ssh: Could not resolve hostname ssh.github.com`，已同步记录到 `docs/roadmap_status.md` 与 `docs/growth/blocked.md`。
