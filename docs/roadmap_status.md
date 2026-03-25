# Roadmap 状态（断点续孵化）

## 当前阶段
- Stage：S0 上架与商店端取证闭环（收入优先）
- 阶段选择说明：S5 增长工厂回归已闭环，且产品已发布并可并行推广获客；当前优先补齐 S0 商店端真实取证与 Listing 同步，并并行执行增长循环回填，直接支撑商店转化与后续收款链路可信度。
- 当前版本：`manifest.json` = `1.1.28`
- 当前状态：插件已发布到 Chrome Web Store；官网已上线，已进入并行推广获客与商业化验证
  - 官网：`https://copy.useai.online/`
  - 商店：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`

## 当前进度
- 当前进度一句话结论：S0 `11/13`，v1-97「真实发布回填 + 转化证据入索引」已完成；Top1 阻塞未解除前保持可回切策略。
- 关键阶段进度：S0 `11/13`；S4 `4/7`；S5 `3/3`
- 本轮交付主题：在 Top1 阻塞持续存在时完成 Top2（v1-97）真实发布回填、链路复核与测试门禁闭环。

## 阶段里程碑
- [x] S0 / Top2：v1-96 入口参数统一 + 证据索引补齐
- [x] S0 / Top2：v1-97 真实发布回填 + 分发到意向链路复核
- [ ] S0 / Top1：v1-70-v1-71 商店安装回归与 Listing 同步取证

## 下一步最重要的 3 件事（收入优先）
1. （S0 主路径）在具备 CWS Developer Dashboard 编辑/发布权限且已执行 `source ~/.bash_profile && pxy` 后，完成 v1-70/v1-71：商店安装回归、Listing EN/ZH 同步、商店端截图取证、转化入口一致性校验。
2. （并行增长循环）继续扩展 xhs 可转化样本：复用 v1-97 口径回填更多帖子 URL 与 `clicks/installs/proIntentSignals`，持续维护 `conversion-evidence-index` 与执行记录一致性。
3. （收入转化）推进 S4 的意向样本量提升项（v1-93/v1-94），把已回填分发流量稳定导入 Pro 意向漏斗并输出可导出证据。

## 阻塞与需要的人类输入（如有）
- Top1 阻塞（权限）：缺少 CWS Developer Dashboard 编辑/发布权限，无法完成真实 Listing 同步与商店端取证闭环。
- Top1 阻塞（代理）：当前未启动可访问 CWS 的代理服务；需在目标 shell 执行 `source ~/.bash_profile && pxy` 后重试。
- Top1 顺延规则：在“权限 + 代理”任一阻塞未解除前，继续执行增长侧 Top2 交付；解除后立即回切 Top1。
- Top2 风险预案（账号会话）：若后续真实发布遇到登录/验证码/风控，需在 `docs/growth/blocked.md` 记录触发环节、影响范围与恢复条件，并同步 `docs/growth/todo.md`。
- 已知前提：项目内 CWS env 已可用，现阶段阻塞点集中在“权限 + 代理服务状态”。
- 已执行策略：已完成 v1-96 与 v1-97（真实发布回填 + 链路复核 + 测试门禁）；阻塞与替代动作统一写入 `docs/growth/blocked.md`，待 Top1 阻塞解除后立即回切 S0 主路径。
