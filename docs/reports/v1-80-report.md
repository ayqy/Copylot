# V1-80 Pro 意向留资闭环最小增强：问卷信号结构化 + 7d 分布导出 + 可审计证据包（简报）

## 状态
- 已完成：Pro 问卷复制事件新增结构化信号（仅枚举/布尔，隐私白名单严格过滤）。
- 已完成：Options ->「Pro 意向漏斗摘要」新增「问卷意向分布（过去 7 天，JSON）」导出按钮（遵循匿名开关）。
- 已完成：用例与证据落盘（`docs/test-cases/v1-80.md` + `docs/evidence/v1-80/`），并补齐单测门禁（`scripts/unit-tests.ts`）。

## 商业化证据（可审计/可复盘）
- 结构化信号（写入本地 telemetry，隐私优先，无 PII）：
  - `pay_willing/pay_monthly/pay_annual`
  - `cap_advanced_cleaning/cap_batch_collection/cap_prompt_pack/cap_note_export`
  - `has_other_capability/has_contact`（仅布尔，不记录原文）
- 7d 分布导出（JSON，聚合计数 + 口径定义，便于归档与复算）：
  - 导出入口：Options -> 隐私页 ->「Pro 意向漏斗摘要」->「导出问卷意向分布（过去 7 天，JSON）」
  - 导出文件命名：`copylot-pro-waitlist-survey-intent-distribution-7d-YYYY-MM-DD.json`
  - 导出指标：`survey_intent`、`pay_willing_*`、`price_monthly_* / price_annual_*`、`capability_*`
- 可审计证据索引：`docs/evidence/v1-80/index.md`（文件清单 + sha256 + “无 PII”断言结论）

## 对 S4「收款/订阅链路」的决策输入
- 若 7d `survey_intent` 足够、且 `pay_willing_yes/maybe` 占比与价位区间集中，则可推进下一步“收款/订阅链路”验证；
- 若意向分布分散或 `pay_willing_no/unknown` 占比高，则优先迭代能力方案与价值表达，再观察下一轮分布变化。

## 测试
- 自动化回归：`bash scripts/test.sh`（2026-03-23 PASS）

## 修改范围（目录/文件）
- `src/options/options.ts`
- `src/options/options.html`
- `src/shared/telemetry.ts`
- `src/shared/pro-waitlist-survey-intent-distribution.ts`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-80.md`
- `docs/evidence/v1-80/`
- `docs/reports/v1-80-report.md`
- `docs/roadmap.md`
- `docs/roadmap_status.md`

