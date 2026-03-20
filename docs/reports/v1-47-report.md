# V1-47 发布阻塞解除 v2：`publish:cws` 支持 `socks5://` 代理 + 网络可达性预检取证 简报

## 状态
- 已完成：子 PRD `prds/v1-47.md` 全部“具体任务”落地并满足验收标准（可发布门禁与诊断链路可用）
  - `npm run publish:cws` 代理能力升级：新增 `socks5://` / `socks5h://` 支持，并保持 `HTTP_PROXY/HTTPS_PROXY/ALL_PROXY` 既有行为与优先级（以诊断块输出为准）
  - 新增网络可达性预检（Preflight）：在 upload/publish 前对关键外网依赖输出 PASS/FAIL + 失败类型 + 最短修复建议，并生成可直接贴到 Issue 的诊断块
  - 测试/用例/取证落盘：新增 `docs/test-cases/v1-47.md`、`docs/evidence/v1-47/` 与 dry-run 取证日志索引
  - 商业化进度落盘：已更新 `docs/roadmap_status.md`（勾选 v1-47 里程碑 + 刷新当前进度/Top3/阻塞）

## 交付效果（收入第一：解除“真实 CWS 发布取证”关键阻塞的不确定性）

1) 代理能力：支持 socks5/socks5h（兼容不破坏）
- 支持：`http://`、`https://`、`socks5://`、`socks5h://`
- 优先级保持不变：`CWS_PROXY > HTTPS_PROXY/https_proxy > HTTP_PROXY/http_proxy > ALL_PROXY/all_proxy`
- 诊断输出可审计：Proxy Diagnostic Block 明确展示命中的 envKey、脱敏后的 proxy URL、以及实际使用的 undici dispatcher（socks5 时为 `undici.Agent (socks5 connector)`）

2) 网络可达性预检（Preflight）+ 错误分类 + 可复制证据
- 在 upload/publish 前对外网依赖进行最小预检（同一代理配置）：
  - `www.googleapis.com`
  - `chromewebstore.googleapis.com`
- 输出包含：
  - Preflight PASS/FAIL 行
  - Preflight Report Block（JSON，可审计）
  - Diagnostic Pack（Proxy Diagnostic + Preflight 合并块，可直接贴到 Issue）
- 预检失败时：
  - 非 dry-run：在任何 upload/publish 调用前阻断并退出非 0
  - dry-run：仍输出证据与修复建议，但按约定不执行 upload/publish

3) 安全与合规
- 诊断输出不包含 `CWS_CLIENT_SECRET/CWS_REFRESH_TOKEN` 等敏感值（仅显示已设置/未设置）
- 若代理 URL 含用户名密码，输出中会脱敏（只保留 `scheme://host:port`）

## 测试/用例/证据
- 用例文档：`docs/test-cases/v1-47.md`（覆盖无代理 / http 代理 / socks5 代理 / socks5h 远程 DNS / 脱敏校验点）
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-20 PASS）
- 取证落盘：
  - `docs/evidence/v1-47/index.md`
  - `docs/evidence/v1-47/dry-run-20260320-174406-socks5.log`（包含 Proxy Diagnostic Block + Preflight Report Block + Diagnostic Pack）

## 修改范围（目录/文件）
- `scripts/cws-proxy.ts`
- `scripts/cws-preflight.ts`
- `scripts/chrome-webstore.ts`
- `scripts/unit-tests.ts`
- `scripts/test.sh`（未改动；作为统一入口继续使用）
- `docs/test-cases/v1-47.md`
- `docs/evidence/v1-47/`
- `docs/publish/cws-preflight-checklist.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`
- `docs/worklog/2026-03-20.md`
- `docs/reports/v1-47-report.md`
