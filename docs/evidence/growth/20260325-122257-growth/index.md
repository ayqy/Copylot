# 证据索引（20260325-122257-growth）

## 1) 网络预检证据

- `preflight-targets.txt`
- `preflight-deployment_url.log`
- `preflight-chrome_web_store.log`
- `preflight-cloudflare_dns.log`
- `preflight-summary.tsv`
- `network-decision.json`

## 2) 内容锚定证据

- `content-grounding.md`
- `docs/growth/assets/landing/2026-03-23/cws-listing-snapshot.md`

## 3) 文件完整性

- `checksums.sha256`（预检与证据文件 hash）
- `asset-hashes.sha256`（增长素材文件 hash）

## 4) 结论

- 预检结果：`network_blocked=true`
- 自动化发布：`forbidden`（按 PRD 门禁）
- 已降级产物：多渠道可复制文案 + xhs 成套 HTML 素材 + 手动渲染/发布清单 + 指标/阻塞更新
