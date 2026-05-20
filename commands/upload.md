# 目标

帮我把最新版本的安装包，提交cws商店审核，注意，在执行上传脚本之前，需要执行pxy开启终端代理（pxy命令定义在bash profile中，如果不生效，你就直接在目标终端配置代理）

# 通用执行步骤

以下步骤是本项目里已经验证成功的一套可复用做法，后续执行同类任务时直接照此流程执行。

## 1. 固定在同一个目标终端会话中执行

必须在同一个终端会话里完成代理设置、dry-run 和真实上传，不能在一个终端里开代理、再去另一个终端执行上传。

推荐直接启动 `bash` 会话，因为 `pxy` 定义在 `~/.bash_profile`：

```bash
bash --noprofile --norc
source ~/.bash_profile
```

## 2. 先启用代理

先确认 `pxy` 已加载：

```bash
type pxy
```

如果已加载，执行：

```bash
pxy
export NO_PROXY=localhost,127.0.0.1,::1
```

然后确认代理变量已经在当前目标终端生效：

```bash
printf 'http_proxy=%s\nhttps_proxy=%s\nALL_PROXY=%s\nNO_PROXY=%s\n' "$http_proxy" "$https_proxy" "$ALL_PROXY" "$NO_PROXY"
```

本项目本次验证成功的代理值是：

```bash
http_proxy=http://127.0.0.1:1087
https_proxy=http://127.0.0.1:1087
ALL_PROXY=socks5://127.0.0.1:1080
NO_PROXY=localhost,127.0.0.1,::1
```

如果 `pxy` 不生效，就直接在目标终端手动配置：

```bash
export http_proxy=http://127.0.0.1:1087
export https_proxy=http://127.0.0.1:1087
export ALL_PROXY=socks5://127.0.0.1:1080
export NO_PROXY=localhost,127.0.0.1,::1
```

## 3. 先执行 dry-run 验证整条发布链路

先跑 dry-run，不要直接真实上传：

```bash
npm run publish:cws -- --dry-run --evidence-dir docs/evidence/cws-review-$(date +%Y%m%d)
```

这个命令会自动完成以下动作：

- 执行 `npm run test`
- 校验 `manifest.json` 和 `dist/manifest.json` 版本一致
- 基于当前 `dist/` 重新生成 `plugin-<version>.zip`
- 执行 CWS 网络预检
- 检查 `.env` 中的 CWS 凭据
- 落盘诊断证据文件

只有在以下条件都满足时，才继续真实上传：

- `npm run test` 通过
- `dist/manifest.json` 版本和根 `manifest.json` 一致
- `plugin-<version>.zip` 已重新生成
- `proxyReadiness.status` 为 `ready`
- Preflight 通过
- `.env` 中的 `CWS_EXTENSION_ID`、`CWS_CLIENT_ID`、`CWS_CLIENT_SECRET`、`CWS_REFRESH_TOKEN` 都已设置

## 4. dry-run 通过后执行真实上传

仍然在同一个终端会话里执行：

```bash
npm run publish:cws -- --evidence-dir docs/evidence/cws-review-$(date +%Y%m%d)
```

这个命令会再次自动执行完整门禁，然后再进行真实上传和发布。

成功标志是输出中出现：

```text
[CWS] 上传成功
[CWS] 发布成功
```

## 5. 完成后检查结果

确认以下结果已经出现：

- 当前版本对应的 `plugin-<version>.zip` 已生成
- 证据目录下已生成 dry-run 诊断包
- 证据目录下已生成 publish 诊断包
- 终端输出明确显示 `上传成功`
- 终端输出明确显示 `发布成功`

## 6. 本项目中已验证成功的参考命令

本次成功提交 `1.1.28` 时，实际执行成功的是：

```bash
bash --noprofile --norc
source ~/.bash_profile
pxy
export NO_PROXY=localhost,127.0.0.1,::1
npm run publish:cws -- --dry-run --evidence-dir docs/evidence/cws-review-20260520
npm run publish:cws -- --evidence-dir docs/evidence/cws-review-20260520
```

## 7. 执行原则

- 永远先开代理，再跑上传脚本
- 永远先 dry-run，再真实上传
- 永远在同一个目标终端会话里完成整套流程
- 如果 `pxy` 不生效，就直接在目标终端手动 `export` 代理
- 如果 dry-run 没通过，就不要执行真实上传
