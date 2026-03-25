# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S0 上架与商店端取证闭环（收入优先）
- 阶段选择说明：产品已发布并进入并行推广获客；当前主路径仍是 S0 商店端真实取证闭环。由于 Top1 受“CWS 权限 + `source ~/.bash_profile && pxy`”阻塞，按顺延规则先执行可直接推动收入证据沉淀的 Top2 增量。
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到 Chrome Web Store；官网已上线；并行增长循环已启动
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`

## 当前进度
- 当前进度一句话结论：S0 `13/15`，S4 `4/7`，S5 `3/3`；Top1 阻塞持续，但顺延执行 Top3 第 2 项（v1-99）已完成并形成可审计对比证据。
- 关键阶段进度：S0 `13/15`；S4 `4/7`；S5 `3/3`
- 本轮交付主题：Top1 因权限/代理阻塞不可执行，按顺延规则执行 `prds/v1-99.md`（Top3 第 2 项）并完成三入口样本回填与漏斗对比证据导出。

## 阶段里程碑（S0）
- [x] Top2 持续增量里程碑：v1-99 三入口样本回填 + `clicks/installs/proIntentSignals` 对比证据包已完成。
- [ ] Top1 主路径里程碑：v1-70/v1-71 商店端回归与 Listing 同步取证（待解除 `CWS 权限 + source ~/.bash_profile && pxy` 阻塞）。

## 下一步最重要的 3 件事（收入优先）
1. （S0 主路径，当前阻塞）解除 CWS Developer Dashboard 编辑/发布权限，并在目标 shell 执行 `source ~/.bash_profile && pxy`。
2. （阻塞解除后立即执行）回切 v1-70/v1-71，补齐商店安装回归、Listing 同步与截图取证证据链。
3. （并行收入证据）延续三入口样本回填与对比导出，持续更新 `conversion-evidence-index`、`metrics`、执行记录三方一致性。

## 阻塞与需要的人类输入（如有）
- Top1 阻塞主描述：`CWS 权限 + source ~/.bash_profile && pxy 未就绪`。
- 阻塞详情（权限）：缺少 CWS Developer Dashboard 编辑/发布权限，无法完成真实 Listing 同步与商店端截图取证闭环。
- 阻塞详情（代理）：当前未在目标 shell 启动可访问 CWS 的代理服务，导致 v1-70/v1-71 无法回切执行。
- 顺延规则：在“权限 + 代理”任一阻塞未解除前，执行收入优先的 Top2 交付；阻塞解除后立即回切 Top1 主路径。
- 本轮顺延执行说明：由于 Top1 仍阻塞，本轮子 PRD `prds/v1-99.md` 选择 Top3 第 2 项作为交付主题并已完成交付。
- 需要的人类输入：提供 CWS Dashboard 编辑/发布权限，并在目标 shell 启动 `pxy`（或完成等效代理就绪动作）。
