# V1-42 转化入口跑数基线：zip 安装回归 + Pro 意向漏斗证据落盘（不依赖外网）简报

## 状态
- 已完成：子 PRD `prds/v1-42.md` 要求的“可量化/可审计/可对比”基线交付物落盘
  - 基线证据目录：`docs/evidence/v1-42/`（含摘要/证据包/截图索引）
  - 用例文档：`docs/test-cases/v1-42.md`
  - 商业化进度落盘：更新 `docs/roadmap_status.md`（将「转化入口跑数基线（v1-42）」标记为已完成，并刷新 Top3/阻塞区）
- 扩展版本号：`1.1.20`（见 `manifest.json`）
- 验收安装方式（强制）：使用仓库内最新 `plugin-*.zip`（本次为 `plugin-1.1.20.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）

## 交付效果（收入优先：意向 -> 可量化漏斗 -> 可复盘证据）
1) 转化入口可用（Popup / Options）
- Popup：升级 Pro / 加入候补名单 / 复制候补文案 入口存在；复制按钮走 `navigator.clipboard.writeText(...)`，并记录 `pro_waitlist_copied`（`props.source=popup`）。
- Options：Pro Tab 打开会记录 `pro_entry_opened`（`props.source=options`）；候补入口与复制入口可用；“了解范围（pro-scope）”文档入口存在。

2) 可导出、可审计的商业化证据（隐私页）
- 导出对象：
  - 「Pro 意向漏斗摘要」：`docs/evidence/v1-42/pro-funnel-summary.json`
  - 「证据包（Pro Funnel Evidence Pack）」：`docs/evidence/v1-42/pro-funnel-evidence-pack.json`
- 关键保证（隐私合规）：
  - 仅本地事件白名单字段（name/ts/props.source），不包含 URL/标题/网页内容/用户复制内容
  - 匿名使用数据开关关闭时：不记录、不导出、不补发（落盘文件见 `*-telemetry-off.json`）

3) 基线对比口径（按 source 拆分计数/转化率）
本次基线（见 `docs/evidence/v1-42/pro-funnel-summary.json` 与 `docs/evidence/v1-42/index.md`）：

| source | entry_opened | waitlist_opened | waitlist_copied | opened/entry | copied/opened |
| --- | --- | --- | --- | --- | --- |
| popup | 1 | 1 | 1 | 1 | 1 |
| options | 1 | 1 | 1 | 1 | 1 |

## 关键证据索引（截图 + JSON）
- 证据索引入口：`docs/evidence/v1-42/index.md`
- 证据资产清单：`docs/evidence/v1-42/`（摘要/证据包/关闭态导出/截图）
- 关键截图文件名（对应断言见 `docs/evidence/v1-42/index.md`）：
  - `docs/evidence/v1-42/screenshots/01-popup-pro-entry.png`
  - `docs/evidence/v1-42/screenshots/02-popup-waitlist-copy.png`
  - `docs/evidence/v1-42/screenshots/03-options-pro-tab.png`
  - `docs/evidence/v1-42/screenshots/04-privacy-telemetry-off.png`
  - `docs/evidence/v1-42/screenshots/05-privacy-telemetry-on.png`

## 修改范围（目录/文件）
- `docs/evidence/v1-42/`
- `docs/test-cases/v1-42.md`
- `docs/reports/v1-42-report.md`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-20.md`
- `scripts/unit-tests.ts`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 最近执行日期：2026-03-20
- 结论：PASS
