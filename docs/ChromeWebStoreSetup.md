# Chrome Web Store First-Copy Listing Setup Guide

## 本轮唯一承接口径

- 主标题：`30 秒完成第一次干净复制`
- 前三个卖点顺序固定：
  1. 长文：去掉导航和广告，直接得到干净 Markdown / 纯文本
  2. 表格：一键转成 Markdown / CSV
  3. 代码块：保留缩进，尽量去掉行号和复制按钮噪声
- 快速上手顺序固定：
  1. 安装并固定扩展
  2. 打开长文 / 表格 / 代码块并触发复制
  3. 粘贴到 ChatGPT / Claude / 文档验证第一次干净复制

## 商店说明、截图与官网首页的同步要求

### 1. Chrome Web Store 说明

- 中文说明使用 [docs/ChromeWebStore-Description-ZH.md](/Users/pocket/Documents/project/Copylot/docs/ChromeWebStore-Description-ZH.md)
- 英文说明使用 [docs/ChromeWebStore-Description-EN.md](/Users/pocket/Documents/project/Copylot/docs/ChromeWebStore-Description-EN.md)
- 不新增表单、问卷、候补或支付承接文案
- Pro 只允许作为“路线说明页”出现

### 2. 推荐截图顺序

1. Popup 首屏：`30 秒完成第一次干净复制`
2. 长文复制结果：干净 Markdown
3. 表格复制结果：Markdown / CSV
4. 代码块复制结果：保留缩进并去噪
5. 粘贴结果：第一次成功贴进 AI 或文档

### 3. 官网首页承接要求

- Hero 标题必须与商店主标题一致
- Hero 副标题必须明确“先复制什么、怎么触发、复制后贴到哪里”
- 首屏 CTA 只保留：
  - Chrome Web Store 安装
  - 快速安装指引
  - 隐私说明
  - Pro 路线说明
- 首页截图顺序必须与上面的商店截图顺序一致

## 官方固定入口

- 官网首页：`https://copy.useai.online/`
- 商店安装页：`https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic`
- 隐私说明页：`https://copy.useai.online/privacy`
- Pro 路线页：`https://copy.useai.online/pricing`

## 发布前核对清单

1. Popup 首屏、商店中英文说明、截图顺序、官网首页规范都使用同一主标题与前三个卖点。
2. [docs/evidence/v1-111/screenshot-sequence.md](/Users/pocket/Documents/project/Copylot/docs/evidence/v1-111/screenshot-sequence.md)、[docs/evidence/v1-111/homepage-alignment-spec.md](/Users/pocket/Documents/project/Copylot/docs/evidence/v1-111/homepage-alignment-spec.md)、[docs/evidence/v1-111/first-copy-install-guide.md](/Users/pocket/Documents/project/Copylot/docs/evidence/v1-111/first-copy-install-guide.md) 已可直接交给站点仓和商店后台使用。
3. [docs/evidence/v1-111/official-links.json](/Users/pocket/Documents/project/Copylot/docs/evidence/v1-111/official-links.json) 只包含官网首页、商店安装页、隐私说明页、Pro 路线页四类固定入口。
4. `bash scripts/test.sh` 通过。

## 发布 API 凭据补充

官方文档：<https://developer.chrome.com/docs/webstore/using-api>

若需要用脚本真实上传 / 发布，继续使用以下四个变量：

- `CWS_EXTENSION_ID`
- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`

建议流程：

1. 在 Chrome Web Store Developer Dashboard 中确认扩展条目存在并可编辑。
2. 在 Google Cloud Console 启用 Chrome Web Store API。
3. 用 OAuth Playground 换取 `refresh_token`。
4. 将四个变量写入 `.env`。
5. 先执行 `bash scripts/test.sh`，再执行：

```bash
npm run build
npm run publish:cws
```

已知注意项：

- 若 OAuth App 仍处于 Testing，`refresh_token` 可能更快失效，建议切到 Production。
- 若网络不可达或无商店权限，优先保留仓库内文案、截图顺序、证据包与安装指引交付，不阻塞本轮承接优化。
