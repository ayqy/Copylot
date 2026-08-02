<!-- managed-by: 24h-studio-commercial revision=af8eb2364a3b9b7b -->
# 商业化进度看板

## 当前阶段

p0-delete-dead-branches-and-verify-repeat · 删除无接收端问卷并退出产品内引导主线，验证无需引导的首次成功与复用

## 当前进度

商业计划已通过确定性门禁，当前唯一活动 action 为 `p0-delete-dead-branches-and-verify-repeat`；北极星为成功付款毛营收，组合优先级为 4。

## 当前验证合同

- 基线：2026-07-26 官方商店显示 54 users、No ratings；首次成功和 7/28 天复用 UNKNOWN；成功付款毛营收=0 且收入路径缺失。
- 目标：TBD：先建立无需引导的独立用户首次成功和自然复用基线；只有多个独立用户重复同一任务才通过。
- 主指标：`verified_repeat_task_users`
- 观察窗：首次成功 7–14 天；自然复用 28 天或真实工作周期。
- 数据源：fixed_opt_in_cohort_record；Chrome_Web_Store_public_listing；support_and_public_reviews

## 下一步最重要的 3 件事（收入优先）

1. 删除无服务端接收端的 Pro 问卷入口，并使产品内引导退出活动商业路线。
2. 校正商店/官网的用户规模、品牌和本地处理表述，确保所有主张可由 Manifest 与运行事实核验。
3. 建立不采集复制正文的固定首次成功/复用 cohort，冻结 Pro、支付和批量 SEO 扩张。

## 阻塞与自动降级

- 不等待人工审批；数据源暂不可用时复用最近有效快照，或执行活动 action 中不会增加客户摩擦的安全测量动作。
- 未通过活动 action 的 Continue/Scale 条件前，不进入后续阶段，也不扩张并行功能主线。
