# V1-60 渠道获客效率取证再降摩擦：一键复制“获客效率证据包”（JSON，含 CSV + Markdown + Env）简报

## 状态
- 已完成：子 PRD `prds/v1-60.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> 隐私与可观测性 -> Pro 面板新增入口（稳定 DOM）：`#copy-pro-acquisition-efficiency-by-campaign-evidence-pack`
  - 匿名使用数据 OFF：允许复制 evidence pack JSON，但不读取/不推断本地事件；JSON 包含明确 OFF 提示 + Env（window/版本/时间戳）+ 空资产占位
  - 匿名使用数据 ON：复制完整 evidence pack JSON，内含：
    - v1-58 同口径 7d CSV（按 campaign）
    - v1-59 同口径周报 Markdown（按 campaign）
    - 结构化 `rows`（可与 CSV/Markdown 表格互证复算一致；`distCopies=0 -> N/A`；小数固定 4 位）
    - Env：`extensionVersion/exportedAt/lookbackDays/windowFrom/windowTo/isAnonymousUsageDataEnabled`
  - 证据落盘：`docs/evidence/v1-60/index.md` + OFF/ON 样例 JSON + 截图索引 + 互证步骤
  - 用例落盘：`docs/test-cases/v1-60.md`（含回归记录）

## 交付效果（收入第一：证据资产“一键打包可落盘”，复盘/审计摩擦再下降）
- 从“零散导出 CSV/Markdown”升级为“一键复制证据包 JSON”，可直接粘贴/落盘归档（支持 diff 与审计）
- 可审计可复核：同一 window 下 `rows` 可与内含 CSV / Markdown 表格互证复算一致；并可与 v1-58/v1-59 出口互证
- 隐私合规：不新增权限；不联网发送数据；不采集用户复制内容；匿名 OFF 不读取/不推断事件；匿名 ON 仅基于本地匿名事件日志派生（字段白名单）

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `src/shared/pro-acquisition-efficiency-by-campaign-evidence-pack.ts`
- `src/options/options.html`
- `src/options/options.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-60.md`
- `docs/evidence/v1-60/`
- `docs/roadmap_status.md`
- `docs/reports/v1-60-report.md`

