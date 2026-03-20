# V1-50 Pro 意向验证节奏固化：每周“意向证据摘要”一键生成 + 问卷模板渠道化 简报

## 状态
- 已完成：子 PRD `prds/v1-50.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复用）
  - Options -> 隐私与可观测性新增一键动作：`复制本周 Pro 意向证据摘要`（7d window，稳定 DOM：`#copy-pro-intent-weekly-digest`）
  - 摘要为 Markdown：包含时间窗（from/to）、关键事件计数（overall + bySource）、关键转化率、环境信息与隐私声明
  - 匿名开关 OFF：摘要明确提示“匿名使用数据关闭（无可用事件）”，且不读取/不推断历史，仅输出环境信息与说明
  - 匿名开关 ON：摘要仅基于本地 telemetry（白名单 + FIFO window）计算 7d 统计；无任何新增网络请求
  - 模板渠道化：新增问卷模板与每周复盘模板，可直接复制到外部渠道使用
  - 用例/证据/简报/roadmap 进度均已落盘

## 交付效果（收入第一：在真实上架阻塞期间仍可持续获客与取证）

1) 每周可复制的“意向证据摘要”（7d window）
- 一键复制可直接粘贴到 GitHub Issue / 邮件 / 社群，形成可审计证据链路
- 字段固定：事件计数 + 转化率 + 环境信息 + 隐私声明，便于每周复盘与对比

2) 模板资产可复用（渠道化）
- `docs/monetization/pro-waitlist-survey-template.md`：对外收集 Pro 需求/定价意向的最小问卷模板
- `docs/growth/pro-intent-weekly-digest-template.md`：每周意向证据摘要复盘模板（指标口径 + 粘贴区 + 结论区 + 下一步假设）

3) 隐私与合规（不新增权限、不联网发送、不采集复制内容）
- 摘要与模板均明确：不包含网页内容/复制内容/URL/标题；仅使用本地匿名事件统计与扩展环境信息
- 匿名开关 OFF：不读取/不推断历史，不生成伪统计

## 测试/用例/证据
- 用例文档：`docs/test-cases/v1-50.md`
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-20 PASS）
- 证据索引：`docs/evidence/v1-50/index.md`

## 修改范围（目录/文件）
- `manifest.json`
- `src/options/options.html`
- `src/options/options.ts`
- `src/shared/pro-intent-weekly-digest.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/monetization/pro-waitlist-survey-template.md`
- `docs/growth/pro-intent-weekly-digest-template.md`
- `docs/test-cases/v1-50.md`
- `docs/evidence/v1-50/`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-20.md`
- `docs/reports/v1-50-report.md`

