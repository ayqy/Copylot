# V1-57 渠道分发工具包升级：商店安装链接/完整投放包一键复制 + 分发动作取证导出 简报

## 状态
- 已完成：子 PRD `prds/v1-57.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> Pro 的“渠道分发工具包”新增 2 个一键复制入口（稳定 DOM）：
    - `#pro-store-url-copy`：复制商店安装链接（Chrome Web Store detail URL，带 `utm_source/utm_medium/utm_campaign`，且 `utm_campaign` 与输入 campaign 一致）
    - `#pro-distribution-pack-copy`：复制完整投放包（Markdown，包含商店安装链接 + 候补链接 + 招募文案 + 可选问卷引导）
  - 强制 campaign 规则（仅对分发工具包生效）：campaign 为空/非法时，4 个按钮全部置灰并显示 `#pro-waitlist-distribution-campaign-required`
  - 分发动作取证：
    - 新增匿名本地事件 `pro_distribution_asset_copied`（仅匿名开关 ON 且写入剪贴板成功后记录；props 白名单 + 枚举校验）
    - 新增 7d 按 campaign 聚合 CSV 导出入口（稳定 DOM：`#export-pro-distribution-by-campaign-7d-csv`；匿名 OFF 置灰且不读取 events）
  - 证据落盘：`docs/evidence/v1-57/index.md`（含商店链接样例/投放包样例/分发聚合 CSV 样例/截图索引与复盘口径）
  - 用例与回归：新增 `docs/test-cases/v1-57.md`，并要求 `bash scripts/test.sh` 全量通过

## 交付效果（收入第一：分发从“能复制”升级为“可获客 + 可取证 + 可复盘”）
- 可直接获客：商店安装链接可直接投放（UTM + campaign 可解码复核）
- 可审计取证：分发动作以匿名本地事件记录（只记录 `name/ts/props` 白名单，不包含网页/复制内容）
- 可量化复盘：7d 按 campaign 聚合导出 CSV，可与 v1-54 的 `leads` 按 campaign 对齐复算 `leads_per_dist_copy`
- 隐私合规：不新增权限；不联网发送数据；不采集用户复制内容；复制模板不拼入网页内容/URL/标题

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `src/options/options.html`
- `src/options/options.ts`
- `src/shared/pro-waitlist-distribution.ts`
- `src/shared/telemetry.ts`
- `src/shared/pro-distribution-by-campaign-csv.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/growth/telemetry-events.md`
- `docs/test-cases/v1-57.md`
- `docs/evidence/v1-57/`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-21.md`
- `docs/reports/v1-57-report.md`
