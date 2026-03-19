# Prompt 工作流：复制内容 → 套用 Prompt → 一键发给 AI（Copylot 教程）/ Prompt Workflow: Copy → Apply Prompt → Paste to AI (Copylot Tutorial)

## 1) 标题与 TL;DR / Title & TL;DR
### 1.1 标题 / Title
- ZH：Prompt 工作流：3 分钟把“指令 + 网页内容”拼好复制，直接粘贴给 AI
- EN: Prompt workflow: in 3 minutes, copy “instruction + web content” and paste to AI

### 1.2 TL;DR / TL;DR
- ZH：准备一个含 `{content}` 的 Prompt 模板；在网页上用「悬浮按钮 Prompt 菜单」（块级）或右键 `智能复制+自定义提示（Magic Copy with Prompt）`（选区优先：Selection > Page）选择 Prompt。Copylot 会把 **Prompt + 提取到的内容** 合并复制到剪贴板；如果在 Options 中为该 Prompt（或默认设置）开启了 `复制后自动打开` 且目标 Chat 服务为启用状态，会在复制后打开对应 Chat 的新标签页（不会自动粘贴）。
- EN: Create a prompt template with `{content}`; on any page, use the “floating button prompt menu” (block-level) or the context menu `Magic Copy with Prompt` (selection-first: Selection > Page). Copylot copies **prompt + extracted content** into your clipboard. If `Auto open after copy` is enabled (per-prompt or default) and the target chat service is enabled, Copylot opens the chat in a new tab after copying (it does NOT auto-paste).

## 2) 适用人群与场景 / Audience & Scenario
- ZH：适合经常把网页段落交给 AI 做固定操作（总结/翻译/改写/提取要点/生成行动项）的人：你只需要“选中范围 + 选一个 Prompt”，然后粘贴给 AI。
- EN: For anyone who repeatedly asks AI to summarize/translate/rewrite/extract key points from web pages: you only do “pick a scope + pick a prompt”, then paste to your AI chat.

## 3) 前置条件 / Prerequisites
- 浏览器 / Browser:
  - ZH：Chrome / Chromium 系浏览器。
  - EN: Chrome / Chromium-based browsers.
- Copylot 版本 / Copylot version:
  - ZH：Copylot `v1.1.18` 或更高（见 `manifest.json`）。
  - EN: Copylot `v1.1.18` or later (see `manifest.json`).
- 必要开关位置 / Required switches:
  - Popup（建议配置）/ Popup (recommended):
    - ZH：
      - `Enable Magic Copy`：ON
      - `Mode`：`Single-Click`（更快；`Double-Click` 也可）
      - `Format`：`MD`（或 `Plain Text`，两者都能用于 Prompt 工作流）
      - `Extra`：`Page title` OFF、`Source URL` OFF（更适合“直接粘贴给 AI”）
    - EN:
      - `Enable Magic Copy`: ON
      - `Mode`: `Single-Click` (fastest; `Double-Click` also works)
      - `Format`: `MD` (or `Plain Text`; both work with prompts)
      - `Extra`: `Page title` OFF, `Source URL` OFF (cleaner for AI pasting)
  - Options（Prompt/Chat 配置）/ Options (Prompt/Chat config):
    - ZH：
      - 至少有 1 个 Prompt：打开 Popup → `管理Prompts`（进入 Options）→ `Prompt管理` 中确认（默认内置 1 个示例 Prompt）。
      - 如需“复制后自动打开”：在 `Chat服务` Tab 设置 `默认Chat服务` / `默认自动打开`，或在 Prompt 编辑器中设置 `目标Chat服务` + `复制后自动打开`。
    - EN:
      - Ensure at least 1 prompt exists: Popup → `Manage Prompts` (Options) → `Prompts` tab (1 built-in prompt exists by default).
      - For “auto open after copy”: set `Default chat service` / `Default auto open` in the `Chat services` tab, or set `Target chat` + `Auto open after copy` in the prompt editor.

### 3.1 隐私口径（可直接复用）/ Privacy statement (copy-paste ready)
- ZH：
  - 默认本地处理：内容提取/清理/格式化都在你的设备上完成。
  - 不收集/不上传复制内容：我们不会收集、存储或上传你复制的网页内容。
  - “匿名使用数据”默认关闭：开启后也仅在本地记录匿名事件；不包含任何复制内容/页面内容；不联网发送；关闭后立即清空本地事件记录。
- EN:
  - Local by default: extraction/cleanup/formatting runs on your device.
  - No copied content collection/upload: we do not collect, store, or upload the web content you copy.
  - Anonymous usage data is OFF by default: when enabled, it only stores a local anonymous event log; no copied/page content; not sent over the network; turning it off clears the local log immediately.

### 3.2 Prompt 变量与配置要点 / Prompt variables & settings
- ZH：
  - `{content}` 占位符：如果模板里包含 `{content}`，Copylot 会把它替换为本次提取到的内容（全量替换，支持多处出现）。
  - 无 `{content}` 时：Copylot 会把内容追加到模板后，并用 `<content>...</content>` 包裹（便于 AI 识别内容边界）。
  - Chat 跳转边界：只有当 `复制后自动打开` 为 ON 且目标 Chat 服务为“启用”状态时才会打开新标签页；即使不打开（或被浏览器拦截弹窗），复制本身也会成功；不会自动把内容发送到任何网站，你需要手动粘贴。
- EN:
  - `{content}` placeholder: if the template includes `{content}`, Copylot replaces it with the extracted content (global replace; multiple occurrences supported).
  - Without `{content}`: Copylot appends the content and wraps it in `<content>...</content>` for clearer boundaries.
  - Chat redirect boundary: a new tab opens only when `Auto open after copy` is ON and the target chat service is enabled; even if the tab isn’t opened (or blocked by the browser), copying still succeeds; Copylot never auto-sends your content anywhere—you paste manually.

## 4) 操作步骤（可复现）/ Steps (Reproducible)
> 目标：走最短路径，在 3 分钟内完成一次“Prompt + 内容”复制，并能直接粘贴给 AI。

### 4.1 选择稳定示例页面（主/备）/ Pick stable sample pages (primary/backup)
1. ZH：打开任一示例页面（主用其一，另一个作备用；两者都无需登录、内容结构稳定，适合复现）：
   - 主用：MDN - Web Docs（任意文档页都可，例如）：`https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API`
   - 备用：W3Schools（任意教程页都可，例如）：`https://www.w3schools.com/html/html_paragraphs.asp`
   EN: Open a sample page (pick one; keep the other as a backup; both are stable, no login required, good for reproducing):
   - Primary: MDN - Web Docs (any doc page works), e.g.: `https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API`
   - Backup: W3Schools (any tutorial page works), e.g.: `https://www.w3schools.com/html/html_paragraphs.asp`

### 4.2 准备一个 Prompt（含 `{content}`）/ Prepare a prompt (with `{content}`)
2. ZH：打开 Copylot Popup（工具栏 Copylot 图标）→ 点击 `管理Prompts`，进入 Options 的 `Prompt管理`。
   EN: Open Copylot popup (toolbar icon) → click `Manage Prompts` to open Options → `Prompts` tab.
3. ZH：新建一个 Prompt（或编辑现有 Prompt），模板示例（任选其一）：
   - 示例 1（总结）：`请用 3 句话总结下面内容：\n\n{content}`
   - 示例 2（翻译）：`Translate the following content into English:\n\n{content}`
   EN: Create a new prompt (or edit an existing one). Example templates (pick one):
   - Example 1 (summary): `Summarize the following content in 3 sentences:\n\n{content}`
   - Example 2 (translate): `Translate the following content into English:\n\n{content}`

### 4.3 路径 A：悬浮按钮 Prompt 菜单（块级复制）/ Path A: Floating button prompt menu (block-level)
4. ZH：回到示例页面，在你想处理的段落/内容块上 **单击**（或按你设置的 `Mode` 双击）。页面会出现 Copylot 高亮与一个“悬浮按钮”。
   EN: Back on the sample page, **single-click** (or double-click based on your `Mode`) on the paragraph/block you want. You’ll see Copylot highlight and a floating button.
5. ZH：把鼠标移动到悬浮按钮上，悬浮按钮会展开 Prompt 列表；点击其中一个 Prompt。
   EN: Hover on the floating button to expand the prompt list; click one prompt.
6. ZH：复制完成：剪贴板里会得到“Prompt + 内容”的合并文本。把它粘贴到：
   - 纯文本编辑器（例如记事本/VS Code）：应看到完整文本与换行
   - 任意 Chat 输入框：应可直接发送（不会自动发送）
   EN: Done: your clipboard now contains “prompt + content”. Paste into:
   - A plain text editor (Notepad/VS Code): full text and line breaks should remain
   - Any chat input box: paste-ready (Copylot never auto-sends)

### 4.4 路径 B：右键菜单 Prompt（选区优先：Selection > Page）/ Path B: Context menu prompt (selection-first: Selection > Page)
7. ZH：（验证“选区优先”）在页面中先**划词选中**一段文字 → 右键 → 选择 `智能复制+自定义提示（Magic Copy with Prompt）` → 选择某个 Prompt。
   EN: (Verify selection-first) **Select** a piece of text → right-click → `Magic Copy with Prompt` → pick a prompt.
8. ZH：复制完成：剪贴板里应只包含该**选区内容**（并按 Prompt 规则拼装），不应出现整页内容。
   EN: Done: clipboard should contain **only the selection** (merged with the prompt), not the whole page.
9. ZH：（验证“无选区=整页”）点击页面空白处取消选区 → 右键 → 选择同一 Prompt。
   EN: (Verify no-selection = page) Click blank area to clear selection → right-click → pick the same prompt.
10. ZH：复制完成：该路径会对**当前页面主要内容（整页）**做提取与格式化，再与 Prompt 合并复制到剪贴板（与 `PROCESS_PAGE_WITH_PROMPT` 行为一致）。
    EN: Done: this path extracts/formats the **main content of the current page**, merges it with the prompt, and copies to clipboard (same behavior as `PROCESS_PAGE_WITH_PROMPT`).

## 5) 期望结果 / Expected Results
### 5.1 Format = Plain Text（示例片段）/ Format = Plain Text (example snippet)
```text
请用 3 句话总结下面内容：

（这里是 Copylot 提取到的内容……）
```

- ZH：粘贴到纯文本编辑器时应保持原样；粘贴到 Chat 输入框时应保持换行，且不包含你未开启的额外信息（如未开启 `Extra`，则不应自动追加页面标题/URL）。
- EN: In a plain text editor it should look the same; in a chat input it should keep line breaks, and should not include extra info you didn’t enable (if `Extra` is OFF, no auto-appended page title/URL).

### 5.2 Format = MD（示例片段）/ Format = MD (example snippet)
```markdown
请用 3 句话总结下面内容：

（这里是 Copylot 提取到的 Markdown 内容，例如标题、列表、代码块等……）
```

- ZH：粘贴到 Chat 输入框/Markdown 编辑器时应保留 Markdown 的换行与标记；是否渲染为富文本取决于目标工具本身。
- EN: When pasting into a chat input / Markdown editor, Markdown markers and line breaks should remain; rendering depends on the target tool.

## 6) 常见问题与排查 / FAQ & Troubleshooting
1. 看不到悬浮按钮 / Can’t see the floating button
   - ZH：确认 Popup 中 `Enable Magic Copy` 为 ON；不要在输入框/富文本编辑器里触发（Copylot 会避开编辑区）；换一个更“正文型”的段落再试。
   - EN: Ensure `Enable Magic Copy` is ON in the popup; don’t trigger inside inputs/rich editors (Copylot avoids editor areas); try again on a normal paragraph block.
2. Prompt 列表为空 / Prompt list is empty
   - ZH：到 Options → `Prompt管理` 确认至少有 1 个 Prompt；保存后菜单会更新（必要时刷新页面/重启浏览器）。
   - EN: In Options → `Prompts`, make sure there’s at least 1 prompt; after saving, menus should update (reload the page / restart the browser if needed).
3. `{content}` 没有被替换 / `{content}` is not replaced
   - ZH：模板里必须写成 **完全一致** 的 `{content}`（大小写与花括号都要对）；建议用编辑器里的 `{content}` 按钮插入；如果你故意不写 `{content}`，Copylot 会把内容用 `<content>...</content>` 包裹后追加在模板末尾。
   - EN: The template must contain the exact `{content}` (case and braces matter); use the `{content}` button in the editor; if you intentionally omit `{content}`, Copylot appends the content wrapped in `<content>...</content>`.
4. 自动打开 Chat 未触发 / Auto-open chat didn’t trigger
   - ZH：确认目标 Chat 服务是“启用”状态（Options → `Chat服务`）；并确认该 Prompt（或默认）开启了 `复制后自动打开`；部分浏览器/插件会拦截 `window.open` 弹窗，允许后再试；不影响复制结果。
   - EN: Ensure the target chat service is enabled (Options → `Chat services`), and `Auto open after copy` is ON (prompt-level or default). Some browsers/extensions may block `window.open`; allow it and retry. Copy still works regardless.
5. 站点使用 Shadow DOM / 编辑器导致无法触发 / Shadow DOM or editors block triggering
   - ZH：对编辑器（如 Notion/在线文档）Copylot 会主动避让；可改用路径 B（不选区时会处理整页），或在非编辑区域触发；如果页面大量内容在 Shadow DOM 内，提取结果可能为空或不完整。
   - EN: Copylot avoids rich editors (e.g., Notion/online docs). Use Path B (clear selection to process the whole page), or trigger on non-editor areas. If the page heavily uses Shadow DOM, extraction may be empty or incomplete.
6. 右键菜单找不到 `Magic Copy with Prompt` / Missing `Magic Copy with Prompt` in context menu
   - ZH：确认扩展未被禁用；并确认 Options 中至少有 1 个 Prompt；保存 Prompt 后会触发菜单更新（必要时刷新页面/重启浏览器）。
   - EN: Ensure the extension is enabled and at least 1 prompt exists in Options; saving prompts triggers a menu refresh (reload / restart if needed).

## 7) 对外发布素材（可直接复用）/ Public-ready Assets
### 7.1 标题候选（EN/ZH 各 >=3）/ Title options (>=3 each)
- ZH：
  - 1) 复制网页内容 + 一键套 Prompt：3 分钟粘贴给 AI
  - 2) 让 AI 直接开工：Copylot 把“指令 + 内容”一次拼好复制
  - 3) 私人 Prompt 工作流：网页一键复制成 AI 可用输入
- EN:
  - 1) Copy web content + apply a prompt (paste-ready for AI in 3 minutes)
  - 2) Let AI start instantly: copy “instruction + content” in one step
  - 3) Personal prompt workflow: one-click web copy into AI-ready input

### 7.2 30 秒演示脚本入口 / 30s demo script entry
- 入口 / Entry: `docs/aso/gif-script.md`
- ZH：可复用其“镜头节奏”（问题 → 打开设置 → 触发复制 → 粘贴 → 收尾），但把场景替换为本教程：
  1) 展示 Prompt 编辑器里 `{content}`（1-2 秒）
  2) 在示例页面点一下段落，出现悬浮按钮（2-3 秒）
  3) 悬停展开 Prompt 列表并点击（2-3 秒）
  4) 切到任意 Chat 页（或展示“自动打开 Chat”打开新标签页），粘贴并停留（6-8 秒）
  5) 落版字幕强调：本地处理、不上传复制内容（与 `docs/aso/value-prop.md` 一致）
- EN: Reuse the pacing (problem → setup → trigger → paste → wrap-up), but replace the scenario with this tutorial:
  1) Show `{content}` in the prompt editor (1-2s)
  2) Click a paragraph to show the floating button (2-3s)
  3) Hover to expand prompt list and click one prompt (2-3s)
  4) Switch to a chat page (or show auto-open chat opening a new tab), paste and pause (6-8s)
  5) End card: local processing, no upload of copied content (aligned with `docs/aso/value-prop.md`)

### 7.3 贴文短文案（EN/ZH 各 >=2）/ Short post copies (>=2 each)
- ZH：
  - 1) 每次都重复输入“总结/翻译/改写”？用 Copylot 把 Prompt 做成模板，点一下就复制“指令 + 网页内容”，直接粘贴给 AI。#Prompt模板 #效率工具
  - 2) 做资料整理的最短路径：复制内容 → 套用 Prompt → 粘贴到 Chat。Copylot 默认本地处理，不上传复制内容。#AI工作流 #隐私优先
- EN:
  - 1) Stop retyping “summarize/translate/rewrite”. With Copylot prompts, copy “instruction + web content” in one click—paste straight to AI. #PromptTemplates #Productivity
  - 2) Shortest research workflow: copy → apply a prompt → paste to chat. Local processing by default, no upload of your copied content. #AIWorkflow #PrivacyFirst

## 8) 审计清单（验收前必过）/ Audit Checklist (must pass before publishing)
- [ ] ZH：本教程“功能描述”与仓库实现一致，可在 `README.md` / `manifest.json` / `src/background.ts` / `src/content/content.ts` / `src/options/options.html` 至少一处找到佐证。  
      EN: Feature claims match the repo implementation, and can be supported by at least one of `README.md` / `manifest.json` / `src/background.ts` / `src/content/content.ts` / `src/options/options.html`.
- [ ] ZH：不包含未实现能力（例如：自动去广告、语义理解清洗、联网分析、云端上传、上传复制内容）。  
      EN: No unimplemented claims (e.g., ad removal, semantic cleanup, network analysis, cloud upload, uploading copied content).
- [ ] ZH：不引导高打扰行为（强制弹窗、强制评价、诱导式弹窗）。  
      EN: No high-disturbance guidance (forced popups, forced rating prompts, manipulative dialogs).
- [ ] ZH：隐私声明与 `docs/aso/value-prop.md` / `docs/privacy-policy.md` 一致（默认本地处理；不收集/不上传复制内容；匿名使用数据默认关闭且仅本地、不联网发送）。  
      EN: Privacy statement matches `docs/aso/value-prop.md` / `docs/privacy-policy.md` (local by default; no collection/upload of copied content; anonymous usage data off by default and stays local, no network sending).
