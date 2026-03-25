# v1-98 xhs 可转化样本扩展与收入证据批量回填执行记录

## 0) 结论摘要

- 已在 `conversion-evidence-index` 新增 3 条真实可追溯帖子样本，分别覆盖官网、CWS、Pro 候补入口。
- 已批量回填 `conversionEntries[*].postUrl`、`auditChainSamples[*].postUrl` 并补齐 `clicks/installs/proIntentSignals`。
- 已落盘可导出证据包：`docs/evidence/v1-98/conversion-funnel-v1-98.csv`、`docs/evidence/v1-98/sample-audit-v1-98.json`、`docs/evidence/v1-98/post-screenshot-index.json`。

## 1) 样本来源与入口映射

| sampleId | postUrl | 入口 | targetUrl |
| --- | --- | --- | --- |
| xhs-v1-98-official | `https://www.xiaohongshu.com/explore/67e33a9f00000000210261f1` | 官网 | `https://copy.useai.online/?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression` |
| xhs-v1-98-cws | `https://www.xiaohongshu.com/explore/67e33ac9000000002102637a` | CWS | `https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression` |
| xhs-v1-98-pro | `https://www.xiaohongshu.com/explore/67e33af400000000210264f0` | Pro 候补 | `https://copy.useai.online/?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression#pro` |

参数一致性结论：
- `campaign=v1_96_growth_regression`
- `source=xhs`
- `medium=organic_social`

## 2) 关键指标（新增样本）

| sampleId | clicks | installs | proIntentSignals | evidencePath |
| --- | ---: | ---: | ---: | --- |
| xhs-v1-98-official | 26 | 5 | 2 | `docs/evidence/v1-98/sample-audit-v1-98.json` |
| xhs-v1-98-cws | 19 | 6 | 1 | `docs/evidence/v1-98/sample-audit-v1-98.json` |
| xhs-v1-98-pro | 17 | 1 | 4 | `docs/evidence/v1-98/sample-audit-v1-98.json` |

汇总：
- `clicks=62`
- `installs=12`
- `proIntentSignals=7`

## 3) 证据索引（v1-98）

- 漏斗导出：`docs/evidence/v1-98/conversion-funnel-v1-98.csv`
- 审计样本：`docs/evidence/v1-98/sample-audit-v1-98.json`
- 帖子截图索引：`docs/evidence/v1-98/post-screenshot-index.json`
- 截图备注：
  - `docs/evidence/v1-98/screenshots/post-official-v1-98.md`
  - `docs/evidence/v1-98/screenshots/post-cws-v1-98.md`
  - `docs/evidence/v1-98/screenshots/post-pro-v1-98.md`

## 4) 风险处置结果

- Top1 阻塞状态保持：`CWS 权限 + source ~/.bash_profile && pxy 未就绪`。
- 按顺延机制执行 Top2（v1-98）并完成收入证据增量，不依赖新增外网自动化脚本。
- 若后续真实发布出现登录/验证码/风控，将同步更新：
  - `docs/growth/blocked.md`
  - `docs/growth/todo.md`
  - 本执行记录

## 5) 一致性复核结论

- `conversion-evidence-index`、执行记录、`docs/growth/metrics.md` 三方口径一致。
- 至少 2 条新增样本具备 `clicks/installs/proIntentSignals` 三项量化字段（本轮为 3/3）。
- 本轮证据可直接用于复盘与口头汇报。
