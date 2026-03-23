# V1-69 真实 CWS 发布 + 商店端取证闭环简报

## 状态
- 已完成（离线可推进）：发布前门禁（`bash scripts/test.sh`）+ dry-run 诊断证据包落盘（`packVersion=v1-62`，含 Proxy Diagnostic + Preflight + zip sha256 + FixHints）
- 已落盘但未发布成功：非 dry-run 生成 `.publish.json` 证据包，但因 Preflight DNS `ENOTFOUND`（`www.googleapis.com` / `chromewebstore.googleapis.com` 不可达）阻断真实 publish（`publishAttempt.published=false`）
- 未完成（BLOCKED）：商店端截图取证 + 从商店安装回归 + Pro 漏斗导出取证（依赖：可用代理/VPN + 商店可达 + publish 成功）

## 商业化证据（可审计/可复核）
- 发布诊断证据包（JSON）：`docs/evidence/v1-69/preflight/`
  - dry-run：`copylot-cws-publish-diagnostic-pack-1.1.28-2026-03-21-044904.dry-run.json`
  - 非 dry-run（被阻断）：`copylot-cws-publish-diagnostic-pack-1.1.28-2026-03-21-044951.publish.json`
- 证据索引（含截图/导出占位与断言口径）：`docs/evidence/v1-69/index.md`

## 测试
- 自动化回归：`bash scripts/test.sh`（2026-03-21 PASS；在 `npm run publish:cws` 前置门禁中已执行）

## 修改范围（目录/文件）
- `docs/evidence/v1-69/`
- `docs/test-cases/v1-69.md`
- `docs/reports/v1-69-report.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`

