# V2 E2E 审计记录

## 目标
- 记录本轮 QA 验收级 E2E 的实现口径、失败修复和最终结果

## 实现口径
- Playwright 版本：`@playwright/test@1.59.1`
- 浏览器：`chromium` channel + persistent context
- E2E 产物目录：
  - `.tmp_e2e/extension`
- 扩展控制方式：
  - 真实加载扩展
  - 通过 `src/e2e/driver.html` 调 background E2E bridge
  - popup 主套件使用真实 popup 页面 + `?tab=<id>` 绑定当前 QA tab
- Fixture Server：
  - `http://127.0.0.1:4173`
  - 提供 `article.html` / `table.html` / `editor.html` / `chat.html`
- Project 划分：
  - `main`：稳定主回归，纳入 `npm run test`
  - `native-ui`：原生 icon / 原生右键真实入口回归；macOS 默认纳入 `npm run test`，非 macOS 自动跳过，也可用环境变量显式跳过

## 本轮关键修复
- 修复 E2E 构建与 prod 构建共享 `dist/` 带来的污染风险：
  - 新增 `BUILD_TARGET=e2e`
  - 新增 `.tmp_e2e/extension`
- 修复 popup 与 context-menu 入口无法稳定绑定目标 tab：
  - popup 增加 `?tab=` 解析
  - background 增加 E2E bridge
- 修复 popup 外链/增长入口 telemetry 在 `window.close()` 前丢失的问题：
  - popup 的 share / feedback / rate / pro entry / onboarding complete 改为显式等待持久化
- 修复部分 seed settings 场景下 `saveSettings()` 因缺失数组字段而静默失败：
  - 保存前先与 `DEFAULT_SETTINGS` 合并
  - `chatServices` / `userPrompts` / editor exclusion 字段补齐默认值
- 修复 popup growth 对外部页面可达性的脆弱依赖：
  - E2E bridge 新增 opened URL 审计
  - 改为验真实点击后的目标 URL 与 telemetry
- 修复 native-ui `Convert Page` 原生右键链路对 OCR 文案误识别过于脆弱：
  - 补充 `AI -> Al / A1` 误识别 query
  - 原生 `Copylot` 子菜单改用 `Right -> Enter` 触发首项，降低坐标漂移风险
- 修复 onboarding 自动弹层遮挡 popup 操作：
  - 测试中显式完成 onboarding
- 修复对宿主系统剪贴板的脆弱依赖：
  - 核心断言切换为 growth stats / telemetry / settings 持久化结果

## 主套件覆盖
- Content：
  - 真实选区 + 页面点击 + Magic Copy 按钮
  - 编辑器排除区
  - 代码块 hover copy 清洗
  - 代码页整页转换
  - 普通表格 CSV
  - 复杂表格 Markdown
- Context Menu：
  - 通过 background 生产 handler 触发 prompt 链路
  - 自动打开 chat 页
  - prompt usage 持久化
  - 整页 Convert Page 噪音过滤
- Popup：
  - 真实 popup 页面
  - onboarding
  - convert
  - 打开 options
  - Pro waitlist copy telemetry
  - settings toggle 持久化
  - growth 分享 / 反馈 / 评分 / survey 入口
- Options：
  - 内置 Prompt
  - 新建自定义 Prompt
  - prompts 高级管理
  - chat service 管理与 auto-open
  - telemetry / growth / WOM / Pro distribution / survey / funnel 导出链路

## Native UI 覆盖
- 工具栏扩展入口：
  - 通过 macOS Accessibility API 点击浏览器原生 `扩展程序 / Extensions`
  - 通过扩展面板真实点击 `Copylot`
  - 校验 popup 打开并可执行一次 `Convert`
- 原生右键入口：
  - 通过 CoreGraphics 系统级右键事件拉起浏览器原生上下文菜单
  - 通过 OCR 命中 `智能复制+自定义提示 / Magic Copy with Prompt`
  - 通过 OCR 命中子菜单 Prompt `QA Native Summary`
  - 通过 `Right -> Enter` 命中 `转换为AI友好格式`
  - 校验 prompt `usageCount` 与 growth stats 成功计数

## 当前结果
- `COPYLOT_E2E_SKIP_BUILD=1 COPYLOT_E2E_NATIVE_UI_SKIP=1 npx playwright test --config=playwright.config.ts --project=main`：PASS
- `npx playwright test --config=playwright.config.ts --project=main`：`35 passed`
- `npm run test`：PASS
- `COPYLOT_TEST_ONLY_NATIVE_UI=1 npm run test`：`3 passed`

## 长期经验入口
- `docs/engineering/README.md`
- 关键约束：
  - `docs/engineering/constraints.md`
  - `docs/engineering/real-ui-testing.md`
  - `docs/engineering/html-to-markdown-regression.md`
  - `docs/engineering/debug-playbook.md`

## 例外说明
- `native-ui` 依赖：
  - macOS 辅助功能权限
  - 桌面会话
  - 屏幕 OCR
  - headed 浏览器
- 在非 macOS 环境不执行；在 macOS 环境可通过 `COPYLOT_TEST_NATIVE_UI_SKIP=1` 跳过
