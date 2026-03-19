# Chrome Web Store 更新日志模板（可复制粘贴）

目标：提供一个可复用的 CWS Release Notes 模板，保证每次发版：
- 不夸大、不写未实现能力
- 隐私/权限口径清晰（无变更也要声明）
- 验证步骤固定且可回归（必须 `bash scripts/test.sh` 通过）

## 使用方式
1. 将下方“Release Notes（Template）”整段复制到 CWS 更新日志输入框。
2. 按版本实际情况替换占位符（`{version}` / `{date}` 等）。
3. **禁止**加入“未来能力/设想/路线图”表述；只写当前版本真实交付。

## Release Notes（Template）
> 建议保持英文（便于国际化）；如需中文，可在同一结构下追加一份中文版本。

Copylot {version} ({date})

Highlights
- {Highlight 1: user-facing, concrete}
- {Highlight 2 (optional)}
- {Highlight 3 (optional)}

Fixes
- {Fix 1: user-facing, non-overly-technical}
- {Fix 2 (optional)}

Privacy
- No new permissions.
- No new data collection and no online analytics.
- Copied content stays on your device (on-device extraction/cleanup/formatting).
- Anonymous usage data: OFF by default; if enabled, it only records a local anonymous event log and is not sent over the network.

Verification (internal)
- Required: `bash scripts/test.sh` (lint / type-check / i18n / unit-tests / build:prod) must pass.

