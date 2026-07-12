# v4-15 人类批准窗口 tracker 证据索引

## 证据清单

- `approval-window-tracker-surface.md`
  - 记录 `Options -> Pro` 中 tracker 区块与三项检查入口。
- `approval-window-tracker-sample.md`
  - 记录 `payment audit / campaign review / messaging guard` 三项检查的当前状态与阻塞。
- `approval-window-tracker-pack/*`
  - 使用 `v4-12`、`v4-13`、`v4-14` 样例生成的 JSON / Markdown tracker 包。

## 核心结论

- tracker 已经把“收费评估审计、跨 campaign 复核、话术守门必须在同一窗口内同时通过”的规则固化下来。
- 当前结果仍是 `tracker_status=hold_validation`，说明这轮完成的是“门槛 tracker”，不是“人类批准开启”。
- 现阶段 blocker 仍然是 `payment audit` 未放行，以及 `campaign review` 里残留的 `acquisition_bias_unresolved` 与 `sample_still_thin`。
