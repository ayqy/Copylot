# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S0 上架与商店端取证闭环（收入优先）
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到商店，官网已上线，进入“并行推广获客 + 功能迭代”模式
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`
- 核心目标：把“上架 = 获客入口 + Pro 候补 CTA = 商业化验证入口”的链路真正跑通：一边开始增长循环，一边补齐商店端取证与可导出的漏斗/留资证据，确保可审计/可复核/可复盘。

## 当前进度
- 已具备的关键资产（可审计/可复核）：
  - 发布诊断证据：`docs/evidence/v1-69/preflight/`（dry-run + `.publish.json` 结构化输出）
  - Listing 基线与 diff：`docs/evidence/v1-66/`、`docs/evidence/v1-67/`、`docs/evidence/v1-68/`
  - Listing 可粘贴字段包与索引：`docs/evidence/v1-71/`
  - 转化/获客工具与证据包：Options -> 隐私面板可导出 Pro funnel / weekly digest / campaign 聚合（S1/S2 已完成）
- 当前主要缺口（收入优先）：缺少“上架后真实推广”的最小闭环落盘（官网/商店/候补入口与分发资产一致化 + 可复盘证据），导致增长循环启动时口径分散、复盘成本高。

## 下一步最重要的 3 件事（收入优先）
1. （v1-74）并行增长循环启动：官网/商店/Pro 候补转化入口一致化 + 可导出复盘证据（Top1，可离线推进）
2. （v1-70）发布后回归与商店端取证补齐：从商店安装回归 + 截图取证 + 导出 Pro 漏斗证据（Top2，需要人工执行取证步骤）
3. （v1-72）敏感词/夸大口径门禁口径定稿 + 自动化扫描/证据落盘（Top3，为 Listing 迭代与审核风险兜底）

## 阻塞与需要的人类输入
- 商店端取证与 Listing 维护：需要可访问 `chromewebstore.google.com` 与 CWS Developer Dashboard，且具备 Store listing 编辑/发布权限（用于 v1-70 取证与后续 listing 迭代）。
