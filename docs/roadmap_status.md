# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S0 上架与商店端取证闭环（收入优先，当前交付聚焦“可执行发布与转化入口验证”）
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到 Chrome Web Store；官网已上线，已进入并行推广获客与商业化验证
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`

## 当前进度
- 当前进度一句话结论：S0 当前为 `9/11`，v1-95 已完成“代理未启用可判定 + `pxy` 可复制修复动作 + `proxyReadiness.*` 证据固化”，发布链路已具备可审计、可复盘、可归因的代理门禁能力；下一优先级聚焦 v1-70/v1-71 的商店端实操取证闭环。
- 关键阶段进度：S0 `9/11`；S4 `4/7`

## 本轮推进的阶段里程碑
- [x] （S0 / v1-95）代理就绪门禁：`proxy_not_started` 稳定分类 + `pxy` 指令 + `proxyReadiness.*` 证据固化
- [ ] （S0 / v1-70）发布后回归与复盘证据补齐（从商店安装为准）
- [ ] （S0 / v1-71）Listing 同步落地 + 商店端取证（EN/ZH descriptions + keywords）

## 下一步最重要的 3 件事（收入优先）
1. （S0 / v1-70/v1-71）在同一 shell 先执行 `source ~/.bash_profile && pxy`，再完成 Listing 同步、从商店安装回归与截图取证，补齐商店端转化入口证据闭环
2. （S0）补齐 CWS Developer Dashboard 编辑/发布权限与稳定登录会话，打通真实发布与商店端取证执行条件
3. （增长并行）持续执行官网/商店/Pro 候补入口一致化分发，并回填渠道指标与证据索引

## 阻塞与需要的人类输入
- CWS 权限阻塞：仍需人类提供可用的 CWS Developer Dashboard 编辑/发布权限与登录会话，否则 v1-70/v1-71 只能停留在仓库侧离线演练。
- 代理服务阻塞：发布链路已支持 `proxy_not_started` 自动指路，但真实商店端执行前仍需人类在目标 shell 启动代理（`source ~/.bash_profile && pxy`）。
- 外网与账号会话阻塞：渠道发布与商店端截图取证仍依赖外网连通性和渠道账号登录态。
