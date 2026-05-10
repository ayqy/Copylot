# V2 E2E 自动化与发布回归（简报）

## 状态
- 已完成：`npm run e2e` 真实浏览器回归入口
- 已完成：Content / Popup / Options 三条关键路径 E2E
- 已完成：Prompt 可见性统一收口到共享规则
- 已完成：DevTools smoke test、单测、总门禁接入
- 已完成：`bash scripts/test.sh` 串联 E2E

## 实现效果
- 删除态内置 Prompt 不再在 background 右键菜单、content 悬浮菜单、options 列表中出现，规则一致
- 真实 Chromium 环境可以加载 `dist/` 扩展并执行三条关键用户路径
- 发布前门禁从“单测/集成/构建自检”扩展为“包含真实浏览器 E2E 的完整回归”

## 测试结果
- `npm run e2e`：PASS
- `npm run test:ui`：PASS
- `npm run test:content`：PASS
- `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts`：PASS
- `bash scripts/verify-prod-build.sh`：PASS
- `bash scripts/test.sh`：PASS

## 修改范围
- `src/background.ts`
- `src/content/content.ts`
- `src/options/options.ts`
- `src/shared/settings-manager.ts`
- `src/shared/context-menu-model.ts`
- `scripts/test-helpers/chrome-mock.ts`
- `scripts/ui-integration-tests.ts`
- `scripts/unit-tests.ts`
- `scripts/e2e.ts`
- `scripts/e2e-fixture-server.ts`
- `e2e/`
- `playwright.config.ts`
- `scripts/test.sh`
- `docs/test-cases/v2.md`
- `docs/evidence/v2/e2e-audit.md`
- `docs/reports/v2-report.md`
- `prds/v2-1.md` ~ `prds/v2-4.md`
