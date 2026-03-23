# Copylot 增长执行计划（7 天冲刺）

目标：在 **Copylot 已上线可访问** 的前提下，并行推进 **推广获客** 与 **反馈收集**；优先自动化，受限则用“可复制物料 + 手动执行清单”推进。

> 注：当前执行环境存在 DNS/网络不可达问题，无法自动化打开官网/CWS/社媒站点进行真实发布与取证；已在 `docs/growth/blocked.md` 记录所需输入与替代动作。

## 1) 北极星指标与漏斗

- 北极星（North Star）：Activated Active Users（活跃用户中“成功复制 ≥ 1 次”的人数）
- 核心漏斗：曝光 → 点击（官网/商店）→ 安装 → 首次成功复制 → 复用 → WOM（分享/评价/反馈）

**7 天目标（保守可达）**
- Installs：≥ 200
- Activated（样本口径）：≥ 60（来自自愿反馈用户的 evidence pack / 复现样本）
- 有效反馈（Issue/长评论/私信）：≥ 20
- CWS 评价（Reviews）：≥ 5
- Pro 意向（候补/问卷）：≥ 20

## 2) 目标人群与信息架构（先打中“复制很痛”的人）

人群 A：知识工作者（Notion/Obsidian/Docs）
- 痛点：复制后要删导航/广告/重新排版
- 卖点：智能区块复制 → 干净 Markdown/纯文本

人群 B：开发者（复制代码/教程）
- 痛点：代码块行号/按钮文案噪声、缩进被破坏
- 卖点：代码块清理 + 悬停复制（保留缩进/空行）

人群 C：数据/运营（复制表格）
- 痛点：网页表格粘贴到表格工具列错位
- 卖点：表格一键转 CSV/Markdown（可直接粘贴）

统一的“必须出现”口径（合规/不夸大）：
- 价值主张基准：`docs/aso/value-prop.md`
- 隐私：默认本地处理；不收集/不上传复制内容；匿名使用数据默认关闭且仅本地

## 3) 渠道策略与发布节奏（7 天）

内容包（直接复制粘贴）：
- 多渠道文案：`docs/growth/publish-pack-2026-03-23.md`
- 可访问落地页基准（CWS 快照，用于对齐口径）：`docs/growth/assets/landing/2026-03-23/cws-listing-snapshot.md`
- GIF/短视频脚本（建议先录 1 条）：`docs/aso/gif-script.md`

节奏（D0 起 7 天）：
- D0：X + LinkedIn + Reddit/HN（二选一）→ 先拿第一波真实反馈
- D1：Indie Hackers 1 发；补 1 条“表格→CSV”教程贴
- D2：补齐 Reddit/HN 另一渠道；发“Append Mode 跨页面整理”用例
- D3：Product Hunt（若账号/素材就绪）；否则 X thread + 社群分发
- D4：中文渠道二次分发（微信/即刻/少数派风格）
- D5：强调“隐私与可观测性”（默认不联网/开关默认关/可导出证据）
- D6：整理反馈 → 输出迭代清单（进入 S3：确定性提升）

## 4) 反馈收集闭环（不收集内容，优先可复现）

统一引导（发帖末尾固定加 1 句）：
- 轻量反馈：扩展内「反馈」入口（打开 GitHub Issue）
- 深度协助：引导用户在 Options 导出/复制“本地证据包”（不含网页内容/URL/标题/复制内容）

处理时效（建议执行纪律）：
- 24 小时内：对新增 Issue/评论完成首次回应
- 48 小时内：给出复现结论（能复现/不能复现/需要更多信息）+ 下一步

## 5) 追踪方式与复盘落盘

UTM 约定（分渠道归因）：
- `utm_source=copylot-ext`
- `utm_medium=distribution_toolkit`
- `utm_campaign=<channel>`（如 `twitter/linkedin/reddit/hn/producthunt/indiehackers/wechat/jike`）

每日落盘（手动执行）：
- 记录发布链接、曝光/点击/安装/反馈：`docs/growth/metrics-tracker-2026-03-23.md`
- 手动发布步骤清单：`docs/growth/checklists/manual-posting-2026-03-23.md`
- 每日执行清单：`docs/growth/checklists/daily-ops-2026-03-23.md`
- 反馈处理清单：`docs/growth/checklists/feedback-triage-2026-03-23.md`
