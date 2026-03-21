# V1-62 商业化证据索引（真实发布取证再降摩擦：`publish:cws` 诊断证据包（JSON）一键落盘）

- 生成时间：2026-03-21T08:43:13+08:00
- 扩展版本号：以证据包 `extensionVersion` 为准（通过 `manifest.json`/`dist/manifest.json` 一致性校验后生成）
- 证据目录：`docs/evidence/v1-62/`（可被 git 审计；离线可推进）

## 样例（必须落盘，脱敏、可审计、可复核）
说明：样例文件位于 `docs/evidence/v1-62/preflight/`，文件名包含版本号与导出时间（UTC），便于归档与 diff。

- （示例）`preflight/copylot-cws-publish-diagnostic-pack-<version>-YYYY-MM-DD-HHMMSS.dry-run.json`
- `preflight/copylot-cws-publish-diagnostic-pack-1.1.28-2026-03-21-004313.dry-run.json`：dry-run（离线）样例（Preflight FAIL 仍可取证）

## 生成命令（脱敏，可复制）

1) dry-run + 证据包落盘（离线可推进）：
- `npm run publish:cws -- --dry-run --evidence-dir docs/evidence/v1-62/preflight/`

2) 非 dry-run（仅在代理/VPN 可达 + 凭据齐全时执行）：
- `npm run publish:cws -- --evidence-dir docs/evidence/v1-62/preflight/`

## 证据包验收断言（关键字段）
- `packVersion === "v1-62"`
- `dryRun` 与命令一致（true/false）
- `extensionVersion`：通过 `manifest.json`/`dist/manifest.json` 一致性校验后的版本号
- `zip.sha256`：用于产物可审计/可复核（可单测）
- `proxyDiagnostic`：复用既有脱敏输出（不得包含用户名密码/token/secret）
- `preflightReport.reportVersion === "v1-47"`
- `preflightFixHints`：FAIL 时必须非空且可执行
- `credentials`：仅 4 个 boolean，不得包含任何具体值
- `publishAttempt`：dry-run 必须标记为 `skipped`；非 dry-run 失败时必须有可审计错误码/脱敏错误信息

## “真实发布商店端取证”截图清单占位（Top2：网络恢复后执行）
说明：截图统一放在 `docs/evidence/v1-62/screenshots/`，文件名规范只用于索引与审计；截图内容需满足断言即可。

1. `screenshots/01-cws-store-version-and-publish-time.png`
   - 断言：Chrome Web Store 商店页可见版本号与发布时间（与本地发布版本一致）。
2. `screenshots/02-cws-store-pro-cta-visible.png`
   - 断言：商店页 Pro 候补 CTA 可见（用于收入路径取证）。
3. `screenshots/03-cws-store-detail-top.png`
   - 断言：商店页顶部关键物料（名称/图标/简介）与仓库产物一致（避免“发了但物料不一致”）。
