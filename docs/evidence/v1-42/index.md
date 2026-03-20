# V1-42 商业化证据索引（转化入口跑数基线）

- 生成时间：2026-03-20T14:10:14+08:00
- 扩展版本号：`1.1.20`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip`（本次为 `plugin-1.1.20.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-42/`（可被 git 审计；不依赖外网）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-42/screenshots/`，文件名在 `docs/test-cases/v1-42.md` 中有规范；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-popup-pro-entry.png`
   - 断言：Popup 内“升级 Pro / 加入候补名单 / 复制候补文案”入口可见且可点击。
2. `screenshots/02-popup-waitlist-copy.png`
   - 断言：点击 Popup “复制候补文案”后按钮反馈为 Copied/已复制（代表写入剪贴板成功）；同时应记录 `pro_waitlist_copied`（`props.source=popup`）。
3. `screenshots/03-options-pro-tab.png`
   - 断言：Options -> Pro Tab 可打开；包含“加入候补名单 / 复制候补文案 / 了解范围（pro-scope）”入口可用，且候补文案口径与 Popup 一致。
4. `screenshots/04-privacy-telemetry-off.png`
   - 断言：Options -> 隐私与可观测性：匿名使用数据开关默认关闭；关闭状态下不记录/不导出（Pro 面板提示不可用；导出应为空且不补发）。
5. `screenshots/05-privacy-telemetry-on.png`
   - 断言：开启匿名使用数据后触发最短路径事件；Pro 面板可刷新并展示“分来源计数 + 转化率”；并可导出摘要与证据包（脱敏、可审计）。

## 证据文件清单（脱敏、可审计）
- `pro-funnel-summary.json`：匿名使用数据开启后导出的「Pro 意向漏斗摘要」落盘文件
- `pro-funnel-evidence-pack.json`：匿名使用数据开启后导出的「证据包」落盘文件（白名单字段、无敏感信息）
- `pro-funnel-summary-telemetry-off.json`：匿名使用数据关闭后的摘要导出（应为空/不可用）
- `pro-funnel-evidence-pack-telemetry-off.json`：匿名使用数据关闭后的证据包导出（`events=[]`；不补发）

## 基线口径（按 `props.source` 拆分的事件计数与转化率）
口径定义（与隐私页导出一致）：
- 事件计数：`pro_entry_opened` / `pro_waitlist_opened` / `pro_waitlist_copied`
- 转化率：
  - `opened/entry = pro_waitlist_opened / pro_entry_opened`
  - `copied/opened = pro_waitlist_copied / pro_waitlist_opened`
  - 分母为 0 时为 `null`

本次基线（见 `pro-funnel-summary.json`）：

| source | entry_opened | waitlist_opened | waitlist_copied | opened/entry | copied/opened |
| --- | --- | --- | --- | --- | --- |
| popup | 1 | 1 | 1 | 1 | 1 |
| options | 1 | 1 | 1 | 1 | 1 |

