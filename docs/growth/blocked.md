# 阻塞与需要的人类输入（增长/商业化）

本文件用于集中记录“需要人类输入才能继续”的事项，并给出在无凭据/无权限情况下可继续推进的替代动作，避免研发卡死。

## 1) Chrome Web Store 真实发布权限/凭据
所需输入清单（示例）：
- CWS 开发者账号发布权限（团队成员/角色）
- 发布 API 凭据（例如 `.env` 中 `client_id` / `client_secret` / `refresh_token` 等）
- 可访问 Google API 的网络环境（或可用代理/VPN；支持通过 `CWS_PROXY/HTTPS_PROXY/HTTP_PROXY/ALL_PROXY` 配置；代理 URL 必须包含 scheme，例如 `http://127.0.0.1:7890`）
- 目标上架条目（item）信息确认（若脚本需要）

无凭据情况下可继续推进的替代动作：
- 继续用 `bash scripts/test.sh` + `npm run build:prod` 完成可发布门禁与产物一致性验证
- 完成商店页长描述/截图/链接的仓库内审计（PRD 对齐、口径一致、可复用链接可达）
- 使用 dry-run/离线演练方式验证 `publish`/`publish:cws` 脚本流程（如脚本支持），复制「Proxy Diagnostic Block」作为可审计证据，提前定位非凭据类问题

已观测阻塞（v1-37）：
- 在当前环境执行 `npm run publish:cws`，上传阶段报错 `fetch failed`，根因 `ENOTFOUND www.googleapis.com`（DNS/网络不可达），导致无法完成真实 upload/publish。

v1-39 进展（已落盘）：
- `publish:cws` 已完成代理链路确定性修复 + 一键诊断 + 失败即指路（见 `docs/reports/v1-39-report.md` 与 `docs/test-cases/v1-39.md`）。

需要的人类输入（v1-39）：
- 提供可用的代理/VPN（确保可访问 `www.googleapis.com`），并给出包含 scheme 的代理地址/端口（例如 `http://127.0.0.1:7890`）。若仅有 `socks5://...`，请同时提供本地 HTTP 代理端口或直接使用 VPN。
- 或在可直连 Google 的网络环境中执行 `npm run publish:cws` 完成发布，并按 `docs/test-cases/v1-39.md` 生成商店端截图/索引取证（写入 `docs/reports/v1-39-report.md`）。

## 2)（非本阶段 MVP）收款/订阅相关输入
所需输入清单：
- Stripe/收款账号
- 定价策略（版本/价格/周期）
- 退款/税务口径

无凭据情况下可继续推进的替代动作：
- 仅推进意向验证闭环（候补入口 + 可导出证据 + 用例/回归），不引入支付链路
