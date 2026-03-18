# V1-8 代码块清理误删修复（保守移除 Copy 按钮文本）简报

## 状态
- 已完成：子 PRD `prds/v1-8.md` 全部“具体任务”落地（代码修复/单测补齐/用例文档）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 修复误删：代码块清理从“全局替换 Copy/Clone”等改为“行级 + 位置受限 + 强约束”的保守清理，避免误删合法代码正文（标识符/字符串/注释等）
- 统一复用：新增纯函数模块 `src/shared/code-block-cleaner.ts` 并在 `src/shared/content-processor.ts` 中统一调用，确保所有 `pre/code` 路径一致
- 测试闭环：在 `scripts/unit-tests.ts` 增加关键场景单测，覆盖“正文包含 Copy/Clone 不误删 / 首末行按钮文案移除 / 中间行不移除”
- 可回归：新增 `docs/test-cases/v1-8.md`，覆盖手工回归、负例与关键路径回归，并记录自动化测试结论

## 修改范围（目录/文件）
- `prds/v1-8-1.md`
- `prds/v1-8-2.md`
- `prds/v1-8-3.md`
- `src/shared/code-block-cleaner.ts`
- `src/shared/content-processor.ts`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-8.md`
- `docs/reports/v1-8-report.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
