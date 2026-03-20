# V1-35 全页转换正文优先：语义 main/article 作为默认根节点 简报

## 状态
- 已完成：子 PRD `prds/v1-35.md` 全部“具体任务”落地（整页 root 优先语义正文容器 + DOM 回归用例 + 用例/文档闭环）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 整页转换（`CONVERT_PAGE`）与整页 Prompt（`PROCESS_PAGE_WITH_PROMPT*`）默认“正文优先”：
  - 仅当处理根节点为 `document.body`（`<body>`）时，尝试选择 `main/article/[role="main"]`
  - 选择策略：取候选中 `innerText.trim().length` 最大者；仅当 `>= 200` 才作为实际 root 进入 `createVisibleClone()` 与后续转换链路
  - 结果：显著减少 header/nav/aside/footer 等噪音进入复制结果，提升整页复制可用性
- 回退策略与无回归：
  - 无候选或候选过小：保持现状，仍处理 `document.body`
  - 选区转换、表格转换、Prompt 选区优先等路径根节点判定逻辑不变（仅对 `BODY` 生效）

## 修改范围（目录/文件）
- `src/shared/content-processor.ts`
- `test/cases/semantic-main-content.html`
- `test/test-manifest.json`
- `docs/test-cases/v1-35.md`
- `docs/reports/v1-35-report.md`
- `prds/v1-35-1.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 回归结论：PASS（2026-03-20）

