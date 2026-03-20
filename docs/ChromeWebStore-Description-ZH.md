从网页复制粘贴经常很痛：正文夹杂导航/广告，表格对不齐，代码还带行号和多余按钮文案等噪声。

Copylot 帮你把网页内容一键复制成干净、结构化的文本。
在网页上点一下区块（或点表格），就能直接粘贴到 AI 对话、文档或笔记里使用，无需二次整理。

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
- 说明：Copylot Pro 目前未上线、不可用（Not shipped yet）。
- 加入候补方式：在扩展内打开 Options -> Pro Tab，点击“加入候补名单”（或“复制候补文案”）。
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
