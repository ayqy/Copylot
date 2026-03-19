# V1-30 Prompt 工作流一致性修复：右键 Prompt 支持“选区优先” + 选区 Prompt 支持自动打开 Chat + 教程/用例闭环 简报

## 状态
- 已完成：子 PRD `prds/v1-30.md` 全部“具体任务”落地（右键 Prompt 选区优先；选区 Prompt 自动打开 Chat；教程/用例闭环）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 右键 Prompt“选区优先”（Selection > Page）一致性补齐：
  - 右键 `Magic Copy with Prompt` 在有选区时走选区链路（`PROCESS_SELECTION_WITH_PROMPT`），无选区时保持既有整页链路（`PROCESS_PAGE_WITH_PROMPT` / `PROCESS_PAGE_WITH_PROMPT_AND_CHAT`）。
  - ContextMenu `contexts` 同时包含 `selection` 与 `page`，确保 `info.selectionText` 在划词右键场景可用。
- 选区 Prompt 自动打开 Chat 补齐（仅复制成功后触发）：
  - 选区 Prompt 写入剪贴板成功后，如消息携带 `chatServiceUrl/chatServiceName`，展示一次跳转提示并在固定延迟后打开新标签页；失败不触发；延迟与页级 Chat 路径保持一致。
- 教程/用例闭环：
  - `docs/tutorials/prompt-workflow.md` 已更新为“选区优先”口径，并明确如何验证“有选区/无选区”两条路径。
  - 新增 `docs/test-cases/v1-30.md`，覆盖用例 A-E 与自动化回归记录。

## 修改范围（目录/文件）
- `src/background.ts`
- `src/content/content.ts`
- `docs/tutorials/prompt-workflow.md`
- `docs/test-cases/v1-30.md`
- `docs/reports/v1-30-report.md`
- `prds/v1-30-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

