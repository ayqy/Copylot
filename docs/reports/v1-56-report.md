# V1-56 渠道周报一键生成：按 campaign 的本周复盘摘要（Markdown）+ 证据落盘 简报

## 状态
- 已完成：子 PRD `prds/v1-56.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> 隐私与可观测性 -> Pro 意向漏斗摘要面板新增入口「按 campaign 的本周复盘摘要（Markdown）」一键复制（稳定 DOM：`#copy-pro-intent-by-campaign-weekly-report`）
  - 匿名使用数据 OFF：输出明确提示“匿名使用数据关闭（无可用事件）”，仅包含环境信息 + 隐私声明（不包含任何事件计数/表格）
  - 匿名使用数据 ON：输出 Markdown，包含 7d window、按 campaign 汇总表（含 `空 campaign` 行）、`leads` 与 `leads_per_entry_opened` 等指标 + 模板结论区，可直接粘贴到 Notion/飞书/文档复盘
  - 证据落盘：`docs/evidence/v1-56/index.md` 含 OFF/ON 两份周报样例 + 截图索引，并说明与 v1-51/v1-54 的互证口径
  - 测试与用例：新增 `docs/test-cases/v1-56.md`，并要求 `bash scripts/test.sh` 全量通过

## 交付效果（收入第一：周复盘从“手工复算”升级为“可粘贴、可审计、可复核”的资产）
- 复盘资产化：一键复制 Markdown 周报，减少 CSV 手工计算与复盘成本
- 可审计可复核：周报仅包含计数/时间窗/环境信息；并明确与 v1-51（明细）/v1-54（聚合）互证路径
- 隐私合规：不新增权限；不联网发送数据；不采集用户复制内容；不包含 URL/标题/网页内容/复制内容

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `manifest.json`
- `plugin-1.1.28.zip`
- `src/options/options.html`
- `src/options/options.ts`
- `src/shared/pro-intent-by-campaign-weekly-report.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-56.md`
- `docs/evidence/v1-56/`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-21.md`
- `docs/reports/v1-56-report.md`
