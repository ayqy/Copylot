# V1-64 真实渠道跑数基线落盘：用 v1-63 周度证据包完成 1 轮可审计复盘（简报）

## 状态
- 已完成：子 PRD `prds/v1-64.md` 全部“具体任务”落盘并满足验收标准（离线可推进、可审计、可复核、可归档）
  - 证据包落盘（`.on.json`）：`docs/evidence/v1-64/copylot-pro-weekly-channel-ops-evidence-pack-2026-03-21.on.json`
  - 互证复核：按 `assets.verifyMarkdown` 复核 PASS（rows <-> 两份 CSV；`distCopies=0 -> N/A`；小数 4 位）
  - 证据索引：`docs/evidence/v1-64/index.md`（含 baseline 表 + campaign 列表 + 互证结论 + 生成时间/版本/窗口）
  - 用例：`docs/test-cases/v1-64.md`（含一次回归记录）
  - 自动化：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 本次跑数基线（7d，按 campaign）

从 `assets.acquisitionEfficiencyEvidencePack.rows` 提取：

| campaign | distCopies | leads | leadsPerDistCopy |
| --- | --- | --- | --- |
| cpc_test_b | 1 | 1 | 1.0000 |
| 空 campaign | 1 | 1 | 1.0000 |
| cpc_test_a | 2 | 1 | 0.5000 |
| cpc_control | 0 | 1 | N/A |

结论（用于口头复盘）：
- “分发 -> 留资”链路最小闭环已跑通：至少 1 个 campaign 满足 `distCopies>=1 && leads>=1`。
- 已保留 `distCopies=0` 对照行，避免把 `N/A` 误读为 0。

## 风险/偏差
- Top1「真实 CWS 发布 + 商店端取证」仍受网络可达性阻塞：需要可用代理/VPN + 商店可达（已在 `docs/roadmap_status.md` 与 `docs/growth/blocked.md` 记录）。
- 本轮跑数使用可公开测试 campaign（不含敏感信息），用于固化口径/互证/归档流程；后续可直接替换为真实渠道 campaign 做周度复盘对齐。

## 修改范围（目录/文件）
- `docs/evidence/v1-64/`
- `docs/test-cases/v1-64.md`
- `docs/reports/v1-64-report.md`
- `docs/roadmap_status.md`
- `scripts/verify-weekly-channel-ops-evidence-pack.ts`
- `scripts/test.sh`

