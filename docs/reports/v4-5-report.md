# v4-5 交付简报

## 状态

- 已完成：`Options -> Pro` 新增批量采集与整理验证卡片，支持打开路线页、复制路线链接、复制验证简报、复制验证清单。
- 已完成：批量采集验证动作接入匿名 intent / distribution 导出链路，使用 `content=options_bulk_collection_cta` 与高级页面清洗路线区分。
- 已完成：`docs/test-cases/v4-5.md`、`docs/evidence/v4-5/*`、`docs/roadmap.md`、`docs/roadmap_status.md` 同步更新。
- 已通过：`bash scripts/test.sh`，摘要为 `23 passed / 0 failed / 1 skipped`。
- 软件工厂命令：沿用 `v4-4` 已确认的 `make devo -> studio/test_runner.py -> bash scripts/test.sh` 输出采集阻塞，本轮继续人工接管闭环。
- 已完成：本轮按闭环要求执行 commit / push，结果以本次提交与远端 `main` 同步状态为准。

## 效果

- Pro Tab 现在已有两条独立验证路线：高级页面清洗、批量采集与整理。
- 两条路线共用同一套验证素材动作，但会通过 `content` 字段分别进入匿名导出，便于后续按路线复盘真实传播意愿。
- 浏览器级回归现在同时覆盖两条路线，减少后续继续扩展验证卡片时的回归盲区。

## 修改范围

- 核心逻辑：`src/shared/pro-route-validation.ts`、`src/shared/pro-intent-attribution.ts`、`src/shared/telemetry.ts`
- Pro 承接界面：`src/options/options.ts`、`src/options/options.html`
- 本地化与测试：`_locales/en/messages.json`、`_locales/zh/messages.json`、`scripts/unit-tests.ts`、`scripts/ui-integration-tests.ts`、`e2e/options-pro-flow.spec.ts`
- 文档与证据：`prds/v4-5.md`、`docs/test-cases/v4-5.md`、`docs/evidence/v4-5/*`、`docs/roadmap.md`、`docs/roadmap_status.md`

## 测试结果

- `npm run build`
- `npm run type-check`
- `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts`
- `node --no-warnings=ExperimentalWarning scripts/ui-integration-tests.ts`
- `npm run build:e2e`
- `npx playwright test e2e/options-pro-flow.spec.ts --reporter=line`
- `bash scripts/test.sh`

## 额外观察

- `build:e2e` 与 Playwright 不能并行操作同一个 `.tmp_e2e/extension` 目录，否则浏览器会在扩展尚未写完时启动，表现为 service worker 无法被发现；本轮已按“先 build:e2e，再跑 Playwright”修正回归顺序。
