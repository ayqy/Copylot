# V1-102 Feature Priority Index

## 输入

- market_scan: `market-scan.json`
- user_signal: `user-signal.json`
- captured_at_market: `2026-04-27`
- captured_at_user: `2026-04-27`

## 评分权重

- painFrequency: 0.3
- growthLeverage: 0.25
- competitiveGap: 0.2
- stabilityTestability: 0.15
- timeToShip: 0.1

## 结果

- selected_top2: `density_based_main_content_selection, nav_aside_footer_blacklist_pruning`

| candidate | total | pain | growth | gap | stability | ship |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| density_based_main_content_selection | 4.55 | 5 | 5 | 4 | 4 | 4 |
| nav_aside_footer_blacklist_pruning | 4.55 | 5 | 4 | 4 | 5 | 5 |
| semantic_main_article_priority | 3.3 | 3 | 3 | 2 | 5 | 5 |
| reader_mode_fallback_notice | 2.6 | 2 | 2 | 3 | 4 | 3 |

## 市场来源

- Reader Mode: https://readermode.org/
- Obsidian Web Clipper Capture: https://obsidian.md/help/web-clipper/capture
- Obsidian Web Clipper Troubleshoot: https://obsidian.md/help/web-clipper/troubleshoot
- Mozilla Readability: https://github.com/mozilla/readability
- go-readability: https://github.com/mackee/go-readability

## 本地用户信号

- docs/Future-Features.md: 明确记录当前缺少主动识别并移除 sidebar/nav/footer/related 的能力。
- docs/reports/v1-35-report.md: 现有实现只在 body 路径做语义 main/article 优先，未覆盖无语义标签页面。
- docs/growth/publish-pack-2026-03-23.md: 对外增长文案多次强调 ads/nav noise，说明这仍是获客主诉求之一。
- docs/evidence/v1-66/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json: 商店物料持续承诺 main content + clean copy，需求与转化口径长期一致。
- scripts/content-interaction-tests.ts: 已新增 semantic/density/pruning 三条 reader-mode 自动化回归，具备低风险持续验证条件。

## 聚合计数

```json
{
  "noise_nav_ads_mentions": 26,
  "main_content_mentions": 20,
  "code_cleanup_mentions": 42,
  "table_mentions": 135,
  "new_reader_mode_test_fixtures": 3
}
```
