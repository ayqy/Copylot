# V1-21 口碑入口可观测性对齐：wom_* 埋点补齐 source + 商店 UTM campaign 统一 简报

## 状态
- 已完成：子 PRD `prds/v1-21.md` 全部“具体任务”落地（埋点 allowlist + source 过滤、Popup/Options 接入、UTM 统一、单测、用例文档、简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- WOM 入口埋点可审计对齐（不新增事件名、不新增联网发送）：
  - `wom_feedback_opened` / `wom_share_opened` / `wom_share_copied` / `wom_rate_opened` 均支持 `props.source`
  - `source` 仅允许 `'popup' | 'options'`，非法值在 `sanitizeTelemetryEvent` 中被丢弃；旧数据（无 props）保持兼容
  - “匿名使用数据”开关关闭时：不记录且关闭即清空（不发送、不缓存、不补发）
- 商店详情页 UTM 可审计一致：
  - Popup：`utm_source=copylot-ext` + `utm_medium=popup-entry` + `utm_campaign=v1-21`
  - Options：`utm_source=copylot-ext` + `utm_medium=options-entry` + `utm_campaign=v1-21`
  - “复制分享文案”与“打开商店页”复用同一条 store URL（保证一致性）

## 修改范围（目录/文件）
- `src/shared/telemetry.ts`
- `src/shared/word-of-mouth.ts`
- `src/popup/popup.ts`
- `src/options/options.ts`
- `scripts/unit-tests.ts`
- `docs/growth/telemetry-events.md`
- `docs/test-cases/v1-21.md`
- `docs/reports/v1-21-report.md`
- `prds/v1-21-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

