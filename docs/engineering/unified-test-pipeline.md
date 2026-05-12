# 统一测试入口与执行模型

## 目标
把所有自动化测试统一到 `npm run test`，让“开发回归”“发布门禁”“人工复核入口”三者使用同一条命令。

## 设计原则
- 对外只暴露一个命令
- 对内允许有多种测试实现，但必须由总控脚本统一编排
- 输出必须统一汇总，不能要求使用者自己拼接多段结果

## 当前执行顺序
`scripts/test.ts` 当前按以下顺序执行：

1. `lint`
2. `type-check`
3. `check-i18n`
4. `scripts/unit-tests.ts`
5. `scripts/build-test-manifest.ts`
6. 一组 deterministic / evidence 校验脚本
7. `build:prod`
8. `build:e2e`
9. `scripts/ui-integration-tests.ts`
10. `scripts/content-interaction-tests.ts`
11. `scripts/html-to-markdown-tests.ts`
12. Playwright `main`
13. Playwright `native-ui`
14. 末尾 evidence / prod build 自检

## 为什么这样排
- 静态检查放最前面：失败成本最低
- 产物构建放在功能回归前：确保后续测试都基于最新扩展
- HTML -> Markdown runner 放在 Playwright 前：它失败时不必浪费时间跑完整浏览器套件
- `main` 在前、`native-ui` 在后：先跑稳定大面回归，再跑慢且依赖桌面环境的真实入口

## 环境变量
- `COPYLOT_TEST_SKIP_BUILD=1`
  - 跳过 `build:e2e`
  - 用于已经确认 `.tmp_e2e/extension` 最新时的快速复测
- `COPYLOT_TEST_ONLY_NATIVE_UI=1`
  - 仅执行原生真实入口回归
- `COPYLOT_TEST_NATIVE_UI_SKIP=1`
  - 显式跳过 `native-ui`

## `main` 与 `native-ui` 的职责边界
### `main`
- 目标：覆盖产品功能
- 特征：
  - 用真实扩展
  - 用真实页面 fixture
  - 可以使用 driver bridge / 真实 popup 页面辅助
  - 追求稳定、可重复、大面积覆盖

### `native-ui`
- 目标：覆盖真实用户入口
- 特征：
  - headed
  - 依赖 macOS Accessibility / OCR / 桌面会话
  - 真实点击 toolbar icon
  - 真实打开浏览器原生右键菜单
  - 真实命中子菜单

## 默认行为
- 在 macOS 环境，`npm run test` 默认会执行 `native-ui`
- 在非 macOS 环境，`native-ui` 自动跳过
- 在 macOS 环境也可以通过 `COPYLOT_TEST_NATIVE_UI_SKIP=1` 显式跳过

## 汇总输出
`npm run test` 末尾会打印统一摘要，按以下维度汇总：
- 门禁校验
- 构建产物
- 脚本测试
- Playwright
- 覆盖统计

当前摘要中至少会显示：
- `html-to-markdown-tests` 用例数
- Playwright `main` 用例数
- Playwright `native-ui` 用例数
- 最终 passed / failed / skipped 组结果

## 报告文件
- `.tmp_e2e/report.json`
- `.tmp_e2e/report-main.json`
- `.tmp_e2e/report-native-ui.json`
- `.tmp_e2e/html-to-markdown-report.json`

这些文件是总览之外的第二层诊断资料，排障时优先读取。

## 与发布链路的关系
- `scripts/publish.ts` 和 `scripts/chrome-webstore.ts` 必须调用 `npm run test`
- 任何人如果尝试恢复“发布前只跑一部分测试”的做法，都应该视为回退

## 后续新增测试的接入规则
- 新增脚本先判断是否属于：
  - 静态门禁
  - 构建验证
  - 脚本测试
  - Playwright 扩展回归
- 再决定接到 `scripts/test.ts` 的哪个阶段
- 不允许新增新的对外 npm script 让人绕开统一入口

## 相关文档
- [技术经验总览](./README.md)
- [工程约束](./constraints.md)
- [真实 UI 测试经验](./real-ui-testing.md)
- [测试排障手册](./debug-playbook.md)
