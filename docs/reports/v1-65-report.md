# V1-65 真实渠道跑数持续化：周度证据归档规范 + 趋势索引一键生成（简报）

## 状态
- 已完成：子 PRD `prds/v1-65.md` 全部“具体任务”落盘并满足验收标准（离线可推进、可审计、可复核、可持续周度执行）
  - 周度证据归档目录：`docs/evidence/v1-65/`（含 `.on.json` + `index.md` + `trend.csv` + 截图目录）
  - 趋势索引一键生成：`scripts/build-weekly-channel-ops-trend.ts`（扫描 `copylot-pro-weekly-channel-ops-evidence-pack-*.on.json`，覆盖写入 `index.md` + 生成 `trend.csv`）
  - 门禁：`bash scripts/test.sh` 增加趋势生成与可重复性校验 + 验证 v1-65 证据包互证 PASS
  - 用例：`docs/test-cases/v1-65.md`（含一次回归记录）
  - 自动化：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 本周趋势表（7d）

来自 `docs/evidence/v1-65/trend.csv`：

| weekEndDate | distCopies | leads | leadsPerDistCopy | campaignsCount | nonEmptyCampaignsCount |
| --- | --- | --- | --- | --- | --- |
| 2026-03-21 | 4 | 4 | 1.0000 | 4 | 3 |

口头结论（用于复盘）：
- 总计 `leadsPerDistCopy=1.0000`（`distCopies=0 -> N/A` 口径不变，详见 `docs/evidence/v1-65/index.md` 的 baseline 表）。
- 互证可复核：`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/verify-weekly-channel-ops-evidence-pack.ts docs/evidence/v1-65` 输出 PASS。

## 与 v1-64 基线差异
- 数据口径：与 v1-64 保持一致（同源 `.on.json` 的 `rows/env` 口径，互证断言口径一致）。
- 工程化增量：v1-65 新增“趋势索引一键生成 + trend.csv 可外部复算”，把“手工写 index”升级为“每周可重复生成、可 git 审计”的低摩擦流程。

## 风险/偏差
- Top1「真实 CWS 发布 + 商店端取证」仍受网络可达性阻塞：需要可用代理/VPN + 商店可达（已在 `docs/roadmap_status.md` 与 `docs/growth/blocked.md` 保持不断档）。
- 本轮趋势仅包含 1 周样例数据（用于固化归档与趋势生成口径）；后续每周按同口径追加 `.on.json` 即可形成环比趋势。

## 下周要跑的 campaign 列表（仅标识，禁止敏感信息）
- `cpc_real_a`
- `cpc_real_b`
- `空 campaign`
- `cpc_control`

## 修改范围（目录/文件）
- `docs/evidence/v1-65/`
- `docs/test-cases/v1-65.md`
- `docs/reports/v1-65-report.md`
- `docs/roadmap_status.md`
- `scripts/build-weekly-channel-ops-trend.ts`
- `scripts/test.sh`
- `scripts/unit-tests.ts`

