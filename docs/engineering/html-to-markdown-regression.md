# HTML -> Markdown 回归经验

## 为什么这套 runner 不能删
`test/index.html` 这套 legacy runner 有自己独立的 case 体系，专门覆盖复杂 HTML 到 Markdown 的转换行为。

它与 Playwright 的 38 个 E2E 用例不是同一套计数，但它必须纳入 `npm run test`，因为很多内容提取问题只会在这类精细快照用例里暴露。

## 当前结构
- 用例入口：`test/index.html`
- runner 逻辑：`test/runner.ts`
- manifest：`test/test-manifest.json`
- 快照目录：`test/snapshots/`
- CLI 包装：`scripts/html-to-markdown-tests.ts`

## 本轮最有价值的失败教训
### 1. 跨 realm `instanceof` 会失效
- legacy runner 把 case 跑在 iframe 里
- 原代码如果直接写：
  - `instanceof HTMLElement`
  - `instanceof HTMLTableElement`
  - `instanceof HTMLImageElement`
- 在跨 `window` 时会失效

正确做法：
- 优先 `nodeType`
- `tagName`
- 显式类型守卫

### 2. 非标准表格不能强行走普通 GFM 转换
- 像 VS Marketplace 这种“卡片式 table”会退化
- 需要专门 fallback 逻辑，而不是把所有 table 都交给同一条路径

### 3. Reader mode 去噪不能误删表格结构节点
- 如果把 `header` 之类的负面词规则直接打在结构节点上，容易把表格正文误伤
- `table / thead / tbody / tr / td / th` 这类结构要单独保护

### 4. 链接清洗会引入肉眼不明显但快照敏感的空格问题
- 例如空锚点被剔除后，前后字符可能直接粘连
- 这类问题不一定影响大面功能，但会稳定污染快照

### 5. 只有 EOF 换行差异时，不应该判失败
- 这类差异是比较口径问题，不是产品逻辑问题
- runner 现在会统一：
  - `\r\n` -> `\n`
  - 忽略文件末尾多余换行

## 当前比较策略
runner 比较 snapshot 前，会先做规范化：
- 统一换行符
- 去掉末尾多余空行

这个规则必须保留。否则会不断出现“内容相同但快照失败”的伪回归。

## 调试方法
### 快速跑法
- `./node_modules/.bin/ts-node scripts/build-test-manifest.ts`
- `npm run build:e2e`
- `./node_modules/.bin/ts-node scripts/html-to-markdown-tests.ts`

### runner 页面上的关键诊断数据
- `#stats-total`
- `#stats-passed`
- `#stats-failed`
- `#batch-update-output`

### 脚本报告
- `.tmp_e2e/html-to-markdown-report.json`

## 快照更新规则
- 先判断失败是：
  - 产品输出真的变了
  - 还是 manifest / runner / 比较口径问题
- 如果是 runner 口径问题，优先修 runner
- 如果是产品行为合理变化，再更新 snapshot

## 新增 case 时的约束
- 先补快照
- 再确保 `build-test-manifest.ts` 能把新快照内联进 manifest
- 不能只新增 HTML case 而漏掉快照

## 与 Playwright 的关系
- HTML -> Markdown runner：
  - 强于转换细节回归
  - 弱于完整用户路径
- Playwright：
  - 强于端到端产品路径
  - 弱于大段文本快照精度

两者长期共存，不互相替代。

## 相关文档
- [技术经验总览](./README.md)
- [工程约束](./constraints.md)
- [统一测试入口与执行模型](./unified-test-pipeline.md)
- [测试排障手册](./debug-playbook.md)
