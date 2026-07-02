# V1-106 Growth Factory Baseline Recovery Report

- 状态：已完成
- 目标：用当前软件工厂完成 `Copylot` 一轮真实增长 PDCA，并修复真实 SEO 数据链路长期缺失的问题。

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

## 下一步最重要的 3 件事

1. 修复 `https://copy.useai.online/pricing` 的可访问性，并重新提交 sitemap / GSC。
2. 围绕首页扩出首批可收录内容面，优先补 `facts`、`use_case`、`guide_detail` 三类页面。
3. 把增长重点继续留在 GSC / GA4 已有真实数据与站内承载改造上，进一步降低低质量目录站探测优先级。
