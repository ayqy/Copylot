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
- BLOCKED 原因：当前环境无法访问 CWS Developer Dashboard/公开商店页（无法完成粘贴同步与截图取证）
- 合规门禁进展（已解除口径阻塞）：v1-76 已落盘“敏感词/夸大口径”门禁口径 + 自动扫描 + 证据（并已接入 `bash scripts/test.sh`），允许否定语境免责声明出现 `payment/subscription/付费/订阅` 并可审计（见 `docs/evidence/v1-76/`）。

v1-95 进展（已落盘，代理门禁可审计）：
- `publish:cws` 预检新增稳定分类：当 CWS 目标不可达且未命中可用代理配置时，输出 `proxy_not_started`，并给出可复制修复动作：`pxy` / `source ~/.bash_profile && pxy` / `npm run publish:cws -- --dry-run`。
- 诊断证据包（`packVersion=v1-62`）新增 `proxyReadiness.status`、`proxyReadiness.fixCommand`、`proxyReadiness.blocking`，已落盘到 `docs/evidence/v1-95/preflight/`。
- 用例与简报已补齐：`docs/test-cases/v1-95.md`、`docs/reports/v1-95-report.md`。

v1-95 仍需人类输入（阻塞清单）：
- 在真实发布所用 shell 先执行 `source ~/.bash_profile && pxy`（或 `pxy`），确保代理服务已启动。
- 提供可用的 CWS Developer Dashboard 编辑/发布权限与登录态，用于完成 v1-70/v1-71 的商店端实操取证。

无凭据/无权限情况下可继续推进的替代动作：
- 持续执行 `npm run publish:cws -- --dry-run --evidence-dir docs/evidence/v1-95/preflight/`，沉淀 `proxyReadiness.*` 回归证据并监控分类命中率。
- 持续执行 `bash scripts/test.sh`，保证代理门禁、证据字段和既有发布链路稳定无回归。
- 继续维护 Listing 文案与差异证据（`docs/evidence/v1-66/`、`docs/evidence/v1-67/`），待权限恢复后直接粘贴并截图取证。

需要的人类输入（持续阻塞：网络/商店可达 + 账号权限）：
- 提供可用的代理/VPN（确保可访问 `www.googleapis.com` 与 CWS API）；代理可为 `http/https/socks5/socks5h`，并给出包含 scheme 的代理地址/端口（例如 `http://127.0.0.1:7890` 或 `socks5h://127.0.0.1:1080`）。
- 或在可直连 Google 的网络环境中执行 `npm run publish:cws` 完成发布，并按 `docs/test-cases/v1-45.md` / `docs/test-cases/v1-47.md` 生成商店端截图/索引取证。
- 提供可登录 CWS Developer Dashboard 且具备 Store listing 编辑权限的账号/权限（用于 v1-71 的 EN/ZH descriptions + keywords 粘贴同步与截图取证）。
- （无）敏感词/夸大口径口径阻塞已解除：以 v1-76 门禁与证据为准；若未来需调整红线词表/规则，直接修改 `docs/publish/cws-listing-redlines-policy.md` 并确保 `bash scripts/test.sh` PASS。

## 2)（非本阶段 MVP）收款/订阅相关输入
所需输入清单：
- Stripe/收款账号
- 定价策略（版本/价格/周期）
- 退款/税务口径

无凭据情况下可继续推进的替代动作：
- 仅推进意向验证闭环（候补入口 + 可导出证据 + 用例/回归），不引入支付链路

## 3) 官网 / CWS / 外部渠道网络不可达（DNS）导致增长自动化阻塞

已观测阻塞（2026-03-23，本机环境）：
- `curl -I -L https://copy.useai.online/` → `Could not resolve host: copy.useai.online`
- `curl -I -L https://chromewebstore.google.com/` → `Could not resolve host: chromewebstore.google.com`
- `curl -I --max-time 8 https://1.1.1.1` → `Failed to connect to 1.1.1.1 port 443: Couldn't connect to server`（外网直连也不可达，非仅 DNS）
- 系统抓取（非本机网络）也无法打开官网：`open https://copy.useai.online/` → `Failed to fetch https://copy.useai.online/: Cache miss`（疑似站点防爬/WAF/需 JS 渲染，导致自动化取证失败）
- 复测（2026-03-23 12:38 CST）：以上 3 条仍失败（环境仍处于外网不可达状态）
- 复测（2026-03-23 15:21 CST）：以上 3 条仍失败（环境仍处于外网不可达状态）
- 复测（2026-03-23 15:48 CST）：以上 3 条仍失败（环境仍处于外网不可达状态）
- 复测（2026-03-24）：`curl -I --max-time 10 https://copy.useai.online/` / `curl -I --max-time 10 https://chromewebstore.google.com/` 仍为 `Could not resolve host`；且 `curl -I --max-time 10 https://1.1.1.1` 仍为 `Couldn't connect to server`（外网直连也不可达，非仅 DNS）
- 复测（2026-03-24）：`scutil --dns` → `No DNS configuration available`（本机无 DNS 配置）；`dig/nslookup` 报 `bind: Operation not permitted`（环境权限限制导致无法进一步诊断）

影响：
- 无法抓取官网落地页真实文案/截图 → 无法基于真实落地页做渠道内容对齐
- 无法打开 CWS 安装页/评价页 → 无法做“从商店安装回归/截图取证/评价引导”自动化
- 无法用 Playwright 自动化登录社媒/社区发布（X/LinkedIn/Reddit/HN/PH/IH 等）

所需输入清单：
- 可直连外网的网络环境，或可用代理/VPN（支持 `HTTP_PROXY/HTTPS_PROXY/ALL_PROXY` 等标准代理变量）
- 若使用代理：提供包含 scheme 的代理地址（例如 `http://127.0.0.1:7890` 或 `socks5h://127.0.0.1:1080`）

无网络情况下可继续推进的替代动作（已落盘）：
- 生成“可复制发布内容包”（多渠道）：`docs/growth/publish-pack-2026-03-23.md`
- 生成今日增长执行记录（含节奏/指标）：`docs/growth/executions/2026-03-23.md`
- 落盘“可访问落地页基准”快照（CWS 安装页）：`docs/growth/assets/landing/2026-03-23/cws-listing-snapshot.md`
- 生成 7 天增长执行计划（含指标/渠道/反馈闭环）：`docs/growth/plan.md`
- 生成手动发布清单（逐步操作）：`docs/growth/checklists/manual-posting-2026-03-23.md` ~ `docs/growth/checklists/manual-posting-2026-03-29.md`
- 生成指标记录表（便于复盘）：`docs/growth/metrics-tracker-2026-03-23.md`

网络恢复后的第一优先动作（30–60 分钟，建议尽量自动化并落盘证据）：
1. 官网落地页取证（优先 Playwright；否则手动）：
   - 抓取 Hero/首屏标题、副标题、CTA 文案（复制到文本）
   - 截图至少 2 张：首屏 + 任意 1 个功能区块
   - 落盘到：`docs/growth/assets/landing/`（按日期建子目录）
2. 对齐渠道文案（不新增能力、不夸大）：
   - 将 `docs/growth/publish-pack-2026-03-23.md` 中 Slogan/开头 1–2 句与官网 Hero 做“小幅一致化”
3. CWS 安装页/Listing 取证与同步（按 v1-71 规范）：
   - 完成 EN/ZH descriptions + keywords 同步
   - 按固定文件名补齐 3 张必选截图，并落盘到 `docs/evidence/v1-71/screenshots/`
4. 渠道首发/补发 + 指标落盘：
   - 按 `docs/growth/checklists/manual-posting-2026-03-23.md` 完成 D0 3 渠道首发
   - 将帖子 URL、曝光/点击/安装/反馈补齐到 `docs/growth/metrics-tracker-2026-03-23.md`

## 4) 渠道发布所需账号/凭据清单（用于自动化或手动发布）

> 原则：若要“自动化真实发布”，需要已登录会话（cookies）或账号密码 + 2FA；若仅手动发布，则只需要账号登录。

基础（必需）：
- 官网分析后台权限（用于看 UTM/访问/转化）：例如 Vercel/Cloudflare/自建统计后台账号
- Chrome Web Store Developer Console 权限（用于看 installs/转化/评价、配置 store listing）

社媒/社区账号（按优先级）：
- X / Twitter：账号登录（可能含 2FA）；若要自动化发布，需可复用的已登录会话（cookies）或自动化可用的登录方式
- LinkedIn：账号登录（可能含 2FA）；同上
- Reddit：账号登录；目标子版发帖权限（有些需要 Karma/账号年龄）
- Hacker News：账号登录（发帖/评论用）
- Product Hunt：Maker 账号（发布产品、写 Maker comment）；可选：Hunter 账号
- Indie Hackers：账号登录（发帖/评论用）

反馈与协作（建议）：
- GitHub 账号（用于及时回复 Issues、关闭重复问题、打标签）

## 5) 可复制发布内容（离线降级，已生成）

完整内容包：
- `docs/growth/publish-pack-2026-03-23.md`

快速复制（最短版，中英文各 1 条）：
```text
从网页复制粘贴太痛了：正文夹杂广告/导航、表格对不齐、代码块噪声一堆。
我做了 Copylot：一键复制成干净的 Markdown/纯文本/CSV（隐私优先，默认本地处理，不收集/不上传复制内容）。
安装：https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

```text
Copy-pasting from the web is messy (ads/nav, broken tables, noisy code blocks).
Copylot turns web content into clean, AI-ready Markdown/plain text/CSV (privacy-first, on-device; no copied content collected).
Install: https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

## 6) Git 自动 commit+push 受限（当前环境）

已观测阻塞：
- 在当前环境执行 `git commit`/`git restore` 等需要写入 `.git/` 的操作会失败：`fatal: Unable to create '.git/index.lock': Operation not permitted`
- 复测（2026-03-24）：执行 `git add -A` 仍失败：`fatal: Unable to create '/Users/pocket/Documents/project/Copylot/.git/index.lock': Operation not permitted`

所需输入清单：
- 在人类开发环境中执行提交与推送（或授予本环境对 `.git/` 的写权限）

无权限情况下可继续推进的替代动作：
- 继续在工作区完成实现、生成离线证据与文档（`docs/evidence/`、`docs/test-cases/`、`docs/reports/`），并确保 `bash scripts/test.sh` 全量 PASS
- 由人类在本地对照文件变更列表进行 `git add/commit/push`（或直接用 IDE 的 Source Control 完成）

## 7) v1-96 工厂增长回归阻塞（外网预检命中 `network_blocked`）

已观测阻塞（2026-03-25，本机环境）：
- `curl -I -L --max-time 15 https://copy.useai.online/` → `Could not resolve host: copy.useai.online`
- `curl -I -L --max-time 15 https://chromewebstore.google.com/` → `Could not resolve host: chromewebstore.google.com`
- `curl -I --max-time 10 https://1.1.1.1` → `Failed to connect to 1.1.1.1 port 443`
- 证据：`docs/evidence/growth/v1-96-20260325-103441/network-preflight-summary.json`（`network_blocked=true`，`playwright_external_access=forbidden`）

影响范围：
- 无法执行 Playwright 外网自动化发布与自动化截图取证；
- 无法直接完成真实小红书账号登录发布链路的自动化回归；
- 只能执行“素材生成 + 手动清单 + 阻塞留痕”降级闭环。

所需输入清单（人类）：
- 可访问外网的网络环境或代理（支持 `HTTP_PROXY/HTTPS_PROXY/ALL_PROXY`，含 scheme）。
- 可用小红书发布账号（含发布权限、稳定登录态；如开启 2FA 需可配合验证）。
- 网络恢复后允许执行真实发布回填（帖子 URL、曝光、点击、评论、私信意向）。

无凭据/无网络情况下可继续推进的替代动作（本轮已完成）：
- 已生成 xhs 成套竖版图片资产：`docs/growth/assets/social/xhs/v1-96/`
- 已生成手动发布清单：`docs/growth/checklists/manual-posting-xhs-v1-96.md`
- 已生成执行记录与转化证据索引：`docs/growth/executions/v1-96-growth-regression.md`
- 已执行 `make todo`，落盘待办队列：`docs/growth/todo.md`

恢复条件：
- `curl` 预检至少满足官网/CWS 任一主链路可达，且外网连接稳定；
- 小红书账号可正常登录并完成至少 1 次图文发布；
- 发布后可回填转化证据（campaign/source + 三入口链接 + 意向信号）。
