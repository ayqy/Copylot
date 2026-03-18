# V1-9 可见性克隆空白文本节点保留修复（避免文本粘连/丢空格）简报

## 状态
- 已完成：子 PRD `prds/v1-9.md` 全部“具体任务”落地（代码修复/DOM 回归用例/用例文档/简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 修复粘连：非 `pre/code` 场景下，`createVisibleClone()` 不再无条件删除纯空白文本节点；当空白用于分隔相邻可见文本时，保留为单个空格 `' '`，避免 `Hello world` 变 `Helloworld`
- 控制噪音：仅在“前后都有有效兄弟节点且非块级分隔标签”的上下文补空格；块级分隔、行首行尾等场景继续丢弃空白，保持输出干净
- 回归闭环：新增 DOM 用例 `whitespace-between-inline`（覆盖内联分隔 + 块级负例），并更新 `test/test-manifest.json`，可在 test runner 一键回归
- 可验收：新增 `docs/test-cases/v1-9.md`，覆盖复现/手工回归/负例/自动化回归，并记录执行结论

## 修改范围（目录/文件）
- `prds/v1-9-1.md`
- `prds/v1-9-2.md`
- `prds/v1-9-3.md`
- `src/shared/dom-preprocessor.ts`
- `test/cases/whitespace-between-inline.html`
- `test/snapshots/whitespace-between-inline.expected.md`
- `test/test-manifest.json`
- `docs/test-cases/v1-9.md`
- `docs/reports/v1-9-report.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

