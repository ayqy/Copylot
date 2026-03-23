# V1-80 Pro 意向问卷信号结构化 + 7d 分布导出（证据包索引，可审计/可复盘）

- 子 PRD：`prds/v1-80.md`
- 证据目录：`docs/evidence/v1-80/`
- 导出入口：Options -> 隐私页 ->「Pro 意向漏斗摘要」->「导出问卷意向分布（过去 7 天，JSON）」
- 口径来源（唯一可信白名单）：`src/shared/telemetry.ts`

## 口径（Definitions）

导出文件为聚合计数（无 PII），并自带窗口与指标口径字段：
- window：仅统计 `windowFrom..windowTo`（毫秒时间戳，闭区间）内的事件
- `survey_intent`：`count(pro_waitlist_survey_copied)`
- `pay_willing_*`：按 `props.pay_willing` 聚合计数（`yes|maybe|no|unknown`）
- `price_monthly_*`：按 `props.pay_monthly` 聚合计数（`lt_5|5_10|10_20|20_50|50_plus|unknown`）
- `price_annual_*`：按 `props.pay_annual` 聚合计数（`lt_50|50_100|100_200|200_500|500_plus|unknown`）
- `capability_*`：按 `cap_*` 为 `true` 聚合计数（可多选，总和允许 > `survey_intent`）

## 导出文件清单（含 sha256）

- `copylot-pro-waitlist-survey-intent-distribution-7d-2026-03-23.json`
  - sha256：`abf2058c8d362fcca2b85b33a815b6d3a86576f84e81f312abaa9f5d7c1d6170`

复算示例：
- `shasum -a 256 docs/evidence/v1-80/*.json`

## “无 PII”断言结论

结论：PASS（不包含联系方式原文/使用场景自由文本/其他能力自由文本/网页 URL/标题/复制内容）。

互证依据：
- `src/shared/telemetry.ts`：`pro_waitlist_survey_copied` props 白名单仅允许枚举/布尔，并对枚举值做严格校验（非法值丢弃）。
- `scripts/unit-tests.ts`：包含隐私红线单测（传入 contact/useCase/otherCapabilities/url/title/clipboardText 等原文，断言不会出现在导出结果中）。

