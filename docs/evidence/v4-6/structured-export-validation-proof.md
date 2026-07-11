# Structured Export Validation Proof

## 证据口径

1. 路线打开信号
   `pro_waitlist_opened` + `content=options_structured_export_cta`
   含义：用户主动进入了“结构化导出与下游工作流”这条验证路线。

2. 分发素材信号
   `pro_distribution_asset_copied` + `content=options_structured_export_cta`
   含义：用户不仅看到了路线说明，而且愿意带着下游工作流素材去验证。

3. 下游任务具体度
   素材样例必须描述表格整理、知识库录入、模板归档或 AI 下游输入等明确任务，而不是泛泛的导出诉求。

## 本轮样例

- `campaign=twitter`
- `pro_waitlist_opened.content=options_structured_export_cta`
- `validationRouteCopied=1`
- `validationBriefCopied=1`
- `validationChecklistCopied=1`

## 隐私边界

- 不记录复制正文、网页内容、URL、标题或其他用户原文。
- 只记录动作枚举、campaign、source、content 和聚合计数。
- 结构化导出验证素材只分发路线边界与固定链接，不承载真实复制结果。

## 商业化判断

- 如果用户愿意传播这条路线，说明当前 Free 导出虽然可用，但在下游接入时仍存在明显的重排成本。
- 如果外部分发案例集中在 Notion、知识库、表格和数据库录入，说明这条 Pro 路线对应的是清晰的工作流痛点。
