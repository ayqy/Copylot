# Copylot ASO 话术基准（Value Proposition）

目标：为商店短描述/长描述/关键词等对外文案提供“可审计、可回归”的统一口径；所有表述必须与仓库真实能力一致（参考：`README.md`、`docs/roadmap.md`、`manifest.json`）。

## 1) 主 Slogan（1 句，中英文对照）
- 中文：一键把网页内容复制成干净、AI 友好的格式。
- EN: One-click smart copy from the web, clean and AI-ready.

## 2) 核心卖点（3 条，中英文对照）
1. 中文：智能区块复制：单击/双击提取正文，复制为干净的 Markdown / 纯文本。
   EN: Smart block copy: click/double-click to extract the main content and copy clean Markdown / plain text.
2. 中文：表格一键转 Markdown / CSV：把网页表格转换成可直接粘贴到笔记或表格工具的结构化文本。
   EN: One-click table to Markdown / CSV: convert web tables into structured text for notes and spreadsheets.
3. 中文：Prompt 模板工作流：管理常用 Prompt，把“指令 + 内容”一次性拼好复制，直接粘贴给 AI 对话工具。
   EN: Prompt templates workflow: manage prompts and copy “instruction + content” in one step for AI chats.

## 3) 差异化卖点（3 条，中英文对照）
1. 中文：追加模式（Append Mode）：按住 Shift 复制即可跨页面合并，多段内容自动用分隔符整理。
   EN: Append Mode: hold Shift while copying to merge multiple clips with separators.
2. 中文：代码块专业级清理：保留缩进与空行；在可识别结构下去行号；保守移除首/末端整行 Copy/复制按钮文案；支持代码块悬停复制。
   EN: Code block cleanup: preserve indentation/blank lines; remove line numbers when the DOM structure is recognizable; conservatively drop leading/trailing Copy-label lines; hover-to-copy for code blocks.
3. 中文：隐私优先 + 最小权限：默认本地处理；不收集/不上传复制内容；“匿名使用数据”默认关闭且仅本地记录。
   EN: Privacy-first + minimal permissions: on-device processing; no collection/upload of copied content; anonymous usage data is off by default and stays local.

## 4) 隐私声明口径（中英文对照，需与实现一致）
中文：
- 默认本地处理：内容提取/清理/格式化在你的设备上完成。
- 不收集/不上传复制内容：我们不会收集、存储或上传你复制的网页内容。
- “匿名使用数据”默认关闭：开启后仅在本地记录匿名事件（事件名/时间戳/少量枚举字段），不包含任何复制内容/页面内容；不联网发送；关闭后立即清空本地事件记录。

EN:
- Local by default: extraction/cleanup/formatting runs on your device.
- No copied content collection/upload: we do not collect, store, or upload the web content you copy.
- Anonymous usage data is OFF by default: when enabled, it only stores a local anonymous event log (event name, timestamp, a few enum-like fields). No copied/page content; no network sending; turning it off clears the local event log immediately.

## 5) 当前 Pro 领先路线话术（v4-10）
- 中文：当前领先路线仍是“高级页面清洗验证”。对外说明优先强调“长文、评论区和推荐位噪声明显的页面，也能更快变成 AI 友好的干净复制结果”。
- EN: The current leading Pro route is still “Advanced page cleaning validation.” External copy should keep prioritizing “cleaner AI-ready output for long articles, comment-heavy pages, and recommendation-heavy layouts.”
- 中文：`v4-10` 已确认这条路线在 `7d / 14d` 总体仍领先，但 `campaign` 支撑还没有完全收敛，所以对外只能写“当前优先验证方向”，不能写成“已经证明会收费”。
- EN: `v4-10` confirms that this route still leads across the 7d and 14d windows, but campaign support has not fully converged. External copy must stay in “currently prioritizing / validating” language and must not imply that monetization is already proven.
- 中文：对外仍只能写“路线验证中”“当前优先验证方向”，不能写成“已上线收费功能”或“已提供订阅能力”。
- EN: External copy must stay in “currently validating” language. Do not imply that paid features or subscriptions are already live.
