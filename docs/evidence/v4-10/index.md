# v4-10 领先路线稳定性摘要证据索引

## 证据清单

- `stability-surface.md`
  - 记录 `Options -> Pro` 中新入口、按钮与隐私边界
- `stability-sample.md`
  - 记录稳定性摘要样例与关键 verdict
- `route-validation-stability-telemetry-sample.json`
  - 用于生成稳定性摘要的匿名 telemetry 样本
- `stability-pack/*`
  - 使用样本 telemetry 生成的 JSON / Markdown 样例，证明共享逻辑、脚本和界面口径一致

## 核心结论

- 当前领先路线已经可以按 `7d / 14d` 与 `campaign` 两层复核，而不是只看一次比较结果。
- 当前仍未进入支付或收款实现，只是把“领先是否稳定”的判断做成了可复核能力。
- 下一轮应转到统一融合判断，而不是把稳定性摘要误解成已可收费。
