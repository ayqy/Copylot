# v4-14 样例输出摘要

本轮样例来自：

- `docs/evidence/v4-9/writeback-pack/copylot-pro-route-validation-writeback-v4-9.json`
- `docs/evidence/v4-13/campaign-review-pack/copylot-pro-route-validation-campaign-review-v4-13.json`

样例结论：

- `guard_status=aligned`
- `overall_leader=高级页面清洗验证`
- `campaign_blocker_codes=acquisition_bias_unresolved, sample_still_thin`
- `prioritized_campaigns=ph, reddit, seo`

逐项观察：

- `route_headline`、`store_short_description`、`summary_judgement` 都命中了 `当前 / 优先 / 验证` 等验证词。
- `store_value_bullet` 不要求显式出现验证词，但也没有命中任何收费 / 订阅禁词。
- 当前导出结果证明对外 surface 已统一锁定到“当前优先验证路线”，避免把 `advanced_cleaning` 的领先误讲成已验证收费需求。
