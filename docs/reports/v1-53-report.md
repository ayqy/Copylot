# V1-53 Pro 意向渠道归因最小闭环：campaign 字段 + 可导出证据可复核 简报

## 状态
- 已完成：子 PRD `prds/v1-53.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> Pro Tab 新增可选渠道（campaign）输入项（稳定 DOM：`#pro-intent-campaign`），并提示“不要填写敏感信息”
  - “复制候补 / 打开候补 / 复制问卷”三条留资链路：campaign 非空则写入 `campaign: <value>`，为空则不写该行
  - 匿名开关 ON：`pro_entry_opened/pro_waitlist_opened/pro_waitlist_copied/pro_waitlist_survey_copied` 事件 props 增加 `campaign`（为空不写入；值严格校验/白名单过滤）
  - 隐私页 weekly digest（7d window）末尾新增 campaign 拆分计数（至少覆盖 `pro_waitlist_copied/pro_waitlist_survey_copied`），便于复算与渠道效率对比
  - 兼容性：未修改 v1-51 的 7d 明细 CSV 固定字段与既有统计口径；campaign 仅作为新增证据维度出现在 events props 与 weekly digest 附加段

## 交付效果（收入第一：让“渠道 -> 留资动作”形成可量化证据链）

1) 渠道字段可写入留资文本（可复核）
- campaign 仅来源于用户在 Options -> Pro Tab 手动输入/本地设置；不包含网页内容/复制内容/URL/标题
- 复制候补文案 / 打开候补 issue body / 复制问卷 Markdown：均可人工复核 `campaign: <value>` 行

2) 本地匿名事件可量化取证（可导出、可审计）
- 匿名使用数据 ON 时，Pro 意向相关事件 props 可复核 `campaign`
- 隐私页「Pro 意向漏斗证据包」events 明细中可看到 `props.campaign`
- weekly digest 末尾新增 campaign 拆分计数，可用于对比渠道留资效率

3) 测试/用例/证据落盘（可回归、可复用）
- 用例文档：`docs/test-cases/v1-53.md`
- 证据索引：`docs/evidence/v1-53/index.md`（含 weekly digest 示例 + 证据包样例 + 最小复盘口径）

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `manifest.json`
- `plugin-1.1.25.zip`
- `src/options/options.html`
- `src/options/options.ts`
- `src/shared/campaign.ts`
- `src/shared/telemetry.ts`
- `src/shared/monetization.ts`
- `src/shared/pro-intent-weekly-digest.ts`
- `src/shared/settings-manager.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/growth/telemetry-events.md`
- `docs/test-cases/v1-53.md`
- `docs/evidence/v1-53/`
- `docs/roadmap_status.md`
- `docs/reports/v1-53-report.md`
