# 2026-03-26 手动发布清单（D3：Product Hunt / 替代渠道）

目标：在无法自动化登录/发布时，仍能**当天完成 1 个“爆发型渠道”发布**（Product Hunt 优先；不具备条件则用替代打法），并把链接与指标落盘，形成可复盘闭环。

所用物料：
- 渠道文案：`docs/growth/publish-pack-2026-03-23.md`（4.6 Product Hunt 模板）
- 社媒配图/素材复用：`docs/growth/assets/social/README.md`
- 指标记录表：`docs/growth/metrics-tracker-2026-03-23.md`

## 0) 发布前 20 分钟准备

1. 准备至少 1 个素材（强烈建议）：
   - 优先：`docs/imgs/Copylot-min.gif`
   - 备选：`docs/imgs/Copylot.jpg`
2. 确认链接（带 UTM）：
   - 官网：https://copy.useai.online/?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=producthunt
   - 商店：https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=producthunt
3. 准备 3 段可快速粘贴文本：
   - Tagline / Short description / Maker comment：直接用 `docs/growth/publish-pack-2026-03-23.md` 的 4.6

## 1) Product Hunt（优先）

1. 打开 Product Hunt 的“发布产品”入口
2. 逐字段粘贴（从 `docs/growth/publish-pack-2026-03-23.md` 复制）：
   - Tagline（<=60 chars）
   - Short description
   - Maker comment（首评，发布后立刻发）
3. 外链优先填“商店安装页”（更利于转化），并确保 `utm_campaign=producthunt`
4. 上传 1–3 张素材（至少 1 张）
5. 发布后把“产品页 URL + 首评 URL”记录到 `docs/growth/metrics-tracker-2026-03-23.md`（对应 2026-03-26 行）

**D3 目标（Product Hunt）**
- 点击（到商店/官网）≥ 120
- 安装（CWS）≥ 25
- 评论 ≥ 5（比 upvote 更能带来反馈）
- 有效反馈（评论/私信/Issue）≥ 3

## 2) 替代打法（若无法发 Product Hunt）

做 2 个动作（同一天做完）：
1. X / Twitter 发 1 条 Thread（用例角度优先：表格→CSV / Append Mode / 代码块清理三选一）
2. Indie Hackers / HN 任选其一做“追评/补充贴”（强调隐私口径 + 反馈 CTA）

模板来源：
- 用例贴：`docs/growth/publish-pack-2026-03-23.md` 的 7) D1/D2/D3
- 隐私贴：`docs/growth/publish-pack-2026-03-23.md` 的 7) D4

记录方式：
- 将 X 帖子 URL（`utm_campaign=twitter`）与 IH/HN 链接（`utm_campaign=indiehackers/hn`）一并填入指标表 2026-03-26 行的“备注”栏。

**D3 目标（替代打法）**
- 曝光 ≥ 2,000
- 点击 ≥ 80
- 安装 ≥ 15
- 有效反馈 ≥ 3

## 3) 评论区反馈收集（发完后 10 分钟）

统一回复口径（固定加 1 句）：
- 引导用户使用扩展内「反馈」
- 愿意深度协助：引导到 Options 导出/复制“本地证据包”（不含网页内容/URL/标题/复制内容）

## 4) 当天收尾（15 分钟）

1. 在 `docs/growth/metrics-tracker-2026-03-23.md` 补齐：
   - 发布链接
   - 点击 / 安装 / 反馈条目
2. 若出现网络/账号阻塞：按 `docs/growth/blocked.md` 补齐证据与所需输入（不要卡住）。

