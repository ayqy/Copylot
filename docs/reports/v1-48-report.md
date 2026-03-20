# V1-48 Pro 候补留资降摩擦：Options 内嵌“付费意向问卷”+ 一键复制/打开候补 + 漏斗取证增强 简报

## 状态
- 已完成：子 PRD `prds/v1-48.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可导出）
  - Options -> Pro Tab 新增「付费意向问卷（可选）」区块：用户自愿填写，不弹窗、不打扰
  - 新增一键动作：`复制问卷（含环境信息）` + `复制并打开候补`
  - 新增匿名事件：`pro_waitlist_survey_copied`（仅匿名开关 ON 才写入本地 telemetry；默认 OFF 不记录）
  - Pro Funnel 摘要/证据包：已纳入新事件字段，导出可验证 `count/lastTs`（或至少在 `events[]` 中可见）
  - 文档同步：埋点清单、用例文档、证据索引、里程碑进度均已落盘

## 交付效果（收入第一：把“付费意向/留资”变成可量化证据）

1) 降摩擦留资（Options 内闭环）
- 用户不需要先跳转/创建 Issue：可先在 Options 内填写并复制问卷 Markdown，再粘贴到 GitHub Issue/邮件/任意渠道
- 可选一键：复制完成后直接打开候补入口，减少步骤

2) 隐私与合规（不新增权限、不开启联网发送）
- 明确提示：复制内容不包含网页内容/复制内容/URL/标题；仅包含扩展环境信息 + 用户手动填写
- 问卷与联系方式均为自愿填写；不做任何自动采集/自动填充

3) 可审计商业化证据（本地匿名事件 + 可导出）
- 新事件 `pro_waitlist_survey_copied` 纳入本地 telemetry 白名单与 Pro Funnel 导出口径
- 匿名开关 OFF：不记录、不缓存、不补发；导出不包含该事件
- 匿名开关 ON：导出可验证该事件发生（summary 的 `counts/lastTs` 或 evidence pack 的 `events[]`）

## 测试/用例/证据
- 用例文档：`docs/test-cases/v1-48.md`
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-20 PASS）
- 证据索引：`docs/evidence/v1-48/index.md`
- 埋点清单更新：`docs/growth/telemetry-events.md`

## 修改范围（目录/文件）
- `src/options/options.html`
- `src/options/options.css`
- `src/options/options.ts`
- `src/shared/telemetry.ts`
- `src/shared/pro-funnel.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/growth/telemetry-events.md`
- `docs/test-cases/v1-48.md`
- `docs/evidence/v1-48/`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-20.md`
- `docs/reports/v1-48-report.md`

