# V1-87 Pro 意向转化提升：Popup 问卷入口前置 + 一次性来源归因 + 可导出证据落盘（证据索引，可审计/可复盘）

- 子 PRD：`prds/v1-87.md`
- 入口：Popup -> “Pro 问卷（1 分钟）” -> Options `#pro-waitlist-survey`
- 归因口径（严格约束）：
  - 事件：`pro_waitlist_survey_copied`
  - `props.source` 仅允许 `popup|options`；任何未知值必须被丢弃
  - Popup 入口通过一次性 querystring `?pro_survey_source=popup` 写入“一次性归因=popup”，仅影响下一次问卷复制事件；读取后清除 querystring，避免后续误归因
- 导出入口：Options -> 隐私页 ->「Pro 意向漏斗摘要」->「复制证据包」（本目录落盘样例）
- 证据目录：`docs/evidence/v1-87/`

## 文件清单（含 sha256）

- `copylot-pro-funnel-evidence-pack-v1-87.sample.json`
  - sha256：`0d3b03d137ea34990e702289fb02bd0b6b8aeb467aac8825137f9296384157f1`

复算示例：
- `shasum -a 256 docs/evidence/v1-87/*`

## “无 PII”断言结论

结论：PASS（本目录文件不包含联系方式原文/使用场景自由文本/其他能力自由文本/网页 URL/标题/复制内容；仅包含枚举/布尔/计数与环境版本号）。

说明：
- `copylot-pro-funnel-evidence-pack-v1-87.sample.json` 为本地回归导出样例，包含 `bySource.popup.counts.pro_waitlist_survey_copied = 1`，用于证明“入口可跑数 + 可归因 + 可导出复盘”。

