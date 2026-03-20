# V1-39 解除真实上架阻塞：publish:cws 代理链路确定性修复 + 一键诊断 + 发布取证闭环 简报

## 状态
- 已完成：子 PRD `prds/v1-39.md` 全部“具体任务”落地（仅改动发布脚本/测试/文档；未改动扩展运行时逻辑 `src/`）
  - `publish:cws` 代理链路确定性修复：环境变量优先级 + scheme 强校验 + `NO_PROXY` 支持 + 全局 fetch 走 undici dispatcher
  - 一键诊断：脚本启动阶段输出可复制的「Proxy Diagnostic Block」（可审计、可落盘、无敏感信息）
  - 失败即指路：对 `ENOTFOUND/fetch failed/timeout` 等网络类错误输出可执行排障指引（含可复制 env 示例）
  - 测试用例/取证闭环：已新增并填写 `docs/test-cases/v1-39.md`
- 仍需人类输入才能闭环：真实 CWS 发布取证依赖“可达 Google API 的代理/VPN”（见 `docs/roadmap_status.md` 与 `docs/growth/blocked.md`）

## 交付效果（解除 ENOTFOUND 阻塞的确定性前置）
1) 代理链路“确定生效”的实现口径
- `chrome-webstore-upload` 使用全局 `fetch`（Node/undici），本轮在脚本启动阶段通过 `undici.setGlobalDispatcher(EnvHttpProxyAgent)` 强制让后续 `fetch(...)` 请求走代理（而非直连）。
- 代理优先级（写入诊断块，可审计）：`CWS_PROXY` > `HTTPS_PROXY/https_proxy` > `HTTP_PROXY/http_proxy` > `ALL_PROXY/all_proxy`
- 代理 URL 强校验：缺少 scheme（例如 `127.0.0.1:7890`）将直接报错退出，并输出可复制示例（禁止静默失败导致继续直连）。
- `NO_PROXY/no_proxy`：用于指定不走代理的域名/IP；未设置时默认 `localhost,127.0.0.1,::1`（若显式设置则尊重原值，并在诊断块中记录）。

2) 可复制的 Proxy Diagnostic Block（用于排障/简报留证）
本次在“无代理 + 无凭据”的 dry-run 演练输出如下（脱敏；可直接粘贴留档）：
```text
-----BEGIN CWS PROXY DIAGNOSTIC BLOCK-----
{
  "diagnosticVersion": "v1-39",
  "proxy": {
    "enabled": false,
    "envKey": null,
    "urlMasked": null,
    "noProxy": {
      "envKey": null,
      "value": "localhost,127.0.0.1,::1"
    },
    "precedence": [
      "CWS_PROXY",
      "HTTPS_PROXY",
      "https_proxy",
      "HTTP_PROXY",
      "http_proxy",
      "ALL_PROXY",
      "all_proxy"
    ],
    "schemeRequired": true
  },
  "runtime": {
    "node": "v23.6.1"
  },
  "script": {
    "entry": "scripts/chrome-webstore.ts",
    "gitCommit": "b93586c",
    "packageVersion": "1.1.0",
    "extensionVersion": "1.1.20"
  },
  "fetch": {
    "globalFetch": true,
    "dispatcher": "undici.default"
  }
}
-----END CWS PROXY DIAGNOSTIC BLOCK-----
```

代理错误（缺少 scheme）时的“禁止静默失败”输出示例：
```text
[CWS] 代理配置错误：HTTPS_PROXY 的值缺少 scheme（协议头），当前值为：127.0.0.1:7890
可复制示例（注意：代理 URL 必须包含 scheme）：
  1) HTTPS_PROXY=http://127.0.0.1:7890
  2) ALL_PROXY=http://127.0.0.1:7890
...
```

3) 失败即指路（可执行排障）
- 当发生 `ENOTFOUND` / `fetch failed` / `timeout` 等网络类错误时，脚本将输出：
  - 错误码/底层原因（若可取）
  - 当前是否启用代理（引用诊断块中的 `proxy.enabled/envKey/urlMasked`）
  - 两组可复制环境变量示例（`HTTPS_PROXY=...` / `ALL_PROXY=...`）+ 最小必需信息说明
- 约束：不打印任何 token/secret（仅输出“是否设置”与代理脱敏 URL）。

## 关键命令（可复制）
- 自动化回归：`bash scripts/test.sh`
- dry-run（无网络调用，用于演练门禁与诊断块）：
  - `CWS_EXTENSION_ID= CWS_CLIENT_ID= CWS_CLIENT_SECRET= CWS_REFRESH_TOKEN= CWS_PROXY= HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= NO_PROXY= npm run publish:cws -- --dry-run`
- 真实发布（需可用代理/VPN + 凭据）：
  - `export HTTPS_PROXY=http://127.0.0.1:7890 && npm run publish:cws`
  - `export ALL_PROXY=http://127.0.0.1:7890 && npm run publish:cws`
  - （可选最高优先级）`export CWS_PROXY=http://127.0.0.1:7890`

## 与 v1-37 / v1-38 的衔接（收入优先的闭环）
- v1-37：已完成 `publish:cws -- --dry-run` 门禁演练，但真实发布被 `ENOTFOUND www.googleapis.com` 阻塞（网络不可达/代理不确定生效）。
- v1-38：已交付隐私页「Pro 意向漏斗摘要」与「证据包」导出，具备可量化/可审计口径。
- v1-39（本轮）：把“真实上架阻塞”从不可控变为可定位/可复现：代理链路确定性 + 一键诊断 + 失败即指路；为“真实上架取证 + 转化入口跑数”提供可执行前置条件。

## 取证索引（本轮已产出 + 待补齐）
已产出（本轮可审计材料）：
- `Proxy Diagnostic Block`：见本简报“可复制诊断块”（来自 2026-03-20 dry-run 演练）
- 自动化回归 PASS：见“测试”章节

待人类在可达环境补齐（真实发布后必须写入本文件）：
- CWS 后台/商店页截图索引：
  - 版本号（Version）+ 发布时间（Publish time）+ default channel
  - 商店页 Pro 候补 CTA 可见（按 v1-36 口径）
- 从商店安装回归后的隐私页证据导出索引（v1-38）：
  - 「Pro 意向漏斗摘要」导出内容保存位置
  - 「证据包（Pro Funnel Evidence Pack）」导出内容保存位置

## 修改范围（目录/文件）
- `scripts/chrome-webstore.ts`
- `scripts/cws-proxy.ts`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-39.md`
- `docs/reports/v1-39-report.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`
- `docs/worklog/2026-03-20.md`
- `prds/v1-39-1.md`
- `prds/v1-39-2.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 最近执行日期：2026-03-20
- 结论：PASS
- dry-run 演练：`npm run publish:cws -- --dry-run` ✅（2026-03-20；无代理/无凭据；不发生上传/发布网络调用）
