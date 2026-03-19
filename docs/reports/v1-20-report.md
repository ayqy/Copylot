# V1-20 反馈模板补齐漏斗摘要：Issue 模板附带 GrowthFunnelSummary 简报

## 状态
- 已完成：子 PRD `prds/v1-20.md` 全部“具体任务”落地（反馈模板扩展、Popup/Options 接入、i18n、单测、用例文档、简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 反馈 Issue 模板新增第 5 块本地诊断信息：`copilot_growth_funnel_summary`
  - 内容为 pretty JSON code block，包含“首次打开 Popup 后 3 分钟内首次成功复制”相关派生字段
- 严格隐私合规且可审计：
  - 漏斗摘要仅输出白名单字段且仅允许 number/boolean 标量（时间戳/计数/布尔/毫秒耗时）
  - 不包含网页内容、URL、标题、复制内容；不新增权限、不新增依赖、不新增联网发送
  - 不新增任何 storage 写入：仅用于构造 GitHub `issues/new` 的 URL query
- URL 长度约束保持保守：
  - 超长时仅继续截断 `copilot_telemetry_events`（漏斗摘要/设置/增长统计不截断）
- Popup 与 Options 入口一致且不改变既有行为：
  - Popup：`#feedback-link`
  - Options：`#wom-feedback-open`
  - 任意读取/构造失败不阻断打开反馈页（`console.warn` + 兜底 `{}`）

## 修改范围（目录/文件）
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `src/shared/word-of-mouth.ts`
- `src/popup/popup.ts`
- `src/options/options.ts`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-20.md`
- `docs/reports/v1-20-report.md`
- `prds/v1-20-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

