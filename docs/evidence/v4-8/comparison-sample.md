# 路线比较摘要样例说明

本轮样例来自 `docs/evidence/v4-8/route-validation-telemetry-sample.json`，并通过 `scripts/build-pro-route-validation-comparison-pack.ts` 再生成一遍，确保脚本与界面口径一致。

## 关键字段

- `campaigns`
- `tracks[].routeOpened`
- `tracks[].validationRouteCopied`
- `tracks[].validationBriefCopied`
- `tracks[].validationChecklistCopied`
- `tracks[].totalSignals`
- `leadingTrackId`
- `signalGap`

## 当前结论

- 当前样例中，高级页面清洗领先于另外两条路线，说明它更接近当前阶段的真实任务表达。
- 这只是样本比较判断，不代表已经进入支付或收款实现。
- 正确下一步是把领先路线的真实任务样本回写到路线页、商店说明与汇总报告，而不是继续新增路线。
