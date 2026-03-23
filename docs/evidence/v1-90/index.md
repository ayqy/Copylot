# V1-90 Pro 意向跑数取证执行闭环：证据包一键导出 + 离线落盘复盘材料

- 子 PRD：`prds/v1-90.md`
- 证据目录：`docs/evidence/v1-90/`
- 导出入口：Options -> 隐私与可观测性 ->「Pro 意向漏斗摘要」->「下载 Pro 意向跑数证据包（JSON）」
- 口径来源（唯一可信白名单）：`src/shared/telemetry.ts`
- 离线落盘脚本（固定入口）：`scripts/build-pro-intent-run-evidence-pack.ts`

## 证据包字段（单文件，可审计/可复盘）
- env：exportedAt / extensionVersion / isAnonymousUsageDataEnabled
- proFunnelSummary：按 source=popup|options 分组 + overall
- proWaitlistSurveyIntentDistribution：survey_intent 等分布（聚合计数）
- proIntentEvents7dCsv：过去 7 天 Pro 意向事件明细（CSV 字符串内嵌）
- proIntentWeeklyDigestMarkdown：本周 Pro 意向证据摘要（Markdown 字符串内嵌）

## 文件清单（含 sha256，可复算）
- `docs/evidence/v1-90/pro-intent-run-evidence-pack.json`
  - sha256：`1c6329d81ff9fc1c8efdcef8350a51818ec88ba590cdc6bf4f5701692f0af4a9`
- `docs/evidence/v1-90/sha256.json`
  - 说明：固化 `index.md` 与 `pro-intent-run-evidence-pack.json` 的 sha256（便于后续复盘对比）
- `docs/evidence/v1-90/index.md`

复算示例：
- `shasum -a 256 docs/evidence/v1-90/*`

## “无 PII”断言结论
结论：PASS（证据包不包含 URL/标题/网页内容/复制内容/联系方式明文；事件口径来自 telemetry 白名单清洗）。

## 生成方式
- 命令：`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-pro-intent-run-evidence-pack.ts <downloaded-pack.json>`

