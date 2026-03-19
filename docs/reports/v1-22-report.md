# V1-22 匿名本地埋点枚举值收敛：source/action 严格过滤 + 单测/用例补齐 简报

## 状态
- 已完成：子 PRD `prds/v1-22.md` 全部“具体任务”落地（sanitize 枚举值域收敛、调用方值域校验、单测、用例文档、简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 本地匿名埋点枚举值域收敛（不新增事件名、不新增权限、不新增任何联网发送）：
  - `source` 严格过滤：
    - `pro_entry_opened` / `pro_waitlist_opened`：仅允许 `'popup' | 'options'`
    - `pro_waitlist_copied`：仅允许 `'options'`
    - `onboarding_shown` / `onboarding_completed`：仅允许 `'auto' | 'manual'`
    - `wom_*`：保持既有 `'popup' | 'options'` 校验逻辑不变
  - `action` 严格过滤：
    - `onboarding_completed`：仅允许 `'finish' | 'skip'`
    - `rating_prompt_action`：仅允许 `'rate' | 'later' | 'never'`
  - 非法值在 `sanitizeTelemetryEvent` 中丢弃：事件保留，但 `props` 可能变为 `undefined`
  - 旧数据（无 props）保持兼容，可正常 sanitize/展示/导出
- 调用方防误用：
  - Popup/Options 相关 `recordTelemetryEvent(...)` 入参均为固定枚举值（无动态字符串拼接，避免误写入 URL/标题/页面内容等潜在敏感信息）
- 开关行为保持不变：
  - “匿名使用数据”关闭时：不记录（不发送、不缓存、不补发）；关闭即清空逻辑保持不变

## 修改范围（目录/文件）
- `src/shared/telemetry.ts`
- `scripts/unit-tests.ts`
- `docs/growth/telemetry-events.md`
- `docs/test-cases/v1-22.md`
- `docs/reports/v1-22-report.md`
- `prds/v1-22-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

