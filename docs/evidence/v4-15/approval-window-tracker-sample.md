# v4-15 tracker 样例输出摘要

本轮样例来自：

- `docs/evidence/v4-12/payment-evaluation-audit-pack/copylot-pro-payment-evaluation-audit-v4-12.json`
- `docs/evidence/v4-13/campaign-review-pack/copylot-pro-route-validation-campaign-review-v4-13.json`
- `docs/evidence/v4-14/messaging-guard-pack/copylot-pro-stay-validation-messaging-guard-v4-14.json`

样例结论：

- `tracker_status=hold_validation`
- `ready_for_human_approval=false`
- `audit_status=hold_validation`
- `guard_status=aligned`
- `campaign_blocker_codes=acquisition_bias_unresolved, sample_still_thin`

阻塞解释：

- 收费评估审计当前仍停在 `hold_validation`。
- 跨 `campaign` 复核仍未清掉 acquisition bias 与薄样本问题。
- 话术守门虽然已经对齐，但单独通过并不能推动 tracker 放行。
