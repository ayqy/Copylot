# v4-15 tracker 区块界面记录

- 区块位置：`Options -> Pro`
- 入口目标：复制 tracker 摘要、下载 tracker JSON
- 当前三项检查：
  - `payment_audit_ready`
  - `campaign_review_clear`
  - `messaging_guard_aligned`
- 当前结果：
  - `tracker_status=hold_validation`
  - `ready_for_human_approval=false`
  - `messaging_guard_aligned=true`
- 设计意图：
  - 把三项检查约束到同一窗口
  - 明确任意一项失败都不能进入人类批准
  - 避免把单项好转误读为收费放行
