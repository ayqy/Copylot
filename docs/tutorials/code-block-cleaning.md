# 代码块专业级清理：保留缩进 / 去噪 / 避免误删（Copylot 教程）/ Pro Code Block Cleaning: Keep Indentation, Remove Noise (Copylot Tutorial)

## 1) 标题与 TL;DR / Title & TL;DR
### 1.1 标题 / Title
- ZH：代码块专业级清理：保留缩进、保守去噪（3 分钟完成首次成功）
- EN: Pro code block cleaning: keep indentation, conservative noise removal (first success in 3 minutes)

### 1.2 TL;DR / TL;DR
- ZH：打开 Copylot Popup，开启 `Enable Magic Copy` 与 `Enable Hover Trigger`，把 `Format` 设为 `Plain Text`（更适合直接运行），并关闭 `Extra`（`Page title` / `Source URL`）。然后在网页代码块（`<pre>`/`<code>`）上悬停并点击 Copylot 按钮，即可复制一段“保留缩进/空行、并做保守去噪”的干净代码。需要连同上下文一起发给 AI 时，用 Path B：对包含代码块的段落/页面执行 Magic Copy（块级/页级），代码块会以 Markdown code fence 输出（取决于 `Format`）。
- EN: In Copylot popup, turn ON `Enable Magic Copy` and `Enable Hover Trigger`, set `Format` to `Plain Text` (best for runnable code), and turn OFF `Extra` (`Page title` / `Source URL`). Then hover a code block (`<pre>`/`<code>`) and click the Copylot button to copy clean code with indentation/blank lines preserved and conservative noise removal. If you want surrounding context for AI, use Path B: run Magic Copy on a block/page that contains code blocks—code blocks will be output as Markdown code fences (depending on `Format`).

## 2) 适用人群与场景 / Audience & Scenario
- ZH：适合需要从技术文档/博客/README 里快速复制可直接运行、或可直接发给 AI 的代码片段的开发者；重点是“保留缩进与空行、避免误删、减少复制按钮/行号等噪音带来的二次整理”。
- EN: For developers who copy runnable code snippets from docs/blogs/READMEs and want something paste-ready for editors or AI—preserving indentation/blank lines, avoiding accidental deletions, and reducing noise like copy-button text or line numbers.

## 3) 前置条件 / Prerequisites
- 浏览器 / Browser:
  - ZH：Chrome / Chromium 系浏览器。
  - EN: Chrome / Chromium-based browsers.
- Copylot 版本 / Copylot version:
  - ZH：Copylot `v1.1.18` 或更高（见 `manifest.json`）。
  - EN: Copylot `v1.1.18` or later (see `manifest.json`).
- Popup 开关（建议配置）/ Popup switches (recommended):
  - ZH：
    - `Enable Magic Copy`：ON（Path A / Path B 都需要）
    - `Enable Hover Trigger`：ON（仅 Path A 需要）
    - `Mode`：`Single-Click`（或 `Double-Click`，仅 Path B 需要）
    - `Format`：`Plain Text`（推荐：更适合直接运行）；或 `MD`（推荐：更适合发给 AI/粘贴到 Markdown 编辑器）
    - `Extra`：`Page title` OFF、`Source URL` OFF（避免在代码末尾追加来源信息影响运行/粘贴）
  - EN:
    - `Enable Magic Copy`: ON (required for both Path A / Path B)
    - `Enable Hover Trigger`: ON (Path A only)
    - `Mode`: `Single-Click` (or `Double-Click`, Path B only)
    - `Format`: `Plain Text` (recommended for runnable code) or `MD` (recommended for AI / Markdown editors)
    - `Extra`: `Page title` OFF, `Source URL` OFF (avoid extra lines appended after code)

### 3.1 隐私说明 / Privacy
- ZH：默认本地处理；不收集/不上传你复制的网页内容；“匿名使用数据”默认关闭且仅本地记录、不联网发送（口径见 `docs/aso/value-prop.md` / `docs/privacy-policy.md`）。
- EN: Local by default; no collection/upload of your copied web content; anonymous usage data is OFF by default and stays local with no network sending (see `docs/aso/value-prop.md` / `docs/privacy-policy.md`).

## 4) 操作步骤（可复现）/ Steps (Reproducible)
> 目标 / Goal：走最短路径，在 3 分钟内完成一次“复制干净代码 → 粘贴可用（编辑器/Chat）”。

### 4.1 选择一个稳定示例页面 / Pick a stable sample page
1. ZH：打开示例页面（主用其一，另一个作备用；都无需登录、长期稳定）：
   - 主用（技术文档、代码块结构稳定）：MDN - Using the Fetch API：`https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch`
   - 备用（文档站点、代码块常见）：GitHub Docs - Creating and highlighting code blocks：`https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks`
   - （可选，便于验证“可识别行号结构”）：highlight.js line numbers demo：`https://wcoder.github.io/highlightjs-line-numbers.js/`
   EN: Open a sample page (pick one as primary, keep the other as backup; both are stable and require no login):
   - Primary (stable docs with code blocks): MDN - Using the Fetch API: `https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch`
   - Backup (docs site with common code blocks): GitHub Docs - Creating and highlighting code blocks: `https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks`
   - (Optional, for “recognizable line-number DOM”): highlight.js line numbers demo: `https://wcoder.github.io/highlightjs-line-numbers.js/`
2. ZH：选择这些页面的原因：公开可访问、长期稳定；代码示例主要以 `<pre>`/`<code>` 形式呈现，适合验证 Copylot 的代码块提取与保守清理（实现可审计：`src/shared/content-processor.ts`、`src/shared/code-block-cleaner.ts`）。
   EN: Why these pages: public and stable; code examples are mostly rendered as `<pre>`/`<code>`, making them good targets to validate Copylot’s code extraction and conservative cleanup (auditable in `src/shared/content-processor.ts` and `src/shared/code-block-cleaner.ts`).

### 4.2 Path A：代码块悬停复制（只复制代码本体）/ Path A: Hover-to-copy a code block (code-only)
3. ZH：打开 Copylot Popup（工具栏上的 Copylot 图标），设置：
   - `Enable Magic Copy`：ON
   - `Enable Hover Trigger`：ON
   - `Format: Plain Text`（推荐）
   - `Extra`：`Page title` OFF、`Source URL` OFF
   EN: Open Copylot popup and set:
   - `Enable Magic Copy`: ON
   - `Enable Hover Trigger`: ON
   - `Format: Plain Text` (recommended)
   - `Extra`: `Page title` OFF, `Source URL` OFF
4. ZH：回到示例页面，把鼠标移动到代码块区域（`<pre>`/`<code>`），出现 Copylot 悬浮按钮后点击。
   EN: Go back to the page, hover the code block (`<pre>`/`<code>`), and click the Copylot floating button when it shows up.
5. ZH：把结果分别粘贴到：
   - VS Code / 任意纯文本编辑器（应可直接运行/编译，缩进与空行保留）
   - 任意 Chat 输入框（换行应保留；如你需要 Markdown code fence，可把 `Format` 切为 `MD` 再复制一次）
   EN: Paste into:
   - VS Code / any plain text editor (should be runnable/compilable; indentation and blank lines preserved)
   - Any chat input (line breaks preserved; if you want Markdown code fences, switch `Format` to `MD` and copy again)

### 4.3 Path B：Magic Copy（块级/页级，包含上下文）/ Path B: Magic Copy (block/page, includes context)
6. ZH：保持 `Enable Magic Copy: ON`，把 `Mode` 设为 `Single-Click`（或 `Double-Click`），并按你的目标选择：
   - 目标是“发给 AI/写到 Markdown” → `Format: MD`
   - 目标是“纯文本粘贴/临时记录” → `Format: Plain Text`
   EN: Keep `Enable Magic Copy: ON`, set `Mode` to `Single-Click` (or `Double-Click`), and choose:
   - For AI / Markdown editors → `Format: MD`
   - For plain text pasting → `Format: Plain Text`
7. ZH：在示例页面点击“包含代码块的段落/内容块”（块级），或使用右键菜单的页级入口 `Convert to AI-Friendly Format`（中文界面为 `转换为AI友好格式`）复制整页主要内容。  
   EN: Click a block that contains code (block-level), or use the page-level entry via the context menu `Convert to AI-Friendly Format` to copy the main page content.
8. ZH：粘贴到 Chat / Markdown 编辑器，对照教程中“Path A vs Path B 的范围差异”说明：
   - Path A：只复制单个代码块，更适合“可直接运行的干净代码”
   - Path B：会包含周边上下文（标题/列表/段落 + 代码块），更适合“把完整上下文交给 AI”
   EN: Paste into a chat / Markdown editor and verify the scope difference:
   - Path A: code-only (best for runnable code)
   - Path B: includes surrounding context (titles/lists/paragraphs + code), best for AI context

## 5) 期望结果 / Expected Results
### 5.1 Format = Plain Text（示例片段，适合直接运行）/ Format = Plain Text (example snippet, runnable)
```text
#include <stdio.h>

int main(void) {
  printf("hello\\n");
  return 0;
}
```

- ZH：粘贴到 VS Code/任意纯文本编辑器：缩进与内部空行应完整保留；仅会裁剪首尾空行；不应混入你未开启的 `Extra` 信息（页面标题/URL）。
- EN: Pasting into VS Code / a plain text editor should preserve indentation and internal blank lines; only leading/trailing blank lines are trimmed; it should not include `Extra` info you didn’t enable (page title/URL).

### 5.2 Format = MD（示例片段，适合发给 AI / 贴到 Markdown）/ Format = MD (example snippet, AI/Markdown-friendly)
````markdown
```c
#include <stdio.h>

int main(void) {
  printf("hello\\n");
  return 0;
}
```
````

- ZH：粘贴到 Chat 输入框/Markdown 编辑器：应保留 code fence 与换行；是否高亮/渲染取决于目标工具本身。
- EN: Pasting into a chat input / Markdown editor should keep code fences and line breaks; highlighting/rendering depends on the target tool.

### 5.3 清理能力边界（不夸大，按实现可审计）/ Cleanup boundaries (no exaggeration, auditable)
- Copy 按钮/文案噪音 / Copy-button text noise  
  - ZH：若此类文案被渲染进代码文本，Copylot 仅做“首/末端整行”的保守移除（不做行内子串替换），避免误删真实代码（见 `src/shared/code-block-cleaner.ts`）。
  - EN: If such labels are rendered into the code text, Copylot only removes whole lines at the very start/end (no in-line substring replacement) to avoid deleting real code (see `src/shared/code-block-cleaner.ts`).
- 行号 / Line numbers  
  - ZH：仅当代码块 DOM 结构可识别为“行号/代码分列”时才能去除（例如 `ol.hljs-ln` 结构）；不承诺覆盖所有站点（见 `src/shared/content-processor.ts` 的 `extractCodeBlockText()`）。
  - EN: Line numbers are removed only when the DOM structure is recognizable as a line-number/code split (e.g. `ol.hljs-ln`); not guaranteed for all sites (see `extractCodeBlockText()` in `src/shared/content-processor.ts`).
- 缩进与空行 / Indentation & blank lines  
  - ZH：保留所有内部空行与缩进，仅裁剪首尾空行（见 `extractCodeBlockText()` 的处理）。
  - EN: All internal blank lines and indentation are preserved; only leading/trailing blank lines are trimmed (see `extractCodeBlockText()`).
- 反转义 / Unescape  
  - ZH：仅对少量 Markdown 转义字符做保守反转义（如 `\\#`、`\\[`、`\\]`、`\\(`、`\\)`、`\\*`、`\\=`），不做语义理解清洗（见 `src/shared/code-block-cleaner.ts`）。
  - EN: Only a small set of Markdown-escaped characters are unescaped conservatively (e.g. `\\#`, `\\[`, `\\]`, `\\(`, `\\)`, `\\*`, `\\=`); no semantic “smart cleaning” is performed (see `src/shared/code-block-cleaner.ts`).

## 6) 常见问题与排查 / FAQ & Troubleshooting
1. 看不到悬浮按钮 / Can’t see the floating button
   - ZH：确认 Popup 中 `Enable Magic Copy` 与 `Enable Hover Trigger` 都为 ON；不要在输入框/富文本编辑器里触发（Copylot 会避开编辑区）；代码块太小（宽高都小于约 50px）也不会触发。
   - EN: Ensure both `Enable Magic Copy` and `Enable Hover Trigger` are ON; don’t trigger inside inputs/rich editors (Copylot avoids editor areas); very small code elements (both width/height < ~50px) won’t trigger.
2. 复制结果仍包含行号 / Copied result still contains line numbers
   - ZH：Copylot 只在可识别的行号结构下去行号（例如 `ol.hljs-ln`）；如果站点把行号“直接渲染进代码文本”或结构不同，可能无法去除。此时建议改用站点自带复制按钮，或换一个不带行号的示例/页面。
   - EN: Copylot removes line numbers only for recognizable DOM structures (e.g. `ol.hljs-ln`). If a site renders numbers directly into the code text or uses a different structure, removal may not work. Use the site’s own copy button or try a page without line numbers.
3. 复制结果仍包含 “Copy/复制代码” 文案 / Still includes “Copy” labels
   - ZH：Copylot 仅保守移除“首/末端整行”的按钮文案；如果该文案出现在中间行、或与代码同一行混排，Copylot 不会做行内替换（避免误删）。可先粘贴到编辑器手工删除，或改用站点自带复制按钮。
   - EN: Copylot only removes whole-label lines at the very start/end. If the label appears in the middle or is mixed into a code line, Copylot won’t do in-line replacement to avoid deleting real code. Paste into an editor and delete manually, or use the site’s own copy button.
4. 站点使用 Shadow DOM / 在线编辑器导致不可触发 / Shadow DOM or editors block triggering
   - ZH：对编辑器（如 Notion/在线 IDE）Copylot 会主动避让；可在非编辑区域触发，或用页级路径（右键菜单 `Convert to AI-Friendly Format`，中文界面为 `转换为AI友好格式`）获取主要内容；若页面大量内容在 Shadow DOM 内，提取结果可能为空或不完整。
   - EN: Copylot avoids rich editors (e.g. Notion/online IDEs). Trigger on non-editor areas, or use the page-level path (context menu `Convert to AI-Friendly Format`). If the page heavily uses Shadow DOM, extraction may be empty or incomplete.
5. 复制到 Chat 后格式乱 / 代码末尾多了标题/URL / Formatting issues or extra title/URL appended
   - ZH：确认 Popup 的 `Extra`（`Page title` / `Source URL`）已关闭；如果你希望在 Chat 中保持 code fence，使用 `Format: MD` 再复制一次；如果你希望“可直接运行”，使用 `Format: Plain Text`。
   - EN: Ensure `Extra` (`Page title` / `Source URL`) is OFF. If you want code fences in chat, use `Format: MD`. If you want runnable code, use `Format: Plain Text`.
6. Path B 复制出来内容太多 / 太少 / Path B copied too much / too little
   - ZH：Path B 的范围取决于你点击的“内容块”或页级入口；想只要代码请用 Path A。若提取为空，换一个更“正文型”的区域再试。
   - EN: Path B scope depends on the clicked block or the page-level entry. Use Path A for code-only. If the result is empty, try a more “article-like” block.

## 7) 对外发布素材（可直接复用）/ Public-ready Assets
### 7.1 标题候选（EN/ZH 各 >=3）/ Title options (>=3 each)
- ZH：
  - 1) 从网页复制代码不再脏：保留缩进、保守去噪（Copylot）
  - 2) 代码块悬停复制：3 分钟复制一段可直接运行的干净代码
  - 3) 发给 AI 的代码更专业：少噪音、少误删、可审计
- EN:
  - 1) Clean code copy from the web: keep indentation, conservative noise removal
  - 2) Hover-to-copy code blocks: paste-ready code in 3 minutes
  - 3) More professional code for AI: less noise, fewer risky deletions, auditable claims

### 7.2 30 秒演示脚本入口 / 30s demo script entry
- 入口 / Entry: `docs/aso/gif-script.md`
- ZH：复用其“镜头节奏”（问题 → 打开设置 → 触发复制 → 粘贴 → 收尾），但把场景替换为本教程：
  1) 展示 Popup 中 `Enable Hover Trigger: ON`、`Format: Plain Text`、`Extra: OFF`（2-3 秒）
  2) 在示例页面悬停代码块出现 Copylot 按钮并点击（3-5 秒）
  3) 切到 VS Code/纯文本编辑器粘贴，展示缩进与空行保留（6-8 秒）
  4) （可选）切到 Chat 输入框粘贴，强调“本地处理、不上传复制内容”（与 `docs/aso/value-prop.md` 一致）
- EN: Reuse the pacing (problem → setup → trigger → paste → wrap-up), but replace the scenario with this tutorial:
  1) Show `Enable Hover Trigger: ON`, `Format: Plain Text`, `Extra: OFF` in the popup (2-3s)
  2) Hover a code block and click the Copylot button (3-5s)
  3) Paste into VS Code / a plain text editor to show indentation/blank lines preserved (6-8s)
  4) (Optional) Paste into a chat input and highlight “local processing, no upload of copied content” (aligned with `docs/aso/value-prop.md`)

### 7.3 贴文短文案（EN/ZH 各 >=2）/ Short post copies (>=2 each)
- ZH：
  - 1) 复制网页代码总带噪音？用 Copylot 悬停点一下：保留缩进/空行，保守去噪，直接粘贴到 VS Code 或发给 AI。#开发者工具 #代码块
  - 2) 专业级代码复制不靠“魔法清洗”：Copylot 只做可审计的保守清理（本地处理，不上传复制内容）。#隐私优先 #效率
- EN:
  - 1) Tired of noisy code copy from the web? Hover and click with Copylot: indentation/blank lines preserved, conservative cleanup—paste to VS Code or AI. #DevTools #CodeBlocks
  - 2) Pro code copy without “magic cleaning”: Copylot only does auditable conservative cleanup (local processing, no upload). #PrivacyFirst #Productivity

## 8) 审计清单（验收前必过）/ Audit Checklist (must pass before publishing)
- [ ] ZH：本教程“功能描述”与仓库实现一致，可在 `README.md` / `manifest.json` / `src/content/content.ts` / `src/shared/content-processor.ts` / `src/shared/code-block-cleaner.ts` / `src/popup/popup.html` 至少一处找到佐证。  
      EN: Feature claims match the repo implementation and can be supported by at least one of `README.md` / `manifest.json` / `src/content/content.ts` / `src/shared/content-processor.ts` / `src/shared/code-block-cleaner.ts` / `src/popup/popup.html`.
- [ ] ZH：不包含未实现能力（例如：命令行提示符自动移除、语义理解清洗、联网分析、云端上传、上传复制内容）。  
      EN: No unimplemented claims (e.g., auto-removing shell prompts, semantic cleanup, network analysis, cloud upload, uploading copied content).
- [ ] ZH：不引导高打扰行为（强制弹窗、强制评价、诱导式弹窗）。  
      EN: No high-disturbance guidance (forced popups, forced rating prompts, manipulative dialogs).
- [ ] ZH：隐私声明与 `docs/aso/value-prop.md` / `docs/privacy-policy.md` 一致（默认本地处理；不收集/不上传复制内容；匿名使用数据默认关闭且仅本地、不联网发送）。  
      EN: Privacy statement matches `docs/aso/value-prop.md` / `docs/privacy-policy.md` (local by default; no collection/upload of copied content; anonymous usage data off by default and stays local with no network sending).
