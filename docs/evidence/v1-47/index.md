# V1-47 商业化证据索引（发布阻塞解除 v2：`publish:cws` socks5 代理 + Preflight 预检取证）

- 生成时间：2026-03-20T17:44:30+08:00
- 扩展版本号：`1.1.22`
- 证据目录：`docs/evidence/v1-47/`（可被 git 审计；日志中不包含任何 token/secret）

## 目标（可审计、可复用）
将 “`npm run publish:cws` 在网络不可达时只剩 `fetch failed` 不可定位” 的问题，固化为可复制、可定位、可审计的诊断证据：
- Proxy Diagnostic：明确代理是否启用、命中哪个环境变量、代理 URL 脱敏输出、dispatcher 类型
- Preflight：在 upload/publish 前对关键外网依赖做最小可达性检查，并输出 PASS/FAIL + 失败类型

## 证据文件清单（至少 1 次 dry-run 取证）

1. `dry-run-20260320-174406-socks5.log`
   - 生成命令（示例；代理 URL 已脱敏）：
     - `HTTPS_PROXY=socks5://127.0.0.1:1080 NO_PROXY=localhost,127.0.0.1,::1 npm run publish:cws -- --dry-run`
   - 断言（必须可在日志中直接搜索验证）：
     - 包含 `-----BEGIN CWS PROXY DIAGNOSTIC BLOCK-----`
     - `proxy.urlMasked` 以 `socks5://` 开头（证明已识别并使用 socks5 代理）
     - `fetch.dispatcher` 为 `undici.Agent (socks5 connector) (setGlobalDispatcher)`
     - 包含 `-----BEGIN CWS PREFLIGHT REPORT BLOCK-----`，且 `checks[]` 对 `www.googleapis.com` 与 `chromewebstore.googleapis.com` 均有明确 PASS/FAIL 与 `failureType`
     - 包含 `-----BEGIN CWS PUBLISH DIAGNOSTIC PACK-----`（Proxy Diagnostic + Preflight 合并块，便于直接贴到 Issue）

## 命名规范（建议）
- `dry-run-YYYYMMDD-HHMMSS-<proxy>.log`
  - `<proxy>`：`no-proxy` / `http` / `socks5` / `socks5h` 等（不包含真实用户名密码）

