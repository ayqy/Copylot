# V1-55 商业化证据索引（Pro 候补分发工具包：候补链接/招募文案一键复制 + 强制带 campaign）

- 生成时间：2026-03-21T03:11:05+08:00
- 扩展版本号：`1.1.27`
- 安装方式（验收口径）：使用仓库内最新 `plugin-*.zip`（本次为 `plugin-1.1.27.zip`）解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）
- 证据目录：`docs/evidence/v1-55/`（可被 git 审计；不依赖外网）

## 对外分发最小操作说明（为什么必须填 campaign）
1) 目的：渠道归因 + ROI 对齐
- 分发工具包生成的候补链接会把 `campaign` 写入 GitHub issue body（可解码复核），用于把“你在哪个渠道投放/发布”与后续留资复盘对齐。

2) 约束：隐私与合规红线
- 不新增扩展权限；不联网发送数据；不采集用户复制内容。
- 分发工具包复制内容仅包含固定模板 + 扩展环境信息 + campaign；不拼入任何网页内容/复制内容/当前网页 URL/标题。

## 如何用 3 件套证据复核本周各 campaign 的 leads 与 leads_per_entry_opened
说明：本轮不修改 v1-50/v1-51/v1-54 的既有字段与统计口径；分发工具包的目标是“强制把 campaign 填对”，让既有证据链更容易复用。

- v1-50 weekly digest：用于本周整体摘要与按 campaign 拆分（Options -> 隐私与可观测性 -> 复制本周 Pro 意向证据摘要）
- v1-51 7d 明细 CSV：用于复核 overall 事件计数（Options -> 隐私与可观测性 -> 导出过去 7 天 Pro 意向明细 CSV）
- v1-54 按 campaign 聚合 7d CSV：用于直接对比各 campaign 的 `leads` 与 `leads_per_entry_opened`（Options -> 隐私与可观测性 -> 导出过去 7 天 Pro 意向按 campaign 聚合 CSV）

字段复核口径（与 v1-54 一致）：
- `leads = proWaitlistCopied + proWaitlistSurveyCopied`
- `leads_per_entry_opened = leads / proEntryOpened`（分母为 0 输出 `N/A`）

## 截图索引（必测关键路径）
说明：截图统一放在 `docs/evidence/v1-55/screenshots/`，文件名规范见 `docs/test-cases/v1-55.md`；本索引只关心“文件名 -> 断言”。

1. `screenshots/01-pro-distribution-toolkit-entry.png`
   - 断言：Options -> Pro Tab 存在分发工具包两个入口（稳定 DOM：`#pro-waitlist-url-copy` / `#pro-waitlist-recruit-copy`），且与 `#pro-intent-campaign` 同区域。
2. `screenshots/02-pro-distribution-toolkit-disabled.png`
   - 断言：`campaign` 为空或非法时：两个按钮置灰（disabled）且提示文案可见（DOM：`#pro-waitlist-distribution-campaign-required`）。
3. `screenshots/03-pro-distribution-toolkit-copied.png`
   - 断言：`campaign` 合法时：两个按钮可点击，点击后短暂显示“已复制”（不包含网页内容/复制内容/当前网页 URL/标题）。

## 样例（必须落盘，脱敏、可审计）

### 候补链接样例（可解码复核 body 含 campaign 行）
- 文件：`docs/evidence/v1-55/pro-waitlist-url.sample.txt`
- 复核命令（示例）：
  - `node -e 'const u=new URL(require(\"fs\").readFileSync(process.argv[1],\"utf8\").trim()); console.log(u.searchParams.get(\"body\"));' docs/evidence/v1-55/pro-waitlist-url.sample.txt`
- 断言：输出内容中包含 `campaign: twitter`（本样例 campaign 为 `twitter`）。

### 招募文案样例（必须包含候补链接）
- 文件：`docs/evidence/v1-55/pro-waitlist-recruit-copy.sample.txt`
- 断言：文案中包含候补链接（与上一条样例一致），并包含 campaign 信息。

### 按 campaign 聚合 CSV 导出样例（v1-54 口径，用于留资复盘）
- 文件：`docs/evidence/v1-55/copylot-pro-intent-by-campaign-7d-2026-03-21.csv`
- 断言：CSV 字段固定且可直接复算 `leads = proWaitlistCopied + proWaitlistSurveyCopied`。

