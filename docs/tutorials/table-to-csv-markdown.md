# 网页表格一键转 CSV / Markdown（Copylot 教程）/ One-click Web Table to CSV / Markdown (Copylot Tutorial)

## 1) 标题与 TL;DR / Title & TL;DR
### 1.1 标题 / Title
- ZH：网页表格一键转 CSV / Markdown（3 分钟完成首次成功）
- EN: One-click web table to CSV / Markdown (first success in 3 minutes)

### 1.2 TL;DR / TL;DR
- ZH：打开 Copylot Popup，把 `Table` 切到 `CSV` 或 `MD`，然后点击网页表格任意单元格即可复制；粘贴到表格工具（Sheets/Excel）或 Markdown 工具（GitHub/Obsidian/Notion）。为保证“可直接导入”，建议先关闭 `Extra`（`Page title` / `Source URL`）。
- EN: Open Copylot popup, set `Table` to `CSV` or `MD`, then click any cell in a web table to copy. Paste into spreadsheets (Sheets/Excel) or Markdown tools (GitHub/Obsidian/Notion). For clean import, turn OFF `Extra` (`Page title` / `Source URL`) first.

## 2) 适用人群与场景 / Audience & Scenario
- ZH：适合需要把网页表格快速带到 Excel/Google Sheets 做分析，或想把表格原样记录到笔记/文档（Markdown）的人。
- EN: For anyone who wants to quickly move web tables into spreadsheets for analysis, or capture tables into Markdown notes/docs.

## 3) 前置条件 / Prerequisites
- 浏览器 / Browser:
  - ZH：Chrome / Chromium 系浏览器。
  - EN: Chrome / Chromium-based browsers.
- Copylot 版本 / Copylot version:
  - ZH：Copylot `v1.1.18` 或更高（见 `manifest.json`）。
  - EN: Copylot `v1.1.18` or later (see `manifest.json`).
- Popup 开关（建议配置）/ Popup switches (recommended):
  - ZH：
    - `Enable Magic Copy`：ON
    - `Table`：按你的目标选择 `CSV` 或 `MD`
    - `Extra`：`Page title` OFF、`Source URL` OFF（避免在 CSV/表格后追加额外信息，导致导入失败）
  - EN:
    - `Enable Magic Copy`: ON
    - `Table`: choose `CSV` or `MD` based on your target
    - `Extra`: `Page title` OFF, `Source URL` OFF (avoid extra lines appended after CSV/table)

### 3.1 隐私说明 / Privacy
- ZH：默认本地处理；不收集/不上传你复制的网页内容；“匿名使用数据”默认关闭且仅本地记录、不联网发送（口径见 `docs/aso/value-prop.md` / `docs/privacy-policy.md`）。
- EN: Local by default; no collection/upload of your copied web content; anonymous usage data is OFF by default and stays local (see `docs/aso/value-prop.md` / `docs/privacy-policy.md`).

## 4) 操作步骤（可复现）/ Steps (Reproducible)
> 目标：走最短路径，在 3 分钟内完成一次“复制表格 → 粘贴成功”。

### 4.1 准备一个稳定示例表格页面 / Pick a stable sample page
1. ZH：打开示例页面（主用其一，另一个作备用）：
   - 主用：W3Schools - HTML Tables：`https://www.w3schools.com/html/html_tables.asp`
   - 备用：Wikipedia（任意包含原生表格的页面即可，例如）：`https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations)`
   EN: Open a sample page (pick one; keep the other as a backup):
   - Primary: W3Schools - HTML Tables: `https://www.w3schools.com/html/html_tables.asp`
   - Backup: Wikipedia (any page with a real table works), e.g.: `https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations)`

### 4.2 Table = CSV：复制并粘贴到表格工具 / Table = CSV: copy & paste into spreadsheets
2. ZH：打开 Copylot Popup（浏览器工具栏上的 Copylot 图标），设置：
   - `Enable Magic Copy`：ON
   - `Table: CSV`
   - `Extra`：`Page title` OFF、`Source URL` OFF
   EN: Open Copylot popup (toolbar icon) and set:
   - `Enable Magic Copy`: ON
   - `Table: CSV`
   - `Extra`: `Page title` OFF, `Source URL` OFF
3. ZH：回到示例页面，点击表格里的任意单元格（或表格本身）。  
   EN: Go back to the page and click any cell in the table (or the table itself).
4. ZH：打开 Google Sheets / Excel / Numbers，新建空表，在 A1 选中后粘贴（`Ctrl/Cmd + V`）。  
   EN: Open Google Sheets / Excel / Numbers, select cell A1, then paste (`Ctrl/Cmd + V`).

### 4.3 Table = Markdown：复制并粘贴到 Markdown 工具 / Table = Markdown: copy & paste into Markdown tools
5. ZH：回到 Copylot Popup，把 `Table` 切换为 `MD`（其余不变，`Extra` 仍建议关闭）。  
   EN: In Copylot popup, switch `Table` to `MD` (keep `Extra` OFF for a clean table).
6. ZH：再次点击同一个表格任意单元格进行复制。  
   EN: Click the same table again to copy.
7. ZH：将结果粘贴到以下任意工具：
   - GitHub：在 Markdown 文件 / Issue / PR 评论里粘贴（预览应显示为表格）
   - Obsidian：新建笔记粘贴（预览应显示为表格）
   - Notion：在页面中直接粘贴（如未自动渲染为表格，可先作为 Markdown 文本保留；或改用 CSV 输出粘贴到 Notion 的表格块）
   EN: Paste into one of the following:
   - GitHub: paste into a Markdown file / Issue / PR comment (preview should render a table)
   - Obsidian: paste into a note (preview should render a table)
   - Notion: paste into a page (if it doesn’t auto-render as a table, keep it as Markdown text; or use CSV output and paste into a Notion table block)

## 5) 期望结果 / Expected Results
### 5.1 Table = CSV（示例片段）/ Table = CSV (example snippet)
> 来自 W3Schools 示例表格（公司/联系人/国家）/ From the W3Schools sample table (Company/Contact/Country)

```csv
Company,Contact,Country
Alfreds Futterkiste,Maria Anders,Germany
Centro comercial Moctezuma,Francisco Chang,Mexico
Ernst Handel,Roland Mendel,Austria
```

- ZH：粘贴到 Sheets/Excel 后应自动分列成 3 列；每行对应一行记录。
- EN: After pasting into Sheets/Excel, it should split into 3 columns; each line becomes one row.

### 5.2 Table = Markdown（示例片段）/ Table = Markdown (example snippet)
```markdown
| Company | Contact | Country |
| --- | --- | --- |
| Alfreds Futterkiste | Maria Anders | Germany |
| Centro comercial Moctezuma | Francisco Chang | Mexico |
| Ernst Handel | Roland Mendel | Austria |
```

- ZH：在支持 Markdown 的编辑器/预览中应渲染为表格。
- EN: In a Markdown-capable editor/preview, it should render as a table.

## 6) 常见问题与排查 / FAQ & Troubleshooting
1. 表格未被识别 / Table not detected
   - ZH：确认 `Enable Magic Copy` 已开启；尽量点击表格单元格；如果网页用 `div` 模拟表格或在 `canvas` 中渲染，则可能无法识别为原生 `<table>`。
   - EN: Ensure `Enable Magic Copy` is ON; click a table cell; `div`-based or `canvas`-rendered “tables” may not be detectable as a real `<table>`.
2. 粘贴后不成表（Sheets/Excel）/ Pasted but not a table (Sheets/Excel)
   - ZH：确认 `Extra` 已关闭（否则会在 CSV 后追加分隔线/来源信息）；在表格工具里先选中一个空白单元格再粘贴。
   - EN: Turn OFF `Extra` (it may append extra lines after CSV); select an empty cell before pasting.
3. 多行单元格 / Multi-line cells
   - ZH：Markdown 表格会把换行渲染为 `<br>`；CSV 会把换行写成 `\\n`。
   - EN: Markdown tables render line breaks as `<br>`; CSV represents them as `\\n`.
4. 合并单元格（跨行/跨列）/ Merged cells (rowspan/colspan)
   - ZH：Copylot 会尽量展开为规则矩阵并填充内容；复杂表格建议先用 W3Schools 这种简单示例完成首次成功，再逐步尝试复杂页面。
   - EN: Copylot tries to expand merged cells into a regular grid; start with a simple table first.
5. 单元格包含特殊字符（例如 `|`、逗号、引号）/ Special characters (`|`, commas, quotes)
   - ZH：Markdown 会转义 `|`；CSV 会按 RFC 4180 对逗号/引号进行引号包裹与转义。
   - EN: Markdown escapes `|`; CSV quotes/escapes fields per RFC 4180 when needed.
6. 复制结果包含“来源信息”影响导入 / Source info breaks import
   - ZH：关闭 `Extra: Page title` 与 `Extra: Source URL` 后重新复制；或先粘贴到纯文本编辑器确认内容只包含 CSV/Markdown 表格。
   - EN: Turn OFF `Extra: Page title` and `Extra: Source URL`, then copy again; or paste into a plain text editor first to confirm it’s pure CSV/Markdown table.

## 7) 对外发布素材（可直接复用）/ Public-ready Assets
### 7.1 标题候选（EN/ZH 各 >=3）/ Title options (>=3 each)
- ZH：
  - 1) 网页表格一键转 CSV：可直接粘贴到 Excel/Sheets
  - 2) 把网页表格复制成 Markdown 表格：粘贴到 Notion/GitHub/Obsidian
  - 3) 告别“表格复制全乱”：Copylot 一键导出 CSV / Markdown
- EN:
  - 1) One-click web table to CSV (paste-ready for Excel/Sheets)
  - 2) Copy web tables as Markdown tables (Notion/GitHub/Obsidian-ready)
  - 3) Stop messy table copy: export CSV / Markdown in one click

### 7.2 30 秒演示脚本入口 / 30s demo script entry
- 入口 / Entry：`docs/aso/gif-script.md`
- ZH：可直接复用其中“场景 A：网页表格一键转 CSV 并可直接粘贴到表格工具”的分镜脚本；只需把示例页面替换为本教程的 W3Schools/Wikipedia，并确保 Popup 设置保持 `Enable Magic Copy: ON`、`Table: CSV`、`Extra: OFF`。
- EN: Reuse “Scenario A: one-click table to CSV and paste into spreadsheets” from `docs/aso/gif-script.md`. Replace the sample page with W3Schools/Wikipedia, and keep Popup settings as `Enable Magic Copy: ON`, `Table: CSV`, `Extra: OFF`.

### 7.3 贴文短文案（EN/ZH 各 >=2）/ Short post copies (>=2 each)
- ZH：
  - 1) 网页表格复制太乱？用 Copylot 点一下就能转成 CSV/Markdown，直接粘贴到 Excel/Sheets 或笔记里。#网页表格 #CSV #Markdown
  - 2) 做资料整理时最痛的就是表格：Copylot 一键复制成可用格式（本地处理，不上传复制内容）。#效率工具 #表格整理
- EN:
  - 1) Web table copy is messy? With Copylot, click once to get CSV/Markdown, paste-ready for Excel/Sheets or your notes. #WebTable #CSV #Markdown
  - 2) Tables are the hardest part of web research. Copylot turns them into usable formats in one click (local processing, no upload of copied content). #Productivity #Markdown

