# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S0 上架与商店端取证闭环（收入优先）
- 阶段选择说明：S5 增长工厂回归已闭环，且产品已发布并可并行推广获客；当前优先补齐 S0 商店端真实取证与 Listing 同步，直接支撑商店转化与后续收款链路可信度。
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到 Chrome Web Store；官网已上线，已进入并行推广获客与商业化验证
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`

## 当前进度
- 当前进度一句话结论：S0 `10/12`，Top2「入口参数统一 + 转化证据索引补齐」已完成；剩余主阻塞仍是 CWS 权限与代理未启动（`source ~/.bash_profile && pxy`）。
- 关键阶段进度：S0 `10/12`；S4 `4/7`；S5 `3/3`
- 本轮交付主题：在 Top1 阻塞持续存在时，完成 Top2 独立闭环并保持可回切 S0 主路径。

## 下一步最重要的 3 件事（收入优先）
1. （S0 主路径）在具备 CWS Developer Dashboard 编辑/发布权限且已执行 `source ~/.bash_profile && pxy` 后，完成 v1-70/v1-71：商店安装回归、Listing EN/ZH 同步、商店端截图取证、转化入口一致性校验。
2. （收入回填）按 `docs/growth/checklists/manual-posting-xhs-v1-96.md` 完成至少一轮真实发布回填：帖子 URL、点击、安装、候补意向信号写入 `conversion-evidence-index`。
3. （意向沉淀）把 `conversion-evidence-index` 与 `docs/evidence/v1-90/pro-intent-run-evidence-pack.json` 做同口径复核，产出可复盘的“分发 -> 转化 -> 意向”链路样例。

## 阻塞与需要的人类输入（如有）
- Top1 阻塞（权限）：缺少 CWS Developer Dashboard 编辑/发布权限，无法完成真实 Listing 同步与商店端取证闭环。
- Top1 阻塞（代理）：当前未启动可访问 CWS 的代理服务；需在目标 shell 执行 `source ~/.bash_profile && pxy` 后重试。
- 已知前提：项目内 CWS env 已可用，现阶段阻塞点集中在“权限 + 代理服务状态”。
- 已执行策略：本轮已完成 Top2（不依赖 CWS Dashboard 权限），并将阻塞与替代动作同步到 `docs/growth/blocked.md`；待 Top1 阻塞解除后立即回切 S0 主路径。
