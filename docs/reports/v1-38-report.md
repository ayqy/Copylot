# V1-38 Pro 转化漏斗取证包：本地摘要 + 一键导出证据包 + 用例/断言闭环 简报

## 状态
- 已完成：子 PRD `prds/v1-38.md` 全部“具体任务”落地并通过回归
  - Options -> 隐私与可观测性新增「Pro 意向漏斗摘要」面板（仅本地、可刷新/复制 JSON）
  - 一键导出「商业化证据包（Pro Funnel Evidence Pack）」：复制即得（字段白名单、无敏感信息）
  - 自动化断言补齐（证据包字段白名单、`pro_*` props.source 枚举收敛、匿名开关关闭时导出为空）
  - 已新增并填写 `docs/test-cases/v1-38.md`，并记录一次 `bash scripts/test.sh` PASS

## 交付效果（可量化 / 可审计 / 可复盘）
1) Pro 意向漏斗“本地摘要”
- 数据源：仅本地匿名事件日志 `copilot_telemetry_events`（最多 100 条，FIFO；仅基于当前窗口）
- 口径：按 `props.source=popup|options` 分别汇总：
  - `pro_entry_opened` / `pro_waitlist_opened` / `pro_waitlist_copied` 的次数与最近一次时间戳（`lastTs`）
  - 派生转化率：`waitlist_opened / entry_opened`、`waitlist_copied / waitlist_opened`（仅展示/导出，不落盘）
- 隐私：不包含 URL/标题/网页内容/复制内容；仅使用事件白名单字段（name/ts/props.source）

2) 商业化证据包（Pro Funnel Evidence Pack）
- 导出字段（顶层严格包含）：`meta/settings/proFunnel/events`
- `meta`：导出时间（ms）、扩展版本号（`manifest.json`）、导出来源（`options`）
- `settings`：白名单设置快照（当前仅 `isAnonymousUsageDataEnabled`）
- `events`：仅 `pro_*` 事件 + 再次 `sanitizeTelemetryEvents`（props 白名单与枚举收敛）

3) 匿名开关关闭时的“不可误判”行为
- 关闭匿名使用数据后：事件不再记录且本地日志被清空
- 摘要面板明确显示“未开启，不记录/不导出”，证据包 `events=[]`（无补发/不回填）

## 示例证据片段（脱敏，可粘贴留档）
（示例结构；实际以导出内容为准）
```json
{
  "meta": {
    "exportedAt": 1700000000000,
    "extensionVersion": "1.1.20",
    "source": "options"
  },
  "settings": {
    "isAnonymousUsageDataEnabled": true
  },
  "proFunnel": {
    "enabled": true,
    "window": { "maxEvents": 100, "policy": "fifo", "scope": "current_window_only" },
    "bySource": {
      "popup": {
        "counts": { "pro_entry_opened": 1, "pro_waitlist_opened": 1, "pro_waitlist_copied": 1 },
        "lastTs": { "pro_entry_opened": 1700000000100, "pro_waitlist_opened": 1700000000200, "pro_waitlist_copied": 1700000000300 },
        "rates": { "waitlist_opened_per_entry_opened": 1, "waitlist_copied_per_waitlist_opened": 1 }
      },
      "options": {
        "counts": { "pro_entry_opened": 1, "pro_waitlist_opened": 0, "pro_waitlist_copied": 0 },
        "lastTs": { "pro_entry_opened": 1700000000400, "pro_waitlist_opened": null, "pro_waitlist_copied": null },
        "rates": { "waitlist_opened_per_entry_opened": 0, "waitlist_copied_per_waitlist_opened": null }
      }
    }
  },
  "events": [
    { "name": "pro_entry_opened", "ts": 1700000000100, "props": { "source": "popup" } },
    { "name": "pro_waitlist_opened", "ts": 1700000000200, "props": { "source": "popup" } }
  ]
}
```

## 修改范围（目录/文件）
- `manifest.json`
- `src/shared/pro-funnel.ts`
- `src/options/options.html`
- `src/options/options.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/roadmap_status.md`
- `docs/test-cases/v1-38.md`
- `docs/reports/v1-38-report.md`
- `prds/v1-38-1.md`
- `prds/v1-38-2.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 最近执行日期：2026-03-20
- 结论：PASS
