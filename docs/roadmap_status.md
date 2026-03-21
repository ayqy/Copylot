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
- [x] 真实发布取证再降摩擦（离线可推进）：为 `npm run publish:cws` 增加「诊断证据包（JSON）一键落盘」能力（Proxy Diagnostic + Preflight + zip hash + 凭据缺失项 + 修复建议），为网络恢复后的“一次性真实发布 + 按口径取证”做准备（v1-62）
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
- [x] 渠道分发/投放最小试验（离线可推进）：Pro 意向按 campaign 聚合 7d CSV 导出 + 复盘证据固化（v1-54）
- [x] 渠道分发/投放效率提升（离线可推进）：Pro 候补“分发工具包”（一键复制候补链接/招募文案，强制带 campaign）+ 用例/证据固化（v1-55）
- [x] 渠道分发/投放周报一键生成（离线可推进）：隐私页 Pro 面板新增“按 campaign 的本周复盘摘要（Markdown）”一键复制 + 证据落盘（v1-56）
- [x] 渠道分发工具包升级（离线可推进）：商店安装链接/完整投放包一键复制 + 分发动作取证导出（v1-57）
- [x] 渠道分发/投放效率复盘一键化（离线可推进）：把 v1-54 `leads` 与 v1-57 `distCopies` 按 campaign 自动对齐并一键导出“效率对比证据资产”（v1-58）
- [x] 渠道分发/投放周报再降摩擦（离线可推进）：一键复制本周获客效率摘要（Markdown，按 campaign）+ 证据落盘（v1-59）
- [x] 渠道获客效率取证再降摩擦（离线可推进）：一键复制“获客效率证据包”（JSON，含 CSV + Markdown + Env）+ 证据落盘（v1-60）
- [x] 渠道获客效率证据包落盘再降摩擦（离线可推进）：新增「下载获客效率证据包（JSON）」入口 + 稳定文件名（v1-61）
- [x] 渠道跑数/复盘证据包再降摩擦（离线可推进）：新增「下载周度渠道复盘证据包（JSON）」入口，把“多次导出 + 手工归档”升级为“单文件证据包可落盘/可审计/可复核”（v1-63）
- [x] 真实渠道跑数基线落盘（离线可推进）：用 v1-63 周度证据包跑 1 轮真实渠道跑数并落盘归档（v1-64）

## 当前进度
- 一句话结论：截至 2026-03-21，v1-64 已完成「真实渠道跑数基线落盘」可审计交付：周度证据包 `.on.json` 已落盘到 `docs/evidence/v1-64/`，并按 `assets.verifyMarkdown` 互证 PASS（rows <-> 两份 CSV；`distCopies=0 -> N/A`；小数 4 位）；`bash scripts/test.sh` 回归 PASS。
- 本轮最小可交付增量（已完成，v1-64，离线可推进，收入优先）：用 `plugin-*.zip` 安装回归，至少设置 2 个 campaign + 空 campaign，完成分发/留资动作后下载 `#download-pro-weekly-channel-ops-evidence-pack` 的 `.on.json`；按 `assets.verifyMarkdown` 复核通过后，将文件 + 截图索引 + baseline 表 + 复核结论落盘到 `docs/evidence/v1-64/`（并补齐用例 `docs/test-cases/v1-64.md` + 简报 `docs/reports/v1-64-report.md`）。
- 下一步最小可交付增量（计划，v1-65，收入优先）：在网络恢复后完成一次真实 CWS 发布 + 商店端取证（v1-62），并在发布后从商店安装回归补齐“复盘证据”（v1-45），形成可对外引用的“发布 -> 转化入口 -> 证据资产”闭环。
- 本轮最小可交付增量（v1-59，离线可推进，收入优先）已完成：把 v1-58 的合并口径（leads + distCopies + leadsPerDistCopy）变成可直接粘贴的周报 Markdown 资产，并补齐单测/用例/证据闭环，显著降低渠道复盘与审计摩擦。
- 本轮最小可交付增量（v1-60，离线可推进，收入优先）已完成：在 v1-58（7d 合并 CSV）+ v1-59（周报 Markdown）之上，新增「获客效率证据包（JSON，含 CSV + Markdown + Env）」一键复制入口，把 CSV/Markdown/Env/结构化 rows 统一打包成可直接落盘归档的审计资产，进一步降低“手工归档/丢证据/不可复核”的商业化风险。
- 本轮最小可交付增量（v1-62，离线可推进，收入优先）已完成：为 `publish:cws` 增加 `--evidence-dir`，把 Proxy Diagnostic + Preflight + zip sha256 + 修复建议 + 凭据缺失项固化为可落盘归档的结构化证据包（JSON），让网络不可达时也能沉淀可追责的 FAIL 证据，并为网络恢复后的“一次性真实发布 + 按口径取证”做准备。
- 本轮最小可交付增量（v1-61，离线可推进，收入优先）已完成：把 v1-60 的「获客效率证据包（JSON）」从“复制”升级为“下载文件落盘”，新增稳定入口 `#download-pro-acquisition-efficiency-by-campaign-evidence-pack`，让每周渠道复盘证据可低摩擦归档/分享/审计（不依赖剪贴板）。
- 本轮最小可交付增量（v1-63，离线可推进，收入优先）已完成：新增「下载周度渠道复盘证据包（JSON）」入口 `#download-pro-weekly-channel-ops-evidence-pack`，把 v1-61/v1-57/v1-51 的互证资产打包成单文件（JSON）可按周落盘归档，并内置 `assets.verifyMarkdown` 最短互证步骤，显著降低渠道复盘与商业化审计摩擦。
- 本轮最小可交付增量（v1-58，离线可推进，收入优先）已完成：把 v1-54 `leads` 与 v1-57 `distCopies` 按 campaign 自动对齐并一键导出 7d 合并 CSV（含 `leadsPerDistCopy`，`distCopies=0 -> N/A`），用于渠道效率对比复盘与审计（见 `docs/evidence/v1-58/`、`docs/test-cases/v1-58.md`）。
- 本轮最小可交付增量（v1-54，离线可推进）已完成：把“按 campaign 的留资效率复盘”从手工复算升级为一键可导出的证据资产（按 campaign 聚合 7d 导出 + 复盘口径/证据目录固化），用于渠道分发/投放的可转化获客增长与后续真实商店跑数对齐。
- 下一步最小可交付增量（已完成，v1-55，离线可推进，收入优先）：已补齐“对外分发 Pro 候补/问卷”的低摩擦工具包（候补链接/招募文案一键复制，强制带 campaign），让渠道投放从“可复盘”升级为“更容易做对、做了就能取证”。
- 下一步最小可交付增量（已完成，v1-56，离线可推进，收入优先）：已交付「按 campaign 的本周复盘摘要（Markdown）一键复制 + 证据落盘」，让每周渠道复盘从“导出 CSV 手工算”升级为“可直接粘贴复盘、且可审计可复核”的标准化周报资产。
- 本轮最小可交付增量（已完成，v1-57，离线可推进，收入优先）：升级“渠道分发工具包”——补齐商店安装链接/完整投放包一键复制，并把分发动作沉淀为可导出的按 campaign 证据口径，用于对齐「分发动作 -> 留资 leads」的效率复盘。
- 可观测性（隐私合规）：已实现“匿名使用数据”开关（默认关闭）+ 本地匿名事件日志导出/清空（仅 name/ts/props 白名单）；并有本地漏斗摘要/增长统计面板
- 激活（Activation）：Popup 已有 3 步新手引导（可跳过、可手动重开）+ 推荐设置一键应用
- 口碑闭环（WOM）：Popup/Options/评分引导已统一商店 UTM 口径；Options -> 隐私页新增「WOM 摘要」与「证据包导出」，可按来源统计 `wom_*` / `rating_prompt_*` 并派生转化率（share copy / rating prompt）
- 商业化准备：Options -> Pro Tab 已有 Free vs Pro Planned 口径与“加入候补名单/复制候补文案”入口；Popup 已补齐“升级 Pro/加入候补名单/复制候补文案”低摩擦入口；并在隐私页新增「Pro 意向漏斗摘要」与「证据包导出」（v1-38），可量化/可审计/可复盘
- 发布与质量：`npm run publish:cws -- --dry-run` 已升级为输出「Proxy Diagnostic + Preflight」完整诊断块（含 socks5/socks5h）；强制 `bash scripts/test.sh` + 产物/版本一致性校验 + 重新打包 zip；全量回归近期均 PASS（2026-03-21，扩展版本 1.1.28，产物 `plugin-1.1.28.zip`）
- 发布凭据：仓库本地 `.env` 已配置 `CWS_EXTENSION_ID/CWS_CLIENT_ID/CWS_CLIENT_SECRET/CWS_REFRESH_TOKEN`（均为 set）；当前阻塞点仍为网络可达性（但已支持 `http/https/socks5/socks5h` 代理，并可通过 Preflight 输出可审计失败类型与修复建议）
- 体验增量（近 24h）：已修复悬浮按钮 Prompt 选区作用域（v1-34）与整页转换正文优先（v1-35），降低噪音提升首次成功复制质量
- 商店物料：已纠偏夸大口径并补齐教程入口（v1-28）；并已在商店长描述补齐“Pro 候补/Planned”CTA 与稳定口径链接（`docs/monetization/pro-scope.md`，v1-36）
- 已交付离线增量（收入优先）：v1-46 已把 Pro 候补 CTA 的曝光/动作链路变成可量化漏斗（例如：`pro_prompt_shown -> pro_entry_opened -> pro_waitlist_opened -> pro_waitlist_copied`），并可通过 Options -> 隐私页导出证据包落盘（`docs/evidence/v1-46/`），用于真实发布后与 v1-42/v1-44 基线对比

## 下一步最重要的 3 件事（收入优先）
1. 完成一次真实 CWS 发布 + 商店端取证（Top1，阻塞：需要可用代理/VPN + 商店可达）：在网络可达后执行 `npm run publish:cws -- --evidence-dir docs/evidence/v1-62/preflight/` 发布到 `default` channel，并落盘 `.publish.json` 证据包；发布成功后补齐商店端“版本号 + 发布时间 + Pro 候补 CTA 可见”截图索引（见 `docs/evidence/v1-62/index.md`），形成可审计的商业化推进证据。
2. 发布后回归与复盘证据补齐（Top2，收入优先）：真实发布后从商店安装/或以 `plugin-*.zip` 安装回归，导出并落盘「Pro 意向漏斗摘要/证据包」（v1-38/v1-42）与 “上架后 24h/7d 复盘模板”截图索引（v1-45），确保“发布 -> 转化入口 -> 证据资产”闭环可复核。
3. （v1-65）真实渠道跑数持续化（Top3，离线可推进）：基于 v1-64 的口径与互证链路，每周至少跑 2 个真实 campaign + `空 campaign`，导出 `.on.json` 并按 `assets.verifyMarkdown` 复核 PASS 后归档（可追加到 `docs/evidence/v1-64/` 或新目录），形成可审计的环比趋势，为后续真实商店跑数对齐做准备。

## 阻塞与需要的人类输入
- v1-53 已完成且无账号/凭据/权限阻塞：campaign 为用户手动填写的渠道标识，已明确提示“不要填写敏感信息”，并保持匿名使用数据默认 OFF 的隐私边界。
- Top1 仍受网络可达性阻塞（需要代理/VPN + 商店可达）；Top2（发布后回归取证）依赖 Top1；Top3（渠道跑数持续化）可离线推进。已优先交付离线可推进的 v1-50/v1-51（weekly digest + 7d 明细 CSV）+ v1-53（campaign 渠道归因）+ v1-54（按 campaign 聚合导出）+ v1-62（发布诊断证据包落盘）+ v1-63（周度渠道复盘证据包一键下载/落盘）+ v1-64（真实渠道跑数基线落盘），保证收入取证资产不断档，网络恢复后可直接与真实商店跑数对齐。
- v1-57 已完成且无账号/凭据/权限阻塞：已补齐「商店安装链接（UTM + campaign）/完整投放包（Markdown）一键复制/分发动作取证导出」，让渠道分发从“能复制”升级为“可获客 + 可量化 + 可复盘”的最小闭环证据资产。
- v1-58 已完成且无账号/凭据/权限阻塞：已新增「按 campaign 合并导出 7d 获客效率（leads + distCopies + leadsPerDistCopy）」入口 `#export-pro-acquisition-efficiency-by-campaign-7d-csv`，可直接与 v1-54/v1-57 导出互证复算，降低复盘摩擦并固化可审计证据资产。
- v1-59 已完成且无账号/凭据/权限阻塞：已新增「复制本周获客效率复盘摘要（Markdown，按 campaign）」入口 `#copy-pro-acquisition-efficiency-by-campaign-weekly-report`；匿名 OFF 不读取/不推断 events 且输出 OFF 提示 + Env；匿名 ON 仅基于本地匿名事件派生并生成表格/Insights；证据目录 `docs/evidence/v1-59/` 可审计复核。
- v1-60 已完成且无账号/凭据/权限阻塞：已新增「复制获客效率证据包（JSON，含 CSV + Markdown + Env）」入口 `#copy-pro-acquisition-efficiency-by-campaign-evidence-pack`；匿名 OFF 不读取/不推断 events 且输出 OFF 提示 + Env；匿名 ON 仅基于本地匿名事件派生 evidence pack（含 v1-58 CSV + v1-59 Markdown + 结构化 rows 互证）；证据目录 `docs/evidence/v1-60/` 可审计复核。
- v1-61 已完成且无账号/凭据/权限阻塞：已新增「下载获客效率证据包（JSON，含 CSV + Markdown + Env）」入口 `#download-pro-acquisition-efficiency-by-campaign-evidence-pack`；匿名 OFF 允许下载但不读取/不推断 events 且输出 OFF 提示 + Env；匿名 ON 仅基于本地匿名事件派生 evidence pack；文件名稳定可按周归档（`.on/.off`）；证据目录 `docs/evidence/v1-61/` 可审计复核。
- v1-63 已完成且无账号/凭据/权限阻塞：已新增「下载周度渠道复盘证据包（JSON）」入口 `#download-pro-weekly-channel-ops-evidence-pack`；匿名 OFF 允许下载但不读取/不推断 events 且输出 OFF 提示 + Env + 空资产占位；匿名 ON 仅基于本地匿名事件派生单文件证据包（含 v1-61 evidence pack + v1-57 7d CSV + v1-51 7d CSV + `assets.verifyMarkdown`）；文件名稳定可按周归档（`.on/.off`）；证据目录 `docs/evidence/v1-63/` 可审计复核。
- v1-64 已完成且无账号/凭据/权限阻塞：已落盘真实渠道跑数基线 `.on.json` + baseline 表 + 截图索引 + 互证 PASS 结论（`docs/evidence/v1-64/`），并补齐用例/简报（`docs/test-cases/v1-64.md`、`docs/reports/v1-64-report.md`），可审计复核。
- v1-54 已完成且无账号/凭据/权限阻塞：已新增「按 campaign 聚合 7d CSV 导出」入口与证据落盘（`docs/evidence/v1-54/`），可在 Top1/Top2 网络阻塞期间先跑渠道分发/投放并形成可审计、可复核的收入导向证据。
- v1-55 已完成且无账号/凭据/权限阻塞：已新增“候补链接/招募文案一键复制（强制带 campaign）”的本地生成与用例/证据固化，不引入支付/订阅、不新增权限、不联网发送数据、不采集用户复制内容。
- v1-56 已完成且无账号/凭据/权限阻塞：已在 Options -> 隐私与可观测性 -> Pro 面板新增稳定入口 `#copy-pro-intent-by-campaign-weekly-report`；匿名开关 OFF 时不读取/不推断事件并明确提示“匿名使用数据关闭（无可用事件）”；匿名开关 ON 时仅基于本地匿名事件日志派生按 campaign 周报（不包含 URL/标题/网页内容/复制内容）；证据目录 `docs/evidence/v1-56/` 可审计复核。
- v1-51 已完成并固化：可导出过去 7 天 Pro 意向明细 CSV（稳定 DOM：`#export-pro-intent-events-7d-csv`），并在 `docs/evidence/v1-51/index.md` 固化最小复盘口径与归档规范；网络恢复后可直接与真实商店跑数对比。
- Chrome Web Store 真实发布的根因阻塞仍为“网络可达性”：本地凭据已齐全，但需要人类侧提供可用代理/VPN（并提供包含 scheme 的代理地址/端口，例如 `http://127.0.0.1:7890` 或 `socks5://127.0.0.1:1080`）。v1-47 已补齐 `socks5://`/`socks5h://` 支持与可审计 Preflight；当网络不可达时可直接从输出中得到 FAIL 类型与修复建议，避免只剩 `fetch failed`。
- 若 `chromewebstore.google.com` 亦不可达，则 Top2 的“从商店安装回归/取证”同样需要代理/VPN；但 v1-42 已以 `plugin-*.zip` 安装回归作为不依赖外网的保底路径，确保基线证据可落盘且可对比。
- 若未来要打通“收款/订阅”（非本阶段 MVP），需要：Stripe/收款账号、定价策略与退款/税务口径（本轮不做）
- v1-45 已把离线门禁与取证/复盘路径固化：可先按 `docs/publish/cws-preflight-checklist.md` 完成离线门禁；网络可达后按 `docs/test-cases/v1-45.md` 完成“真实发布 -> 商店端截图 -> 从商店安装回归 -> 导出证据 -> 更新 `docs/evidence/v1-45/index.md` -> 24h/7d 复盘”。
