# V4-10 领先路线稳定性摘要

## 输入
- window_set=7d, 14d
- campaign_count=4
- overall_leader=高级页面清洗验证

## 窗口判断
- 7d leader=高级页面清洗验证, total_signals=8, signal_gap=2, campaigns=2
- 14d leader=高级页面清洗验证, total_signals=12, signal_gap=4, campaigns=4
- stable_across_windows=true

## campaign 支撑
- ph leader=高级页面清洗验证, total_signals=2, signal_gap=2
- reddit leader=批量采集与整理验证, total_signals=3, signal_gap=3
- seo leader=结构化导出与下游工作流验证, total_signals=2, signal_gap=2
- twitter leader=高级页面清洗验证, total_signals=5, signal_gap=5
- supporting_campaigns=ph, twitter
- conflicting_campaigns=reddit, seo

## 结论
- 7d 与 14d 的领先路线一致，但不同 campaign 仍然分裂，说明领先路线还没有跨渠道稳定成立。
- 下一步：优先补跨 campaign 的真实任务样本，再用回写包和门槛摘要一起复核。
