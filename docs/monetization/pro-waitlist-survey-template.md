# Pro 候补留资最小问卷模板（可复制到 Issue / 邮件 / 社群）

> 隐私提示（请务必阅读）：  
> 1) 请不要粘贴任何网页内容/复制内容/URL/标题；  
> 2) 请不要提供账号密码、验证码、订单信息、聊天记录等敏感信息；  
> 3) 本问卷仅用于收集 Pro 需求与定价意向，用于产品迭代优先级判断。

## 1) 你的主要使用场景（必填）
- 我最常用 Copylot 做什么？（1-3 句话即可）：
- 目前最大的痛点是什么？：

## 2) 你希望 Pro 优先解决的能力（可多选）
- [ ] 高级清洗（更强的去噪/去广告/结构提取）
- [ ] 批量采集（列表页/多页一键汇总）
- [ ] Prompt Pack（可复用的 Prompt 模板包/工作流）
- [ ] 笔记/知识库导出（例如 Notion/Obsidian/Markdown 结构化）
- [ ] 其他（请描述）：

## 3) 付费意向（必填一项即可）
- 是否愿意为 Pro 付费：Yes / Maybe / No
- 可接受按月价格（USD）：$?（可写区间，例如 $5-$10）
- 可接受按年价格（USD）：$?（可写区间，例如 $39-$79）

## 4) 联系方式（可选）
- 邮箱 / Telegram / 其他（可留空）：

## 5) 其他补充（可选）
- 你愿意被邀请做 15 分钟访谈吗？Yes / No
- 其他想说的：

---

## 证据口径（可量化、可审计）
- 在扩展内（Options -> Pro）点击“复制问卷（含环境信息）”会触发本地匿名事件：`pro_waitlist_survey_copied`  
  - 仅当“匿名使用数据”开关为 ON 时记录；默认 OFF 不记录  
  - 仅本地统计，不联网，不包含网页内容/复制内容
- 与本问卷相关的最小漏斗事件（同口径可导出）：  
  `pro_entry_opened` / `pro_waitlist_opened` / `pro_waitlist_copied` / `pro_waitlist_survey_copied`

## 最小动作链路（如何触发事件 -> 导出/复制摘要 -> 落盘证据索引）
1. Options -> 隐私与可观测性：开启“匿名使用数据”（默认关闭）。
2. Options -> Pro：点击“复制问卷（含环境信息）”（触发 `pro_waitlist_survey_copied`）。
3. Options -> Pro：点击“加入候补名单 / 复制候补文案”（触发 `pro_waitlist_opened / pro_waitlist_copied`）。
4. Options -> 隐私与可观测性：点击“复制本周 Pro 意向证据摘要”（7d window，DOM：`#copy-pro-intent-weekly-digest`）。
5. 按 `docs/evidence/v1-50/index.md` 的命名规范，把摘要示例/截图索引/导出文件清单落盘到 `docs/evidence/v1-50/`，形成可审计证据资产。

