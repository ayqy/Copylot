# V1-58 渠道分发/投放效率复盘一键化：按 campaign 合并导出 leads + distCopies + leads_per_dist_copy（7d） 简报

## 状态
- 已完成：子 PRD `prds/v1-58.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> 隐私与可观测性 -> Pro 面板新增合并导出入口（稳定 DOM）：`#export-pro-acquisition-efficiency-by-campaign-7d-csv`
  - 匿名使用数据 OFF：入口置灰且不读取/不推断本地 events；匿名使用数据 ON：可成功导出过去 7 天合并 CSV
  - 口径复用且可互证：
    - `leads = pro_waitlist_copied + pro_waitlist_survey_copied`（复用 v1-54）
    - `distCopies` 为 `pro_distribution_asset_copied` 按 action 求和（复用 v1-57）
    - `leadsPerDistCopy = leads / distCopies`（`distCopies=0` 输出 `N/A`，小数固定 4 位）
  - 证据落盘：`docs/evidence/v1-58/index.md` + 样例 CSV（含至少 2 个 campaign + 空桶行）+ 截图索引 + 互证步骤
  - 用例落盘：`docs/test-cases/v1-58.md`（含回归记录）

## 交付效果（收入第一：效率复盘从“两张表手工对齐”升级为“一键导出可审计资产”）
- 一键复盘：直接导出按 campaign 合并的 7d 获客效率指标（leads/distCopies/leadsPerDistCopy）
- 可审计可复核：任意 campaign 行可用 v1-54/v1-57 两份导出按公式复算一致；分母为 0 明确输出 `N/A`
- 隐私合规：不新增权限；不联网发送数据；不采集用户复制内容；仅基于本地匿名事件日志派生（字段白名单）

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `src/shared/pro-acquisition-efficiency-by-campaign-csv.ts`
- `src/options/options.html`
- `src/options/options.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-58.md`
- `docs/evidence/v1-58/`
- `docs/roadmap_status.md`
- `docs/reports/v1-58-report.md`

