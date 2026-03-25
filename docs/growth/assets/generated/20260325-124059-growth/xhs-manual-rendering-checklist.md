# xhs 手动渲染清单（20260325-124059-growth）

> 触发条件：`network_blocked=true`，按 PRD 禁止 Playwright/MCP 自动渲染。

## A. 渲染输入文件（1080x1440）

1. `01-cover.html`
2. `02-before-after.html`
3. `03-feature-stack.html`
4. `04-three-steps.html`
5. `05-privacy-proof.html`
6. `06-cta.html`

## B. 手动渲染步骤

1. 用 Chrome 依次打开以上 6 个 HTML（100% 缩放）。
2. 每页导出为 PNG（命名 `01-cover.png` ~ `06-cta.png`）。
3. PNG 与 HTML 一并归档到：`docs/growth/assets/generated/20260325-124059-growth/`。
4. 执行 hash：
   - `shasum -a 256 docs/growth/assets/generated/20260325-124059-growth/* > docs/evidence/growth/20260325-124059-growth/asset-hashes.sha256`
5. 将渲染完成时间、操作人、异常记录到 `docs/growth/checklists/manual-posting-20260325-124059-growth.md`。

## C. 发布前核对

- 封面大标题可读、利益点清晰。
- 末页 CTA 含官网 / 商店 / Pro 候补三链接。
- 正文使用 `xhs-copy.md` 对应标题与正文。
