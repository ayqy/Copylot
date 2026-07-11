# V1-81 Pro 意向决策摘要（可审计）

## 输入
- 分布文件：`docs/evidence/v1-81/copylot-pro-waitlist-survey-intent-distribution-7d-2026-03-23.json`
- sha256：`abf2058c8d362fcca2b85b33a815b6d3a86576f84e81f312abaa9f5d7c1d6170`
- enabled：`true`
- lookbackDays：`7`
- windowFrom..windowTo：`1773619200000..1774224000000`

## 指标
- survey_intent：`3`
- high_intent_rate：`0.6667`
- pay_willing：yes=`1` maybe=`1` no=`1` unknown=`0`
- price_monthly_peak：bucket=`10_20` rate=`0.3333`
- price_annual_peak：bucket=`100_200` rate=`0.3333`
- capability_top2：advanced_cleaning=1(0.3333) batch_collection=1(0.3333)

## 结论（A/B/C）
- code：`A`
- 结论：继续收集（样本量不足）
- reasons：`survey_intent_insufficient`
