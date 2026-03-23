# V1-90 Pro 意向跑数取证执行闭环：证据包一键导出 + 离线落盘复盘材料（简报）

## 状态
- 已完成：Options -> 隐私与可观测性 ->「Pro 意向漏斗摘要」新增「下载 Pro 意向跑数证据包（JSON）」按钮（i18n）。
- 已完成：证据包口径落盘为纯函数模块：`src/shared/pro-intent-run-evidence-pack.ts`（单文件、可审计、可离线分享）。
- 已完成：匿名开关 OFF 门禁：证据包 `enabled=false` + `disabledReason=anonymous_usage_data_disabled`，且 `proIntentEvents7dCsv` 为空串（不得导出明细/CSV 内容）。
- 已完成：离线落盘脚本：`scripts/build-pro-intent-run-evidence-pack.ts`（输入=导出的证据包 JSON；输出= `docs/evidence/v1-90/` + sha256 固化）。
- 已完成：补齐单测门禁（`scripts/unit-tests.ts`），并纳入 `bash scripts/test.sh`。
- 已完成：用例与证据落盘（`docs/test-cases/v1-90.md` + `docs/evidence/v1-90/`）。

## 效果（商业化/增长）
- 跑数取证从“多次手工导出/拼接”升级为“一键导出单文件证据包 + 离线落盘复盘材料”，便于团队持续累积 `survey_intent` 样本与漏斗证据。
- 可审计/可复核：证据包字段口径固定；离线落盘后固化 sha256，便于后续对比“口径/实现是否漂移”。
- 隐私更稳：严格复用 `src/shared/telemetry.ts` 白名单清洗；匿名开关 OFF 时不导出事件明细/CSV 内容，避免误导或泄露风险。

## 测试
- 自动化回归：`bash scripts/test.sh`（PASS）

## 修改范围（目录/文件）
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `src/options/options.html`
- `src/options/options.ts`
- `src/shared/pro-intent-run-evidence-pack.ts`
- `scripts/build-pro-intent-run-evidence-pack.ts`
- `scripts/unit-tests.ts`
- `scripts/test.sh`
- `docs/test-cases/v1-90.md`
- `docs/evidence/v1-90/`
- `docs/reports/v1-90-report.md`
- `docs/roadmap.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`

