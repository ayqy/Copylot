# V1-17 Prompt 管理器排序能力（最常用 / 最近使用）+ 修正“最近使用”时间显示 简报

## 状态
- 已完成：子 PRD `prds/v1-17.md` 全部“具体任务”落地（Options UI + 排序逻辑 + 最近使用文案修正 + i18n + 单测 + 用例文档 + 简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- Options -> Prompts Tab 工具条新增排序下拉框 `#prompt-sort-select`，支持：
  - `default`：保持原顺序
  - `most_used`：按 `usageCount` 倒序（缺省视为 0），并按标题（忽略大小写）稳定次排序
  - `recent_used`：按 `lastUsedAt` 倒序（未使用过排末尾），再按 `usageCount` 倒序 + 标题稳定排序
- Prompt 卡片底部“最近使用”时间不再误用 `createdAt`：
  - 有 `lastUsedAt`：显示 `formatTimeAgo(lastUsedAt)`
  - 无 `lastUsedAt`：显示 i18n 占位 `promptNeverUsed`
- 排序模式选择使用 localStorage 记忆（`copylot_prompt_sort_mode`），刷新后保持

## 修改范围（目录/文件）
- `src/options/options.html`
- `src/options/options.css`
- `src/options/options.ts`
- `src/shared/prompt-sort.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-17.md`
- `docs/reports/v1-17-report.md`
- `prds/v1-17-1.md`
- `docs/worklog/2026-03-19.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
