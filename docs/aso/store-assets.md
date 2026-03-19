# Copylot Chrome Web Store 截图顺序与素材规范（可复用/可验证）

目标：沉淀一套可直接复用的 CWS 截图顺序与拍摄脚本，确保文案口径真实可验证（不夸大、不写未实现能力），且每张截图都能在仓库当前版本中复现（参考：`README.md`、`docs/roadmap.md`、`manifest.json`、`docs/privacy-policy.md`、`docs/aso/value-prop.md`）。

## 通用拍摄准备（所有截图共用）
1. **干净浏览器 Profile**
   - Chrome/Chromium 新建 Profile（避免历史扩展/脚本/主题干扰）。
   - 关闭会影响画面的扩展（广告拦截、翻译插件等）。
2. **安装扩展**
   - 推荐：安装 Chrome Web Store 的正式版本（最贴近用户体验）。
   - 或：本地加载生产包（`npm run build:prod` 后从 `dist/` 加载）。
3. **统一画面规格**
   - 建议窗口：1280x800（或 1440x900）；保持每张截图一致。
   - 浏览器缩放：100%。
4. **避免“高打扰”画面**
   - 不要主动制造/展示强制弹窗或强制评价；只展示“用户点击触发”的真实体验。
5. **隐私相关开关**
   - “匿名使用数据”保持默认 **OFF**（Options -> 隐私与可观测性）。
6. **功能开关基线（除非某张截图另有要求）**
   - Popup：
     - Enable Magic Copy：ON
     - Mode：Single-Click（或按截图需要）
     - Format：MD
     - Table：CSV（或按截图需要）
     - Extra：默认全 OFF（按截图需要再开启 Page title / Source URL）

## 截图顺序（建议 7 张：价值最强 -> 场景覆盖 -> 隐私与可信）

### 01（价值最强）：一键复制干净正文（Markdown/纯文本）
- 截图标题（ZH）：一键复制干净正文（Markdown/纯文本）
- Title (EN): One-click clean copy (Markdown / plain text)
- 要展示的真实功能点（可验证）：
  - 智能区块复制：点击/双击提取主要内容并复制（`README.md` “智能识别与提取”；`docs/aso/value-prop.md` 核心卖点 1）。
  - 输出可选 Markdown / 纯文本（`src/popup/popup.html` Output Format）。
- 需要的开关前置：
  - Popup -> Enable Magic Copy：ON
  - Popup -> Mode：Single-Click（或 Double-Click，保持与画面一致）
  - Popup -> Format：MD（此图建议用 MD）
- 拍摄步骤（可复现）：
  1. 打开一个内容结构清晰的文章页（建议：Wikipedia 任意条目）。
  2. 用鼠标点击文章正文区域的一段内容（与当前 Mode 匹配：单击/双击）。
  3. 画面应出现“复制高亮框/选区提示”（以真实 UI 为准）。
  4. 在任意文本编辑器/笔记（如 VS Code/Notion/Obsidian/Google Docs）粘贴，确认是干净的 Markdown（无导航/广告等噪声）。
  5. 截图建议：左右分屏（左：网页高亮；右：粘贴后的 Markdown 片段），或用一个明显的粘贴目标窗口呈现结果。

### 02（强场景）：网页表格一键转 CSV（可直接粘贴到表格工具）
- 截图标题（ZH）：网页表格一键转 CSV，粘贴即成表格
- Title (EN): One-click web table to CSV (paste-ready)
- 要展示的真实功能点（可验证）：
  - 表格一键转换 CSV/Markdown（`README.md` “网页表格一键转换 (CSV & Markdown)”；`docs/aso/value-prop.md` 核心卖点 2）。
  - Table 输出格式可选 CSV/MD（`src/popup/popup.html` Table Output Format）。
- 需要的开关前置：
  - Popup -> Table：CSV
  - Popup -> Format：MD（无关，可保持默认）
- 拍摄步骤（可复现）：
  1. 打开一个包含简洁表格的页面（建议：W3Schools HTML Tables 示例页，或 Wikipedia 含表格页面）。
  2. 点击表格区域触发复制（表格应被识别为表格复制路径）。
  3. 在任意表格工具新建空表（Google Sheets / Excel / Numbers 皆可）并粘贴。
  4. 画面要点：粘贴后列对齐、可直接编辑；同时可在浏览器左侧留出原表格作为对照。

### 03（场景覆盖）：追加模式跨页面收集资料（Shift 追加 + 分隔符）
- 截图标题（ZH）：Shift 追加模式：跨页面收集资料，一次性粘贴
- Title (EN): Append Mode: collect across pages with Shift
- 要展示的真实功能点（可验证）：
  - 追加复制模式：按住 Shift 复制即可跨页面合并，并用分隔符整理（`README.md` “追加复制模式 (Append Mode)”；`docs/aso/value-prop.md` 差异化卖点 1）。
  - Popup 可开启 Append Mode（`src/popup/popup.html` Enable Append Mode）。
- 需要的开关前置：
  - Popup -> Enable Append Mode：ON
  - Popup -> Format：MD（建议）
  - Popup -> Extra：可选开启 Source URL（用于展示溯源）
- 拍摄步骤（可复现）：
  1. 打开页面 A（如 Wikipedia 条目 A），选择/定位一段正文。
  2. **按住 Shift** 并点击触发复制（追加第 1 段）。
  3. 打开页面 B（如 Wikipedia 条目 B），再次 **按住 Shift** 复制第 2 段。
  4. 在任意笔记/文档中粘贴，确认两段内容被 `---`（或实现中的分隔符）分隔。
  5. 截图建议：展示“合并后的粘贴结果”，并在浏览器工具栏显示扩展图标角标（如角标存在且可见）。

### 04（场景覆盖）：Prompt 模板把“指令 + 内容”一次性拼好
- 截图标题（ZH）：Prompt 模板：指令 + 内容一键拼好复制
- Title (EN): Prompt templates: copy “instruction + content” in one step
- 要展示的真实功能点（可验证）：
  - Prompt 管理器：创建/管理 Prompt 模板（`README.md` “私人 Prompt 管理器”；Options：`src/options/options.html` Prompts Tab）。
  - 通过右键菜单/悬浮按钮使用 Prompt（`README.md` “使用右键菜单”；`manifest.json` 包含 `contextMenus` 权限）。
- 需要的开关前置：
  - Options -> Prompt 管理：存在至少 1 条 Prompt（模板包含 `{content}` 占位符）。
  - （可选）Options -> Chat 服务：保持默认即可（避免展示“自动打开 Chat”等可能不在 MVP 素材中的细节）。
- 拍摄步骤（可复现）：
  1. 打开 Options（右键扩展图标 -> 选项），在 Prompt 管理页创建一个简单 Prompt（如“总结以下内容：{content}”）。
  2. 在任意网页选中一段文字，右键打开 Copylot 的 Prompt 子菜单，点击刚创建的 Prompt。
  3. 粘贴到任意编辑器，画面中应能看到“指令 + 被选中文本”已拼接完成。
  4. 截图建议：以 Options 的 Prompt 管理界面为主画面（更清晰可理解），右键菜单步骤可在拍摄脚本中执行但不一定必须入镜。

### 05（场景覆盖）：代码块复制自动清理（悬停复制）
- 截图标题（ZH）：代码块复制自动清理：去行号/提示符/杂质
- Title (EN): Clean code copy: remove noise, keep formatting
- 要展示的真实功能点（可验证）：
  - 代码块专业级清理 + 悬停复制（`README.md` “代码块专业级清理”；`docs/aso/value-prop.md` 差异化卖点 2）。
  - Popup 可开启 Hover Trigger（`src/popup/popup.html` Enable Hover Trigger）。
- 需要的开关前置：
  - Popup -> Enable Hover Trigger：ON
  - Popup -> Format：Plain Text（此图更适合展示“可直接运行的纯净代码”；也可用 MD，但需保持与画面一致）
- 拍摄步骤（可复现）：
  1. 打开包含代码块的页面（建议：GitHub README / 技术文档页）。
  2. 鼠标悬停在代码块附近，出现 Copylot 悬浮入口（以真实 UI 为准）。
  3. 点击悬浮入口完成复制。
  4. 粘贴到编辑器，确认无多余“Copy/复制代码”、无行号噪声（以实现为准）。

### 06（辅助理解）：Popup 一页完成关键设置（触发方式/格式/表格/附加信息）
- 截图标题（ZH）：Popup 一页设置：触发方式、输出格式、表格与附加信息
- Title (EN): One popup to configure: mode, format, table, extras
- 要展示的真实功能点（可验证）：
  - Popup 提供核心开关与格式配置（`src/popup/popup.html`）。
  - 可选附加 Page title / Source URL（`src/popup/popup.html` Extra）。
- 需要的开关前置：
  - 无特殊要求（按画面展示选择即可；但请确保截图中开关状态与拍摄脚本一致）。
- 拍摄步骤（可复现）：
  1. 点击浏览器工具栏的 Copylot 图标打开 Popup。
  2. 调整并展示关键开关（Enable/Mode/Format/Table/Extra）。
  3. 截图画面尽量包含版本号区域（Popup Header 右侧）以增强可信度。

### 07（隐私与可信）：隐私优先 + 可选匿名使用数据（默认关闭，仅本地）
- 截图标题（ZH）：隐私优先：默认本地处理；匿名使用数据可选且仅本地
- Title (EN): Privacy-first: on-device by default, optional local-only logs
- 要展示的真实功能点（可验证）：
  - 隐私口径：本地处理、不上传复制内容；匿名使用数据默认关闭且仅本地记录（`docs/aso/value-prop.md`；`docs/privacy-policy.md`）。
  - Options -> 隐私与可观测性：匿名使用数据开关与本地日志面板（`src/options/options.html` Privacy Tab）。
- 需要的开关前置：
  - Options -> 匿名使用数据：OFF（默认）
- 拍摄步骤（可复现）：
  1. 打开 Options -> 隐私与可观测性 Tab。
  2. 展示“匿名使用数据”开关为 OFF，以及“本地匿名事件日志 / 本地增长统计”等面板（可折叠展示）。
  3. 若画面中有说明文案，确保包含“不联网/仅本地/关闭清空”等真实口径。

## 统一隐私提示（EN/ZH，商店素材与截图文案保持一致）
中文：
- 默认本地处理：内容提取/清理/格式化在你的设备上完成。
- 不收集/不上传复制内容：我们不会收集、存储或上传你复制的网页内容。
- “匿名使用数据”默认关闭：开启后仅在本地记录匿名事件（事件名/时间戳/少量枚举字段），不包含任何复制内容/页面内容；不联网发送；关闭后立即清空本地事件记录。

EN:
- Local by default: extraction/cleanup/formatting runs on your device.
- No copied content collection/upload: we do not collect, store, or upload the web content you copy.
- Anonymous usage data is OFF by default: when enabled, it only stores a local anonymous event log (event name, timestamp, a few enum-like fields). No copied/page content; no network sending; turning it off clears the local event log immediately.

