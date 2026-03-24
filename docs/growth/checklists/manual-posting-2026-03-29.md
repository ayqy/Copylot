# 2026-03-29 手动发布清单（D6：反馈复盘征集 + 迭代清单输出）

目标：在无法自动化登录/发布时，仍能**当天完成 1 条“反馈征集/投票贴”**，并把过去 6 天的反馈收敛成可执行的迭代清单（进入 S3），形成可复盘闭环。

所用物料：
- 反馈征集模板：`docs/growth/publish-pack-2026-03-23.md`（7) D6）
- 反馈处理清单：`docs/growth/checklists/feedback-triage-2026-03-23.md`
- 指标记录表：`docs/growth/metrics-tracker-2026-03-23.md`

## 0) 发布前 10 分钟准备

1. 选择渠道（二选一）：
   - X / Twitter（优先：投票/回复效率高）
   - 中文社群（微信/即刻/群）：用中文模板
2. 确认链接（带 UTM）：
   - 商店：https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=copylot-ext&utm_medium=distribution_toolkit&utm_campaign=twitter

## 1) 反馈征集贴（当天只发 1 条也可以）

1. 打开发帖入口
2. 复制 `docs/growth/publish-pack-2026-03-23.md` 的 7) D6（EN 或中文）
3. 将链接 `utm_campaign` 固定为：
   - X：`twitter`
   - 中文社群：`wechat/jike`（按你实际渠道填）
4. 发布后把“帖子 URL/截图存档位置（若无 URL）”记录到 `docs/growth/metrics-tracker-2026-03-23.md`（对应 2026-03-29 行）

**D6 目标（反馈征集）**
- 回复/投票 ≥ 10
- 有效反馈 ≥ 5（可复现、可改进优先）

## 2) 反馈收敛（45–60 分钟，产出可执行迭代清单）

1. 用 `docs/growth/checklists/feedback-triage-2026-03-23.md` 的分类法，把新增反馈按以下标签整理到指标表「反馈记录」区：
   - bug / 需求 / 表扬
   - 复现结论（能复现/不能复现/需要更多信息）
2. 输出“只改 3 件事”的最小迭代清单（建议口径）：
   - P0：能显著提升首次成功复制率（Activation）
   - P1：能显著减少返工（确定性/一致性）
   - P2：能显著提升 WOM（评价/分享/推荐）
3. 将迭代清单写入当日执行记录（建议路径）：
   - `docs/growth/executions/2026-03-29.md`（若尚未创建，可先新建 1 个 Markdown，三段即可：结论/证据/下一步）

## 3) 当天收尾（15 分钟）

1. 在 `docs/growth/metrics-tracker-2026-03-23.md` 补齐：
   - 发布链接/截图存档
   - 回复数/投票数（若可见）
   - 反馈条目链接（Issue/评论）
2. 若出现网络/账号阻塞：按 `docs/growth/blocked.md` 补齐证据与所需输入（不要卡住）。

