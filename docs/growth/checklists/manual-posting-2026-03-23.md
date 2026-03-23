# 2026-03-23 手动发布清单（无自动化/无凭据降级）

目标：在无法自动化登录/发布时，仍能**当天完成 3 个渠道首发**，并把链接与指标落盘，形成可复盘闭环。

所用物料：
- 渠道文案：`docs/growth/publish-pack-2026-03-23.md`
- GIF/短视频脚本（建议尽快补 1 条，提高转化）：`docs/aso/gif-script.md`
- 社媒配图/素材快速复用：`docs/growth/assets/social/README.md`
- 指标记录表：`docs/growth/metrics-tracker-2026-03-23.md`

## 0) 发布前 10 分钟准备

1. 选定今日 3 个渠道：X + LinkedIn + Reddit/HN（二选一）
2. 选定主卖点角度（二选一即可，避免一次讲太多）：
   - 角度 A（通用）：网页 → 干净 Markdown/纯文本（正文去噪）
   - 角度 B（高转化）：表格 → CSV（能立刻感知价值）
3. 准备 1 张图或 1 个 GIF（可选但强烈建议）：
   - 优先：表格 → CSV 粘贴到表格工具（见 `docs/aso/gif-script.md`）
   - 没时间录制：先按 `docs/growth/assets/social/README.md` 直接复用仓库动图/截图
4. 生成并确认链接（带 UTM）：
   - 官网：https://copy.useai.online/?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=<channel>
   - 商店：https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=<channel>

## 1) X / Twitter（发 1 条短推或 1 条 Thread）

1. 打开 X 发帖入口
2. 从 `docs/growth/publish-pack-2026-03-23.md` 复制：
   - EN：4.1（短推）或 Thread（5 条）
   - 中文：4.2（短文）
3. 将链接中的 `utm_campaign` 固定为 `twitter`
4. 附上 GIF/截图（如有）
5. 发布后把“帖子 URL”记录到 `docs/growth/metrics-tracker-2026-03-23.md`
6. 1 小时后回看评论：用 `docs/growth/publish-pack-2026-03-23.md` 的「评论区/私信回复模板」做快速回应，并引导使用扩展内“反馈”

**D0 目标（X）**
- 曝光 ≥ 1,500
- 点击 ≥ 60
- 有效反馈 ≥ 2

## 2) LinkedIn（发 1 条长文）

1. 打开 LinkedIn 发帖入口
2. 从 `docs/growth/publish-pack-2026-03-23.md` 复制 4.3（LinkedIn EN）
3. 将链接中的 `utm_campaign` 固定为 `linkedin`
4. 附上 GIF/截图（如有）
5. 发布后记录“帖子 URL”到指标表

**D0 目标（LinkedIn）**
- 曝光 ≥ 800
- 点击 ≥ 30
- 有效反馈 ≥ 1

## 3) Reddit / Hacker News（二选一，优先规则允许的地方）

### 3.1 Reddit（建议）
1. 选择子版（先读规则，避免硬广）：
   - r/productivity / r/ObsidianMD / r/Notion / r/ChatGPT / r/browsers
2. 从 `docs/growth/publish-pack-2026-03-23.md` 复制 4.4（Reddit EN）
3. 将链接中的 `utm_campaign` 固定为 `reddit`
4. 发布后记录“帖子 URL”到指标表

**D0 目标（Reddit）**
- 评论 ≥ 5（比曝光更重要）
- 有效反馈 ≥ 2（可复现/可改进）

### 3.2 Hacker News（Show HN）
1. 从 `docs/growth/publish-pack-2026-03-23.md` 复制 4.5（Show HN）
2. 将链接中的 `utm_campaign` 固定为 `hn`
3. 发布后记录“帖子 URL”到指标表

**D0 目标（HN）**
- 点击 ≥ 30
- 有效反馈 ≥ 2（长评论优先）

## 4) 当天收尾（15 分钟）

1. 在 `docs/growth/metrics-tracker-2026-03-23.md` 补齐：
   - 各渠道曝光/点击（平台后台/帖子统计）
   - 安装（CWS Dashboard）
   - 反馈条目（Issue/评论链接）
2. 用 3 句复盘模板写下：
   - 今天最有效的渠道/话术
   - 最大阻力点
   - 明天只改 1 件事

## 5) 阻塞处理（如无法访问官网/CWS/外网）

若出现 DNS/网络不可达，自动化发布与取证会失败；所需输入与替代动作见：
- `docs/growth/blocked.md`
