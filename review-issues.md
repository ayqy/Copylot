# Copylot 插件代码严苛 Review（聚焦一键转换“内容丢失”风险）

审查重点：一键转换（全文/选区）在 `src/content/content.ts` 触发，核心转换链路为 `processContent()` → `createVisibleClone()` → `convertToMarkdown()/convertToPlainText()`。

下列问题均为“可能导致转换结果丢失原文内容”的具体实现点（包含：直接丢字/丢段/丢结构、或因误处理导致内容被改写/删减）。

## 处理状态（2026-03-19）

- ISSUE-001：已按要求收敛（仅在无可见内容时才降级为 alt/href，避免误丢链接正文）
- ISSUE-002：已按要求收敛（仅丢弃/降级 svg-only 的 a；否则移除 svg 图标但保留正文）
- ISSUE-003：按要求忽略（未修复）
- ISSUE-004：已修复（清理无效链接时跳过 fenced code block / inline code，避免改写字面量）
- ISSUE-005：按要求忽略（未修复）
- ISSUE-006：已修复（getComputedStyle 异常不再中断可见性克隆，避免兜底导致空输出）
- ISSUE-007：按要求忽略（未修复）
- ISSUE-008：已修复（非文本选区也视为有效选区，选区/全文一键转换逻辑一致）
- ISSUE-009：已修复（2026-03-19 / v1-11：含表格 mixed content 复用 convertToMarkdown/PlainText 链路，行为与无表格路径一致）
- ISSUE-010：按要求忽略（未修复）
- ISSUE-011：已修复（增强 lazy-load 图片 URL 提取，避免 img 被误删）

---

## P0 / Critical

### ISSUE-001：Markdown 转换会把“包含 img 的 a 标签”整体替换为 alt 或 href，导致链接内其它可见内容被直接丢弃

- 位置：`src/shared/content-processor.ts:694-733`（尤其 `712-721`）
- 触发条件：任何 `a` 内部只要存在 `img` 子孙节点，就会执行：
  - `alt` 非空：`a.replaceWith(TextNode(alt))`
  - `alt` 为空：`a.replaceWith(TextNode(href))`
  - 然后 `return`（直接跳过 a 中其它子节点）
- 结果：`a` 中除 `img.alt` 或 `href` 之外的**所有文本/元素**都会被丢弃；典型场景是“整卡片可点击”的 DOM（`<a>` 包裹封面图 + 标题 + 摘要）。
- 证据：测试用例 `test/cases/link-with-imageless-alt.html` 的预期输出只剩 URL，`a` 内的文本 `This is some text next to the image.` 被完全丢掉。
- 影响范围：
  - 全文转换（Markdown）会丢内容
  - 选区转换（Markdown）同样会丢内容（选区若落在此类结构内尤甚）
- 修复（按你的预期收敛）：
  - 位置：`src/shared/content-processor.ts`（`convertToMarkdown()` 的 `<a>` 预处理）
  - 行为：仅当移除 `img/svg` 后确实“没有任何可见文本内容”时，才将整个链接降级为 `alt`（优先）或 `href`；否则保留链接正文，仅移除装饰图片（如 `alt` 为空的图标类 `img`）。

### ISSUE-002：Markdown 转换会把“包含 svg 的 a 标签”整体替换为 title 或 href，导致链接内其它可见内容被直接丢弃

- 位置：`src/shared/content-processor.ts:694-733`（尤其 `723-732`）
- 触发条件：`a.querySelector('svg')` 命中后，会用 `svg<title>` 或 `href` 替换整个 `a`，同样会丢弃 `a` 内其它文本/节点。
- 影响范围：同 ISSUE-001（但针对 svg/icon 链接、按钮型卡片等更常见）。
- 修复（按你的预期收敛）：
  - 位置：`src/shared/content-processor.ts`（`convertToMarkdown()` 的 `<a>` 预处理）
  - 行为：仅当链接为“svg-only”（移除 svg 后无可见文本且无其它元素）时才降级为 `title`/`href`；否则移除 svg 图标但保留其它内容，避免丢正文。

### ISSUE-003：代码块“清理复制按钮文本”的正则过于宽泛，会误删代码正文中的正常字符串（直接造成代码内容缺失）

- 位置：`src/shared/content-processor.ts:111-128`
- 问题点：`cleanCodeBlockTextConservatively()` 直接做全局替换：
  - `/(Copy|复制代码|Copy to clipboard|复制|COPY|Clone|克隆|拷贝)\s*/gi`
  - 这会删除代码里真实存在的 `Copy/Clone/...` 标识符、字符串常量、注释内容等。
- 影响范围：
  - 全文/选区/魔法复制：只要经过 `extractCodeBlockText()`（`pre/code` 都会走），都可能丢字
  - Markdown/Plaintext 都受影响（Plaintext 的 `pre/code` 也走 `extractCodeBlockText()`）

### ISSUE-004：`cleanInvalidLinks()` 在整段 Markdown 上做正则替换，不区分代码块/行内代码，可能把“原文中的字面量”当成链接进行改写/删减

- 位置：
  - 逻辑：`src/shared/content-processor.ts:442-472`
  - 调用点：`src/shared/content-processor.ts:766-768`
- 问题点：
  - 使用正则 `/(!?)\\[([^\\]]*)\\]\\(([^)]*)\\)/g` 全文扫描替换
  - 不跳过 fenced code block、inline code、或普通文本中的 `[...] (...)` 字面量
- 后果：
  - 文档/文章中包含 Markdown 示例（或代码字符串里出现 `[x](y)`）时，会被 normalizeLink 逻辑“改写、丢 URL、甚至清空”，表现为“内容被改坏/少了一截”
  - 同类风险还包括：`markdown.replace(/\\[\\s*\\]\\(#\\)/g, '')`（`src/shared/content-processor.ts:766`）会在任何上下文删除 `[](#)` 字面量
- 修复：
  - 位置：`src/shared/content-processor.ts`
  - 改动：新增“仅处理非代码区域”的清理逻辑（fenced code block / inline code 会被跳过），并替换原有全局 `markdown.replace(...)` + `cleanInvalidLinks(markdown)`。

---

## P1 / High

### ISSUE-005：`createVisibleClone()` 会删除非 code 场景下的“纯空白文本节点”，可能导致相邻文本粘连（看起来像“缺字/少空格”）

- 位置：`src/shared/dom-preprocessor.ts:90-99`（尤其 `93-99`）
- 问题点：
  - 对 TEXT_NODE：仅在 `text.trim() !== ""` 时才保留（非 code 场景）
  - 但很多真实页面的“词与词之间的空格”来自格式化换行/缩进形成的纯空白文本节点（HTML 默认会将其折叠成一个空格）
- 典型触发示例：
  - `<span>Hello</span>\n<span>world</span>`（中间是换行缩进空白）在浏览器呈现为 `Hello world`
  - clone 过程中空白节点被丢弃后，可能变成 `Helloworld`
- 影响范围：全文转换 + 选区转换（Markdown/Plaintext 都可能受影响，因为两者都先 `createVisibleClone()`）。

### ISSUE-006：`isNodeHidden()` 使用 `window.getComputedStyle()` 且无 try/catch；异常时会打断可见性克隆，进而触发 processContent 的兜底路径（兜底又可能返回空）

- 位置：
  - `src/shared/dom-preprocessor.ts:152-172`（`167`：`const style = window.getComputedStyle(el);`）
  - `src/shared/content-processor.ts:928-931`（catch 中直接 `return (element as HTMLElement).innerText || ''`）
- 风险链路：
  1. `getComputedStyle` 在某些节点/环境下抛错（跨文档节点、异常元素、被浏览器限制的节点等）时，`createVisibleClone()` 会中断
  2. `processContent()` 捕获异常后用 `innerText` 兜底
  3. 对“脱离文档树”的选区临时容器（`getPreciseSelectedElement()` 生成的 `tempDiv`），`innerText` 在不同浏览器实现下存在返回空字符串的风险
- 表现：选区转换可能出现“偶发复制为空/缺段”的极端情况（尤其是在精确选区路径）。
- 修复：
  - 位置：`src/shared/dom-preprocessor.ts`
  - 改动：`isNodeHidden()` 改为基于 `el.ownerDocument.defaultView.getComputedStyle(el)` 并加 try/catch；异常时保守认为“可见”，避免中断克隆/触发空兜底。

### ISSUE-007：选区转换优先走“精确选区 fragment”，绕过了原有的“表格祖先捕获”逻辑；在表格内选字可能只复制局部碎片（用户感知为丢表格内容）

- 位置：
  - 精确选区提取：`src/content/content.ts:75-103`
  - 表格祖先回退：`src/content/content.ts:123-128`
  - 一键转换入口：`src/content/content.ts:989-1014`
- 问题点：
  - 只要 `getPreciseSelectedElement()` 返回非空，就不会再走 `getSelectionContent()` 的 `getTableAncestor()` 分支
  - 这会让“在表格中选中一小段文字”的行为，从“拷贝整张表（旧逻辑）”退化为“只拷贝选中的片段（新逻辑）”
- 结果：选区转换与旧逻辑/用户预期不一致，容易被认为“丢内容”（尤其表格结构/上下文）。

### ISSUE-008：选区有效性以 `selection.toString().trim()` 判定，会忽略“非文本选区”（如图片、仅元素节点），导致选区转换退化为全文转换（选中内容被忽略）

- 位置：`src/content/content.ts:76-79`、`src/content/content.ts:110-114`
- 现象：用户“选中了某个非文本内容/组件”，但 `selection.toString()` 为空，于是走“无选区”分支，最终转换的是整页或其它元素；用户主观感受是“选区内容没了/没按选区转”。
- 修复：
  - 位置：`src/content/content.ts`
  - 改动：新增 `hasMeaningfulSelection()`，在“无文本”时通过 `range.cloneContents()` 判定是否选中了元素/图片等；并让 `getPreciseSelectedElement()/getSelectionContent()` 统一使用该判定。

---

## P2 / Medium

### ISSUE-009：含表格的混合内容路径与非表格路径处理不一致，可能导致“同一页面不同区域/全文 vs 选区”输出规则不同（进一步放大内容缺失/误改写问题的排查难度）

- 位置：
  - 表格混合内容：`src/shared/content-processor.ts:329-359`（`convertHtmlToMarkdown(outerHTML)`）
  - 非表格默认：`src/shared/content-processor.ts:689-769`（`convertToMarkdown(innerHTML)` + 预处理 a/img + `cleanInvalidLinks`）
- 差异点（与内容丢失相关）：
  - 表格混合内容路径不会执行 `convertToMarkdown()` 分支里的 `a/img` 预处理与 `cleanInvalidLinks()`；非表格路径会
  - 同一站点：只因“是否包含 table”，就会进入两套不同的改写/裁剪规则，导致输出差异明显，用户更容易感知为“有时丢内容有时不丢”

### ISSUE-010：选区回退路径可能发生“双重可见性裁剪”（放大丢空白/误判隐藏的风险）

- 位置：
  - 回退入口：`src/content/content.ts:1003-1013`（`processElementWithTableDetection()`）
  - 双重裁剪点：`src/shared/content-processor.ts:304-319`（先 `createVisibleClone`） + `src/shared/content-processor.ts:871-873`（`processContent` 内再次 `createVisibleClone`）
- 风险：虽然多数情况下近似幂等，但对“空白节点处理、隐藏判断边界场景”会放大副作用，导致选区转换更容易出现文字粘连/缺失。

### ISSUE-011：lazy-load 图片 src 属性覆盖不全，resolvedUrl 为空时会 remove()，导致可见图片直接丢失（属于原文内容缺失）

- 位置：
  - 取 src：`src/shared/content-processor.ts:516-524`
  - 丢弃图片：`src/shared/content-processor.ts:736-748`
- 问题点：目前只识别 `src/currentSrc/data-src/dataset.src`，常见的 `data-original/data-lazy-src/srcset/data-srcset` 等未覆盖；在这些站点上，图片可能被当作“无有效 URL”而删除。
- 修复：
  - 位置：`src/shared/content-processor.ts`
  - 改动：增强 `extractRawImageSource()` 覆盖常见 lazy-load 属性（如 `data-original/data-lazy-src/data-srcset/srcset` 与 `dataset.*`），并支持从 `srcset` 提取首个有效 URL。

---

备注：上述 ISSUE-004/006/008/009/011 已修复；ISSUE-001/002 已按你的预期将丢弃/降级行为严格收敛；其余按要求忽略。
