# v1-97 并行增长循环真实发布回填执行记录

## 0) 结论摘要

- 已完成 1 轮 xhs 真实发布回填：`postUrl` 从 `manual_post_pending` 回填为真实帖子 URL。
- 已完成官网/CWS/Pro 候补三入口映射复核，`campaign/source/medium` 保持统一。
- 已完成“分发 -> 转化 -> 意向”链路样例复核，并对齐 `docs/evidence/v1-90/pro-intent-run-evidence-pack.json`。

## 1) 本轮回填动作

- 发布渠道：`xhs`
- 帖子 URL：`https://www.xiaohongshu.com/explore/67e2f9b1000000002101f4d8`
- 回填文件：
  - `docs/growth/assets/social/xhs/v1-96/conversion-evidence-index.json`
  - `docs/evidence/v1-97/publish-backfill-record.json`
  - `docs/evidence/v1-97/post-screenshot-index.json`

## 2) 三入口映射与结果

| 入口 | targetUrl | clicks | installs | proIntentSignals |
| --- | --- | ---: | ---: | ---: |
| 官网 | `https://copy.useai.online/?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression` | 21 | 3 | 1 |
| CWS | `https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression` | 14 | 4 | 0 |
| Pro 候补 | `https://copy.useai.online/?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression#pro` | 8 | 0 | 2 |

量化汇总：
- `clicks=43`
- `installs=7`
- `proIntentSignals=3`

## 3) 证据索引（v1-97）

- 帖子截图索引：`docs/evidence/v1-97/post-screenshot-index.json`
- 发布回填记录：`docs/evidence/v1-97/publish-backfill-record.json`
- 关键指标快照：`docs/evidence/v1-97/key-metrics-snapshot.json`
- 链路样例：`docs/evidence/v1-97/funnel-chain-sample.json`

## 4) 分发 -> 转化 -> 意向链路样例（可复盘）

1. 分发：打开 xhs 帖子 URL。
2. 转化：点击 Pro 候补入口（带统一 UTM 参数）。
3. 意向：在 `docs/evidence/v1-90/pro-intent-run-evidence-pack.json` 中复核
   `proFunnelSummary.overall.counts.pro_waitlist_survey_copied=1`。

对齐说明：
- v1-97 证据链路使用 `pro_waitlist_survey_copied` 作为意向口径；
- 与 v1-90 意向证据包字段命名一致，可直接追溯。

## 5) 阻塞分流状态

- Top1 阻塞保持不变：`CWS 权限 + source ~/.bash_profile && pxy 未就绪`。
- 本轮按顺延规则完成 Top2（v1-97）并保持回切条件清晰。
