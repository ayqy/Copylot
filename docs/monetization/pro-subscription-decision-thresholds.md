# Pro「收款/订阅链路」推进决策阈值（Go/No-Go，固定口径）

阈值版本：`v1-81`

## 目标
基于 v1-80 的“问卷意向分布（7d）”导出（聚合计数、无 PII、可审计），给出是否推进 S4「收款/订阅链路」的**量化决策阈值**，并保证结论可复盘、可验收判定。

约束：
- 禁止引入任何新采集字段；只允许使用 v1-80 导出的聚合字段。
- 结论必须落在 A/B/C 三段式之一，不允许“拍脑袋”。

## 输入（唯一可信来源）
输入文件：Options -> 隐私页 ->「Pro 意向漏斗摘要」->「导出问卷意向分布（过去 7 天，JSON）」。

可审计字段（均来自导出 JSON）：
- 样本量：`survey_intent`
- 付费意向分布：`pay_willing_yes / pay_willing_maybe / pay_willing_no / pay_willing_unknown`
- 价格区间分布：
  - `price_monthly_*`（`lt_5|5_10|10_20|20_50|50_plus|unknown`）
  - `price_annual_*`（`lt_50|50_100|100_200|200_500|500_plus|unknown`）
- 能力偏好分布（可多选计数）：`capability_*`

## 派生指标（Definitions）

1) 样本量门槛（7d）
- `survey_intent = count(pro_waitlist_survey_copied)`

2) 高意向占比
- `high_intent_rate = (pay_willing_yes + pay_willing_maybe) / survey_intent`

3) 价格区间集中度（主峰 bucket 与占比）
- `monthly_peak_bucket/monthly_peak_rate`：在 `price_monthly_*` 中取 count 最大的 bucket（包含 `unknown`），`rate = peakCount / survey_intent`
- `annual_peak_bucket/annual_peak_rate`：在 `price_annual_*` 中取 count 最大的 bucket（包含 `unknown`），`rate = peakCount / survey_intent`
- `best_peak_rate = max(monthly_peak_rate, annual_peak_rate)`

4) 能力偏好 Top2 与覆盖率
- `capability_top2`：按 `capability_*` 计数降序取 Top2
- 覆盖率：对每个能力分别计算 `capability_count / survey_intent`

## A/B/C 三段式结论（可验收判定）

### A：继续收集（样本不足/分布不稳定）
触发条件（任一满足即为 A）：
- `survey_intent < 30`
- 或导出显示匿名使用数据未开启（`enabled=false` / `disabledReason=anonymous_usage_data_disabled`）

输出要求：
- 结论必须明确写为 A，并注明“样本量不足”，不得进入“收款/订阅”实施。

### B：先迭代价值表达与能力包（意向不足但有偏好）
前置：`survey_intent >= 30`

触发条件（任一满足即为 B）：
- `high_intent_rate < 0.6`
- 或 `best_peak_rate < 0.4`
- 或 `monthly_peak_bucket = unknown` 且 `annual_peak_bucket = unknown`（价格信息不可用）

输出要求：
- 结论必须明确写为 B，并给出“能力偏好 Top2（覆盖率）+ 价格主峰 bucket”，用于下一轮价值表达/能力包迭代。

### C：可推进收款/订阅链路最小实现（样本与意向达到门槛）
触发条件（全部满足才为 C）：
- `survey_intent >= 30`
- 且 `high_intent_rate >= 0.6`
- 且 `best_peak_rate >= 0.4`
- 且 `monthly_peak_bucket != unknown` 或 `annual_peak_bucket != unknown`

输出要求：
- 结论必须明确写为 C，但本轮仍不直接引入支付；只作为“进入收款/订阅 MVP 设计与实施”的 go/no-go 输入。

## 自动化落盘（脚本一致性）
离线摘要生成脚本：`scripts/build-pro-intent-decision-pack.ts`（输出 A/B/C + 阈值版本 + 口径字段）。

要求：
- 脚本阈值必须与本文件一致；如需调整阈值，必须同步修改脚本与单测门禁。

