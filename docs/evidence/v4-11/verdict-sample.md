# v4-11 Pro 路线融合判断样例

生成命令：

```bash
./node_modules/.bin/ts-node scripts/build-pro-route-validation-verdict-pack.ts \
  docs/evidence/v4-8/comparison-pack/copylot-pro-route-validation-comparison-v4-8.json \
  docs/evidence/v4-9/writeback-pack/copylot-pro-route-validation-writeback-v4-9.json \
  docs/evidence/v4-10/stability-pack/copylot-pro-route-validation-stability-v4-10.json \
  docs/evidence/v1-81/copylot-pro-intent-decision-summary-v1-81.json \
  docs/evidence/v4-11/verdict-pack
```

样例结论：

- `routeLeaderTrackId = advanced_cleaning`
- `routeLeaderConsistent = true`
- `routeStabilityReady = false`
- `gateAllowsPaymentEvaluation = false`
- `verdictCode = stay_validation`

说明：

- 这表示“高级页面清洗验证”在比较、回写和稳定性三处 leader 已对齐，但稳定性还没有进入 `leader_stable`，收费前门槛也还没有达到 `C`。
- 因此下一步仍应继续补跨 campaign 的真实任务样本，并把当前判断固化成收费评估审计包，而不是提前推进支付实现。
