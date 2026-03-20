# V1-46 Pro 候补提示（低打扰）+ 漏斗取证补齐（曝光 -> 行动）简报

## 状态
- 已完成：子 PRD `prds/v1-46.md` 全部“具体任务”落地并满足验收标准
  - Popup 内新增「Pro 候补提示」（一次性、低打扰、可永久关闭/可延迟再提示）
  - 新增匿名事件并纳入 Pro 意向漏斗摘要/证据包导出：`pro_prompt_shown` / `pro_prompt_action`
  - 新增测试用例文档：`docs/test-cases/v1-46.md`
  - 新增证据目录与索引：`docs/evidence/v1-46/` + `docs/evidence/v1-46/index.md`
  - 商业化进度落盘：已更新 `docs/roadmap_status.md`（勾选 v1-46 里程碑 + 刷新当前进度/Top3/阻塞）
- 仍存在的外部阻塞（需人类输入）：真实 CWS 发布/商店端取证仍受网络可达性（代理/VPN）影响（见 `docs/roadmap_status.md` 与 `docs/growth/blocked.md`）

## 交付效果（收入第一：把 Pro 候补 CTA 变成可量化漏斗）

1) Popup 内 Pro 候补提示（低打扰）
- 仅对高意图用户展示（安装时长 + 成功复制次数 + Prompt 使用/重度复制兜底）
- 展示不遮挡主流程：在 Popup 内页面流展示，可折叠；包含 `加入候补名单/稍后/不再提示`
- 状态持久化且可审计：通过本地 growth stats 记录 shown/action/snooze，保证最多提示 1 次或按延迟策略再提示；选择 `不再提示` 后永久不再出现

2) 漏斗取证补齐（曝光 -> 行动）
- 新增本地匿名事件（仅在“匿名使用数据”开关开启后记录；默认关闭不记录）：
  - `pro_prompt_shown`（`props.source=popup`）
  - `pro_prompt_action`（`props.source=popup`，`action=join|later|never`）
- Pro 意向漏斗摘要/证据包已纳入上述事件与转化率口径（Options -> 隐私页可导出）：
  - `entry_opened_per_prompt_shown`
  - `waitlist_opened_per_prompt_shown`
- 不新增任何联网上报；事件仅本地可导出、可审计

3) 测试/证据/文档闭环
- 用例：`docs/test-cases/v1-46.md` 覆盖触发门槛、展示次数上限/延迟策略、按钮行为、开关 OFF/ON 的埋点与导出差异，并写入一次回归 PASS 记录
- 证据：`docs/evidence/v1-46/index.md` 包含截图索引、导出文件清单、命名规范与 v1-42/v1-44 基线对比口径
- 埋点清单更新：`docs/growth/telemetry-events.md` 增补 `pro_prompt_*`

## 修改范围（目录/文件）
- `src/popup/popup.html`
- `src/popup/popup.ts`
- `src/popup/popup.css`
- `src/shared/growth-stats.ts`
- `src/shared/telemetry.ts`
- `src/shared/pro-funnel.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `manifest.json`
- `docs/growth/telemetry-events.md`
- `docs/test-cases/v1-46.md`
- `docs/evidence/v1-46/`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-20.md`
- `docs/reports/v1-46-report.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 最近执行日期：2026-03-20
- 结论：PASS

