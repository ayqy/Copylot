# Chrome Web Store Setup Guide

https://developer.chrome.com/docs/webstore/using-api


refresh token经常过期（7天有效期），原因是Google auth App是Testing状态，需要点一下变成production状态，refresh token变成6个月有效期

https://console.cloud.google.com/auth/audience?project=chromestore-465702

点击左侧Audience - Publishing status

**直接看官方文档，不要看底下这些**


> 本文档将指导你完成获取并配置 Chrome Web Store Publishing API 所需的四个变量：
>
> * `CWS_EXTENSION_ID`
> * `CWS_CLIENT_ID`
> * `CWS_CLIENT_SECRET`
> * `CWS_REFRESH_TOKEN`
>
> 完成后，请将它们填入项目根目录的 `.env` 文件（可复制 `.env.example` 作为起点）。

---

## 1. 注册开发者账号

1. 使用 **个人或公司 Google 账号** 登录 Chrome Web Store 开发者控制台：<https://chrome.google.com/webstore/devconsole>  
2. 按提示 **支付 5 美元一次性注册费** 并接受开发者协议。

## 2. 创建扩展并获取 `CWS_EXTENSION_ID`

1. 在开发者控制台点击 **「Add New Item」**。  
2. 上传任意占位 ZIP（可以使用项目 `dist` 目录打包的文件）。稍后可替换。  
3. 上传完成后进入该扩展详情页，浏览器地址栏 URL 形如：

```
https://chrome.google.com/webstore/devconsole/<publisherId>/edit/<extensionId>
```

4. `extensionId` 即为需要的 **`CWS_EXTENSION_ID`**，复制并写入 `.env`。

## 3. 在 Google Cloud Console 创建项目并启用 API

1. 访问 <https://console.cloud.google.com>，点击顶部项目下拉，选择 **「新建项目」**。  
2. 命名如 `MagicCopy-CWS`，创建后进入该项目。
3. 在左侧导航 **「API 与服务 → 库」** 搜索 **Chrome Web Store API** 并 **启用**。

## 4. 配置 OAuth 同意屏幕

1. 转到 **「API 与服务 → OAuth 同意屏幕」**。  
2. 选择 **External**（外部），填写应用名称、邮箱等信息。  
3. 在 **Scopes** 步骤保持默认或添加 `.../auth/chromewebstore`（后续也可由 Playground 指定）。
4. 在 **Test users** 步骤将自己的 Google 账号加入测试用户列表。

## 5. 创建 OAuth 客户端并获取 `CLIENT_ID`/`CLIENT_SECRET`

1. 打开 **「API 与服务 → 凭据」**。  
2. 点击 **「创建凭据」 → 「OAuth 客户端 ID」**。  
3. 选择 **Desktop app** 类型，命名如 `CWS Upload`.  
4. 创建后弹窗中显示 **Client ID** 与 **Client Secret**，复制分别写入 `.env`：
   * `CWS_CLIENT_ID`
   * `CWS_CLIENT_SECRET`

## 6. 获取 `REFRESH_TOKEN`

> 需使用 Google OAuth Playground 执行「一次」三步授权，后续脚本会自动刷新 token。

1. 打开 <https://developers.google.com/oauthplayground/>。
2. 右侧 **⚙️ 设置 (OAuth 2.0 Configuration)**：
   * 勾选 **Use your own OAuth credentials**。
   * 填入刚创建的 `CWS_CLIENT_ID` 与 `CWS_CLIENT_SECRET`。
3. **Step 1** 输入框搜索并勾选 **Chrome Web Store API v1 – `https://www.googleapis.com/auth/chromewebstore`** 范围，点击 **Authorize APIs**。
4. Google 会弹出登录授权页面，选择与你的开发者账号对应的 Google 账号并同意。
5. 重定向回 Playground 后点击 **Exchange authorization code for tokens**，下方将显示 **Access token** 与 **Refresh token**。
6. 复制 **Refresh token** 并写入 `.env` 的 `CWS_REFRESH_TOKEN`。

## 7. 验证 `.env` 文件

确认 `.env` 含有如下内容（示例）：

```bash
CWS_EXTENSION_ID=abcdefghijklmnopabcdefghijklmnop
CWS_CLIENT_ID=1234567890-abc123def456.apps.googleusercontent.com
CWS_CLIENT_SECRET=GOCSPX-xyz_ABC123def456
CWS_REFRESH_TOKEN=1//04xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> 保管好 `CLIENT_SECRET` 与 `REFRESH_TOKEN`，请勿公开提交到 Git 仓库。

## 8. 打包并上传测试

```bash
npm run build           # 生成 dist/
npm run publish:cws     # 打包 zip 并上传 & 发布至公开通道
```

脚本输出 **发布成功** 后，可在开发者控制台查看状态。Chrome Web Store 可能需要数小时到数天完成审核。

---

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| "invalid_grant" 错误 | 检查 `refresh_token` 是否正确，确保 OAuth 同意屏幕将当前账号列入测试用户，并且 Refresh token 未过期/未撤销 |
| "403 Forbidden" on upload | 确保启用了 Chrome Web Store API，且 OAuth 凭据对应的项目与 API 项目相同 |
| 上传成功但发布失败 | 若扩展信息不完整（隐私政策、图标、描述等），需先在商店后台补充后再发布 |

如果仍有问题，请参考官方文档：<https://developer.chrome.com/docs/webstore> 