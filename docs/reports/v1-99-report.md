# V1-99 收入证据增量简报

## 状态

- 子 PRD 已完成：三入口样本回填、对比证据导出、测试用例与门禁日志、路线图状态同步均已落盘。
- Top1 阻塞仍在：`CWS 权限 + source ~/.bash_profile && pxy 未就绪`；本轮按顺延规则完成 Top3 第 2 项交付。
- 自动化门禁已通过：`bash scripts/test.sh`，日志见 `docs/evidence/v1-99/test.sh.log`。

## 效果（可审计）

- `conversion-evidence-index` 本轮新增 3 条样本，覆盖 `official_site` / `chrome_web_store` / `pro_waitlist`。
- v1-99 新增样本汇总：`clicks=74`、`installs=15`、`proIntentSignals=9`。
- v1-98 -> v1-99 增量：`clicks +12`、`installs +3`、`proIntentSignals +2`。
- 已形成可复盘证据包：`conversion-funnel-v1-99.csv`、`conversion-funnel-compare-v1-98-v1-99.json`、`sample-audit-v1-99.json`。

## 修改范围（目录/文件）

- `prds/v1-99-1.md`
- `prds/v1-99-2.md`
- `prds/v1-99-3.md`
- `docs/growth/assets/social/xhs/v1-96/conversion-evidence-index.json`
- `docs/growth/executions/v1-99-growth-backfill.md`
- `docs/growth/metrics.md`
- `docs/growth/blocked.md`
- `docs/growth/todo.md`
- `docs/evidence/v1-99/conversion-funnel-v1-99.csv`
- `docs/evidence/v1-99/conversion-funnel-compare-v1-98-v1-99.json`
- `docs/evidence/v1-99/sample-audit-v1-99.json`
- `docs/evidence/v1-99/case-a-sample-integrity.json`
- `docs/evidence/v1-99/case-b-attribution-consistency.json`
- `docs/evidence/v1-99/case-c-commercial-compare.json`
- `docs/evidence/v1-99/case-d-blocked-deferral-check.txt`
- `docs/evidence/v1-99/test.sh.log`
- `docs/test-cases/v1-99.md`
- `docs/roadmap.md`
- `docs/roadmap_status.md`
- `docs/reports/v1-99-report.md`
