# v4-13 跨 campaign 领先路线复核包证据索引

## 证据清单

- `campaign-review-surface.md`
  - 记录 `Options -> Pro` 中新入口、按钮与隐私边界
- `campaign-review-sample.md`
  - 记录复核包样例输出与当前优先补样判断
- `campaign-review-pack/*`
  - 使用 `v4-10` 稳定性摘要与 `v4-11` verdict 样例生成的 JSON / Markdown 复核包，证明共享逻辑、脚本与界面口径一致

## 核心结论

- 当前已经可以把不同 campaign 对领先路线的支持、冲突和样本薄弱点整理成一份统一复核包，不再需要人工拼读稳定性摘要与 verdict。
- 当前重点已从“继续补判断面板”切到“优先补冲突、薄样本或无信号的 campaign”，避免 acquisition 偏差。
- 当前证据支持的动作是：
  - 继续扩量：保持 `twitter` 这类 supporting campaign 的同一路线分发。
  - 继续验证：优先补 `ph / reddit / seo` 的真实任务样本。
  - 暂缓收费判断：在 `acquisition_bias_unresolved` 与 `sample_still_thin` 清空前，不进入新的收费实现规划。
- `S4` 本轮已推进到 `3/4`，但当前交付目标仍是继续验证，而不是进入收费实现。
