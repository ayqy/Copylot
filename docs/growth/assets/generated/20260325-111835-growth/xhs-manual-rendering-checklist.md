# xhs 手动渲染清单（20260325-111835-growth）

> 触发原因：`network_blocked=true`，按 PRD 禁止 Playwright（外网与本地渲染均禁用）

## 目标输出

- `01-cover.png`
- `02-before-after.png`
- `03-feature-stack.png`
- `04-three-steps.png`
- `05-privacy-proof.png`
- `06-cta.png`

分辨率要求：1080x1440（竖版）

## 手动渲染步骤（Chrome）

1. 打开本地文件夹：`docs/growth/assets/generated/20260325-111835-growth/`
2. 依次双击打开 `01-cover.html` ~ `06-cta.html`
3. 浏览器缩放设为 100%，确保无滚动条遮挡
4. 使用系统截图或开发者工具截图导出 PNG
5. 文件名严格按“目标输出”命名
6. 把 PNG 放到同目录下，执行：
   - `shasum -a 256 01-cover.png 02-before-after.png 03-feature-stack.png 04-three-steps.png 05-privacy-proof.png 06-cta.png`
7. 将 hash 追加到：`docs/evidence/growth/20260325-111835-growth/asset-hashes.sha256`

## 发布前最小验收

- 封面大标题可读（手机预览不糊）
- 内页至少 1 张包含“前后对比”
- 末页包含强 CTA + 统一 UTM 链接
