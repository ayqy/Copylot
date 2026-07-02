# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S0 上架与商店端取证闭环（收入优先）
- 阶段选择说明：产品已发布到商店且已并行推广获客；主路径仍是 S0 的商店端真实取证闭环。`Copylot` 的 GSC / GA4 真实链路已在本轮恢复，后续收入与功能判断应优先依据真实搜索数据和站内承载缺口，而不是继续停留在“代理未通”的旧假设。
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到 Chrome Web Store；官网已上线；并行增长循环已启动
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`

## 当前进度
- 当前进度一句话结论：S0 `13/15`，S4 `5/8`，S5 `3/3`；Top1 阻塞持续，但本轮已恢复 `Copylot` 的 GSC / GA4 真实数据链路，并完成一轮真实增长闭环。
- 关键阶段进度：S0 `13/15`；S4 `5/8`；S5 `3/3`
- 本轮交付主题：恢复 `Copylot` 增长数据基线并执行真实工厂增长，证据见 `docs/reports/v1-106-report.md` 与 `docs/evidence/growth/20260702-100354-growth/`。

## 下一步Top3（收入优先）
1. 修复 `https://copy.useai.online/pricing` 的可访问性，并把修复结果重新提交 GSC。
2. 基于工厂动作板扩出首批 `facts / use_case / guide_detail` 内容承载页，接住现有极薄搜索曝光。
3. 继续维护 `v1-100` 的意向漏斗证据与 `conversion-evidence-index`，把搜索流量和 Pro 意向承接到同一复盘口径。

## 阻塞
- Top1 阻塞主描述：`CWS 权限 + source ~/.bash_profile && pxy 未就绪`。
- 阻塞详情（权限）：缺少 CWS Developer Dashboard 编辑/发布权限，无法完成真实 Listing 同步与商店端截图取证闭环。
- 阻塞详情（代理）：目标 shell 未完成 `pxy` 代理就绪，无法访问 CWS 完成 v1-70/v1-71 回切执行。
- 顺延策略：Top1 阻塞未解除时，优先执行收入主线中的 Top2 最小可交付增量；阻塞解除后立即回切 Top1 主路径。
- 需要的人类输入：提供 CWS Dashboard 编辑/发布权限，并在目标 shell 启动 `pxy`（或完成等效代理就绪动作）。
