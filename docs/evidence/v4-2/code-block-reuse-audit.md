# v4-2 代码块复用审计

## 审计目标

- 证明代码块复制结果已经从“还要返工”收敛到“可直接复用”。
- 证明两类高频结构都被覆盖：
  - `ol.hljs-ln`
  - 两列代码行结构（`.code-line-row` / `data-line-number`）

## 代码与用例映射

- `src/shared/code-block-cleaner.ts`
  - 负责首尾整行按钮文案保守清理与 `NBSP` 归一化
- `src/shared/content-processor.ts`
  - 负责复制前克隆代码块 DOM、移除内联复制控件、抽取两列代码行正文
- `e2e/code-block-flow.spec.ts`
  - 浏览器级覆盖悬停复制与整页 fenced code
- `scripts/content-interaction-tests.ts`
  - 内容脚本交互级覆盖 `#code-block` 与 `#table-code-block`
- `test/cases/code-block-reuse.html`
  - html-to-markdown 快照基线

## 判定标准

- 输出保留原始缩进与内部空行
- 输出不包含行号前缀
- 输出不包含 `Copy code` / `复制代码`
- 整页转换中的 fenced code 与悬停复制正文保持一致

## 样例结论

- `#code-block`
  - 结果：通过
  - 说明：`hljs` 行号结构已被剥离，首尾按钮文案已清掉
- `#table-code-block`
  - 结果：通过
  - 说明：两列代码行结构已能提取最后一列正文，内联 `Copy code` 控件不会混入复制结果

## 对复用路径的意义

- 代码块用户现在不需要手动删行号、删按钮文案、补缩进。
- 这意味着“首次成功复制 -> 第二次成功复制”的路径在开发者场景里更短，适合继续承接 S2 的口碑门禁。
