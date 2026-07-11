# v4-8 三条路线样本比较证据索引

## 证据清单

- `comparison-surface.md`
  - 记录 `Options -> Pro` 中新入口、按钮与隐私边界
- `comparison-sample.md`
  - 记录三路线比较摘要样例与关键字段
- `route-validation-telemetry-sample.json`
  - 用于生成样本比较摘要的匿名 telemetry 样本
- `comparison-pack/*`
  - 使用样本 telemetry 生成的 JSON / Markdown 样例，证明共享逻辑、脚本和界面口径一致

## 核心结论

- 三条路线的真实打开与复制样本现在可以在扩展内直接比较，而不是继续分散在事件流和离线导出里。
- 当前仍未进入支付或收款实现，只是把“哪条路线更接近真实付费价值”的判断做成了可复核能力。
- 下一轮应转到领先样本回写，而不是继续扩更多路线或比较按钮。
