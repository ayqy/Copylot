# V1-31 V1 发布收尾：生产构建自检脚本 + 全量 Smoke 用例闭环 简报

## 状态
- 已完成：子 PRD `prds/v1-31.md` 全部“具体任务”落地（生产构建干净产物自检脚本 + 全量 Smoke 用例文档 + 发布简报）
- 已验证：`bash scripts/test.sh` 全量通过（包含 build:prod 后的生产包自检），达到可发布状态

## 效果
- 生产构建“干净产物”自检（失败即阻断发布）：
  - 新增 `scripts/verify-prod-build.sh`，对 `dist/` 执行测试资源排除、manifest `test` 引用排除、popup 调试入口关键字排除、权限白名单校验。
  - `scripts/test.sh` 已接入：`npm run build:prod` 后自动执行 `bash scripts/verify-prod-build.sh`，用于 CI/本地一键回归阻断不干净产物。
- V1 全量 Smoke 回归用例闭环：
  - 新增 `docs/test-cases/v1-31.md`，覆盖用例 A-H（权限/隐私、引导、复制主流程、追加模式、表格转换、Prompt 工作流、口碑闭环、商业化入口），并包含一次自动化回归记录（含生产包自检）。

## 修改范围（目录/文件）
- `scripts/test.sh`
- `scripts/verify-prod-build.sh`
- `docs/test-cases/v1-31.md`
- `docs/reports/v1-31-report.md`
- `prds/v1-31-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod + verify-prod-build）✅
- 回归结论：PASS（2026-03-20）
