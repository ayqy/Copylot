# 证据索引（20260325-115710-growth）

## 1) 网络预检证据

- `preflight-targets.txt`
- `preflight-deployment_url.log`
- `preflight-chrome_web_store.log`
- `preflight-cloudflare_dns.log`
- `preflight-summary.tsv`
- `network-decision.json`

## 2) 内容锚定证据

- `content-grounding.md`

## 3) 文件完整性

- `checksums.sha256`（预检产物 hash）
- `asset-hashes.sha256`（增长素材 hash）

## 4) 结论

- 预检结果：`network_blocked=true`
- 自动化发布：`forbidden`（按 PRD 门禁）
- 已降级产物：渠道文案 + xhs 成套 HTML 素材 + 手动发布清单 + 指标/阻塞更新
