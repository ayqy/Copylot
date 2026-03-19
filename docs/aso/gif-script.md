# Copylot GIF / 短视频脚本（20-30s，可执行）

目标：提供可复用、可执行的 GIF/短视频脚本，用于 Chrome Web Store 素材或社媒短视频。所有文案需与 `docs/aso/value-prop.md` 口径一致（不夸大、不写未实现能力）。

本轮固定主线场景（建议二选一并固定）：**场景 A：网页表格一键转 CSV 并可直接粘贴到表格工具**（对应 `README.md` “网页表格一键转换 (CSV & Markdown)”）。

## 录制准备（建议）
- 时长：20-30 秒
- 分辨率：1080p（16:9）或 1280x800（更接近商店截图风格）
- 帧率：30fps
- 浏览器：Chrome/Chromium 干净 Profile
- 扩展版本：CWS 正式版或本地 `dist/` 生产包
- Popup 预置：
  - Enable Magic Copy：ON
  - Table：CSV
  - Format：MD（无关，可保持默认）

## 分镜脚本（中文）
> 备注：字幕尽量短句；每个镜头 2-5 秒，镜头切换以“鼠标点击/粘贴完成”作为节奏点。

1) 0:00-0:03（问题）  
画面：网页上的表格（保持简单、可读）。  
字幕：`复制网页表格，总是乱？`  
旁白（可选）：复制网页表格，经常对不齐。

2) 0:03-0:07（打开设置）  
画面：点开 Copylot Popup，展示 `Table: CSV` 已选中。  
字幕：`Copylot：一键转 CSV`  
旁白（可选）：用 Copylot，一键把表格转成 CSV。

3) 0:07-0:12（触发复制）  
画面：在网页表格上点击（触发复制），表格区域出现真实的复制反馈（高亮/提示，以实际 UI 为准）。  
字幕：`点击表格 → 已复制`  
旁白（可选）：点击表格，直接复制。

4) 0:12-0:20（粘贴到表格工具）  
画面：切到表格工具的空白表（Google Sheets / Excel / Numbers 任一），`Cmd/Ctrl+V` 粘贴，表格瞬间对齐。  
字幕：`粘贴即成表格`  
旁白（可选）：粘贴就能变成可编辑的表格。

5) 0:20-0:26（收尾与卖点）  
画面：停留在粘贴后的表格，轻微滚动/选中单元格强调可编辑；角落可短暂露出 Copylot 图标。  
字幕（两行内）：  
`网页表格 → CSV / Markdown`  
`干净、可直接用`  
旁白（可选）：网页表格转 CSV 或 Markdown，干净、可直接用。

6) 0:26-0:30（品牌落版）  
画面：简单落版（可用浏览器工具栏 + Copylot Logo/名称，避免过度设计）。  
字幕：`Copylot` / `One-click table to CSV`（按需二选一）  

## Storyboard (English)
1) 0:00-0:03 (Problem)  
Visual: a simple web table.  
Subtitle: `Copying web tables is messy?`  
VO (optional): Copying tables from the web often breaks formatting.

2) 0:03-0:07 (Show setup)  
Visual: open Copylot popup, highlight `Table: CSV`.  
Subtitle: `Copylot: one-click to CSV`  
VO (optional): With Copylot, convert a table to CSV in one click.

3) 0:07-0:12 (Copy)  
Visual: click the table to copy; show real feedback (highlight/toast, as implemented).  
Subtitle: `Click table → Copied`  
VO (optional): Click the table, and it’s copied.

4) 0:12-0:20 (Paste)  
Visual: switch to a spreadsheet (Google Sheets / Excel / Numbers) and paste. Columns align instantly.  
Subtitle: `Paste-ready in spreadsheets`  
VO (optional): Paste it straight into your spreadsheet.

5) 0:20-0:26 (Wrap-up)  
Visual: stay on the pasted table; quickly select a cell to show it’s editable.  
Subtitle (max 2 lines):  
`Web table → CSV / Markdown`  
`Clean. Ready to use.`  
VO (optional): Web table to CSV or Markdown. Clean and ready to use.

6) 0:26-0:30 (End card)  
Visual: simple end card with Copylot name/logo (no exaggerated claims).  
Subtitle: `Copylot`

