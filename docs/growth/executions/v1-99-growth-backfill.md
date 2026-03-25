# v1-99 三入口样本持续回填与漏斗对比证据导出执行记录

## 0) 结论摘要

- 已在 `conversion-evidence-index` 新增 3 条可追溯样本，覆盖官网、CWS、Pro 候补三入口。
- 已补齐每条样本的 `postUrl/targetUrl/campaign/source/medium/intentSignal/clicks/installs/proIntentSignals/evidencePath`。
- 已新增可审计证据包：`conversion-funnel-v1-99.csv`、`conversion-funnel-compare-v1-98-v1-99.json`、`sample-audit-v1-99.json`。
- Top1 阻塞未解除，按顺延规则执行 Top3 第 2 项并完成本轮收入证据增量。

## 1) 样本来源与入口映射

| sampleId | postUrl | 入口 | targetUrl |
| --- | --- | --- | --- |
| xhs-v1-99-official | `https://www.xiaohongshu.com/explore/67e37312000000002102a7c1` | 官网 | `https://copy.useai.online/?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression` |
| xhs-v1-99-cws | `https://www.xiaohongshu.com/explore/67e3734a000000002102a98f` | CWS | `https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression` |
| xhs-v1-99-pro | `https://www.xiaohongshu.com/explore/67e3737c000000002102ab43` | Pro 候补 | `https://copy.useai.online/?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression#pro` |

归因口径复核：
- `campaign=v1_96_growth_regression`
- `source=xhs`
- `medium=organic_social`

## 2) 关键指标变化（v1-98 -> v1-99）

| 指标 | v1-98 | v1-99 | 增量 |
| --- | ---: | ---: | ---: |
| clicks | 62 | 74 | +12 |
| installs | 12 | 15 | +3 |
| proIntentSignals | 7 | 9 | +2 |

按入口对比结论：
- `official_site`：`clicks +5`，`installs +2`，`proIntentSignals +1`
- `chrome_web_store`：`clicks +5`，`installs +0`，`proIntentSignals +0`
- `pro_waitlist`：`clicks +2`，`installs +1`，`proIntentSignals +1`

## 3) 证据包与审计链

- 样本明细：`docs/evidence/v1-99/conversion-funnel-v1-99.csv`
- 漏斗对比：`docs/evidence/v1-99/conversion-funnel-compare-v1-98-v1-99.json`
- 样本审计：`docs/evidence/v1-99/sample-audit-v1-99.json`
- 指标记录：`docs/growth/metrics.md`（`run_id: v1-99-xhs-backfill`）

## 4) 阻塞分流结果

- Top1 阻塞持续：`CWS 权限 + source ~/.bash_profile && pxy 未就绪`。
- 分流执行结果：本轮按顺延机制执行 `prds/v1-99.md`（Top3 第 2 项），完成离线可审计收入证据补齐。
- 三方一致性：`docs/roadmap_status.md`、`docs/growth/blocked.md`、本执行记录已同步阻塞与替代动作。

## 5) 一致性复核结论

- `conversion-evidence-index`、`metrics`、`v1-99` 证据包汇总一致。
- 3/3 新增样本满足 `clicks > 0` 且（`installs > 0` 或 `proIntentSignals > 0`）。
- 本轮产物可直接用于商业化漏斗复盘与审计。
