# V1-69 真实 CWS 发布 + 商店端取证闭环：证据索引（可审计/可复核）

- 生成时间：2026-03-21T12:54:09+08:00
- 证据目录：`docs/evidence/v1-69/`
- 扩展版本号：`1.1.28`（以证据包 `extensionVersion`/zip 内 `manifest.json` 为准）
- 结论：**BLOCKED**（Preflight DNS `ENOTFOUND`：`www.googleapis.com` / `chromewebstore.googleapis.com` 不可达，已阻断真实 publish；证据包已落盘，可复核）

## 1) 发布前门禁 + 诊断证据包（JSON，已落盘）

目录：`docs/evidence/v1-69/preflight/`

1. `copylot-cws-publish-diagnostic-pack-1.1.28-2026-03-21-044904.dry-run.json`
   - 命令：`npm run publish:cws -- --dry-run --evidence-dir docs/evidence/v1-69/preflight/`
   - 关键断言：
     - `packVersion === "v1-62"`
     - `dryRun === true`
     - `zip.sha256 === "8a73bbd025c70f1e2b9013c4cfa0468f148f20a4ced7fae6d53f05364aa19aab"`
     - `publishAttempt.errorCode === "skipped"`（dry-run 约定：不进行 upload/publish）

2. `copylot-cws-publish-diagnostic-pack-1.1.28-2026-03-21-044951.publish.json`
   - 命令：`npm run publish:cws -- --evidence-dir docs/evidence/v1-69/preflight/`
   - 关键断言：
     - `packVersion === "v1-62"`
     - `dryRun === false`
     - `zip.sha256 === "51dd627fd656f819f815db854c230e7c4505b388bf31dbd07fc89a318751f107"`
     - `publishAttempt.published === false` 且 `publishAttempt.errorCode === "preflight_failed"`（真实发布已被 Preflight 阻断）

Proxy/网络口径（脱敏，可复核）：
- `proxy.enabled=false`（未启用代理；见证据包 `proxyDiagnostic`）
- 代理优先级：`CWS_PROXY > HTTPS_PROXY > HTTP_PROXY > ALL_PROXY`（支持 `http/https/socks5/socks5h`；示例见证据包 `preflightFixHints`）

## 2) 商店端截图取证索引（待补齐）

目录：`docs/evidence/v1-69/screenshots/`

- `01-cws-store-version-and-publish-time.png`
  - 断言：版本号与发布时间可见，且与本轮发布版本一致
- `02-cws-store-pro-cta-visible.png`
  - 断言：Pro 候补 CTA 可见（不得暗示 Pro 已上线/可订阅）
- `03-cws-store-detail-top.png`
  - 断言：名称/图标/简介可见

状态：**BLOCKED**（依赖：可用代理/VPN + 商店可达 + `*.publish.json` 中 `publishAttempt.published=true` 后才能截图取证）

## 3) 从商店安装回归 + Pro 漏斗导出（待补齐）

导出并落盘（文件名固定，便于审计与对比基线 `docs/evidence/v1-42/`）：
- `docs/evidence/v1-69/pro-funnel-summary.json`
- `docs/evidence/v1-69/pro-funnel-evidence-pack.json`

关键字段断言（复核口径）：
- 事件计数非 0，且至少覆盖：`pro_entry_opened` / `pro_waitlist_opened` / `pro_waitlist_copied`
- `extensionVersion` 与商店版本一致（证据包 `meta.extensionVersion`）
- 不包含 token/secret/网页内容/URL/用户复制内容

状态：**BLOCKED**（依赖：商店可达 + 必须从 CWS 安装当前版本；禁止用 `plugin-*.zip`/unpacked 替代）

## 4) Listing 物料一致性复核口径（inputs.sha256）

- baseline：`docs/evidence/v1-66/index.md`（inputs.sha256 基线表）
- current/diff：`docs/evidence/v1-68/index.md`（diff 摘要 + sha256 互证 + `redlines=[]`）

复核动作（示例）：
- `shasum -a 256 docs/ChromeWebStore-Description-EN.md` / `docs/ChromeWebStore-Description-ZH.md` / `docs/aso/keywords.md`，与 v1-66/v1-68 evidence pack 的 `inputs.sha256` 对齐
- 商店截图中的长描述/Pro 候补 CTA 必须与上述 sha256 对应文本一致（避免“发了但物料不一致”）

