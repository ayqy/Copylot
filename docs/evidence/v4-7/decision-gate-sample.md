# 决策摘要样例说明

本轮样例来自 `docs/evidence/v1-81/copylot-pro-waitlist-survey-intent-distribution-7d-2026-03-23.json`，并通过共享后的 `scripts/build-pro-intent-decision-pack.ts` 再生成一遍，确保脚本与界面口径一致。

## 关键字段

- `survey_intent`
- `high_intent_rate`
- `price_monthly_peak`
- `price_annual_peak`
- `capability_top2`
- `decision.code`
- `decision.reasons`

## 当前结论

- 当匿名数据关闭或样本量不足时，摘要必须回到 `A`。
- 当前产品的正确动作仍是先验证门槛，再做路线样本比较，而不是直接推进支付实现。
