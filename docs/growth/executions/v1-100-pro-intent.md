# v1-100 Pro 意向转化最小增量执行记录

## 0) 结论摘要

- 已对齐 Popup / Options / 外部落地导入的 Pro 入口 attribution。
- 已新增问卷最短路径埋点：`pro_intent_form_start / pro_intent_form_submit`。
- 已新增 v1-100 JSON / CSV 下载与离线证据生成脚本。
- Top1 阻塞未解除，本轮按顺延规则完成离线可审计收入证据闭环。

## 1) 本轮入口对齐

| 入口 | runtime source | content | 行为 |
| --- | --- | --- | --- |
| Popup 升级 CTA | `popup` | `popup_upgrade_cta` | 打开 Options Pro，记录 `pro_entry_opened` |
| Popup 问卷 CTA | `popup` | `popup_survey_cta` | 记录 `pro_entry_opened + pro_intent_form_start`，跳转问卷 |
| Popup 候补 CTA | `popup` | `popup_waitlist_cta` | 记录 `pro_entry_opened + pro_waitlist_opened`，打开 waitlist URL |
| Options 候补 CTA | `options` | `options_waitlist_cta` | 记录 `pro_entry_opened/pro_waitlist_opened` |
| Options 问卷 copy-open | `options` 或 `popup` 深链 | `options_survey_copy_open` / `popup_survey_cta` | 复制成功后记录 `pro_intent_form_submit` |

说明：
- runtime telemetry 只记录 `popup|options`
- 官网 / 商店来源通过 landing UTM 与 CTA content 桥接进入同一漏斗口径

## 2) v1-100 证据包

- `docs/evidence/v1-100/intent-funnel-v1-100.csv`
- `docs/evidence/v1-100/intent-funnel-summary-v1-100.json`
- `docs/evidence/v1-100/intent-sample-audit-v1-100.json`
- `docs/evidence/v1-100/index.md`

关键汇总：
- `upgradeEntryClicks=4`
- `formStarts=3`
- `formSubmits=2`
- `formStartRate=0.75`
- `intentSubmitRate=0.5`

## 3) 样本说明

- 官网来源样本：
  - 外部来源类别：`official_site`
  - runtime attribution：`popup_upgrade_cta`
- 商店来源样本：
  - 外部来源类别：`chrome_web_store`
  - runtime attribution：`popup_waitlist_cta`
  - 真实行为只覆盖 entry click，不伪造问卷提交
- 扩展内样本：
  - 外部来源类别：`extension_in_app`
  - runtime attribution：`popup_survey_cta`

## 4) 阻塞顺延结果

- Top1 仍阻塞：`CWS 权限 + source ~/.bash_profile && pxy 未就绪`
- 本轮顺延：执行 `v1-100`，优先完成可导出、可审计的 Pro 意向转化最小增量
- 回切条件：代理与 CWS Dashboard 权限恢复后，继续 `v1-70 / v1-71`
