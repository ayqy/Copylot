# V1-65 真实渠道跑数持续化：周度证据归档规范 + 趋势索引（可审计）

- 证据目录：`docs/evidence/v1-65/`
- 生成脚本：`scripts/build-weekly-channel-ops-trend.ts`
- 互证断言口径：`scripts/verify-weekly-channel-ops-evidence-pack.ts`
- 约束：仅使用证据包内聚合 `rows` + `env`（以及互证所需的两份 CSV）；不得读取/推断 URL/标题/网页内容/复制内容。

## 趋势表（按 weekEndDate 升序）

| weekEndDate | distCopies | leads | leadsPerDistCopy | campaignsCount | nonEmptyCampaignsCount | verify |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-03-21 | 4 | 4 | 1.0000 | 4 | 3 | PASS |

## 2026-03-21

- 生成时间：2026-03-21T10:00:00+08:00
- 扩展版本号：`1.1.28`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip` 解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 导出窗口（7d）：2026-03-14T10:00:00+08:00 ~ 2026-03-21T10:00:00+08:00
- 本周 campaign（可公开测试标识）：`cpc_test_b` / `空 campaign` / `cpc_test_a` / `cpc_control`
- 证据包文件：`copylot-pro-weekly-channel-ops-evidence-pack-2026-03-21.on.json`

### Baseline（按 campaign）

| campaign | distCopies | leads | leadsPerDistCopy |
| --- | --- | --- | --- |
| cpc_test_b | 1 | 1 | 1.0000 |
| 空 campaign | 1 | 1 | 1.0000 |
| cpc_test_a | 2 | 1 | 0.5000 |
| cpc_control | 0 | 1 | N/A |

### 与上一周对比 delta（总计）

- distCopies：N/A
- leads：N/A
- leadsPerDistCopy：N/A

### 互证复核结论（rows <-> 两份 CSV）

- 结论：PASS（断言口径见 `scripts/verify-weekly-channel-ops-evidence-pack.ts`）

### 截图索引（入口位置 + 文件下载落地）

1. `screenshots/01-privacy-pro-weekly-channel-ops-evidence-pack-download-entry-2026-03-21.png`
   - 断言：Options -> 隐私与可观测性 -> Pro 面板存在稳定入口 `#download-pro-weekly-channel-ops-evidence-pack`。
2. `screenshots/02-privacy-pro-weekly-channel-ops-evidence-pack-on-downloaded-2026-03-21.png`
   - 断言：下载落地成功，文件名可见 `copylot-pro-weekly-channel-ops-evidence-pack-2026-03-21.on.json`。

---

输出文件：
- `docs/evidence/v1-65/index.md`
- `docs/evidence/v1-65/trend.csv`

