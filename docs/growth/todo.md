# Growth TODO（阻塞降级队列）

## 当前阻塞优先级（收入优先）

- [ ] v1-96 / 网络恢复：提供可访问外网的代理或直连网络，复跑 `curl` 预检并解除 `network_blocked`。
- [ ] v1-96 / 渠道账号：提供可用小红书发布账号（含可发布权限与稳定登录态），完成真实发布并回填帖子链接。
- [ ] v1-96 / Playwright 自动化：网络恢复后再执行外网自动化发布/取证，当前阶段保持“禁止 Playwright 打开外网站点”。
- [ ] v1-96 / 证据补齐：发布后补齐分发链接、转化点击、Pro 候补意向信号，并回写执行记录。

## 无凭据可继续动作

- [x] 已生成成套竖版资产：`docs/growth/assets/social/xhs/v1-96/`
- [x] 已生成手动发布清单：`docs/growth/checklists/manual-posting-xhs-v1-96.md`
- [x] 已生成执行记录与转化证据索引：`docs/growth/executions/v1-96-growth-regression.md`
