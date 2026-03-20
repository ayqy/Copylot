# V1-45 发布取证准备包：证据索引（离线可审计 + 上线后可直接补齐）

- 生成时间：2026-03-20T15:55:46+08:00
- 当前扩展版本号（仓库基线）：`1.1.21`（见 `manifest.json` / `dist/manifest.json` / `plugin-1.1.21.zip`）
- 证据目录：`docs/evidence/v1-45/`
- 对比基线（必须引用）：
  - Pro 意向漏斗基线：`docs/evidence/v1-42/`
  - WOM 基线（含 UTM=v1-44）：`docs/evidence/v1-44/`

> 说明：本索引用于把“发布门禁/取证/复盘”证据落盘路径固定下来。  
> 当前处于“商店可达前（离线）准备”阶段：商店端截图与“从商店安装回归”导出证据需在网络可达后补齐。

---

## 1) 离线门禁证据（当前即可落盘）

建议落盘路径：`docs/evidence/v1-45/preflight/`

- `test-YYYY-MM-DD.log`：`bash scripts/test.sh` 全量回归日志（退出码 0）
- `verify-prod-build-YYYY-MM-DD.log`：`bash scripts/verify-prod-build.sh` 生产产物自检日志（权限白名单）
- `publish-cws-dry-run-YYYY-MM-DD.log`：`npm run publish:cws -- --dry-run` 日志（必须包含 Proxy Diagnostic Block）

必备断言（从日志可审计）：
- `scripts/test.sh` 覆盖 lint/type-check/i18n/unit-tests/build:prod/verify 且 PASS
- `publish:cws -- --dry-run` 输出 `BEGIN/END CWS PROXY DIAGNOSTIC BLOCK`（脱敏）

---

## 2) 商店端截图索引（真实发布后补齐）

截图统一放在：`docs/evidence/v1-45/screenshots/`

命名规则（固定）：
- `NN-cws-<page>-<assertion>.png`（NN 为两位序号；assertion 用短语描述断言点）

必拍截图清单（发布后 24h / 7d 复用；若 7d 信息变化则补拍）：
1. `screenshots/01-cws-listing-version.png`
   - 断言：CWS listing 页面显示的版本号与 `manifest.json` 一致
2. `screenshots/02-cws-listing-updated-at.png`
   - 断言：CWS listing 页面可见“发布时间/最近更新时间”（用于取证）
3. `screenshots/03-cws-listing-pro-cta-visible.png`
   - 断言：商店描述中 Pro 候补/升级入口可见，且不暗示“Pro 已上线”
4. `screenshots/04-cws-listing-privacy-section.png`
   - 断言：隐私口径可被定位（本地处理/不上传/匿名使用数据默认 OFF，或可跳转到隐私政策）

---

## 3) 本地导出证据文件清单（真实发布后补齐）

> 来源：从 Chrome Web Store 安装回归后，在 Options -> 隐私与可观测性导出并落盘（见 `docs/test-cases/v1-45.md`）。

Pro 意向漏斗（Pro Funnel）：
- `pro-funnel-summary.json`
- `pro-funnel-evidence-pack.json`

WOM 摘要（WOM + rating prompt）：
- `wom-summary.json`
- `wom-evidence-pack.json`

（可选对照）匿名使用数据关闭态导出（应为空，不补发）：
- `pro-funnel-summary-telemetry-off.json`
- `pro-funnel-evidence-pack-telemetry-off.json`
- `wom-summary-telemetry-off.json`
- `wom-evidence-pack-telemetry-off.json`

---

## 4) 对比口径说明（与 v1-42 / v1-44 对齐）

对比目标：一旦真实发布完成，可在不需要临时决策的情况下，对比“真实商店安装回归”与既有基线的差异，形成可审计复盘结论。

1) Pro 意向漏斗对比（基线：`docs/evidence/v1-42/`）
- 对比文件：
  - 本次：`docs/evidence/v1-45/pro-funnel-summary.json`
  - 基线：`docs/evidence/v1-42/pro-funnel-summary.json`
- 对比字段：
  - `bySource.popup|options.counts.pro_entry_opened/pro_waitlist_opened/pro_waitlist_copied`
  - `bySource.popup|options.rates.waitlist_opened_per_entry_opened`
  - `bySource.popup|options.rates.waitlist_copied_per_waitlist_opened`

2) WOM 对比（基线：`docs/evidence/v1-44/`）
- 对比文件：
  - 本次：`docs/evidence/v1-45/wom-summary.json`
  - 基线：`docs/evidence/v1-44/wom-summary.json`
- 对比字段：
  - `bySource.popup|options.counts.wom_share_opened/wom_share_copied/wom_rate_opened/wom_feedback_opened`
  - `bySource.rating_prompt.counts.rating_prompt_shown/rating_prompt_action`
  - `bySource.*.rates.share_copied_per_share_opened`
  - `bySource.*.rates.rating_prompt_rate_clicked_per_prompt_shown`

