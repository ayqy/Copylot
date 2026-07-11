# v4-4 交付简报

## 状态

- 已完成：`Options -> Pro` 新增高级页面清洗验证卡片，支持打开路线页、复制路线链接、复制验证简报、复制验证清单。
- 已完成：高级页面清洗验证动作接入匿名 telemetry 与 campaign 级分发导出，新增 `validationRouteCopied`、`validationBriefCopied`、`validationChecklistCopied`。
- 已完成：`docs/test-cases/v4-4.md`、`docs/evidence/v4-4/*`、`docs/roadmap.md`、`docs/roadmap_status.md` 同步更新。
- 已完成：历史周度渠道证据包 `docs/evidence/v1-63/*`、`docs/evidence/v1-64/*`、`docs/evidence/v1-65/*` 升级到新的分发表头，避免统一测试被旧样本拦住。
- 已通过：`bash scripts/test.sh`，摘要为 `23 passed / 0 failed / 1 skipped`。
- 软件工厂命令：`make devo PROJECT=/Users/pocket/Documents/project/Copylot ...` 会进入 `studio` 循环并阻塞在 `bash scripts/test.sh` 子进程采集阶段；本轮已记录该现象并手工接管闭环。
- 已完成：本轮按闭环要求执行 commit / push，结果以本次提交与远端 `main` 同步状态为准。

## 效果

- Pro Tab 现在可以直接生成“高级页面清洗”路线素材，先验证用户是否真的愿意为更强页面清洗带走路线说明，而不是提前上支付或候补。
- 路线打开与素材复制都能落到现有匿名导出中，后续可以按 `campaign` 看清楚哪个来源最愿意传播这条方向。
- 离线安装包检查与历史周度渠道证据包继续可审计，避免新列引入后破坏既有回归。

## 修改范围

- 核心逻辑：`src/shared/pro-route-validation.ts`、`src/shared/pro-intent-attribution.ts`、`src/shared/telemetry.ts`、`src/shared/pro-distribution-by-campaign-csv.ts`
- Pro 承接界面：`src/options/options.ts`、`src/options/options.html`、`src/options/options.css`
- 本地化与测试：`_locales/en/messages.json`、`_locales/zh/messages.json`、`scripts/unit-tests.ts`、`scripts/ui-integration-tests.ts`、`e2e/options-pro-flow.spec.ts`
- 文档与证据：`prds/v4-4.md`、`docs/test-cases/v4-4.md`、`docs/evidence/v4-4/*`、`docs/roadmap.md`、`docs/roadmap_status.md`
- 历史样本兼容：`docs/evidence/v1-63/*`、`docs/evidence/v1-64/*`、`docs/evidence/v1-65/*`

## 测试结果

- `npm run build`
- `npm run type-check`
- `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts`
- `node --no-warnings=ExperimentalWarning scripts/ui-integration-tests.ts`
- `npm run build:e2e`
- `npx playwright test e2e/options-pro-flow.spec.ts --reporter=line`
- `bash scripts/test.sh`

## 工厂命令记录

- 命令：`make devo PROJECT=/Users/pocket/Documents/project/Copylot INSTRUCTION="只做 docs/roadmap.md 里 S3 的第 1 项..."`
- 结果：进入 `studio/loops/dev_loop.py` 后会调用 `studio/test_runner.py -> bash scripts/test.sh`，当前无增量输出且需人工中断；中断栈显示阻塞在 `subprocess.run(... capture_output=True)` 的等待阶段。
- 人工接管范围：代码实现、离线 zip 刷新、专项回归、统一测试、证据与 roadmap 更新。
