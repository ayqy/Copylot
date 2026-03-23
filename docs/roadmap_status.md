# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S0 上架与商店端取证闭环（收入优先）
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到 Chrome Web Store；官网已上线，进入“并行推广获客 + 商业化验证”模式
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`
- 核心目标：把“上架 = 获客入口 + Pro 候补 CTA = 商业化验证入口”的链路真正跑通：一边开始增长循环，一边补齐商店端取证与可导出的漏斗/留资证据，确保可审计/可复核/可复盘。

## 当前进度
- 当前进度一句话结论：v1-87 已完成“Popup 问卷入口前置 + 一次性来源归因（popup/options）+ 可导出证据落盘”；下一步（v1-90）优先把「跑数取证」做成可执行闭环：在 Options 内一键导出/离线落盘可复盘证据包 + 例行更新离线决策摘要，持续拉升 `survey_intent` 样本量，为 S4「收款/订阅链路」go/no-go 提供更可信输入。
- S0 进度：8/10（80%）（以 `docs/roadmap.md` 为准）
- S4 进度：3/6（50%）（以 `docs/roadmap.md` 为准）

本轮推进的阶段里程碑：
- [x] （S4 / v1-80）问卷信号结构化 + 7d 分布导出 + 可审计证据/用例/单测门禁
- [x] （S4 / v1-81）收款/订阅推进决策阈值口径 + 离线决策摘要脚本 + 证据包样例（结论：A 继续收集）
- [x] （S4 / v1-87）Popup 问卷入口前置 + 一次性来源归因（popup/options）+ 可导出证据落盘（可审计/可复盘）
- 已具备的关键资产（可审计/可复核）：
  - 发布诊断证据：`docs/evidence/v1-69/preflight/`（dry-run + `.publish.json` 结构化输出）
  - Listing 基线与 diff：`docs/evidence/v1-66/`、`docs/evidence/v1-67/`、`docs/evidence/v1-68/`
  - Listing 可粘贴字段包与索引：`docs/evidence/v1-71/`
  - 合规 ASO 离线迭代证据：`docs/evidence/v1-77/`（diff pack + paste pack；可直接用于后续 Dashboard 粘贴同步）
  - Listing 合规门禁与证据（敏感词/夸大口径）：`docs/evidence/v1-76/`（已接入 `bash scripts/test.sh`）
  - 对外入口“单一事实来源”：`src/shared/external-links.ts`（官网/商店/Pro 候补 URL + UTM 口径）
  - 并行增长循环证据包：`docs/evidence/v1-75/`（官方链接样例 + 投放资产样例；已纳入 `bash scripts/test.sh` 确定性门禁）
  - 转化/获客工具与证据包：Options -> 隐私面板可导出 Pro funnel / weekly digest / campaign 聚合（S1/S2 已完成）
  - Pro 问卷意向分布证据：`docs/evidence/v1-80/`（结构化信号 + 7d 分布导出样例 + sha256 + “无 PII”断言）
  - Pro 决策阈值口径：`docs/monetization/pro-subscription-decision-thresholds.md`（v1-81）
  - Pro 决策摘要脚本：`scripts/build-pro-intent-decision-pack.ts`（v1-81）
  - Pro 决策证据包：`docs/evidence/v1-81/`（分布导出 + 决策摘要 + sha256 + “无 PII”断言）
- 当前主要缺口（收入优先）：
  - S4：Pro 意向样本量仍不足（`survey_intent < 30`），尚无法进入 go/no-go 决策；已完成入口前置与归因/证据闭环，下一步需要持续跑数取证
  - S0：商店端“Listing 同步 + 截图取证 + 发布后回归取证”仍未形成可执行闭环（依赖网络/权限），导致 ASO/转化迭代无法在商店端闭环验证
- 本轮交付主题：待交付（v1-90 / S4）Pro 意向跑数取证执行闭环：证据包一键导出 + 落盘复盘材料（子 PRD：`prds/v1-90.md`）

## 下一步最重要的 3 件事（收入优先）
1. （S4 / v1-90）用 Popup 新入口持续跑数取证：引导真实用户完成问卷并产生 `pro_waitlist_survey_copied`，并将「Pro 意向漏斗摘要 / Pro 意向明细（CSV）/ 问卷意向分布（JSON）」一键导出并落盘为可复盘证据
2. （S4）更新离线决策摘要：基于最新 7d 分布执行 `scripts/build-pro-intent-decision-pack.ts`，判断是否接近/达到订阅 MVP 决策阈值（不足则继续收集）
3. （并行增长循环）按 `docs/growth/checklists/manual-posting-2026-03-23.md` 执行渠道发布/回填指标，持续拉升问卷样本量与升级入口点击（缺账号/外网则保持 BLOCKED 并推进替代动作）

## 阻塞与需要的人类输入
- 并行增长循环“手动首发/回填指标”：需要外网可达（DNS/网络）+ 渠道账号/登录会话（X/LinkedIn/Reddit/HN/PH/IH 等），并按 `docs/growth/checklists/manual-posting-2026-03-23.md` 执行后回填 `docs/growth/metrics-tracker-2026-03-23.md`。
- v1-70/v1-71 商店端取证与 Listing 维护：需要可访问 `chromewebstore.google.com` 与 CWS Developer Dashboard，且具备 Store listing 编辑/发布权限；并需要在可运行 Chrome 的环境中执行“按 `docs/evidence/v1-77/listing-paste-pack.md` 粘贴同步 / 从商店安装回归 / 截图取证 / 导出证据包”等手工步骤。
