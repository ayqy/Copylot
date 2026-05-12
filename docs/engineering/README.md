# 技术经验总览

## 目的
这组文档用于沉淀本仓库在测试体系、真实 UI 自动化、HTML -> Markdown 回归、发布门禁和排障闭环上的有效经验。

目标不是复述实现历史，而是把已经验证过的约束、失败教训和成功做法固化下来，减少后续需求实现中的反复试错。

## 入口
- [工程约束](./constraints.md)
- [统一测试入口与执行模型](./unified-test-pipeline.md)
- [真实 UI 测试经验](./real-ui-testing.md)
- [HTML -> Markdown 回归经验](./html-to-markdown-regression.md)
- [测试排障手册](./debug-playbook.md)

## 推荐阅读顺序
1. 先读 [工程约束](./constraints.md)
2. 再读 [统一测试入口与执行模型](./unified-test-pipeline.md)
3. 之后根据任务类型读：
   - 真实浏览器入口类需求：读 [真实 UI 测试经验](./real-ui-testing.md)
   - 内容提取 / 快照回归类需求：读 [HTML -> Markdown 回归经验](./html-to-markdown-regression.md)
4. 遇到失败时回到 [测试排障手册](./debug-playbook.md)

## 当前固定结论
- 对外唯一测试命令是 `npm run test`
- 发布门禁与回归门禁必须复用同一个命令，不允许再维护第二套对外测试入口
- Playwright 要长期拆成两类：
  - `main`：功能覆盖与稳定回归
  - `native-ui`：真实入口、真实点击、真实右键
- `native-ui` 不是“可有可无”的演示脚本，而是对“是否严格模拟人工 QA”这一目标的强约束
- legacy HTML -> Markdown runner 继续保留独立用例体系，但必须纳入 `npm run test`
- snapshot 比较必须做规范化，不能因为 CRLF/LF 或文件末尾换行差异制造伪失败

## 截至 2026-05-12 的稳定事实
- `npm run test` 已统一串起：
  - lint
  - type-check
  - i18n 检查
  - unit tests
  - build test manifest
  - 一组 deterministic / evidence 校验
  - `build:prod`
  - `build:e2e`
  - UI integration tests
  - content interaction tests
  - HTML -> Markdown runner
  - Playwright `main`
  - Playwright `native-ui`（macOS 默认执行；非 macOS 自动跳过；也可通过环境变量显式跳过）
- 当前 Playwright 用例数：
  - `main`: 35
  - `native-ui`: 3
- 当前 legacy HTML -> Markdown 用例数：
  - 13

## 关联资料
- [V2 简报](../reports/v2-report.md)
- [V2 E2E 审计记录](../evidence/v2/e2e-audit.md)
- [V2 测试用例](../test-cases/v2.md)
