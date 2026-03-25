# xhs 手动渲染清单（20260325-113320-growth）

> 触发原因：`network_blocked=true`；按 PRD 禁止 Playwright/MCP 外网访问与本地渲染自动化

## 输出要求

- 画布尺寸：`1080x1440`（竖版）
- 文件清单：
  - `01-cover.png`
  - `02-before-after.png`
  - `03-feature-stack.png`
  - `04-three-steps.png`
  - `05-privacy-proof.png`
  - `06-cta.png`

## 手动渲染步骤（Chrome）

1. 打开目录：`docs/growth/assets/generated/20260325-113320-growth/`
2. 依次打开 `01-cover.html` 至 `06-cta.html`
3. 缩放固定 100%，确保无滚动条遮挡
4. 使用系统截图或开发者工具截图导出 PNG
5. 文件名必须与“输出要求”一致
6. 将 PNG 存放在同目录后执行：
   - `shasum -a 256 01-cover.png 02-before-after.png 03-feature-stack.png 04-three-steps.png 05-privacy-proof.png 06-cta.png`
7. 把 hash 追加到：`docs/evidence/growth/20260325-113320-growth/asset-hashes.sha256`

## 发布前最小验收

- 封面大标题在手机端可读
- 内页至少 1 张展示“前/后对比”
- 末页包含强 CTA + UTM 链接
