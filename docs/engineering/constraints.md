# 工程约束

## 目的
这些约束不是建议，而是本仓库后续继续扩展测试体系时的默认规则。除非有明确反例并同步更新经验文档，否则不要违反。

## 1. 测试入口约束
- 对外只能保留一个测试命令：`npm run test`
- 任何新测试脚本都必须并入 `scripts/test.ts`，不能新增第二个对外入口
- 发布脚本必须复用 `npm run test` 作为门禁，不能维护独立的“发布前测试命令”

## 2. 构建隔离约束
- 生产构建和测试构建必须隔离
- 生产构建使用 `dist/`
- E2E 构建使用 `.tmp_e2e/extension`
- 不允许让测试资源污染 `dist/`

## 3. Playwright 分层约束
- `main` 只负责稳定、可批量回归的功能覆盖
- `native-ui` 专门负责真实入口验证
- 不允许把“调用 background bridge / 直接打开 popup 页面”包装成“真实原生入口测试”
- 也不允许把所有真实 UI 测试都塞进 `native-ui`，导致功能覆盖不足

## 4. 真实 UI 约束
- 当需求目标是“严格模拟人工 QA 验收”时，必须满足以下条件：
  - 从最新打包扩展开始
  - 真实安装并加载扩展
  - 真实点击浏览器 toolbar 扩展入口
  - 真实打开原生右键菜单
  - 真实触发 Prompt 子菜单或 Convert Page 子菜单
- 如果只是在扩展内部页面里直接调函数、直接打开 popup HTML、直接触发 background handler，这只能算功能覆盖，不算真实入口覆盖

## 5. 断言策略约束
- 默认不要把系统剪贴板作为主断言来源
- 优先断言：
  - storage 持久化结果
  - `usageCount`
  - growth stats
  - telemetry
  - opened URL 审计
  - 导出文件
  - Playwright report / runner report
- 原因：系统剪贴板在真实 UI、桌面环境、CI 或多窗口场景下都更脆弱

## 6. HTML -> Markdown 回归约束
- legacy runner 继续保留在 `test/index.html`
- `scripts/html-to-markdown-tests.ts` 必须纳入 `npm run test`
- 比较 snapshot 时必须统一：
  - `\r\n` / `\n`
  - 文件末尾多余换行
- 不能让“只有 EOF 换行差异”的 case 失败

## 7. DOM 兼容约束
- 对 iframe / 跨 realm 场景，禁止依赖裸 `instanceof HTMLElement / HTMLTableElement / HTMLImageElement`
- 优先使用：
  - `nodeType`
  - `tagName`
  - 自己的显式类型守卫
- 原因：legacy runner 在 iframe 里跑 case，跨 `window` 后 `instanceof` 会失效

## 8. 快照更新约束
- 快照更新前先判断是产品行为变化，还是比较器口径问题
- 如果只是 CRLF/LF、末尾换行或 manifest 同步问题，优先修 runner 或构建链路，不要盲目刷新快照
- 只有当实际产品输出变得更合理且稳定时，才更新 snapshot

## 9. 可诊断性约束
- runner / 总控脚本失败时必须输出可操作诊断信息
- 最低要求：
  - 失败 case 标题
  - 可定位的报告文件
  - 明确的失败阶段
- 不能只报“超时”或“测试失败”这种低信息量错误

## 10. 汇总输出约束
- `npm run test` 末尾必须给出统一总览
- 至少包含：
  - 各阶段 PASS / FAIL / SKIP
  - Playwright 用例数
  - HTML -> Markdown 用例数
  - 最终组结果

## 相关文档
- [技术经验总览](./README.md)
- [统一测试入口与执行模型](./unified-test-pipeline.md)
- [真实 UI 测试经验](./real-ui-testing.md)
- [HTML -> Markdown 回归经验](./html-to-markdown-regression.md)
- [测试排障手册](./debug-playbook.md)
