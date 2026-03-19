# V1-16 反馈入口增强：Issue 模板自动附带本地诊断信息（Settings + GrowthStats + TelemetryEvents）简报

## 状态
- 已完成：子 PRD `prds/v1-16.md` 全部“具体任务”落地（Shared 模板扩展 + Popup/Options 接入 + i18n + 单测 + 用例文档 + 简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- Popup `#feedback-link` 与 Options `#wom-feedback-open` 打开 GitHub `issues/new` 时，body 自动预填 4 块可审计信息：
  - 环境信息（版本/扩展 ID/UA/language 等）
  - `copilot_settings`：仅标量字段快照（补齐匿名使用数据开关、onboarding 版本、默认 Chat 服务等；不含任何网页/复制内容/用户输入文本）
  - `copilot_growth_stats`：本地增长统计规范化结果
  - `copilot_telemetry_events`：最近最多 20 条匿名事件（按 `ts` 倒序，仅 `name/ts/props(白名单)`；URL 过长时仅截断该段落）
- 关闭“匿名使用数据”开关时：`copilot_telemetry_events` 强制为空数组 `[]`，且读取失败不会影响打开反馈页面

## 修改范围（目录/文件）
- `src/shared/word-of-mouth.ts`
- `src/popup/popup.ts`
- `src/options/options.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-16.md`
- `docs/reports/v1-16-report.md`
- `prds/v1-16-1.md`
- `docs/worklog/2026-03-19.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

