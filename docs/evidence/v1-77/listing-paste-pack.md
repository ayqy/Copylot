# V1-77 CWS Listing 可粘贴字段包（只复制粘贴，禁止临场改字）

- 生成时间：2026-03-23T11:09:18+08:00
- 来源文件（与 v1-77 evidence pack `inputs.sha256` 互证）：
  - `docs/ChromeWebStore-Description-EN.md` sha256：`9d77013eb3ec54391b9bd5d775116f4dd1489885a7dc786cfa19f4d7b0bcff3d`
  - `docs/ChromeWebStore-Description-ZH.md` sha256：`22bba47de6a5b41fe87cba18a79af21b73bab1713f8d3f9ff4588a1215bc84ac`
  - `docs/aso/keywords.md` sha256：`eb702760c5b5895d7388b193966aa5f1643ec0ec536c22d42315b5ec6b345ac8`

---

## EN 长描述（粘贴到 CWS：English description）

Copy-pasting from the web is messy: ads, navigation, broken tables, and noisy code blocks.

Copylot is a privacy-first web-to-text copier: copy blocks to clean Markdown or plain text, convert tables to CSV, and clean code blocks — ready for AI chats, docs, and notes.
Privacy-first and on-device: extraction/cleanup runs locally, and we do not collect or upload what you copy.

QUICK START (30 seconds)
1) Open the Copylot Popup (pin it first if you want), and pick an interaction mode (click / double-click / hover).
2) On the webpage, trigger copy on a block, table, or code snippet.
3) Paste into your AI chat or document — done.

CORE FEATURES (based on current implementation)
- Smart block copy: click/double-click to extract the main content and copy clean Markdown or plain text
- Table to Markdown / CSV: convert web tables into structured Markdown (GFM) or CSV for spreadsheets
- Code block cleanup (conservative): keep indentation/blank lines; trim only leading/trailing blank lines; remove line numbers only when the DOM structure is recognizable; conservatively drop leading/trailing whole-line Copy-label text (no in-line replacement); hover-to-copy supported for code blocks
- Append Mode: hold Shift while copying to merge multiple clips with separators
- Prompt templates workflow: manage prompts and copy “instruction + content” in one step; optionally auto-open your chosen chat service after copy
- Optional source info: append page title and source URL if you want attribution

USE CASES
For knowledge work: collect snippets across multiple pages with Append Mode, then paste into Notion/Obsidian/Docs.
For developers: copy runnable code from technical articles with less noise (like Copy-label lines or some line numbers) while keeping indentation intact.
For data work: copy web tables as CSV for Excel/Google Sheets, or as Markdown tables for docs.

LEARN MORE / TUTORIALS
https://github.com/ayqy/copy/blob/main/docs/tutorials/table-to-csv-markdown.md
https://github.com/ayqy/copy/blob/main/docs/tutorials/prompt-workflow.md
https://github.com/ayqy/copy/blob/main/docs/tutorials/code-block-cleaning.md

Copylot Pro (Planned / Waitlist)
- Copylot Pro is not shipped yet and not available today (waitlist only).
- How to join the waitlist (reproducible in-extension path): open the extension Options -> Pro tab, then click "Join waitlist" (or "Copy waitlist template").
- Pro scope & boundaries (stable public doc, auditable): https://github.com/ayqy/copy/blob/main/docs/monetization/pro-scope.md
- Note: there is no payment/subscription promise on the store page; the waitlist is only for intent validation and feedback.

PRIVACY & PERMISSIONS
- Local by default: extraction/cleanup/formatting runs on your device
- No copied content collection/upload: we do not collect, store, or upload the web content you copy
- Anonymous usage data toggle (OFF by default): when enabled, it only stores a local anonymous event log (event name, timestamp, a few enum-like fields). No content, no URLs, no network sending. Turning it off clears the local event log immediately
- Minimal permissions: storage, clipboardWrite, contextMenus

FEEDBACK & REVIEWS
- Feedback and feature requests: https://github.com/ayqy/copy/issues/new
- If Copylot helps your workflow, consider sharing it with teammates or leaving an honest review on the Chrome Web Store

---

## ZH 长描述（粘贴到 CWS：Chinese（简体）description）

从网页复制粘贴经常很痛：正文夹杂导航/广告，表格对不齐，代码还带行号和多余按钮文案等噪声。

Copylot 是一款隐私优先的网页复制工具：一键把网页区块/表格/代码变成干净、结构化的 Markdown/纯文本/CSV，直接粘贴到 AI 对话、文档或笔记里即可用。
隐私优先：默认本地处理，不收集/不上传复制内容；“匿名使用数据”开关默认关闭（仅本地）。

快速上手（30 秒）
1) 打开 Copylot 的 Popup（建议先固定到工具栏），并选择触发方式（单击/双击/悬停）。
2) 在网页上对目标区块/表格/代码块触发复制。
3) 粘贴到 AI 对话或文档即可。

核心功能（以当前实现为准）
- 智能区块复制：单击/双击提取正文，输出干净的 Markdown 或纯文本
- 表格一键转 Markdown/CSV：网页表格复制后可直接粘贴到文档或导入表格工具
- 代码块专业清理（保守）：保留缩进与空行，仅裁剪首尾空行；在可识别结构下去行号；保守移除首/末端整行 Copy/复制按钮文案（不做行内替换）；代码块支持悬停快速复制
- 追加模式：按住 Shift 复制即可跨页面合并，多段内容自动分隔
- Prompt 模板工作流：管理常用 Prompt，一键拼接“指令 + 内容”；可选复制后自动打开你选择的 Chat 服务
- 可选附加来源：按需在末尾追加页面标题与来源 URL

使用场景
面向知识工作者：跨页面摘录资料，用追加模式合并，一次性粘贴进 Notion/Obsidian/文档。
面向开发者：从技术博客或论坛复制可运行的代码块，减少清理成本。
面向数据工作者：把网页表格转成 CSV 导入 Excel/Google Sheets，或转成 Markdown 表格写报告。

了解更多 / 教程
https://github.com/ayqy/copy/blob/main/docs/tutorials/table-to-csv-markdown.md
https://github.com/ayqy/copy/blob/main/docs/tutorials/prompt-workflow.md
https://github.com/ayqy/copy/blob/main/docs/tutorials/code-block-cleaning.md

Copylot Pro（候补/规划中）
- 说明：Copylot Pro 目前未上线、不可用（仅候补名单）。
- 加入候补方式（扩展内可复现路径）：在扩展内打开 Options -> Pro Tab，点击“加入候补名单”（或“复制候补文案”）。
- Pro 范围/边界（稳定对外口径，可审计）：https://github.com/ayqy/copy/blob/main/docs/monetization/pro-scope.md
- 提醒：商店页不提供任何付费/订阅承诺；候补仅用于意向验证与需求收集。

隐私与权限
- 默认本地处理：内容提取/清理/格式化在你的设备上完成
- 不收集/不上传复制内容：我们不会收集、存储或上传你复制的网页内容
- “匿名使用数据”开关（默认关闭）：开启后仅在本地记录匿名事件（事件名/时间戳/少量枚举字段），不包含任何复制内容/页面内容/URL；不联网发送；关闭后立即清空本地事件记录
- 最小权限：storage, clipboardWrite, contextMenus

反馈与评价
- 反馈与建议（GitHub Issues）：https://github.com/ayqy/copy/issues/new
- 如果 Copylot 帮到你，欢迎分享给同事朋友，或在商店留下真实评价

---

## Keywords（粘贴到 CWS：Keywords）

- EN（comma-separated）：
  copy to markdown, copy web page to markdown, webpage to markdown, web page to text, webpage to text, copy webpage to text, clean copy, copy cleaner, copy clean text, table to csv, html table to csv, web clipper for ai, web clipper markdown, table to markdown, code block cleanup, remove line numbers, prompt template, prompt manager, append clipboard, clipboard append mode
- ZH（comma-separated）：
  智能复制, 网页转 Markdown, 网页复制助手, 网页转文本, 网页转纯文本, 一键复制, 网页内容提取, 表格转 CSV, 表格转 Markdown, 代码块清理, 去行号, 代码块去噪, 保留缩进, Prompt 模板, Prompt 管理器, 追加模式, 跨页面合并剪贴板, 网页剪藏

