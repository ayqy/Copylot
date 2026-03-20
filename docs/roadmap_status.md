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
- [x] 商店可达前的发布取证准备包（离线可推进）：上架前核对清单 + 上架后 24h/7d 复盘模板 + 用例/证据落盘（v1-45）
- [x] Pro 候补提示（低打扰）+ 漏斗取证补齐：补齐“曝光 -> 行动”的可量化证据与导出路径（v1-46）
- [x] 发布阻塞解除 v2（离线可推进）：`publish:cws` 支持 `socks5://`/`socks5h://` 代理 + 网络可达性预检取证（v1-47）
- [x] Pro 候补留资降摩擦（离线可推进）：Options 内嵌“付费意向问卷”+ 一键复制/打开候补 + 漏斗取证增强（v1-48）
- [x] Pro 下一步验证节奏固化（离线可推进）：每周“意向证据摘要”一键生成 + 问卷模板渠道化（v1-50）
- [x] Pro 意向数据资产化 v2（离线可推进）：7d 明细 CSV 导出 + 证据落盘规范固化（v1-51）
- [x] Pro 意向渠道归因最小闭环（离线可推进）：Pro Tab 增加渠道（campaign）字段 + 候补/问卷模板写入 + 导出证据可复核（v1-53）

## 当前进度
- 一句话结论：截至 2026-03-21，v1-53 已完成「Pro 意向渠道归因最小闭环」可发布交付：Options -> Pro Tab 新增可选渠道（campaign）输入项（稳定 DOM：`#pro-intent-campaign`），并在“复制候补文案/打开候补 issue body/复制问卷 Markdown”中按规则写入 `campaign: <value>`（为空不写该行）；匿名开关 ON 时，`pro_entry_opened/pro_waitlist_opened/pro_waitlist_copied/pro_waitlist_survey_copied` 事件 props 补齐 `campaign` 并可在隐私页「Pro 意向漏斗证据包」导出复核；weekly digest（7d window）末尾追加 campaign 拆分计数（至少覆盖 `pro_waitlist_copied/pro_waitlist_survey_copied`），且保持 v1-51 的 7d 明细 CSV 固定字段不变；`bash scripts/test.sh` 回归 PASS。
- 下一步（收入优先，阻塞：需要可用代理/VPN + 商店可达）：完成一次真实 CWS 发布并按统一口径取证；同时结合 v1-53 campaign 字段，开始渠道分发/投放时要求填写 campaign，并按周导出 weekly digest（v1-50）+ 7d 明细 CSV（v1-51）做渠道对比与复盘，形成可持续的商业化增长证据资产。
- 可观测性（隐私合规）：已实现“匿名使用数据”开关（默认关闭）+ 本地匿名事件日志导出/清空（仅 name/ts/props 白名单）；并有本地漏斗摘要/增长统计面板
- 激活（Activation）：Popup 已有 3 步新手引导（可跳过、可手动重开）+ 推荐设置一键应用
- 口碑闭环（WOM）：Popup/Options/评分引导已统一商店 UTM 口径；Options -> 隐私页新增「WOM 摘要」与「证据包导出」，可按来源统计 `wom_*` / `rating_prompt_*` 并派生转化率（share copy / rating prompt）
- 商业化准备：Options -> Pro Tab 已有 Free vs Pro Planned 口径与“加入候补名单/复制候补文案”入口；Popup 已补齐“升级 Pro/加入候补名单/复制候补文案”低摩擦入口；并在隐私页新增「Pro 意向漏斗摘要」与「证据包导出」（v1-38），可量化/可审计/可复盘
- 发布与质量：`npm run publish:cws -- --dry-run` 已升级为输出「Proxy Diagnostic + Preflight」完整诊断块（含 socks5/socks5h）；强制 `bash scripts/test.sh` + 产物/版本一致性校验 + 重新打包 zip；全量回归近期均 PASS（2026-03-21，扩展版本 1.1.25，产物 `plugin-1.1.25.zip`）
- 发布凭据：仓库本地 `.env` 已配置 `CWS_EXTENSION_ID/CWS_CLIENT_ID/CWS_CLIENT_SECRET/CWS_REFRESH_TOKEN`（均为 set）；当前阻塞点仍为网络可达性（但已支持 `http/https/socks5/socks5h` 代理，并可通过 Preflight 输出可审计失败类型与修复建议）
- 体验增量（近 24h）：已修复悬浮按钮 Prompt 选区作用域（v1-34）与整页转换正文优先（v1-35），降低噪音提升首次成功复制质量
- 商店物料：已纠偏夸大口径并补齐教程入口（v1-28）；并已在商店长描述补齐“Pro 候补/Planned”CTA 与稳定口径链接（`docs/monetization/pro-scope.md`，v1-36）
- 已交付离线增量（收入优先）：v1-46 已把 Pro 候补 CTA 的曝光/动作链路变成可量化漏斗（例如：`pro_prompt_shown -> pro_entry_opened -> pro_waitlist_opened -> pro_waitlist_copied`），并可通过 Options -> 隐私页导出证据包落盘（`docs/evidence/v1-46/`），用于真实发布后与 v1-42/v1-44 基线对比

## 下一步最重要的 3 件事（收入优先）
1. 完成一次真实 CWS 发布 + 商店端取证（Top1，阻塞：需要可用代理/VPN + 商店可达）：在网络可达后执行 `npm run publish:cws` 发布到 `default` channel；发布前先用 `npm run publish:cws -- --dry-run` 观察 Preflight 是否 PASS；发布成功后补齐商店端“版本号 + 发布时间 + Pro 候补 CTA 可见”截图/核对清单证据（形成可审计的商业化推进证据）
2. 真实发布后跑数取证 + 24h 复盘首轮（Top2，阻塞：依赖 Top1 完成真实发布 + 商店可达）：从商店安装当前版本，按 `docs/evidence/v1-42/index.md`、`docs/evidence/v1-44/index.md`、`docs/evidence/v1-46/index.md`、`docs/evidence/v1-48/index.md` 同口径导出/落盘「Pro 意向漏斗摘要/证据包」与「WOM 摘要/证据包」截图索引；然后按 `docs/growth/post-release-review-template.md` 填写发布后 24h 复盘（7d 复盘后置）
3. 渠道分发/投放最小试验（Top3，收入优先，离线可推进）：对外分发候补/问卷模板时要求填写 campaign；每周导出 weekly digest（含 campaign 拆分）与证据包/7d CSV，在表格中复算“按 campaign 的留资计数/效率”，形成可复用的增长证据资产（网络恢复后与商店真实跑数对齐）

## 阻塞与需要的人类输入
- v1-53 已完成且无账号/凭据/权限阻塞：campaign 为用户手动填写的渠道标识，已明确提示“不要填写敏感信息”，并保持匿名使用数据默认 OFF 的隐私边界。
- Top1/Top2 仍受网络可达性阻塞（需要代理/VPN + 商店可达）；已优先交付离线可推进的 v1-50/v1-51（weekly digest + 7d 明细 CSV）与 v1-53（campaign 渠道归因），保证收入取证资产不断档，网络恢复后可直接与真实商店跑数对齐。
- v1-51 已完成并固化：可导出过去 7 天 Pro 意向明细 CSV（稳定 DOM：`#export-pro-intent-events-7d-csv`），并在 `docs/evidence/v1-51/index.md` 固化最小复盘口径与归档规范；网络恢复后可直接与真实商店跑数对比。
- Chrome Web Store 真实发布的根因阻塞仍为“网络可达性”：本地凭据已齐全，但需要人类侧提供可用代理/VPN（并提供包含 scheme 的代理地址/端口，例如 `http://127.0.0.1:7890` 或 `socks5://127.0.0.1:1080`）。v1-47 已补齐 `socks5://`/`socks5h://` 支持与可审计 Preflight；当网络不可达时可直接从输出中得到 FAIL 类型与修复建议，避免只剩 `fetch failed`。
- 若 `chromewebstore.google.com` 亦不可达，则 Top3 的“从商店安装”同样需要代理/VPN；但 v1-42 已以 `plugin-*.zip` 安装回归作为不依赖外网的保底路径，确保基线证据可落盘且可对比。
- 若未来要打通“收款/订阅”（非本阶段 MVP），需要：Stripe/收款账号、定价策略与退款/税务口径（本轮不做）
- v1-45 已把离线门禁与取证/复盘路径固化：可先按 `docs/publish/cws-preflight-checklist.md` 完成离线门禁；网络可达后按 `docs/test-cases/v1-45.md` 完成“真实发布 -> 商店端截图 -> 从商店安装回归 -> 导出证据 -> 更新 `docs/evidence/v1-45/index.md` -> 24h/7d 复盘”。
