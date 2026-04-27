# V1-104 Report

- 状态：已完成
- 目标：局部文章块复制也执行保守 reader-mode 噪音裁剪
- 变更：
  - `src/shared/content-processor.ts`：新增 article-like local root 启发式，仅在正文足够、链接密度不过高、结构像文章块时执行 pruning
  - `scripts/content-interaction-tests.ts`：新增 `runLocalBlockPruningAssertion()`
  - `test/fixtures/content/local-block-pruning.html`：新增局部块噪音样例
- 结果：
  - 局部块复制不再轻易混入 `share / related / footer`
  - 策略仍保持保守，避免把短卡片或高链接密度块一律当正文处理
