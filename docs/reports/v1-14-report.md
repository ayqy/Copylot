# V1-14 隐私页本地增长统计面板：可查看/导出/重置 copilot_growth_stats 简报

## 状态
- 已完成：子 PRD `prds/v1-14.md` 全部“具体任务”落地（Options 隐私页面板/UI i18n/读取渲染/复制导出/一键重置/用例文档/简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- Options -> 隐私与可观测性（`#privacy-tab`）新增“本地增长统计”折叠面板 `#growth-stats-panel`（稳定 DOM、低打扰、可 i18n）
- 面板仅展示来自 `chrome.storage.local` 的 `copilot_growth_stats`，且字段严格限制为时间戳/计数/枚举：
  - `installedAt/successfulCopyCount/ratingPromptShownAt/ratingPromptAction/ratingPromptActionAt`
- 操作均为用户点击触发，且不新增权限/不新增三方依赖/不新增联网请求与 telemetry 噪音：
  - `#growth-stats-refresh` 重新读取并渲染 pretty JSON（可审计）
  - `#growth-stats-copy` 一键复制可解析 JSON 到剪贴板（失败自动降级，不影响其它功能）
  - `#growth-stats-reset` 一键重置为默认结构（`installedAt=now`、`successfulCopyCount=0`，清空 ratingPrompt*），并立即刷新展示

## 修改范围（目录/文件）
- `src/options/options.html`
- `src/options/options.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `docs/test-cases/v1-14.md`
- `docs/reports/v1-14-report.md`
- `prds/v1-14-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
