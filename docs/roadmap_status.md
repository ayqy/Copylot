# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S5 增长工厂回归与分发执行（收入优先，并行获客）
- 阶段选择说明：S0 仍有商店端取证待补齐，但受 CWS 权限与代理会话阻塞；本轮先执行可落地的增长回归与转化资产闭环
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到 Chrome Web Store；官网已上线，已进入并行推广获客与商业化验证
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`

## 当前进度
- 当前进度一句话结论：S0 `9/11` 的发布链路门禁已就绪，但真实商店端取证受账号与代理阻塞；本轮切换到 S5，先完成“xhs 素材生成 + 降级清单 + 证据索引”的可执行增长闭环。
- 关键阶段进度：S0 `9/11`；S4 `4/7`；S5 `0/3`
- 本轮交付主题：v1-96（S5）工厂增长回归验证，目标是直接支撑分发与转化入口跑数

## 下一步最重要的 3 件事（收入优先）
1. （S5 / v1-96）按工厂增长 PRD 完成回归测试，重点验证 xhs 素材（封面 + 3-8 内页）生成与降级手动清单，沉淀可执行证据与测试用例
2. （S0 / v1-70/v1-71）在同一 shell 执行 `source ~/.bash_profile && pxy` 后补齐 Listing 同步、商店安装回归与截图取证，闭合商店端转化入口证据
3. （S4）并行开始增长循环：延续官网/商店/Pro 候补入口一致化分发，回填渠道归因与意向漏斗证据，提升可转化样本

## 阻塞与需要的人类输入
- CWS 权限阻塞：v1-70/v1-71 仍需人类提供 CWS Developer Dashboard 编辑/发布权限与稳定登录会话。
- 代理会话阻塞：真实商店端执行前，仍需人类在目标 shell 启动代理（`source ~/.bash_profile && pxy`）。
- 渠道账号阻塞：若增长执行遇到登录/验证码/风控，必须记录到 `docs/growth/blocked.md` 并进入 `make todo`。
