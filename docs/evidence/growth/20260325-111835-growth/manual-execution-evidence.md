# 自动化降级执行证据（20260325-111835-growth）

## 判定

- `network_blocked=true`（见 `network-preflight-summary.json`）
- 依据 PRD：禁止调用 Playwright/MCP 打开任何外网 URL
- 依据 PRD：禁止使用 Playwright/MCP 进行本地 `file://` 渲染截图

## 本轮已执行的离线动作

1. 生成多渠道可复制文案包：
   - `docs/growth/assets/generated/20260325-111835-growth/channel-posts.md`
2. 生成 xhs 成套图片素材源文件（HTML）：
   - `docs/growth/assets/generated/20260325-111835-growth/01-cover.html`
   - `docs/growth/assets/generated/20260325-111835-growth/02-before-after.html`
   - `docs/growth/assets/generated/20260325-111835-growth/03-feature-stack.html`
   - `docs/growth/assets/generated/20260325-111835-growth/04-three-steps.html`
   - `docs/growth/assets/generated/20260325-111835-growth/05-privacy-proof.html`
   - `docs/growth/assets/generated/20260325-111835-growth/06-cta.html`
3. 生成手动渲染与发布清单：
   - `docs/growth/assets/generated/20260325-111835-growth/xhs-manual-rendering-checklist.md`
   - `docs/growth/checklists/manual-posting-20260325-111835-growth.md`
4. 更新阻塞与指标：
   - `docs/growth/blocked.md`
   - `docs/growth/metrics.md`
