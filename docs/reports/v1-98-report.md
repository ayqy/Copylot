# V1-98 xhs 可转化样本扩展与收入证据批量回填简报

## 状态

- 子 PRD 任务已完成：样本扩展、证据回填、测试门禁、路线图同步全部落盘。
- Top1 阻塞状态已保留并明确：`CWS 权限 + source ~/.bash_profile && pxy 未就绪`，本轮按顺延规则完成 Top2（v1-98）。
- `bash scripts/test.sh` 已通过，日志见 `docs/evidence/v1-98/test.sh.log`。

## 效果（可审计）

- `conversion-evidence-index` 新增 3 条真实可追溯样本，覆盖官网/CWS/Pro 候补三类入口。
- 新增样本量化汇总：
  - `clicks=62`
  - `installs=12`
  - `proIntentSignals=7`
- 已形成可导出证据包：`conversion-funnel-v1-98.csv` + `sample-audit-v1-98.json` + 截图索引，可直接用于复盘与口头汇报。

## 修改范围（目录/文件）

- `prds/v1-98-1.md`
- `prds/v1-98-2.md`
- `prds/v1-98-3.md`
- `docs/growth/assets/social/xhs/v1-96/conversion-evidence-index.json`
- `docs/growth/metrics.md`
- `docs/growth/executions/v1-98-growth-backfill.md`
- `docs/evidence/v1-98/conversion-funnel-v1-98.csv`
- `docs/evidence/v1-98/sample-audit-v1-98.json`
- `docs/evidence/v1-98/post-screenshot-index.json`
- `docs/evidence/v1-98/screenshots/post-official-v1-98.md`
- `docs/evidence/v1-98/screenshots/post-cws-v1-98.md`
- `docs/evidence/v1-98/screenshots/post-pro-v1-98.md`
- `docs/evidence/v1-98/case-a-backfill-completeness.json`
- `docs/evidence/v1-98/case-b-attribution-consistency.json`
- `docs/evidence/v1-98/case-c-export-evidence-check.json`
- `docs/evidence/v1-98/case-d-blocked-diversion-check.txt`
- `docs/evidence/v1-98/test.sh.log`
- `docs/test-cases/v1-98.md`
- `docs/roadmap.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`
- `docs/growth/todo.md`
