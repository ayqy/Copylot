# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S0 上架与商店端取证闭环（收入优先）
- 阶段选择说明：产品已发布到商店且已并行推广获客；主路径仍是 S0 的商店端真实取证闭环。由于 Top1 依赖权限与代理就绪，当前按顺延规则执行可直接推动转化与付费意向证据沉淀的收入增量。
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到 Chrome Web Store；官网已上线；并行增长循环已启动
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`

## 当前进度
- 当前进度一句话结论：S0 `13/15`，S4 `4/8`，S5 `3/3`；Top1 阻塞持续，已按顺延规则切换到 Top2 的收入最小增量并产出 `prds/v1-100.md`。
- 关键阶段进度：S0 `13/15`；S4 `4/8`；S5 `3/3`
- 本轮交付主题：Top1 因账号权限/代理阻塞不可执行，顺延选择 Top3 第 2 项（`v1-100`：Pro 意向转化最小增量）。

## 下一步Top3（收入优先）
1. （S0 主路径，当前阻塞）解除 CWS Developer Dashboard 编辑/发布权限，并在目标 shell 完成 `source ~/.bash_profile && pxy` 代理就绪。
2. （本轮顺延执行主题）交付 `prds/v1-100.md`：三入口升级 CTA 对齐、问卷最短路径、可导出漏斗证据与测试用例闭环。
3. （并行收入证据）持续回填 `conversion-evidence-index`，并保持 `metrics`、执行记录、证据索引三方一致。

## 阻塞
- Top1 阻塞主描述：`CWS 权限 + source ~/.bash_profile && pxy 未就绪`。
- 阻塞详情（权限）：缺少 CWS Developer Dashboard 编辑/发布权限，无法完成真实 Listing 同步与商店端截图取证闭环。
- 阻塞详情（代理）：目标 shell 未完成 `pxy` 代理就绪，无法访问 CWS 完成 v1-70/v1-71 回切执行。
- 顺延策略：Top1 阻塞未解除时，优先执行收入主线中的 Top2 最小可交付增量；阻塞解除后立即回切 Top1 主路径。
- 需要的人类输入：提供 CWS Dashboard 编辑/发布权限，并在目标 shell 启动 `pxy`（或完成等效代理就绪动作）。
