# V1-61 渠道获客效率证据包落盘再降摩擦：新增「下载证据包（JSON）」入口简报

## 状态
- 已完成：子 PRD `prds/v1-61.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> 隐私与可观测性 -> Pro 面板新增入口（稳定 DOM）：`#download-pro-acquisition-efficiency-by-campaign-evidence-pack`
  - 下载内容与 v1-60 复制输出同口径同 schema：复用 `buildProAcquisitionEfficiencyByCampaignEvidencePackForClipboard()` + `formatProAcquisitionEfficiencyByCampaignEvidencePackAsJson(...)`，可互证复算一致
  - 匿名使用数据 OFF：允许下载 evidence pack，但不读取/不推断本地事件；下载文件包含明确 OFF 提示 + Env（window/版本/时间戳）+ 空资产占位
  - 匿名使用数据 ON：下载完整 evidence pack JSON，内含：
    - v1-58 同口径 7d CSV（按 campaign）
    - v1-59 同口径周报 Markdown（按 campaign）
    - 结构化 `rows`（可与 CSV/Markdown 表格互证复算一致；`distCopies=0 -> N/A`；小数固定 4 位）
    - Env：`extensionVersion/exportedAt/lookbackDays/windowFrom/windowTo/isAnonymousUsageDataEnabled`
  - 文件命名稳定可归档（可单测）：`copylot-pro-acq-eff-by-campaign-evidence-pack-YYYY-MM-DD.off.json` / `copylot-pro-acq-eff-by-campaign-evidence-pack-YYYY-MM-DD.on.json`
  - 证据落盘：`docs/evidence/v1-61/index.md` + OFF/ON 下载样例 JSON + 截图索引 + 互证步骤
  - 用例落盘：`docs/test-cases/v1-61.md`（含回归记录）

## 交付效果（收入第一：从“复制”升级为“可落盘文件”，每周复盘证据沉淀摩擦再下降）
- “每周渠道跑数后取证/归档”从依赖剪贴板升级为一键下载文件：可直接按周落盘、可 diff、可审计、可复核
- 同口径互证：下载文件内容与 v1-60 复制输出一致；并可与 v1-58/v1-59 互证复算一致（同一 window）
- 隐私合规：不新增权限；不联网发送数据；不采集用户复制内容；匿名 OFF 不读取/不推断事件；匿名 ON 仅基于本地匿名事件日志派生（字段白名单）

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `src/options/options.html`
- `src/options/options.ts`
- `src/shared/pro-acquisition-efficiency-by-campaign-evidence-pack-filename.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-61.md`
- `docs/evidence/v1-61/`
- `docs/roadmap_status.md`
- `docs/reports/v1-61-report.md`

