# V1-19 本地漏斗摘要面板：3 分钟激活与漏斗进度自检 简报

## 状态
- 已完成：子 PRD `prds/v1-19.md` 全部“具体任务”落地（漏斗摘要纯函数、Options 隐私页新增面板、i18n、单测、用例文档、简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 新增纯函数漏斗摘要（不写回存储、可单测、隐私合规）：
  - `src/shared/growth-stats.ts` 新增 `GrowthFunnelSummary` + `buildGrowthFunnelSummary(stats, now)`
  - 摘要仅包含时间戳/计数/布尔/毫秒耗时字段；不包含网页内容、URL、标题、复制内容
- “3 分钟激活”指标可审计且规则固定：
  - 当 `firstPopupOpenedAt` 与 `firstSuccessfulCopyAt` 均存在时，输出：
    - `timeFromFirstPopupToFirstCopyMs`
    - `activatedWithin3MinutesFromFirstPopup`（阈值 `3 * 60 * 1000`，含等于）
  - 缺失任一时间戳时，上述字段为 `undefined` 且不报错
- Options -> 隐私与可观测性 新增“本地漏斗摘要”面板（稳定 DOM + i18n）：
  - `#growth-funnel-panel`：折叠面板
  - `#growth-funnel-refresh`：刷新
  - `#growth-funnel-copy`：复制导出（复制规范化后的摘要 JSON；失败走 fallback copy）
  - `#growth-funnel-view`：只读展示区（pretty JSON，末尾追加换行）
  - 面板操作不写入任何 telemetry 事件；失败不阻断其它功能（`console.warn` + toast）

## 修改范围（目录/文件）
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `src/shared/growth-stats.ts`
- `src/options/options.html`
- `src/options/options.ts`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-19.md`
- `docs/reports/v1-19-report.md`
- `prds/v1-19-1.md`
- `docs/worklog/2026-03-19.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
