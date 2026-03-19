# V1-13 设置页口碑入口补齐（分享/评价/反馈）简报

## 状态
- 已完成：子 PRD `prds/v1-13.md` 全部“具体任务”落地（Options WOM 区块/UTM 可审计/模板化反馈/本地匿名事件/用例文档/简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- Options -> Pro Tab（`#pro-tab`）新增“口碑与支持”区块 `#wom-actions-panel`，提供 4 个稳定入口（均为用户点击触发）：
  - `#wom-share-open` 打开商店详情页（固定 UTM：`utm_source=copylot-ext&utm_medium=options-entry&utm_campaign=v1-13`）
  - `#wom-share-copy` 一键复制分享文案（仅用户点击后写入剪贴板；失败提示且不影响其它功能）
  - `#wom-rate-open` 打开商店 reviews 页面
  - `#wom-feedback-open` 打开 GitHub `issues/new`（title/body 预填；body 仅含环境信息 + settings 快照 + 复现模板）
- 本地匿名事件：开关开启时记录 `wom_*`；关闭时不记录、不缓存、不补发（复用 `recordTelemetryEvent` 既有逻辑）
- 可审计：同步更新 `docs/growth/telemetry-events.md`，补齐 Options 侧触发位置说明

## 修改范围（目录/文件）
- `src/options/options.html`
- `src/options/options.css`
- `src/options/options.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `docs/growth/telemetry-events.md`
- `docs/worklog/2026-03-19.md`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-13.md`
- `docs/reports/v1-13-report.md`
- `prds/v1-13-1.md`
- `prds/v1-13-2.md`
- `prds/v1-13-3.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
