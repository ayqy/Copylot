# 阻塞与需要的人类输入（增长/商业化）

本文件用于集中记录“需要人类输入才能继续”的事项，并给出在无凭据/无权限情况下可继续推进的替代动作，避免研发卡死。

## 1) Chrome Web Store 真实发布权限/凭据
所需输入清单（示例）：
- CWS 开发者账号发布权限（团队成员/角色）
- 发布 API 凭据（例如 `.env` 中 `client_id` / `client_secret` / `refresh_token` 等）
- 可访问 Google API 的网络环境（或可用代理/VPN；支持通过 `CWS_PROXY/HTTPS_PROXY/HTTP_PROXY/ALL_PROXY` 配置；代理 URL 必须包含 scheme，支持 `http/https/socks5/socks5h`，例如 `http://127.0.0.1:7890` 或 `socks5://127.0.0.1:1080`）
- 目标上架条目（item）信息确认（若脚本需要）

无凭据情况下可继续推进的替代动作：
- 继续用 `bash scripts/test.sh` + `npm run build:prod` 完成可发布门禁与产物一致性验证
- 完成商店页长描述/截图/链接的仓库内审计（PRD 对齐、口径一致、可复用链接可达）
- 使用 dry-run/离线演练方式验证 `publish`/`publish:cws` 脚本流程（如脚本支持），复制「Proxy Diagnostic Block」作为可审计证据，提前定位非凭据类问题
- 按 `docs/publish/cws-preflight-checklist.md` 固化“上架前核对清单”（离线可执行），并将门禁日志落盘到 `docs/evidence/v1-45/preflight/`
- 先准备“上架后 24h/7d 复盘模板”与证据索引占位：`docs/growth/post-release-review-template.md`、`docs/evidence/v1-45/index.md`

已观测阻塞（v1-37）：
- 在当前环境执行 `npm run publish:cws`，上传阶段报错 `fetch failed`，根因 `ENOTFOUND www.googleapis.com`（DNS/网络不可达），导致无法完成真实 upload/publish。

v1-39 进展（已落盘）：
- `publish:cws` 已完成代理链路确定性修复 + 一键诊断 + 失败即指路（见 `docs/reports/v1-39-report.md` 与 `docs/test-cases/v1-39.md`）。

v1-45 进展（已落盘，离线可审计）：
- 已固化上架前核对清单：`docs/publish/cws-preflight-checklist.md`（门禁命令/文件路径可核验）
- 已固化上架后 24h/7d 复盘模板：`docs/growth/post-release-review-template.md`（引用 v1-42/v1-44 基线）
- 已落盘 v1-45 用例与证据索引模板：`docs/test-cases/v1-45.md`、`docs/evidence/v1-45/index.md`

v1-47 进展（已落盘，离线可审计）：
- `publish:cws` 已新增 `socks5://`/`socks5h://` 代理支持，并新增网络可达性预检（Preflight）与错误分类；dry-run 输出可复制的 `Proxy Diagnostic Block + Preflight Report Block + Diagnostic Pack`（见 `docs/reports/v1-47-report.md`、`docs/test-cases/v1-47.md`、`docs/evidence/v1-47/index.md`）。

v1-62 进展（已落盘，离线可审计）：
- `publish:cws` 已新增 `--evidence-dir <dir>`：无论 Preflight PASS/FAIL，退出前都会落盘「诊断证据包（JSON）」文件（`packVersion=v1-62`），内含 zip sha256、Proxy Diagnostic（脱敏）、Preflight Report（v1-47）、FixHints、credentials boolean、publishAttempt（dry-run skipped/非 dry-run 成功或脱敏失败信息）。
- 证据目录与索引：`docs/evidence/v1-62/`；用例：`docs/test-cases/v1-62.md`；简报：`docs/reports/v1-62-report.md`。

v1-66 进展（已落盘，离线可审计）：
- 已新增「CWS Listing 物料证据包」一键生成脚本 + 门禁：把上架/获客关键物料（长描述/关键词/截图脚本/更新日志模板）固化为结构化证据包并落盘到 `docs/evidence/v1-66/`，用于网络恢复后真实发布前的“物料一致性/口径可追溯”基线复核。

v1-67 进展（已落盘，离线可审计）：
- 已新增「CWS Listing ASO diff 证据包」一键生成脚本 + 门禁：基于 v1-66 基线 pack 自动解析 baseline，并即时生成 current pack，输出 diff 证据包（关键词增删/描述指纹/截图计划变更/断言变化）+ 变更摘要索引，并在命中红线（丢 Pro 候补 CTA/丢隐私口径/出现误导性宣称）时以非 0 退出码阻断门禁（见 `docs/evidence/v1-67/`）。

v1-69 进展（已落盘，但真实发布仍 BLOCKED）：
- 已完成发布门禁与证据落盘：执行 `npm run publish:cws -- --dry-run --evidence-dir docs/evidence/v1-69/preflight/` 与 `npm run publish:cws -- --evidence-dir docs/evidence/v1-69/preflight/`，均已生成可审计 JSON 证据包（`packVersion=v1-62`，含 zip sha256、Proxy Diagnostic、Preflight Report、FixHints、credentials boolean、publishAttempt）。
- `.publish.json` 证据包显示：Preflight DNS `ENOTFOUND`，已阻断真实 upload/publish（`publishAttempt.published=false`）；凭据齐全与否可通过 `credentials` 4 个 boolean 复核（不落盘具体值）。
- 证据索引已建立：`docs/evidence/v1-69/index.md`（含截图/从商店安装回归/Pro 漏斗导出占位与断言口径）。

v1-71 进展（已落盘，但 Listing 同步/截图仍 BLOCKED）：
- 已固化可粘贴字段包：`docs/evidence/v1-71/listing-paste-pack.md`（EN/ZH 长描述 + keywords；记录来源 sha256，避免临场改字/口径漂移）
- 已固化证据索引：`docs/evidence/v1-71/index.md`（引用 v1-68 `inputs.sha256` + 截图命名规范 + PASS/BLOCKED 结论口径）
- 已补齐用例/简报：`docs/test-cases/v1-71.md`、`docs/reports/v1-71-report.md`
- BLOCKED 原因：当前环境无法访问 CWS Developer Dashboard/公开商店页；且子 PRD `prds/v1-71.md` 的敏感词门禁命中需先明确处理口径（否定语境是否允许出现 payment/subscription/付费/订阅 等字样）

需要的人类输入（持续阻塞：网络/商店可达 + 账号权限）：
- 提供可用的代理/VPN（确保可访问 `www.googleapis.com` 与 CWS API）；代理可为 `http/https/socks5/socks5h`，并给出包含 scheme 的代理地址/端口（例如 `http://127.0.0.1:7890` 或 `socks5h://127.0.0.1:1080`）。
- 或在可直连 Google 的网络环境中执行 `npm run publish:cws` 完成发布，并按 `docs/test-cases/v1-45.md` / `docs/test-cases/v1-47.md` 生成商店端截图/索引取证。
- 提供可登录 CWS Developer Dashboard 且具备 Store listing 编辑权限的账号/权限（用于 v1-71 的 EN/ZH descriptions + keywords 粘贴同步与截图取证）。
- 明确 v1-71“敏感词门禁”处理口径：命中是否一律阻断；若不允许否定语境出现 payment/subscription/付费/订阅，则需先更新素材与 evidence pack（将导致不再是“同步 v1-68 素材”口径）。

## 2)（非本阶段 MVP）收款/订阅相关输入
所需输入清单：
- Stripe/收款账号
- 定价策略（版本/价格/周期）
- 退款/税务口径

无凭据情况下可继续推进的替代动作：
- 仅推进意向验证闭环（候补入口 + 可导出证据 + 用例/回归），不引入支付链路
