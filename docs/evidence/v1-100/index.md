# V1-100 Pro 意向转化最小增量证据包

- 子 PRD：`prds/v1-100.md`
- 时间窗：2026-02-23T06:00:00.000Z -> 2026-03-25T06:00:00.000Z（30 天）
- 口径说明：仅统计本地匿名 telemetry 中的 `pro_entry_opened / pro_intent_form_start / pro_intent_form_submit`。
- 来源说明：runtime telemetry 仅记录 `popup|options`；官网/商店来源通过 UTM + 统一 CTA 对齐进入同一漏斗，不虚构额外 source。

## 核心汇总
- upgradeEntryClicks：4
- formStarts：3
- formSubmits：2
- formStartRate：0.75
- intentSubmitRate：0.5

## 样本覆盖
- v1-100-official-site: 官网落地页升级 CTA -> popup_upgrade_cta
- v1-100-chrome-web-store: Chrome Web Store 候补 CTA -> popup_waitlist_cta
- v1-100-extension-in-app: 扩展内 Popup 问卷 1 分钟入口 -> popup_survey_cta

## 文件清单（sha256）
- `intent-funnel-v1-100.csv`：`2769960b48fa18a5b3f42ef707d678fb5b6881ca3191f1fd5aee552b4dc90ffa`
- `intent-funnel-summary-v1-100.json`：`5fd4f4da9e3625e4fffc86756755b8beea865a97dfaad0faa488869616ee95ed`
- `intent-sample-audit-v1-100.json`：`6265aeb72ceebd11d623e59fa33613c93334a8cb56fd1b082f93f246b39cac25`

