# V1-24 增长内容资产最小闭环：教程模板 + 表格一键转 CSV/Markdown 教程 简报

## 状态
- 已完成：子 PRD `prds/v1-24.md` 全部“具体任务”落地（教程模板、首篇教程、README 教程链接、测试用例文档、简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 沉淀可复用、可审计的教程模板：
  - `docs/tutorials/_tutorial-template.md`：固定结构（标题/TL;DR/前置条件/步骤/期望结果/FAQ/发布素材/审计清单），明确双语规则与“禁止夸大/隐私口径”
- 产出首篇可对外发布教程（口径真实可验证）：
  - `docs/tutorials/table-to-csv-markdown.md`：用稳定示例页面演示“网页表格 → CSV/Markdown”，强调 3 分钟内完成首次成功，并对齐 Popup UI 术语（`Enable Magic Copy` / `Table: CSV|MD` / `Extra`）
- 对外引用最小联动：
  - `README.md`：在“网页表格一键转换 (CSV & Markdown)”段落增加教程链接，便于商店/社媒引用
- 测试/用例与发布检查闭环：
  - `docs/test-cases/v1-24.md` 覆盖用例 A-D，并记录一次 `bash scripts/test.sh` 结果

## 修改范围（目录/文件）
- `docs/tutorials/_tutorial-template.md`
- `docs/tutorials/table-to-csv-markdown.md`
- `README.md`
- `docs/test-cases/v1-24.md`
- `docs/reports/v1-24-report.md`
- `prds/v1-24-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

