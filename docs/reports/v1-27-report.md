# V1-27 增长内容资产补齐：代码块专业级清理教程 + README 入口 + 用例闭环 简报

## 状态
- 已完成：子 PRD `prds/v1-27.md` 全部“具体任务”落地（教程、README 入口与口径纠偏、ASO 口径收敛、测试用例文档、简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 新增可对外发布教程（口径真实、可复现、含隐私口径/发布素材/审计清单）：
  - `docs/tutorials/code-block-cleaning.md`：覆盖两条最短路径（Path A：代码块悬停复制；Path B：Magic Copy 块级/页级复制含上下文），并明确清理边界（Copy 文案仅首尾整行保守移除；行号仅覆盖可识别结构；保留缩进/空行；少量 Markdown 反转义）。
- README 最小联动 + 口径最小纠偏：
  - `README.md`：在“【代码块专业级清理】—— 开发者必备”段落新增教程链接，并将“代码块清理”表述收敛为可审计口径（不承诺提示符自动移除/所有站点去行号等未实现能力）。
- ASO 口径收敛：
  - `docs/aso/value-prop.md`：将“代码块专业清理”差异化卖点收敛为与实现一致的可审计描述（保留缩进/空行、行号结构有边界、Copy 文案保守移除）。
- 测试/用例与发布闭环：
  - `docs/test-cases/v1-27.md` 覆盖用例 A-F，并记录一次 `bash scripts/test.sh` 回归结论。

## 修改范围（目录/文件）
- `docs/tutorials/code-block-cleaning.md`
- `README.md`
- `docs/aso/value-prop.md`
- `docs/test-cases/v1-27.md`
- `docs/reports/v1-27-report.md`
- `prds/v1-27-1.md`
- `docs/worklog/2026-03-19.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

