# V1-10 表格内选区复制一致性修复（整表优先 + 去除双重可见性裁剪）简报

## 状态
- 已完成：子 PRD `prds/v1-10.md` 全部“具体任务”落地（选区策略/链路裁剪修复/DOM 回归用例与快照/用例文档/简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 表格内选区整表优先：在表格单元格内划词后触发 `CONVERT_PAGE_WITH_SELECTION`，处理根节点提升为表格祖先元素，避免仅输出 fragment 导致表格结构丢失
- 非表格选区不退化：表格外划词仍走精确选区 fragment，输出仅包含选区内容并保留基础内联结构（链接/加粗/内联 code 等）
- 去除双重可见性裁剪：选区回退链路统一改用 `processContent()`，并将 `processElementWithTableDetection()` 收敛为薄封装，确保全链路最多一次 `createVisibleClone()`
- 回归闭环：新增 DOM 用例 `table-selection-inside-table` 与快照并更新 `test/test-manifest.json`；补齐 `docs/test-cases/v1-10.md`，可执行可回归

## 修改范围（目录/文件）
- `prds/v1-10-1.md`
- `prds/v1-10-2.md`
- `prds/v1-10-3.md`
- `src/content/content.ts`
- `src/shared/content-processor.ts`
- `test/cases/table-selection-inside-table.html`
- `test/snapshots/table-selection-inside-table.expected.md`
- `test/test-manifest.json`
- `docs/test-cases/v1-10.md`
- `docs/reports/v1-10-report.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

