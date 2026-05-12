# 测试排障手册

## 原则
排障顺序必须从“最便宜、最确定”的层开始，不要一上来就重跑整套大回归。

## 推荐排障顺序
1. 看 `npm run test` 统一总览，先定位失败阶段
2. 如果是静态门禁：
   - `npm run lint`
   - `npm run type-check -- --pretty false`
   - `npm run check-i18n`
3. 如果是 HTML -> Markdown：
   - `./node_modules/.bin/ts-node scripts/build-test-manifest.ts`
   - `npm run build:e2e`
   - `./node_modules/.bin/ts-node scripts/html-to-markdown-tests.ts`
4. 如果是 Playwright `main`：
   - `npx playwright test --config=playwright.config.ts --project=main`
5. 如果是 Playwright `native-ui`：
   - `COPYLOT_TEST_ONLY_NATIVE_UI=1 npm run test`
   - 或 `npx playwright test --config=playwright.config.ts --project=native-ui`

## 关键报告文件
- `.tmp_e2e/report.json`
- `.tmp_e2e/report-main.json`
- `.tmp_e2e/report-native-ui.json`
- `.tmp_e2e/html-to-markdown-report.json`

## 按失败类型排
### A. `lint` / `type-check` 失败
优先看：
- 最近是不是为了兼容跨 realm 改了类型守卫
- 最近是不是引入了重载、`never` 分支、`no-redeclare` 风险

### B. HTML -> Markdown 失败
优先看：
- manifest 是否重新生成
- `.tmp_e2e/extension` 是否重建
- 失败是否只是末尾换行或 CRLF/LF
- batch update 输出里到底给了什么实际文本

### C. `main` 失败
优先看：
- 是否是 fixture 变了
- 是否是 popup / options / background state 没 reset 干净
- 是否是断言过度依赖剪贴板

### D. `native-ui` 失败
优先看：
- 是否在 macOS
- 是否有 Accessibility 权限
- 是否有可见桌面会话
- `Google Chrome for Testing` 是否真的在前台
- OCR query 是否需要补模糊匹配
- 是否能改成键盘导航兜底

## native-ui 专项排障
- 先确认不是功能逻辑问题，而是入口点击问题
- 如果入口 OCR 不稳定：
  - 先扩展 query
  - 再减少坐标依赖
  - 最后增加键盘兜底
- 如果断言不稳定：
  - 优先改成 storage / telemetry / growth stats
  - 不要继续加 `sleep` 掩盖问题

## legacy runner 专项排障
- 如果 3 个 case 同时失败，先怀疑：
  - manifest 未更新
  - `.tmp_e2e/extension` 未重建
  - runner 比较器口径出错
- 不要先怀疑三个产品逻辑同时坏了

## 什么时候可以更新快照
- 已确认是合理行为变化
- 已确认不是比较器或构建链路问题
- 已重新跑过 runner 并能稳定复现

## 什么时候不能更新快照
- 只差 CRLF/LF
- 只差文件末尾换行
- 只差构建产物没同步
- 还没确认跨 realm / 去噪规则 / 链接清洗是不是根因

## 常用命令清单
```bash
npm run lint
npm run type-check -- --pretty false
npm run check-i18n
./node_modules/.bin/ts-node scripts/build-test-manifest.ts
npm run build:e2e
./node_modules/.bin/ts-node scripts/html-to-markdown-tests.ts
npx playwright test --config=playwright.config.ts --project=main
COPYLOT_TEST_ONLY_NATIVE_UI=1 npm run test
npm run test
```

## 相关文档
- [技术经验总览](./README.md)
- [工程约束](./constraints.md)
- [统一测试入口与执行模型](./unified-test-pipeline.md)
- [真实 UI 测试经验](./real-ui-testing.md)
- [HTML -> Markdown 回归经验](./html-to-markdown-regression.md)
