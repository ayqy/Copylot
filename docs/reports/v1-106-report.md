# V1-106 Growth Factory Baseline Recovery Report

- 状态：已完成
- 目标：用当前软件工厂完成 `Copylot` 一轮真实增长 PDCA，修复真实 SEO 数据链路长期缺失的问题，并在扩展内补齐更低流失的 Pro 意向承接链路。

## 本轮完成

- 工厂已自动为 `Copylot` 建立增长画像：`docs/growth/profile.json`
  - 自动发现并写入 `gsc_site_url=sc-domain:copy.useai.online`
  - 自动补齐 `ga4_property_id=543942561`
  - 自动补齐 `ga4_measurement_id=G-VCWBZXTFVS`
- 工厂已完成一轮真实增长执行：
  - 执行记录：`docs/growth/executions/20260702-100354-growth.md`
  - 证据目录：`docs/evidence/growth/20260702-100354-growth/`
- 工厂已完成 14 天真实 SEO 报告：
  - 报告目录：`docs/evidence/growth/20260702-100230-seo-report/`
- 扩展已新增 Popup -> Pro 问卷高意向直达：
  - Popup 新增 4 个“最想先解决什么”意向入口
  - 进入 Options -> Pro 问卷时自动预填使用场景与能力选择
  - `pro_waitlist_survey_copied` 新增 `prefill_used / prefill_capability_count` 口径，用于区分预填样本

## 真实结果

- Google 数据链路：
  - GSC：已接通，14 天窗口已拉到真实页面级数据
  - GA4：已接通，当前窗口暂无自然搜索会话
  - 当前唯一剩余阻塞：`realtime_unverified`
- 当前 14 天窗口：
  - Google Search 展现：`1`
  - Google Search 点击：`0`
  - CTR：`0.00%`
  - 平均排名：`1.00`
  - GA4 自然搜索会话：`0`
  - GA4 主要转化：`0`
- 本轮增长执行：
  - 公开候选目录站：`20`
  - 搜索收录动作：`3`
  - Google Search Console sitemap submit：`HTTP 204`
  - Site submit：`20` 个目标全部按“阻塞即跳过”策略快速留痕，无卡死

## 工厂诊断结论

- 当前不是“代理不可用”问题，跳板机代理链路已证明可稳定访问 Google。
- 当前主问题变成：
  - 自然搜索基线极薄，只有首页出现极少量真实曝光
  - `/pricing` 被识别为 `non_200_page`
  - `facts / use_case / guide_detail` 等内容面缺失
  - 目录站分发命中大量 `url_error / probe_deferred`，外链提交价值继续下降
  - 扩展内的 Pro 承接之前仍偏“空白表单”，本轮已先把高意向用户改成“先选诉求再填问卷”

## 本轮功能迭代

- 新增 Popup 内意向直达卡片：
  - `Cleaner article copy`
  - `Batch collect and organize`
  - `Advanced Prompt workflow`
  - `Note-tool export`
- 新增共享预填协议：
  - `src/shared/pro-waitlist-survey-prefill.ts`
  - 通过 `pro_survey_prefill` query 参数把 use case 与能力选择带到 Options
- 新增可审计样本字段：
  - `prefill_used`
  - `prefill_capability_count`
- 目的：
  - 减少从 Popup 到 Pro 问卷的空白填写流失
  - 在不新增联网埋点的前提下，把更高信号的需求样本沉淀到本地证据链

## 验证

- `npm run type-check`
- `npm run check-i18n`
- `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts`
- `npm run build:e2e`
- `COPYLOT_E2E_SKIP_BUILD=1 npx playwright test --config=playwright.config.ts --project=main e2e/popup-flow.spec.ts e2e/options-pro-flow.spec.ts`

## 下一步最重要的 3 件事

1. 修复 `https://copy.useai.online/pricing` 的可访问性，并重新提交 sitemap / GSC。
2. 围绕首页扩出首批可收录内容面，优先补 `facts`、`use_case`、`guide_detail` 三类页面。
3. 复盘 Popup 预填直达样本里哪类能力诉求最高，再决定 `Copylot` 下一轮最该做的具体功能。
