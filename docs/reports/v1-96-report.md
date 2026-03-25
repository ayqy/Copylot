# V1-96 收入回填最小增量（转化入口参数统一与漏斗证据补齐）简报

## 状态

- 已完成 Top2 交付：统一官网/CWS/Pro 候补三类入口参数口径（`campaign/source/medium`）。
- 已完成可导出证据索引补齐：`conversion-evidence-index` 新增审计必填字段并对齐 Pro 意向证据包。
- 已完成测试用例文档：`docs/test-cases/v1-96.md`（用例 A/B/C + 统一门禁回归记录）。
- 已执行统一门禁：`bash scripts/test.sh` 通过，日志落盘 `docs/evidence/v1-96/test.sh.log`。
- 已同步路线图与阻塞状态：`docs/roadmap.md`、`docs/roadmap_status.md`、`docs/growth/blocked.md`。

## 效果

- 三类转化入口采用同一参数命名规则，避免同源流量在漏斗中被拆分。
- `conversion-evidence-index` 支持从入口记录追溯到意向证据，满足可导出、可审计、可复盘。
- 已提供至少 1 条“分发入口 -> 转化动作 -> 意向信号”完整链路样例（xhs -> Pro 候补 -> `pro_waitlist_survey_copied`）。
- 在 Top1（CWS 权限 + 代理未启动）阻塞下，Top2 仍可独立闭环并保持回切路径清晰。

## 修改范围（目录/文件）

- `docs/growth/assets/social/xhs/v1-96/cta-links.md`
- `docs/growth/assets/social/xhs/v1-96/conversion-evidence-index.json`
- `docs/growth/assets/social/xhs/v1-96/asset-index.md`
- `docs/growth/checklists/manual-posting-xhs-v1-96.md`
- `docs/growth/executions/v1-96-growth-regression.md`
- `docs/test-cases/v1-96.md`
- `docs/reports/v1-96-report.md`
- `docs/roadmap.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`
- `docs/evidence/v1-96/case-a-params-check.json`
- `docs/evidence/v1-96/case-b-field-check.json`
- `docs/evidence/v1-96/case-c-blocking-check.txt`
- `docs/evidence/v1-96/test.sh.log`
