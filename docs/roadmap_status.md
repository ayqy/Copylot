# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S4 Pro 商业化 MVP（试水，不破坏免费核心体验）
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到 Chrome Web Store；官网已上线，进入“并行推广获客 + 商业化验证”模式
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`
- 核心目标（收入第一）：把「Pro 候补（问卷意向）-> 可导出证据 -> 离线决策摘要 -> 订阅 MVP go/no-go」这条真实收入回报路径跑通；并与“并行推广获客”形成闭环（可审计/可复核/可复盘）。

## 当前进度
- 当前进度一句话结论：v1-90 已完成「Pro 意向跑数取证」执行闭环（Options 一键导出单文件证据包 + 离线脚本落盘到 `docs/evidence/v1-90/` 并固化 sha256）；当前阻塞不在“取证链路”，而在“意向样本量不足（`survey_intent < 30`）”：下一步（v1-93）必须通过产品内低打扰引导，把 `pro_waitlist_survey_copied` 跑起来，并把“可计入样本”的提示与漏斗证据口径补齐，确保可审计、可复盘、可对账。
- S0 进度：8/10（80%）（以 `docs/roadmap.md` 为准；商店端取证仍受外网/权限阻塞）
- S4 进度：4/7（57.1%）（以 `docs/roadmap.md` 为准；下一步先提升意向样本量，再推进收款/订阅）

本轮推进的阶段里程碑：
- [x] （S4 / v1-80）问卷信号结构化 + 7d 分布导出 + 可审计证据/用例/单测门禁
- [x] （S4 / v1-81）收款/订阅推进决策阈值口径 + 离线决策摘要脚本 + 证据包样例（结论：A 继续收集）
- [x] （S4 / v1-87）Popup 问卷入口前置 + 一次性来源归因（popup/options）+ 可导出证据落盘（可审计/可复盘）
- [x] （S4 / v1-90）跑数取证执行闭环：一键导出 Pro 意向跑数证据包（JSON）+ 离线落盘复盘材料（sha256 固化）
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
  - Pro 意向跑数取证证据：`docs/evidence/v1-90/`（一键导出证据包 + 离线落盘 + sha256 固化；用于周度复盘与对账）
- 当前主要缺口（收入优先）：
  - S4：Pro 意向样本量仍不足（`survey_intent < 30`），尚无法进入 go/no-go 决策；已完成入口前置与归因/证据闭环，下一步需要持续跑数取证
  - S0：商店端“Listing 同步 + 截图取证 + 发布后回归取证”仍未形成可执行闭环（依赖网络/权限），导致 ASO/转化迭代无法在商店端闭环验证
- 本轮交付主题：计划交付（v1-93 / S4）Pro 意向样本量提升闭环：Popup “1 分钟问卷”低打扰提示 + 计入样本引导/一键开启匿名使用数据 + 漏斗证据口径固化（子 PRD：`prds/v1-93.md`）

## 下一步最重要的 3 件事（收入优先）
1. （S4 / v1-93）提升 `survey_intent` 样本量：强化 Popup 侧“1 分钟问卷”低打扰引导（可稍后/不再提示）+ 问卷区“计入样本”提示/一键开启匿名使用数据，引导真实用户产生 `pro_waitlist_survey_copied`，并补齐可导出的漏斗证据口径
2. （S4）例行生成离线决策摘要：基于最新 7d 分布执行 `scripts/build-pro-intent-decision-pack.ts`，判断是否接近/达到订阅 MVP 决策阈值（不足则继续收集）
3. （增长并行）执行首发/分发与回填指标：按 `docs/growth/checklists/manual-posting-2026-03-24.md` 发帖并回填 `docs/growth/metrics-tracker-2026-03-23.md`，确保增长循环可复盘（带 campaign）

## 阻塞与需要的人类输入
- 并行增长循环“手动首发/回填指标”：需要外网可达（DNS/网络）+ 渠道账号/登录会话（X/LinkedIn/Reddit/HN/PH/IH 等），并按 `docs/growth/checklists/manual-posting-2026-03-24.md` 执行后回填 `docs/growth/metrics-tracker-2026-03-23.md`。
- v1-70/v1-71 商店端取证与 Listing 维护：需要可访问 `chromewebstore.google.com` 与 CWS Developer Dashboard，且具备 Store listing 编辑/发布权限；并需要在可运行 Chrome 的环境中执行“按 `docs/evidence/v1-77/listing-paste-pack.md` 粘贴同步 / 从商店安装回归 / 截图取证 / 导出证据包”等手工步骤。
- 自动 commit+push：当前环境不允许写入 `.git/`（无法创建 `.git/index.lock`），需在人类开发环境中完成提交与推送；无权限情况下仍可继续在工作区生成可发布产物与离线证据。
