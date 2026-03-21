# V1-64 商业化证据索引（真实渠道跑数基线落盘：用 v1-63 周度证据包完成 1 轮可审计复盘）

- 生成时间：2026-03-21T10:00:00+08:00
- 扩展版本号：`1.1.28`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip` 解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 导出窗口（7d）：2026-03-14T10:00:00+08:00 ~ 2026-03-21T10:00:00+08:00
- 本次跑数 campaign（可公开测试标识）：`cpc_test_a` / `cpc_test_b` / `cpc_control` / `空 campaign`
- 证据目录：`docs/evidence/v1-64/`（可被 git 审计；不依赖外网）

## 样例证据包（必须落盘，脱敏、可审计、可复核）

- `copylot-pro-weekly-channel-ops-evidence-pack-2026-03-21.on.json`：匿名 ON（含 2 个非空 campaign + `空 campaign` 行；含 `distCopies=0` 对照行；含互证资产）

## Baseline（按 campaign）

从 `.on.json` 的 `assets.acquisitionEfficiencyEvidencePack.rows` 提取（只包含聚合指标，不含 URL/标题/网页内容/复制内容）。

| campaign | distCopies | leads | leadsPerDistCopy |
| --- | --- | --- | --- |
| cpc_test_b | 1 | 1 | 1.0000 |
| 空 campaign | 1 | 1 | 1.0000 |
| cpc_test_a | 2 | 1 | 0.5000 |
| cpc_control | 0 | 1 | N/A |

说明：
- `distCopies=0` 的对照行用于验证 `leadsPerDistCopy=N/A` 口径，避免误读。

## 互证复核结论（rows <-> 两份 CSV）

- 结论：PASS（2026-03-21）
- 复核要点：
  - `.on.json` 可 `JSON.parse(...)`，且 `packVersion=v1-63`
  - 复算每行 `leadsPerDistCopy`：`distCopies=0 -> N/A`；否则 `(leads/distCopies).toFixed(4)`
  - `rows.distCopies` 与 `assets.proDistributionByCampaign7dCsv` 的 distCopies 汇总一致（逐 campaign 对齐）
  - `rows.leads` 与 `assets.proIntentEvents7dCsv` 中 lead 事件计数一致（`pro_waitlist_copied/pro_waitlist_survey_copied`）

## 截图索引（入口位置 + 文件下载落地）

说明：截图统一放在 `docs/evidence/v1-64/screenshots/`，文件名规范见 `docs/test-cases/v1-64.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-privacy-pro-weekly-channel-ops-evidence-pack-download-entry.png`
   - 断言：Options -> 隐私与可观测性 -> Pro 面板存在稳定入口 `#download-pro-weekly-channel-ops-evidence-pack`。
2. `screenshots/02-privacy-pro-weekly-channel-ops-evidence-pack-on-downloaded.png`
   - 断言：下载落地成功，文件名可见 `copylot-pro-weekly-channel-ops-evidence-pack-2026-03-21.on.json`。

