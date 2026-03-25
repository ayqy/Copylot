# 内容锚定说明（20260325-124059-growth）

## 1) 网络与抓取结论

- 本轮先执行强制预检：
  - `curl --max-time 15 -I -L https://copy.useai.online/`
  - `curl --max-time 15 -I -L https://chromewebstore.google.com/`
  - `curl --max-time 15 -I -L https://1.1.1.1`
- 结果命中 `network_blocked=true`，证据见：
  - `preflight-deployment_url.log`（`Could not resolve host: copy.useai.online`）
  - `preflight-chrome_web_store.log`（`Could not resolve host: chromewebstore.google.com`）
  - `preflight-cloudflare_dns.log`（`Couldn't connect to server`）

## 2) 本轮“真实落地页口径”来源

由于本机无法实时抓取官网，本轮内容严格锚定到已落盘的真实落地页快照：

- `docs/growth/assets/landing/2026-03-23/cws-listing-snapshot.md`
  - 页面：Chrome Web Store - Copylot（真实公开落地页）
  - 一句话口径：`A browser extension to copy web page content as AI-friendly format.`

并与以下可审计能力口径交叉校验：

1. `README.md`
2. `manifest.json`
3. `docs/growth/publish-pack-2026-03-23.md`
4. `docs/growth/executions/20260325-122257-growth.md`

## 3) 本轮变量控制

- 只改一个变量：`xhs` 封面场景词调整为“竞品分析 / 周报汇总 / 方案提案”。
- 其余能力边界、CTA 与 UTM 结构保持一致，便于下一轮对比 CTR。
