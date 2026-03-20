# 当前阶段进度看板（断点续孵化）

## 当前阶段
- 阶段：V1（增长与商业化基础能力，2026-03-18 ~ 2026-04-30）
- 核心目标：把“好用”变成“用得起来、会推荐”，并为后续 Pro 转化验证提供入口与证据
- 北极星指标：Activated WAU（每周活跃用户中“成功复制 >= 1 次”的人数）

### 阶段里程碑（V1）
- [x] 匿名使用数据：开关（默认关闭）+ 本地匿名事件日志（导出/清空/白名单）+ 增长统计面板（漏斗/统计）
- [x] Pro 候补转化闭环（MVP）：商店页 CTA + Popup/Options 统一入口 + Popup 可复制候补文案 + 可导出审计证据（v1-36）
- [x] Pro 转化漏斗取证包：隐私页本地摘要 + 一键导出证据包 + 用例/断言闭环（v1-38）
- [x] 发布阻塞解除准备：`publish:cws` 代理链路确定性修复 + 一键诊断 + 用例/简报落盘（v1-39）
- [ ] 真实上架验证：在可用代理/VPN 环境下使用 `npm run publish:cws` 完成一次包含“转化入口”的真实发布，并核对商店端物料一致性（v1-37 门禁演练已完成；v1-39 已加固代理链路与诊断）
- [x] 转化入口跑数基线：从商店（若可达）/或从 `plugin-*.zip` 安装回归 + 导出「Pro 意向漏斗摘要」与「证据包」并落盘截图索引（v1-42）
- [x] WOM 小实验：对分享/评价/反馈入口做 1 轮低打扰实验，并用本地事件导出形成可量化对比口径（v1-43）
- [x] 收入导向 WOM 实验：评分引导触发更早但更精准 + 统一更新 CWS UTM `utm_campaign=v1-44` + 证据资产/用例/回归落盘（v1-44）

## 当前进度
- 一句话结论：v1-44 已完成「收入导向 WOM 实验」可发布交付：评分引导触发更早但更精准（安装 >=48h 且成功复制 >=10，并要求 `firstPromptUsedAt` 存在或成功复制 >=20；最多展示 1 次），并将 Popup/Options/评分引导 的 Chrome Web Store UTM 统一更新为 `utm_campaign=v1-44`（保留 `utm_source=copylot-ext`、`utm_medium=popup|options|rating_prompt`）；证据资产落盘于 `docs/evidence/v1-44/`（含 telemetry off 对照 + 截图索引）并补齐 `docs/test-cases/v1-44.md`。真实上架取证仍受网络可达性阻塞（待可用代理/VPN）。
- 可观测性（隐私合规）：已实现“匿名使用数据”开关（默认关闭）+ 本地匿名事件日志导出/清空（仅 name/ts/props 白名单）；并有本地漏斗摘要/增长统计面板
- 激活（Activation）：Popup 已有 3 步新手引导（可跳过、可手动重开）+ 推荐设置一键应用
- 口碑闭环（WOM）：Popup/Options/评分引导已统一商店 UTM 口径；Options -> 隐私页新增「WOM 摘要」与「证据包导出」，可按来源统计 `wom_*` / `rating_prompt_*` 并派生转化率（share copy / rating prompt）
- 商业化准备：Options -> Pro Tab 已有 Free vs Pro Planned 口径与“加入候补名单/复制候补文案”入口；Popup 已补齐“升级 Pro/加入候补名单/复制候补文案”低摩擦入口；并在隐私页新增「Pro 意向漏斗摘要」与「证据包导出」（v1-38），可量化/可审计/可复盘
- 发布与质量：`npm run publish:cws -- --dry-run` 已通过（启动阶段输出可复制 Proxy Diagnostic Block；强制 `bash scripts/test.sh` + 产物/版本一致性校验 + 重新打包 zip）；全量回归近期均 PASS（2026-03-20，扩展版本 1.1.21）
- 发布凭据：仓库本地 `.env` 已配置 `CWS_EXTENSION_ID/CWS_CLIENT_ID/CWS_CLIENT_SECRET/CWS_REFRESH_TOKEN`（均为 set）；当前阻塞点为网络不可达（可用 `HTTPS_PROXY` 配置代理后重试）
- 体验增量（近 24h）：已修复悬浮按钮 Prompt 选区作用域（v1-34）与整页转换正文优先（v1-35），降低噪音提升首次成功复制质量
- 商店物料：已纠偏夸大口径并补齐教程入口（v1-28）；并已在商店长描述补齐“Pro 候补/Planned”CTA 与稳定口径链接（`docs/monetization/pro-scope.md`，v1-36）

## 下一步最重要的 3 件事（收入优先）
1. 完成一次真实 CWS 发布 + 商店端取证（Top1，阻塞：需要可用代理/VPN）：在人类提供可用代理/VPN 后执行 `npm run publish:cws` 发布到 `default` channel，并补齐商店端“版本号 + 发布时间 + Pro 候补 CTA 可见”截图/核对清单证据（形成可审计的商业化推进证据）
2. 真实跑数取证与对比（Top2，阻塞：依赖 Top1 完成真实发布 + 商店可达）：真实发布后从商店安装当前版本，按 `docs/evidence/v1-42/index.md` 与 `docs/evidence/v1-44/index.md` 同口径再次导出「Pro 意向漏斗摘要/证据包」与「WOM 摘要/证据包」并落盘截图索引（用于与 zip 回归基线对比：source 拆分计数/转化率 + UTM 可核验）
3. 商店可达前的发布取证准备（Top3，可离线推进）：整理 CWS 上架前核对清单（描述/截图/权限/隐私口径一致），并基于 v1-44 的 UTM/事件口径准备“真实上架后 24h/7d 对比复盘模板”（确保一旦网络可达即可最短路径取证跑数）

## 阻塞与需要的人类输入
- Chrome Web Store 真实发布的根因阻塞仍为“网络可达性”：本地凭据已齐全，但执行 `npm run publish:cws` 在上传阶段报错 `fetch failed`，根因 `ENOTFOUND www.googleapis.com`。v1-39 已将代理链路做成可确定生效 + 可诊断（含 scheme 强校验与可复制诊断块），当前仍需要人类侧提供可用代理/VPN（并提供包含 scheme 的代理地址/端口，例如 `http://127.0.0.1:7890`；若只有 `socks5://`，请提供本地 HTTP 代理端口或 VPN）。
- 若 `chromewebstore.google.com` 亦不可达，则 Top3 的“从商店安装”同样需要代理/VPN；但 v1-42 已以 `plugin-*.zip` 安装回归作为不依赖外网的保底路径，确保基线证据可落盘且可对比。
- 若未来要打通“收款/订阅”（非本阶段 MVP），需要：Stripe/收款账号、定价策略与退款/税务口径（本轮不做）
