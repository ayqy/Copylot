# 2026-03-25 手动发布清单（D2：补齐 Reddit/HN + Append Mode 用例贴）

目标：在无法自动化登录/发布时，仍能**当天完成 1 个渠道发布**（补齐 Reddit/HN 的另一渠道），并把链接与指标落盘，形成可复盘闭环。

所用物料：
- 渠道文案：`docs/growth/publish-pack-2026-03-23.md`（第 7 节 D2 用例贴）
- 社媒配图/素材复用：`docs/growth/assets/social/README.md`
- 指标记录表：`docs/growth/metrics-tracker-2026-03-23.md`

## 0) 发布前 10 分钟准备

1. 选定今日发布渠道（补齐 D0 未发的那个）：
   - 若 D0 发了 Reddit：今天发 HN（Show HN 或追评）
   - 若 D0 发了 HN：今天发 Reddit（按子版规则选择）
2. 准备 1 张图或 1 个 GIF（强烈建议）：
   - 重点演示：**Append Mode（按住 Shift 追加合并）**，把多页摘录合并成一份整理好的 Markdown
   - 没时间录：先按 `docs/growth/assets/social/README.md` 复用现有素材
3. 确认链接（带 UTM）：
   - 官网：https://copy.useai.online/?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=<channel>
   - 商店：https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=<channel>

## 1) Reddit（EN，用例贴）

> 适用：D0 发了 HN，今天补齐 Reddit。

1. 选择子版并阅读规则（避免硬广）：
   - r/productivity / r/ObsidianMD / r/Notion / r/ChatGPT / r/browsers
2. 从 `docs/growth/publish-pack-2026-03-23.md` 复制「7 天游程 -> D2（Append Mode）」正文并按子版语气做小幅调整（不新增能力、不夸大口径）。
3. 将链接中的 `utm_campaign` 固定为 `reddit`
4. 附上 GIF/截图（如有）
5. 发布后把“帖子 URL”记录到 `docs/growth/metrics-tracker-2026-03-23.md`（对应 2026-03-25 行）

**D2 目标（Reddit）**
- 评论 ≥ 5（比曝光更重要）
- 点击 ≥ 30
- 有效反馈 ≥ 2（可复现/可改进优先）

## 2) Hacker News（Show HN 或追评，EN）

> 适用：D0 发了 Reddit，今天补齐 HN。

### 2.1 若你已经有 Show HN 帖（推荐：追评）
1. 打开既有 Show HN 帖子
2. 从 `docs/growth/publish-pack-2026-03-23.md` 复制「7 天游程 -> D2（Append Mode）」内容，发一条**追评**：
   - 讲清楚 “Shift 追加合并” 能解决什么场景（多篇资料摘录/研究笔记/写作素材整理）
   - 文末附安装链接（`utm_campaign=hn`）+ 反馈引导（in-extension Feedback）
3. 记录“评论 URL/追评时间”到指标表备注栏（便于回看）

### 2.2 若你还没有 Show HN 帖（备选：首发）
1. 用 `docs/growth/publish-pack-2026-03-23.md` 的 4.5（Show HN）为骨架
2. 将其中 “Append Mode（Shift）” 作为主角度（用例式描述），并附安装链接（`utm_campaign=hn`）
3. 发布后把“帖子 URL”记录到指标表

**D2 目标（HN）**
- 点击 ≥ 40
- 有效反馈 ≥ 2（长评论优先）

## 3) 评论区反馈收集（发完后 10 分钟）

统一回复口径（发帖末尾固定加 1 句）：
- 引导用户使用扩展内「反馈」
- 愿意深度协助：引导到 Options 导出/复制“本地证据包”（不含网页内容/URL/标题/复制内容）

## 4) 当天收尾（15 分钟）

1. 在 `docs/growth/metrics-tracker-2026-03-23.md` 补齐：
   - 帖子 URL
   - 曝光/点击（平台统计）
   - 安装（CWS Dashboard）
   - 反馈条目（Issue/评论链接）
2. 用 3 句复盘模板写下：
   - 今天最有效的渠道/话术
   - 最大阻力点
   - 明天只改 1 件事

## 5) 阻塞处理（如无法访问官网/CWS/外网或缺账号）

若出现 DNS/网络不可达或渠道账号不可用，自动化发布与取证会失败；所需输入与替代动作见：
- `docs/growth/blocked.md`

