# V1-26 增长内容资产增量：Prompt 工作流教程 + README 入口 + 用例闭环 简报

## 状态
- 已完成：子 PRD `prds/v1-26.md` 全部“具体任务”落地（第 3 篇 Prompt 工作流教程、README 教程入口、测试用例文档、简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 新增可对外发布教程（口径真实、可复现、含隐私口径/发布素材/审计清单）：
  - `docs/tutorials/prompt-workflow.md`：覆盖两条最短路径（悬浮按钮 Prompt 菜单：块级；右键 `Magic Copy with Prompt`：页级），说明 `{content}` 占位符规则与“复制后自动打开 Chat”的行为边界（仅打开新标签页、不自动粘贴、不上传内容）。
- README 最小联动（对外引用入口稳定）：
  - `README.md`：在“【私人 Prompt 管理器】—— 打造您的专属 AI 工作流”段落新增教程链接，GitHub 渲染可直接打开。
- 测试/用例与发布闭环：
  - `docs/test-cases/v1-26.md` 覆盖用例 A-F，并记录一次 `bash scripts/test.sh` 回归结论。

## 修改范围（目录/文件）
- `docs/tutorials/prompt-workflow.md`
- `README.md`
- `docs/test-cases/v1-26.md`
- `docs/reports/v1-26-report.md`
- `prds/v1-26-1.md`
- `docs/worklog/2026-03-19.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
