# Copylot 增长事件口径（无表单版）

## 目标

事件只服务于四类判断：

1. 用户有没有完成第一次成功复制
2. 用户会不会回来继续用
3. 用户愿不愿意自然分享或评价
4. 用户是否对 Pro 路线产生真实兴趣

## 指标分层

### A. 激活层
- `popup_opened`
- `copy_success`

解释：
- `popup_opened -> copy_success` 是最核心的首次激活漏斗。
- 没有 `copy_success`，后续所有分享、评价和 Pro 路线都没有经营价值。

### B. 复用层
- `prompt_used`
- `copy_success`（按用户、按时间窗口复看）

解释：
- 第二次、第三次 `copy_success` 比任何表单回答都更能说明产品是否形成习惯。
- `prompt_used` 是“从一次复制进入工作流”的关键信号。

### C. 口碑层
- `wom_share_opened`
- `wom_share_copied`
- `wom_rate_opened`
- `rating_prompt_shown`
- `rating_prompt_action`
- `wom_feedback_opened`

解释：
- 浏览器插件增长需要自然分享和商店评分。
- 评价和分享提示必须晚于真实成功使用。

### D. Pro 路线层
- `pro_entry_opened`
- `pro_waitlist_opened`
- `pro_distribution_asset_copied`

解释：
- 这里的事件仅用于观察用户是否愿意继续了解 Pro 路线。
- 当前阶段不再经营 `pro_intent_form_*` 或 `pro_waitlist_survey_*`。

## 经营顺序

1. 先看 `copy_success`
2. 再看复用率和 `prompt_used`
3. 再看 `wom_share_* / wom_rate_*`
4. 最后才看 Pro 路线兴趣

如果一个版本只提升了 Pro 路线点击，但没有提升首次成功复制或 7 日复用率，应默认判定为偏航。
