# V1-59 渠道分发/投放周报再降摩擦：一键复制本周获客效率复盘摘要（Markdown，按 campaign） 简报

## 状态
- 已完成：子 PRD `prds/v1-59.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> 隐私与可观测性 -> Pro 面板新增入口（稳定 DOM）：`#copy-pro-acquisition-efficiency-by-campaign-weekly-report`
  - 匿名使用数据 OFF：允许复制 Markdown，但不读取/不推断本地事件；内容包含明确 OFF 提示 + Env 区块（window/版本/时间戳）
  - 匿名使用数据 ON：复制含表格/Insights/Privacy 的周报 Markdown；表格口径与 v1-58 合并 CSV 一致、可互证复算
  - 指标口径（与 v1-58 一致）：
    - `leads = pro_waitlist_copied + pro_waitlist_survey_copied`
    - `distCopies` 为 `pro_distribution_asset_copied` 按 action 聚合求和
    - `leadsPerDistCopy = leads / distCopies`（`distCopies=0` 输出 `N/A`；小数固定 4 位）
  - 证据落盘：`docs/evidence/v1-59/index.md` + OFF/ON 样例 Markdown + 截图索引 + 与 v1-58 CSV 的互证步骤
  - 用例落盘：`docs/test-cases/v1-59.md`（含回归记录）

## 交付效果（收入第一：周报资产“可复制可粘贴”，复盘/审计摩擦再下降）
- 从“下载 CSV 再加工”升级为“一键复制 Markdown 资产”，可直接粘贴到周报/复盘文档
- 可审计可复核：同一 window 下可与 v1-58 合并 CSV 逐行对齐复算一致（分母为 0 明确 `N/A`）
- 隐私合规：不新增权限；不联网发送数据；不采集用户复制内容；匿名 OFF 不读取/不推断事件；匿名 ON 仅基于本地匿名事件派生（字段白名单）

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `src/shared/pro-acquisition-efficiency-by-campaign-weekly-report.ts`
- `src/options/options.html`
- `src/options/options.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-59.md`
- `docs/evidence/v1-59/`
- `docs/roadmap_status.md`
- `docs/reports/v1-59-report.md`

