# v1-104 证据索引

## 市场刷新（2026-04-27）

| source | link | observation |
| --- | --- | --- |
| Obsidian Web Clipper - Clip | https://help.obsidian.md/web-clipper/clip | 官方文档持续强调默认抓取正文，并允许用户切换或精炼抓取范围。 |
| Obsidian Web Clipper - Highlight | https://help.obsidian.md/web-clipper/highlight | 官方流程明确支持对局部元素做高亮/选择，说明“局部内容可直接复用”是核心体验。 |
| Raindrop.io Articles | https://help.raindrop.io/articles | 官方帮助把 article 视图和高亮能力作为网页保存体验的一部分。 |
| Readwise - Importing from other sources | https://docs.readwise.io/readwise/docs/importing-highlights/other-sources | 官方文档长期围绕“把网页内容和高亮干净导入阅读/笔记系统”展开。 |

## 结论

- 市场上的 clipper / reader 工具不仅要把整页正文抽干净，还要保证局部高亮、局部块复制时不混入噪音。
- v1-102 已补整页正文路径，本轮继续补齐局部文章块路径，符合竞品基线与高频用户动作。

## 实现与验证

- 代码：`src/shared/content-processor.ts`
- 回归：`scripts/content-interaction-tests.ts`
- fixture：`test/fixtures/content/local-block-pruning.html`
- 验证命令：`npm run build`、`npm run test:content`
