# V2 E2E 审计记录

## 目标
- 留存本轮 E2E 与回归门禁的实现口径、失败修复和最终结论

## 实现口径
- Playwright 版本：`@playwright/test@1.59.1`
- 浏览器：`chromium` channel + persistent context
- 扩展加载方式：
  - `--disable-extensions-except=dist`
  - `--load-extension=dist`
- Fixture Server：
  - `http://127.0.0.1:4173`
  - 提供 `e2e/fixtures/index.html`
- 产物目录：
  - `.tmp_e2e/`

## 首轮失败与修复
- 问题 1：
  - 现象：并行触发 `build:prod` 与 `e2e` 时，`.tmp_build_prod` 被互相清理，出现 `spawn sh ENOENT`
  - 修复：后续严格串行执行构建与测试
- 问题 2：
  - 现象：E2E 启动时默认查找 `chromium_headless_shell`
  - 修复：扩展启动改为 `channel: 'chromium'`
- 问题 3：
  - 现象：Content E2E 在 teardown 卡住
  - 修复：fixture server 禁用 keep-alive、跟踪并销毁 sockets，测试内显式关闭 page
- 问题 4：
  - 现象：Options E2E 使用英文标题断言，受 i18n 实际文案影响
  - 修复：改为按 `data-id="builtin-summary-article"` 断言内置 Prompt
- 问题 5：
  - 现象：新建 Prompt 后 `.prompt-card-title` 命中多个元素触发 strict mode 失败
  - 修复：改为精确过滤包含 `E2E Prompt` 的标题

## 最终通过项
- `npm run e2e`
- `npm run test:ui`
- `npm run test:content`
- `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts`
- `bash scripts/verify-prod-build.sh`
- `bash scripts/test.sh`

## 例外说明
- 原生 context menu 本轮不做 Playwright 直接点击，改为：
  - 共享 prompt 可见性规则单测
  - background/context menu 纯函数模型单测
  - content/options/background 共用规则回归
