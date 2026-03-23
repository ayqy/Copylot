# Copylot 渠道发布内容包（2026-03-23）

> 说明（重要）：本次增长执行环境无法自动化抓取官网 `https://copy.useai.online/`（`curl` DNS/外网不可达；且系统抓取也失败），因此本内容包以“可访问的真实落地页”——**Chrome Web Store 安装页**为对齐基准（快照：`docs/growth/assets/landing/2026-03-23/cws-listing-snapshot.md`），并结合仓库内**可审计对外口径**生成（`docs/aso/value-prop.md`、`docs/ChromeWebStore-Description-*.md`、`README.md`、`docs/growth/telemetry-events.md`）。后续一旦可抓取官网 Hero/首屏，请按 `docs/growth/assets/landing/README.md` 落盘取证并做“小幅一致化”（不改变能力边界、不新增夸大表述）。

## 0) 一键链接包（带 UTM）

统一约定：
- `utm_source=copylot-ext`
- `utm_medium=distribution_toolkit`
- `utm_campaign=<channel>`

将 `<channel>` 替换为：`twitter` / `linkedin` / `reddit` / `hn` / `producthunt` / `indiehackers` / `wechat` / `jike` / `newsletter`

链接模板（可直接复制）：
```text
# 官网（主页）
https://copy.useai.online/?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=<channel>

# Chrome Web Store（安装页）
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=<channel>

# Pro 候补（官网 #pro）
https://copy.useai.online/?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=<channel>#pro
```

## 1) 核心一句话（用于标题/开头）

中文（Slogan）：
```text
一键把网页内容复制成干净、AI 友好的 Markdown / 纯文本 / CSV（隐私优先、默认本地处理）。
```

English (Slogan)：
```text
One-click smart copy from the web to clean, AI-ready Markdown / plain text / CSV (privacy-first, on-device).
```

## 2) 3 条卖点（可用于正文/要点）

中文（3 bullets）：
```text
- 智能区块复制：单击/双击提取正文，复制为干净的 Markdown / 纯文本
- 表格一键转 Markdown / CSV：网页表格粘贴即成结构化数据
- 追加模式（Shift）：跨页面合并多段摘录，自动分隔整理
```

English (3 bullets)：
```text
- Smart block copy: click/double-click to extract main content into clean Markdown / plain text
- Table to Markdown / CSV: copy web tables into paste-ready structured text
- Append Mode (Shift): merge multiple clips across pages with separators
```

## 3) 反馈收集 CTA（不收集内容，隐私优先）

中文 CTA（建议放在文末）：
```text
如果你愿意帮忙打磨：安装后在扩展里点「反馈」，或到 Options -> Pro / 隐私与可观测性 导出本地证据包发给我（不包含任何网页内容/URL/标题/复制内容）。
```

English CTA:
```text
If you’d like to help: use the in-extension “Feedback”, or export a local-only evidence pack from Options (no page content/URLs/titles/copied text included).
```

## 4) 各渠道可复制发布文案

### 4.1 X / Twitter（EN）

**单条短推（30s 可发）**
```text
Copy-pasting from the web is messy (ads/nav/broken tables/noisy code).

I built Copylot: one-click copy to clean Markdown / plain text, convert tables to CSV, and keep it privacy-first (on-device, no copied content collected).

Install: https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

**5 条 Thread（更适合讲清楚）**
```text
1/ Copy-pasting from the web is messy: ads/nav, broken tables, noisy code blocks.

2/ Copylot is a Chrome extension that copies web content into clean, AI-ready text: Markdown / plain text / CSV.

3/ Highlights:
- Smart block copy (click/double-click)
- Table to CSV / Markdown
- Append Mode (hold Shift) to merge multiple clips

4/ Privacy-first:
Processing stays on-device.
We do NOT collect or upload what you copy.

5/ Try it:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
Feedback welcome (in-extension “Feedback”).
```

### 4.2 X / Twitter（中文）

**单条短文（30s 可发）**
```text
从网页复制粘贴太痛了：正文夹杂导航/广告、表格对不齐、代码还带行号/按钮文案噪声。

我做了 Copylot：一键把网页区块/表格/代码复制成干净的 Markdown/纯文本/CSV，直接粘贴给 AI 对话或文档就能用。隐私优先：默认本地处理，不收集/不上传复制内容。

安装（Chrome Web Store）：
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

### 4.3 LinkedIn（EN，偏职场）
```text
Copy-pasting from the web shouldn’t be a “cleanup job”.

I built Copylot — a privacy-first Chrome extension that turns messy web content into clean, AI-ready text:
• Smart block copy → clean Markdown / plain text
• Web tables → Markdown / CSV (paste-ready for spreadsheets)
• Append Mode (hold Shift) → merge clips across pages with separators

Privacy-first by design:
• Processing runs on your device
• We do not collect or upload what you copy

Install (Chrome Web Store):
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=linkedin

If you’re willing to share feedback, please use the in-extension “Feedback” entry — it’s the fastest way for me to iterate.
```

### 4.4 Reddit（EN，建议发帖结构）

> 注意：Reddit 各子版自我推广规则差异大；优先用“问题/经验分享 + 工具作为解决方案”的写法，避免硬广。

**标题备选**
```text
I built a privacy-first Chrome extension to copy web pages into clean Markdown/CSV for AI + notes
```

**正文（可直接发）**
```text
Copy-pasting from the web is messy: ads/nav get mixed in, tables break, and code blocks come with noise.

I built Copylot (Chrome extension) to make “web → AI-ready text” frictionless:
- Smart block copy to clean Markdown / plain text (click/double-click)
- Web tables to Markdown / CSV
- Append Mode (hold Shift) to merge multiple clips across pages

Privacy: processing stays on-device, and it does NOT collect/upload what you copy.

Install:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=reddit

Feedback welcome — there’s an in-extension “Feedback” entry (GitHub issue). Happy to iterate based on your workflow.
```

建议子版（按相关性排序，需先读规则）：
- r/productivity
- r/ObsidianMD
- r/Notion
- r/ChatGPT
- r/browsers

### 4.5 Hacker News（Show HN，EN）

**标题**
```text
Show HN: Copylot – privacy-first web copy to clean Markdown/CSV for AI + notes
```

**正文**
```text
Hi HN! I built Copylot, a Chrome extension that turns messy web copy-paste into clean, AI-ready text.

What it does:
- Smart block copy: click/double-click to extract the main content into clean Markdown / plain text
- Table copy: convert web tables into Markdown (GFM) or CSV for spreadsheets
- Append Mode: hold Shift to merge multiple clips across pages with separators

Privacy-first:
- Processing stays on-device
- No collection/upload of what you copy

Install:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=hn

I’d love feedback from people who copy content into ChatGPT/Claude/notes daily. Thanks!
```

### 4.6 Product Hunt（EN）

**Tagline（<=60 字符）**
```text
One-click web copy to clean Markdown/CSV, privacy-first
```

**Short description**
```text
Copylot is a privacy-first Chrome extension to copy web blocks into clean Markdown/plain text, convert tables to CSV/Markdown, and merge clips with Append Mode (Shift). On-device processing; no collection/upload of copied content.
```

**Maker comment（首评）**
```text
Thanks for checking out Copylot!

The problem: copying from the web usually means extra cleanup (ads/nav, broken tables, noisy code blocks).

Copylot focuses on “clean + structured + privacy-first”:
- Smart block copy to Markdown/plain text
- Table to CSV/Markdown
- Append Mode (Shift) to collect across pages

Privacy: processing stays on-device; we don’t collect or upload what you copy.

Would love your feedback: what’s the #1 site/workflow where copy-paste hurts the most?
```

### 4.7 Indie Hackers（EN）
```text
Just launched Copylot — a privacy-first Chrome extension that turns messy web copy/paste into clean, AI-ready Markdown/plain text, plus table → CSV and Append Mode (Shift) for multi-page research.

Install:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=indiehackers

If you copy content into ChatGPT/Claude/notes daily, I’d love to hear what breaks most often (ads/nav noise? tables? code blocks?).
```

### 4.8 微信/即刻（中文，偏“效率工具推荐”）
```text
从网页复制粘贴太痛：正文夹杂广告/导航、表格对不齐、代码块噪声一堆。

我做了一个 Chrome 插件 Copylot：一键把网页内容复制成干净的 Markdown/纯文本/CSV，直接粘贴到 AI 对话或笔记就能用；还支持 Shift 追加跨页面合并。隐私优先：默认本地处理，不收集/不上传复制内容。

安装：
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=wechat
```

## 5) 评论区/私信回复模板（中英文）

中文（隐私/权限）：
```text
隐私口径：Copylot 默认本地处理，不收集/不上传你复制的网页内容；“匿名使用数据”开关默认关闭，即使开启也仅本地记录事件名/时间戳等少量枚举字段，不含内容/URL/标题，不联网发送，关闭会立刻清空。
```

中文（需求引导）：
```text
你主要在哪类页面/哪个网站上复制最痛？是正文噪声、表格、还是代码块？我会优先复现并优化（也欢迎用扩展里的“反馈”入口发 issue）。
```

English (privacy)：
```text
Privacy: Copylot runs on-device by default and does not collect/upload what you copy. Anonymous usage data is OFF by default; when enabled it stores local-only event names/timestamps (no content/URLs/titles), and turning it off clears logs immediately.
```

## 6) 素材清单（发帖配图/GIF）

可直接复用仓库素材（优先）：
- `docs/imgs/Copylot-min.gif`（动图，适合社媒）
- `docs/imgs/Copylot.jpg`（静图）

商店截图（建议顺序与拍摄脚本）：
- 见 `docs/aso/store-assets.md`

## 7) 7 天游程：逐日可复制贴（D0-D6）

> 用法：每天照抄 1 条（或同日发中英各 1 条），并把帖子 URL 记到 `docs/growth/metrics-tracker-2026-03-23.md`。

统一链接（建议都用“商店安装链接”，便于转化）：
```text
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=<channel>
```

### D0（首发：通用痛点 + 3 卖点）

直接使用本文件：
- X：4.1（EN）或 4.2（中文）
- LinkedIn：4.3（EN）
- Reddit：4.4（EN）或 HN：4.5（EN）

### D1（用例 1：表格 → CSV，高转化）

X / Twitter（EN）：
```text
Web tables never paste right into Sheets/Excel.

Copylot converts web tables to clean CSV/Markdown in one click (privacy-first, on-device).

Install:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

X / Twitter（中文）：
```text
网页表格复制到表格工具经常列错位？

Copylot 一键把网页表格转成干净的 CSV/Markdown，直接粘贴到 Excel/Sheets 就能用（隐私优先：默认本地处理）。

安装：
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

LinkedIn（EN）：
```text
If you move data from the web into spreadsheets, you’ve probably felt this: tables copy/paste poorly.

Copylot (Chrome extension) converts web tables to clean CSV / Markdown in one click — paste-ready for Sheets/Excel.

It’s privacy-first by design:
• Processing runs on your device
• We do not collect or upload what you copy

Install:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=linkedin

If you’re willing to share feedback, the in-extension “Feedback” entry is the fastest way for me to iterate.
```

### D2（用例 2：Append Mode 跨页面合并整理）

X / Twitter（EN）：
```text
Doing research across multiple pages?

Copylot has Append Mode: hold Shift while copying to merge multiple clips with separators — then paste into Notion/Obsidian/ChatGPT as clean Markdown.

Install:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

X / Twitter（中文）：
```text
跨页面摘录整理资料很痛？

Copylot 支持「Shift 追加」：按住 Shift 复制即可把多段内容自动合并，并用分隔符整理成一份干净的 Markdown/纯文本。

安装：
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

### D3（用例 3：代码块清理 + 悬停复制，面向开发者）

X / Twitter（EN）：
```text
Copying code blocks from tutorials often comes with noise (line numbers, “Copy” labels) and broken indentation.

Copylot cleans code blocks conservatively and supports hover-to-copy.

Install:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

HN 评论回复模板（EN，可用于 Show HN 追评）：
```text
Happy to optimize based on real examples — which site’s code blocks are the worst for you (line numbers? broken indentation? extra UI labels)?

There’s also an in-extension “Feedback” entry to file issues quickly.
```

### D4（信任：隐私与可观测性，降低“装了不敢用”）

X / Twitter（EN）：
```text
Privacy-first note (because copy tools are sensitive):

Copylot runs on-device by default and does NOT collect/upload what you copy.
Anonymous usage data is OFF by default; when enabled it stays local-only and can be cleared anytime.

Install:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

X / Twitter（中文）：
```text
隐私口径先说清楚（复制工具很敏感）：

Copylot 默认本地处理，不收集/不上传你复制的网页内容；
“匿名使用数据”默认关闭，即使开启也仅本地记录少量事件，不含内容/URL/标题，随时可清空。

安装：
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

### D5（工作流：Prompt 模板 + 一键拼好“指令 + 内容”）

X / Twitter（EN）：
```text
If you keep reusing the same prompts for web content, Copylot includes a prompt templates workflow:
manage prompts + copy “instruction + content” in one step.

Install:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

X / Twitter（中文）：
```text
如果你经常把网页内容喂给 AI：Copylot 内置 Prompt 模板工作流，把「指令 + 内容」一次性拼好复制，少做很多重复动作。

安装：
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

### D6（复盘征集：收敛到 1 个最痛点）

X / Twitter（EN）：
```text
Quick question for people who copy web content into ChatGPT/Claude/notes:

What’s the #1 thing that breaks your workflow most often — noisy main content, broken tables, or code blocks?

Copylot tries to fix these with on-device, privacy-first cleanup.
Install:
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter
```

中文（用于社群/朋友圈/即刻）：
```text
想收集 3 个真实反馈：你从网页复制到 AI/笔记最痛的是哪一类？
1) 正文噪声（广告/导航） 2) 表格对不齐 3) 代码块行号/缩进

我会按票数优先优化。也欢迎装完用扩展内「反馈」入口直接提 issue。
安装：
https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=wechat
```
