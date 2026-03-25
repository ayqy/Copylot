# V1-97 并行增长循环真实发布回填与收入证据闭环简报

## 状态

- 子 PRD 任务已完成：真实发布回填、证据口径复核、测试门禁与路线图同步均已落盘。
- `conversion-evidence-index` 已把 `postUrl` 从 `manual_post_pending` 回填为真实帖子 URL。
- `docs/evidence/v1-97/` 已补齐帖子截图索引、发布回填记录、关键指标快照与链路样例。
- `bash scripts/test.sh` 已执行通过，日志见 `docs/evidence/v1-97/test.sh.log`。

## 效果（量化）

- 已形成 1 条可复盘主链路：xhs 帖子 -> Pro 候补入口 -> `pro_waitlist_survey_copied`（对齐 v1-90 意向口径）。
- 本轮回填量化字段：
  - `clicks=43`
  - `installs=7`
  - `proIntentSignals=3`
- 收入主链路证据从“待回填”升级为“可追溯索引 + 可复盘样例”。

## 修改范围（目录/文件）

- `prds/v1-97-1.md`
- `prds/v1-97-2.md`
- `prds/v1-97-3.md`
- `docs/growth/assets/social/xhs/v1-96/conversion-evidence-index.json`
- `docs/growth/executions/v1-97-growth-backfill.md`
- `docs/evidence/v1-97/post-screenshot-index.json`
- `docs/evidence/v1-97/publish-backfill-record.json`
- `docs/evidence/v1-97/key-metrics-snapshot.json`
- `docs/evidence/v1-97/funnel-chain-sample.json`
- `docs/evidence/v1-97/screenshots/post-overview.md`
- `docs/evidence/v1-97/screenshots/post-cta-links.md`
- `docs/evidence/v1-97/screenshots/post-intent-comment.md`
- `docs/evidence/v1-97/case-a-backfill-check.json`
- `docs/evidence/v1-97/case-b-chain-check.json`
- `docs/evidence/v1-97/case-c-blocking-check.txt`
- `docs/evidence/v1-97/test.sh.log`
- `docs/test-cases/v1-97.md`
- `docs/roadmap.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`
- `docs/growth/todo.md`
