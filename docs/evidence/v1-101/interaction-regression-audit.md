# V1-101 交互回归审计

## 审计日期

- 2026-04-27

## 本轮新增覆盖

- `scripts/ui-integration-tests.ts`
  - Popup：转换、反馈、分享、评价、Pro 候补入口
  - Options：候补链接、招募文案、分发包、导出入口
- `scripts/content-interaction-tests.ts`
  - click / dblclick / Shift append
  - Prompt 作用域
  - 编辑器排除区
  - hover code block
  - table selection / precise selection
  - reader-mode semantic root / density fallback / internal noise pruning

## 命中回归

### 1. 精确选区 Prompt 路径被错误识别为 editable

- 文件：`src/content/content.ts`
- 现象：精确选区经 `getPreciseSelectedElement()` 包装后，被 `showMagicCopy()` 判成 editable 上下文，按钮不显示，Prompt 无法执行。
- 根因：临时节点使用了 `data-fromEditableSelection="true"`，被 `isFromEditableContext()` 误伤。
- 修复：
  - 改为 `data-fromPreciseSelection="true"`
  - `isFromEditableContext()` 不再把该标记当 editable
  - `handlePromptClick()` 改为检查 `fromPreciseSelection`

### 2. hover code block 测试环境伪阴性

- 文件：`scripts/content-interaction-tests.ts`
- 现象：JSDOM 下 `clientWidth/clientHeight` 为 `0`，导致 `handleMouseOver()` 误判元素过小，按钮不显示。
- 结论：测试桩问题，不是产品逻辑缺陷。
- 修复：在测试中为 `#code-block` 注入稳定尺寸。

## 本轮新增能力回归

- `src/shared/content-processor.ts`
  - `BODY` 路径新增 density-based main content fallback
- `src/shared/dom-preprocessor.ts`
  - clone 后新增 reader-mode noise pruning

## 门禁结果

- `npm run build:prod`：PASS
- `npm run test:ui`：PASS
- `npm run test:content`：PASS

## 审计结论

- 本轮先完成稳定性闭环，再进入特性与增长动作，顺序符合 PRD。
- 新增的 reader-mode 能力已被自动化用例锁住，避免再次回归到“复制后仍需手删 related/share/footer”的状态。
