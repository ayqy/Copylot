# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S5 增长工厂回归与分发执行（本轮已完成），下一焦点回到 S0 商店端真实取证补齐
- 阶段选择说明：已完成 S5 Top1 的预检分流与降级闭环，当前优先把可直接转化的分发结果回填到商店/官网/Pro 主链路
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到 Chrome Web Store；官网已上线，已进入并行推广获客与商业化验证
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`

## 当前进度
- 当前进度一句话结论：S5 `3/3` 已闭环，`network_blocked` 场景下已完成“Playwright 外网禁用 + xhs 成套素材 + 手动发布清单 + 阻塞留痕 + make todo + 转化证据索引”。
- 关键阶段进度：S0 `9/11`；S4 `4/7`；S5 `3/3`
- 本轮交付主题：v1-96（S5）工厂增长 PRD v2 回归，聚焦“分发可执行与转化证据可审计”

## 本轮阶段里程碑（S5）
- [x] 里程碑 1：完成 `curl` 外网预检并落盘分流证据（命中 `network_blocked`）
- [x] 里程碑 2：完成 xhs 成套竖版资产（封面 + 第 3-8 页）与手动发布清单
- [x] 里程碑 3：完成阻塞留痕、`make todo`、执行记录与转化证据索引对齐

## 下一步最重要的 3 件事（收入优先）
1. （收入回填）网络恢复后立即按 `docs/growth/checklists/manual-posting-xhs-v1-96.md` 完成真实发布，并回填帖子 URL、点击与意向信号
2. （S0 补齐）在代理就绪与账号可用前提下补齐 v1-70/v1-71 的商店端安装回归、Listing 同步与截图取证
3. （S4 转化）持续统一官网/CWS/Pro 候补入口参数，滚动更新 `conversion-evidence-index` 与 Pro 意向证据包

## 阻塞与需要的人类输入（如有）
- 外网阻塞：当前环境 `curl` 预检命中 `network_blocked`，需要可访问外网的代理/VPN 或可直连网络。
- 渠道账号阻塞：需要可发布的小红书账号与稳定登录态；若触发验证码/风控，需人工完成验证。
- CWS 权限阻塞：v1-70/v1-71 仍需 CWS Developer Dashboard 编辑/发布权限。
- 已执行降级：阻塞详情在 `docs/growth/blocked.md`，待办在 `docs/growth/todo.md`（由 `make todo` 刷新）。
