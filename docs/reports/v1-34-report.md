# V1-34 Prompt 作用域一致性修复：悬浮按钮 Prompt 优先选区 简报

## 状态
- 已完成：子 PRD `prds/v1-34.md` 全部“具体任务”落地（悬浮按钮 Prompt 选区优先 + 统计/隐私回归检查 + 用例/文档闭环）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 悬浮按钮 Prompt 行为与右键 Prompt 入口对齐：
  - 当前块内存在有效选区：Prompt 优先作用于选区
    - 表格内选区：优先整表（table ancestor）
    - 非表格选区：优先精确选区 fragment（保留 `<a>/<b>/<code>` 等内联结构）
  - 无有效选区 / 选区不在当前块：保持既有行为，仍作用于当前块（不被其它选区“劫持”）
- 右键菜单 Prompt 行为保持不变（仍沿用 background message 路径的既有实现）
- 统计与隐私无回归：
  - 一次 Prompt 操作仅产生一次剪贴板写入（`finalText`）
  - telemetry 本地事件：`copy_success` + `prompt_used` 各 1 次（开关关闭时不记录且会清空本地日志）
  - growth stats：成功复制计数 + 首次 Prompt 使用时间等字段更新逻辑保持不变

## 修改范围（目录/文件）
- `src/content/content.ts`
- `docs/test-cases/v1-34.md`
- `docs/reports/v1-34-report.md`
- `prds/v1-34-1.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 回归结论：PASS（2026-03-20）
