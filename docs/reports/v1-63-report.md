# V1-63 渠道跑数/复盘证据包再降摩擦：一键下载「周度渠道复盘证据包（JSON）」简报

## 状态
- 已完成：子 PRD `prds/v1-63.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> 隐私与可观测性 -> Pro 面板新增稳定入口：`#download-pro-weekly-channel-ops-evidence-pack`
  - 匿名 OFF：允许下载，但不读取/不推断本地 events；证据包包含明确 OFF 提示 + Env + 空资产占位
  - 匿名 ON：基于本地匿名事件生成单文件证据包（JSON），内含互证资产：
    - v1-61 同口径获客效率 evidence pack（CSV + 周报 Markdown + rows + Env）
    - v1-57 同口径分发动作按 campaign 聚合 7d CSV
    - v1-51 同口径 Pro 意向明细 7d CSV
    - `assets.verifyMarkdown` 最短可执行互证说明
  - 文件名稳定可归档：`copylot-pro-weekly-channel-ops-evidence-pack-YYYY-MM-DD.{off|on}.json`

## 交付效果（收入第一：把“跑数 -> 复盘 -> 取证归档”降到单文件）
- 渠道复盘证据从“多入口、多文件、易丢证据”升级为“单文件证据包（JSON）”：可按周落盘归档、可 diff、可审计、可复核
- 互证闭环内置：证据包同时包含 rows + 两份 CSV + verifyMarkdown，支持快速复算并核对 leads/distCopies/leadsPerDistCopy 一致

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `src/shared/pro-weekly-channel-ops-evidence-pack.ts`
- `src/shared/pro-weekly-channel-ops-evidence-pack-filename.ts`
- `src/options/options.html`
- `src/options/options.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-63.md`
- `docs/evidence/v1-63/`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-21.md`
- `docs/reports/v1-63-report.md`
