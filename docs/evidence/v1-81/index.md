# V1-81 Pro 意向强度验证：真实样本导出取证 + 决策阈值固化（证据包索引，可审计/可复盘）

- 子 PRD：`prds/v1-81.md`
- 阈值口径（固定路径）：`docs/monetization/pro-subscription-decision-thresholds.md`
- 证据目录：`docs/evidence/v1-81/`
- 导出入口：Options -> 隐私页 ->「Pro 意向漏斗摘要」->「导出问卷意向分布（过去 7 天，JSON）」
- 决策摘要生成脚本（固定入口）：`scripts/build-pro-intent-decision-pack.ts`

## 口径（Definitions）

- 分布导出：与 v1-80 一致（见分布 JSON 自带的 `definitions` 字段）
- 决策阈值：以 `docs/monetization/pro-subscription-decision-thresholds.md` 为准
- 决策摘要：见 `copylot-pro-intent-decision-summary-v1-81.json` 的 `thresholds/definitions`

## 文件清单（含 sha256）

- `copylot-pro-waitlist-survey-intent-distribution-7d-2026-03-23.json`
  - sha256：`abf2058c8d362fcca2b85b33a815b6d3a86576f84e81f312abaa9f5d7c1d6170`
- `copylot-pro-intent-decision-summary-v1-81.json`
  - sha256：`a4cbeda838b701660d9ef578c1d3150f9f3acd287220fb3770be9cb4aa474c9e`
- `copylot-pro-intent-decision-summary-v1-81.md`
  - sha256：`57868aefbaedb0a4b36bd72235ae374ef96906e1242987e48e23b82a33ac53d8`

复算示例：
- `shasum -a 256 docs/evidence/v1-81/*`

## “无 PII”断言结论

结论：PASS（证据包与摘要不包含联系方式原文/使用场景自由文本/其他能力自由文本/网页 URL/标题/复制内容）。

互证依据：
- `scripts/build-pro-intent-decision-pack.ts`：仅读取 v1-80 分布导出的聚合字段，忽略任何额外输入字段。
- `scripts/unit-tests.ts`：包含隐私红线单测（向 rawDistribution 注入 contact/useCase/otherCapabilities/url/title/clipboardText 原文，断言不会出现在输出中）。

