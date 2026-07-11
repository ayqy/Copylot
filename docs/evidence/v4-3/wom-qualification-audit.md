# v4-3 WOM 资格审计摘要

## 结论

- WOM 分享与评价入口已绑定到“至少 2 次成功复制”之后。
- 锁前只展示低打扰提示，不落 WOM 分享/评价事件。
- 解锁后可通过 Options 的 WOM 完整报告包导出 `womQualificationAudit`，直接复核资格链路。

## 本轮证据点

- 资格口径：`successfulCopyCount >= 2` 且已形成 `secondSuccessfulCopyAt`。
- 锁前行为：Popup / Options 均不允许触发 `wom_share_opened`、`wom_share_copied`、`wom_rate_opened`。
- 解锁后行为：分享/评价入口恢复可用，且 WOM 报告包可导出资格审计摘要。

## 对商业化主线的意义

- 口碑动作不再面向“刚安装但尚未验证价值”的用户，减少无效打扰。
- 只有在用户至少完成两次成功复制后，才开始鼓励分享与评价，更贴近真实复用价值。
- 导出包中的资格审计字段可以直接支持后续“分享/评价是否带来新安装”的复盘。
