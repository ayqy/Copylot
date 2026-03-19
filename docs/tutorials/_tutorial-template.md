# 教程模板 / Tutorial Template（Copylot）

> 目的 / Purpose：沉淀可复用、可审计、避免夸大的增长内容教程模板。  
> 约束 / Constraints：不新增权限、不引入任何联网发送、不改动核心复制/Prompt/引导主流程；所有表述必须与仓库当前实现一致（可用 `README.md` / `docs/roadmap.md` / `manifest.json` / `src/popup/popup.html` 佐证）。  
> 隐私口径 / Privacy：必须与 `docs/aso/value-prop.md` 与 `docs/privacy-policy.md` 一致（默认本地处理；不收集/不上传复制内容；匿名使用数据默认关闭且仅本地记录、不联网发送）。  
> 禁止 / Prohibited：禁止写未实现能力（例如“自动去广告/语义理解清洗/云端上传/联网分析”）；禁止高打扰引导（强制弹窗、强制评价）。  

## 0) 双语写法规则 / Bilingual Rules
- 必填：每个一级小节必须同时提供 **ZH** 与 **EN**（用 `ZH:` / `EN:` 标注即可）。
- 对外发布素材必须双语：标题候选、贴文短文案、演示脚本入口说明。
- 术语对齐：涉及 UI 开关/入口时，优先写 Popup/Options 中的英文 label（例如 `Enable Magic Copy` / `Table: CSV` / `Format: MD` / `Extra: Source URL`），再补充中文解释，避免用户找不到入口。
- 口径可审计：每条“能力描述”都要能在仓库中找到对应实现或文档佐证（见第 8 节审计清单）。
- 日期格式：`YYYY-MM-DD`。

## 1) 标题与 TL;DR / Title & TL;DR
### 1.1 标题 / Title
- ZH:
- EN:

### 1.2 TL;DR（1 句话：解决什么问题 / 用 Copylot 怎么做）/ TL;DR
- ZH:
- EN:

## 2) 适用人群与场景（1-2 句）/ Audience & Scenario (1-2 sentences)
- ZH:
- EN:

## 3) 前置条件（浏览器/扩展版本、必要开关位置：Popup/Options）/ Prerequisites
- 浏览器 / Browser:
  - ZH:
  - EN:
- Copylot 版本 / Copylot version:
  - ZH:
  - EN:
- 必要开关位置 / Required switches:
  - Popup:
    - `Enable Magic Copy`：
    - `Table`（如涉及表格）：
    - `Format`（如涉及 Markdown/Plain Text）：
    - `Extra`（`Page title` / `Source URL` 是否需要；如教程目标是“可直接粘贴导入”，通常建议关闭）：
    - `Append Mode`（如涉及多段合并）：
    - `Enable Hover Trigger`（如涉及悬停复制）：
  - Options（如需要）/ Options (if needed):
    - （写清楚路径与开关名）

### 3.1 隐私口径（可直接复用）/ Privacy statement (copy-paste ready)
- ZH：
  - 默认本地处理：内容提取/清理/格式化都在你的设备上完成。
  - 不收集/不上传复制内容：我们不会收集、存储或上传你复制的网页内容。
  - “匿名使用数据”默认关闭：开启后也仅在本地记录匿名事件；不包含任何复制内容/页面内容；不联网发送；关闭后立即清空本地事件记录。
- EN:
  - Local by default: extraction/cleanup/formatting runs on your device.
  - No copied content collection/upload: we do not collect, store, or upload the web content you copy.
  - Anonymous usage data is OFF by default: when enabled, it only stores a local anonymous event log; no copied/page content; not sent over the network; turning it off clears the local log immediately.

## 4) 操作步骤（可复现，逐步编号）/ Steps (Reproducible)
1. ZH：
   EN：
2. ZH：
   EN：
3. ZH：
   EN：

> 建议：步骤尽量围绕“3 分钟内首次成功”最短路径；不要引导高打扰行为（强制弹窗/强制评价）。

## 5) 期望结果（CSV/Markdown 示例片段）/ Expected Results (include examples)
### 5.1 输出示例：Table = CSV（如适用）/ Example: Table = CSV (if applicable)
```csv
# 在这里贴一段最小可读示例（含表头 + 2-3 行数据）
```
- ZH：如何粘贴 / 导入到目标工具（例如 Google Sheets / Excel / Numbers）以及预期效果。
- EN: How to paste/import into the target tool (e.g. Google Sheets / Excel / Numbers) and what to expect.

### 5.2 输出示例：Table = Markdown（如适用）/ Example: Table = Markdown (if applicable)
```markdown
# 在这里贴一段最小可读示例（含表头 + 2-3 行数据）
```
- ZH：如何粘贴到目标工具（例如 Notion / GitHub / Obsidian）以及预期效果。
- EN: How to paste into the target tool (e.g. Notion / GitHub / Obsidian) and what to expect.

## 6) 常见问题与排查（至少 5 条）/ FAQ & Troubleshooting (>=5)
> 必须包含：表格未被识别 / 粘贴后不成表 / 多行单元格 / 合并单元格（跨行/跨列）。

1. 表格未被识别 / Table not detected
   - ZH：确认 `Enable Magic Copy` 已开启；尝试点击表格的单元格；如果页面使用 `div` 模拟表格或在 `canvas` 中渲染，则可能无法识别为原生 `<table>`。
   - EN: Make sure `Enable Magic Copy` is ON; try clicking a table cell; if the page uses `div`-based layout or `canvas`, it may not be a real `<table>`.
2. 粘贴到表格工具后不成表 / Pasted but not a table
   - ZH：确认 Popup 中 `Extra`（`Page title` / `Source URL`）已关闭，避免在 CSV 后追加了多余行；在表格工具中先选中一个空白单元格再粘贴。
   - EN: Turn OFF `Extra` (Page title / Source URL) to avoid extra lines after CSV; select an empty cell before pasting.
3. 多行单元格（换行）/ Multi-line cells (line breaks)
   - ZH：Markdown 表格会把换行渲染为 `<br>`；CSV 会把换行写成 `\\n`（便于在单元格内保持换行语义）。
   - EN: Markdown tables render line breaks as `<br>`; CSV represents them as `\\n`.
4. 合并单元格（跨行/跨列）/ Merged cells (rowspan/colspan)
   - ZH：Copylot 会尽量展开为规则矩阵并填充单元格内容；复杂表格建议先用简单示例完成首次成功，再逐步尝试复杂页面。
   - EN: Copylot tries to expand merged cells into a regular grid; start with a simple table first.
5. 单元格包含特殊字符（例如 `|` / 逗号 / 引号）/ Special characters (`|` / commas / quotes)
   - ZH：Markdown 表格会转义 `|`；CSV 遇到逗号/引号会按 RFC 4180 规则进行引号包裹与转义。
   - EN: Markdown escapes `|`; CSV quotes/escapes fields per RFC 4180 when needed.
6. 复制到了“表格 + 额外说明”导致导入失败 / Extra info breaks import
   - ZH：关闭 `Extra`；或先粘贴到纯文本编辑器确认内容只包含 CSV/Markdown 表格，再导入目标工具。
   - EN: Turn OFF `Extra`; or paste into a plain text editor first to confirm it’s pure CSV/Markdown table.
7. 表格包含嵌套表格 / Nested tables
   - ZH：嵌套表格会先被内化为紧凑文本再参与生成，输出可能更“扁平”；必要时建议选择更规则的表格作为输入。
   - EN: Nested tables are flattened into compact text; output may look “flatter”.

## 7) 对外发布素材（可直接复用）/ Public-ready Assets
### 7.1 标题候选（EN/ZH 各 >=3 条）/ Title options (>=3 each)
- ZH（>=3）：
  - （候选 1）
  - （候选 2）
  - （候选 3）
- EN (>=3):
  - (Option 1)
  - (Option 2)
  - (Option 3)

### 7.2 30 秒演示脚本入口（可引用既有脚本并说明如何复用）/ 30s demo script entry
- 入口 / Entry: `docs/aso/gif-script.md`
- ZH：复用方式（写清楚选择哪个场景、需要替换哪些字幕/步骤、哪些 UI 开关必须保持一致）。
- EN: How to reuse (which scenario to pick, what subtitles/steps to replace, which switches must match the real UI).

### 7.3 贴文短文案（EN/ZH 各 >=2 条，含关键词但不堆砌）/ Short post copies (>=2 each)
- ZH（>=2）：
  - （短文案 1：含 1-2 个关键词，如“网页表格/CSV/Markdown/一键复制”）
  - （短文案 2）
- EN (>=2):
  - (Copy 1 with 1-2 keywords like “web table / CSV / Markdown / one-click”)
  - (Copy 2)

## 8) 审计清单（验收前必过）/ Audit Checklist (must pass before publishing)
- [ ] 本教程“功能描述”与仓库实现一致，可在 `README.md` / `docs/roadmap.md` / `manifest.json` / `src/popup/popup.html` 至少一处找到佐证。
- [ ] 不包含未实现能力（例如：自动去广告、语义理解清洗、联网分析、云端上传、上传复制内容）。
- [ ] 不引导高打扰行为（强制弹窗、强制评价、诱导式弹窗）。
- [ ] 隐私声明与 `docs/aso/value-prop.md` / `docs/privacy-policy.md` 一致（默认本地处理；不收集/不上传复制内容；匿名使用数据默认关闭且仅本地、不联网发送）。

