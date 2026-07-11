# Bulk Collection Validation Proof

## 证据口径

1. 路线打开信号
   `pro_waitlist_opened` + `content=options_bulk_collection_cta`
   含义：用户主动进入了“批量采集与整理”这条验证路线。

2. 分发素材信号
   `pro_distribution_asset_copied` + `content=options_bulk_collection_cta`
   含义：用户愿意把这条路线的素材带出去验证，而不只是被动看到 Pro 说明。

3. 任务具体度
   素材样例必须描述多页面/多片段/竞品对比等明确任务，而不是抽象地说“希望更高级”。

## 本轮样例

- `campaign=twitter`
- `pro_waitlist_opened.content=options_bulk_collection_cta`
- `validationRouteCopied=1`
- `validationBriefCopied=1`
- `validationChecklistCopied=1`

## 隐私边界

- 不记录复制正文、网页内容、URL、标题或其他用户原文。
- 只记录动作枚举、campaign、source、content 和聚合计数。
- 批量采集验证素材只分发路线边界与固定链接，不承载真实收集到的资料内容。

## 商业化判断

- 如果用户愿意传播这条路线，说明当前 Free 的“单页复制 + 追加模式”之外确实还存在更重的整理成本。
- 如果外部分发案例集中在研究资料、竞品监控和参考汇总，说明这条 Pro 路线对应的是明确任务而非宽泛愿望。
