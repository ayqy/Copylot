# V1-51 Pro 意向数据资产化 v2：7d 明细 CSV 导出 + 证据落盘规范固化 简报

## 状态
- 已完成：子 PRD `prds/v1-51.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> 隐私与可观测性 -> Pro 区域新增「导出过去 7 天 Pro 意向明细（CSV）」入口（稳定 DOM：`#export-pro-intent-events-7d-csv`）
  - 匿名开关 ON：可下载 UTF-8（无 BOM）CSV 明细，字段固定：`exportedAt/extensionVersion/windowFrom/windowTo/lookbackDays/eventTs/eventLocalTime/eventName/source`
  - 匿名开关 OFF：入口置灰，不读取/不推断本地 events，不导出事件明细
  - 口径可互证：CSV 聚合计数可与 v1-50 weekly digest overall/bySource 一致；关键转化率可由 CSV 在表格中复算
  - 用例/证据/简报/roadmap 进度均已落盘

## 交付效果（收入第一：把“意向漏斗”沉淀为可计算的数据资产）

1) 7d 明细 CSV 可导出（可审计、可复核）
- 支持导出过去 7 天明细行数据，可用于趋势/渠道/source 对比与漏斗复算
- 严格隐私：仅事件名/时间戳/来源 + 环境信息，不包含网页内容/复制内容/URL/标题；不新增网络请求

2) 与 v1-50 weekly digest 形成闭环互证
- weekly digest 提供“可复制摘要”；CSV 提供“可计算明细”
- 两者口径一致（同白名单、同 source 过滤、同 7d window、同 FIFO 上限），便于周度复盘/对外同步

3) 证据落盘规范固化
- `docs/evidence/v1-51/index.md` 固化截图索引、样例 CSV、归档规范与最小复盘口径（可直接用于周度商业化复盘）

## 测试/用例/证据
- 用例文档：`docs/test-cases/v1-51.md`
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-20 PASS）
- 证据索引：`docs/evidence/v1-51/index.md`

## 修改范围（目录/文件）
- `manifest.json`
- `src/options/options.html`
- `src/options/options.ts`
- `src/shared/pro-intent-events-csv.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-51.md`
- `docs/evidence/v1-51/`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-20.md`
- `docs/reports/v1-51-report.md`

