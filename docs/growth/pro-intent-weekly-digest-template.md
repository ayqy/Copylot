# 每周 Pro 意向证据摘要复盘模板（7d window，可复制到 Issue / 邮件 / 社群）

> 隐私提示：本模板只使用本地匿名事件统计与扩展环境信息，不包含网页内容/复制内容/URL/标题。对外分发时也请提示填写者不要粘贴任何敏感信息。

## 0) 本周结论（一句话）
- （例）本周 `survey_copied_per_entry_opened` 上升，说明“问卷留资”比“候补复制”更可承接；下周优先优化问卷分发渠道与文案。

## 1) 时间窗与口径
- 时间窗：过去 7 天（本地时间，以摘要中的 `from/to` 为准）
- 数据来源：Options -> 隐私与可观测性 -> `复制本周 Pro 意向证据摘要`（7d window）
- 事件口径（与 `docs/growth/telemetry-events.md` 一致）：
  - `pro_entry_opened`：触达 Pro 入口
  - `pro_waitlist_opened`：打开候补登记入口
  - `pro_waitlist_copied`：复制候补文案成功
  - `pro_waitlist_survey_copied`：复制“付费意向问卷（可选）”成功
- 转化率定义（分母为 0 输出 `N/A`）：
  - `waitlist_opened_per_entry_opened = pro_waitlist_opened / pro_entry_opened`
  - `waitlist_copied_per_waitlist_opened = pro_waitlist_copied / pro_waitlist_opened`
  - `survey_copied_per_entry_opened = pro_waitlist_survey_copied / pro_entry_opened`

## 2) 本周数据（粘贴区）

将扩展生成的 Markdown 摘要粘贴到这里（保持原样，便于审计）：

```md
（paste weekly digest here）
```

## 3) 解读与洞察（为什么会这样）
- 入口触达（entry_opened）主要来自哪里（popup/options）？
- 候补打开（waitlist_opened）是否能跟上入口触达？
- “问卷复制”与“候补复制”的相对占比变化说明了什么？
- 是否存在明显漏斗断点（某一步骤为 0）？

## 4) 下一步假设与最小动作（收入优先）
1. （假设）  
   （动作：渠道/文案/触发点）  
   （验证：下周指标变化 + 需要落盘的证据）
2. （假设）  
   （动作）  
   （验证）
3. （假设）  
   （动作）  
   （验证）

## 5) 证据落盘索引
- 证据目录：`docs/evidence/v1-50/`
- 索引文件：`docs/evidence/v1-50/index.md`
- 落盘要求：至少包含 weekly digest ON/OFF 样例、截图索引、导出文件清单与命名规范（可被 git 审计）

## 6) 最小动作链路（触发事件 -> 导出/复制摘要 -> 落盘）
1. Options -> 隐私与可观测性：开启“匿名使用数据”（默认关闭）。
2. 触发动作：打开 Pro 入口/候补/复制文案/复制问卷（触发 `pro_entry_opened` / `pro_waitlist_opened` / `pro_waitlist_copied` / `pro_waitlist_survey_copied`）。
3. Options -> 隐私与可观测性：点击 `复制本周 Pro 意向证据摘要`（DOM：`#copy-pro-intent-weekly-digest`）。
4. 将摘要粘贴到本模板，并把摘要示例与截图索引按 `docs/evidence/v1-50/index.md` 规范落盘，形成可复用、可审计的商业化证据资产。

