# Advanced Cleaning Validation Proof

## 证据口径

1. 路线打开信号
   `pro_waitlist_opened` + `content=options_advanced_cleaning_cta`
   含义：用户明确进入了“高级页面清洗”这条验证路线，而不是泛 Pro 曝光。

2. 分发素材信号
   `pro_distribution_asset_copied` + `action in [validation_route, validation_brief, validation_checklist]`
   含义：用户不仅看到了路线，还愿意把可归因素材带出去验证。

3. campaign 级归因
   `validationRouteCopied / validationBriefCopied / validationChecklistCopied` 进入 `proDistributionByCampaign7dCsv`
   含义：后续可以按渠道比较“哪类场景最愿意带走高级清洗素材”。

## 本轮样例

- `campaign=twitter`
- `pro_waitlist_opened.content=options_advanced_cleaning_cta`
- `validationRouteCopied=1`
- `validationBriefCopied=1`
- `validationChecklistCopied=1`
- `distCopies=4`

## 隐私边界

- 不记录复制正文、网页内容、URL、标题或任何用户原文。
- 只记录动作枚举、campaign、source、content 和聚合计数。
- 验证简报与验证清单只分发路线边界、固定链接与验收信号，不承载用户复制出的页面内容。

## 商业化判断

- 如果“高级页面清洗”路线打开和素材复制持续出现，说明用户已经愿意为“更少返工”付出额外关注。
- 如果这些动作集中在少数真实噪声场景，而不是泛泛的功能许愿，说明路线说明足够具体，适合继续扩展到下一轮验证。
- 当前仍然只是在验证方向，不代表高级页面清洗已经作为 Pro 能力交付。
