# 真实上架后 24h / 7d 复盘模板（收入证据链：转化 + 口碑 + 可观测性）

> 目的：把“真实发布 -> 商店端取证 -> 从商店安装回归 -> 导出本地摘要/证据包 -> 落盘索引 -> 可对比复盘”固化成可复制的最短路径。  
> 复盘基线（必须引用，便于对比）：`docs/evidence/v1-42/`（Pro 意向漏斗基线）、`docs/evidence/v1-44/`（WOM 基线，含 UTM=v1-44）。

## 0) 本次真实发布信息（先填）

| 字段 | 值 |
|---|---|
| 复盘对象（版本） | `[填写：例如 1.1.21]` |
| 真实发布时间（本地时区） | `[填写：例如 2026-03-xx 12:34 +08:00]` |
| CWS 列表页链接 | `[填写]` |
| CWS Item ID（extension id） | `[填写：与 .env / publish 脚本一致]` |
| 代理/VPN 说明（可审计，不含敏感信息） | `[填写：例如 HTTPS_PROXY=http://127.0.0.1:7890]` |
| 取证目录（落盘路径） | `docs/evidence/v1-45/`（或复制该目录到新版本目录后填写新路径） |

---

## 1) 商店端取证清单（截图命名规范 + 索引位置）

截图落盘路径（固定）：
- `docs/evidence/v1-45/screenshots/`
- 并在 `docs/evidence/v1-45/index.md` 更新“截图索引”条目（文件名 -> 断言）

命名规范（建议，NN 为两位序号，断言短语尽量可读）：
- `NN-cws-listing-version.png`
- `NN-cws-listing-updated-at.png`
- `NN-cws-listing-pro-cta-visible.png`
- `NN-cws-listing-privacy-section.png`

商店端必拍断言（24h 与 7d 均可复用；若 7d 有变化则补拍）：
1. 版本号可见（listing 页面显示的版本号与 `manifest.json` 一致）
2. 发布时间/最近更新时间可见（listing 页面显示的 updated date/time）
3. 核心 CTA 可见性（Pro 候补/升级入口的文案与位置，且不暗示“Pro 已上线”）
4. 隐私口径可见性（至少能定位到“本地处理/不上传/匿名使用数据默认 OFF”的描述或跳转链接）

---

## 2) 可量化指标口径（与本地导出一致；用于 24h/7d 对比）

### 2.1 Pro 意向漏斗（Pro Funnel）

数据来源（本地导出）：
- Options -> 隐私与可观测性 -> 「Pro 意向漏斗摘要」/「证据包」
- 文件落盘（建议固定命名）：
  - `docs/evidence/v1-45/pro-funnel-summary.json`
  - `docs/evidence/v1-45/pro-funnel-evidence-pack.json`

指标字段（与导出 JSON 一致）：
- `bySource.popup.counts.pro_entry_opened`
- `bySource.popup.counts.pro_waitlist_opened`
- `bySource.popup.counts.pro_waitlist_copied`
- `bySource.popup.rates.waitlist_opened_per_entry_opened`
- `bySource.popup.rates.waitlist_copied_per_waitlist_opened`
- `bySource.options.*` 同口径

对比基线引用：
- `docs/evidence/v1-42/pro-funnel-summary.json`
- `docs/evidence/v1-42/pro-funnel-evidence-pack.json`

### 2.2 WOM 摘要（Word of Mouth + Rating Prompt）

数据来源（本地导出）：
- Options -> 隐私与可观测性 -> 「WOM 摘要」/「证据包」
- 文件落盘（建议固定命名）：
  - `docs/evidence/v1-45/wom-summary.json`
  - `docs/evidence/v1-45/wom-evidence-pack.json`

指标字段（与导出 JSON 一致）：
- `bySource.popup.counts.wom_share_opened / wom_share_copied / wom_rate_opened / wom_feedback_opened`
- `bySource.options.*` 同口径
- `bySource.rating_prompt.counts.rating_prompt_shown / rating_prompt_action`
- `bySource.*.rates.share_copied_per_share_opened`
- `bySource.*.rates.rating_prompt_rate_clicked_per_prompt_shown`

对比基线引用：
- `docs/evidence/v1-44/wom-summary.json`
- `docs/evidence/v1-44/wom-evidence-pack.json`

---

## 3) 数据采集动作（从商店安装回归后：导出摘要/证据包并落盘）

> 说明：本动作用于形成“真实发布 -> 商店安装 -> 本地可观测导出 -> 落盘索引”的可审计链路。  
> 前提：已从 Chrome Web Store 安装当前版本（而非 zip/unpacked）。

1. 打开 Options -> 隐私与可观测性
2. 开启「匿名使用数据」开关（若需要采集 WOM/Pro 事件；默认 OFF）
3. 触发最短路径事件（确保有可导出的计数）：
   - Pro：打开 Popup/Options 的 Pro 候补入口（entry/opened/copied）
   - WOM：打开分享/去评价/反馈入口；若评分引导出现，完成一次操作（rate/later/never）
4. 回到隐私页导出并落盘（建议命名固定，便于对比）：
   - Pro Funnel：
     - 点击「复制摘要」保存到 `docs/evidence/v1-45/pro-funnel-summary.json`
     - 点击「复制证据包」保存到 `docs/evidence/v1-45/pro-funnel-evidence-pack.json`
   - WOM：
     - 点击「复制摘要」保存到 `docs/evidence/v1-45/wom-summary.json`
     - 点击「复制证据包」保存到 `docs/evidence/v1-45/wom-evidence-pack.json`
5. 更新证据索引：
   - 补齐 `docs/evidence/v1-45/index.md` 的截图索引与证据文件清单

---

## 4) 24h 复盘（填写表格；必须引用基线）

| 维度 | 本次 24h 观测（填 JSON 字段值 / 截图文件名） | 对比基线（v1-42 / v1-44） | 结论（可执行） |
|---|---|---|---|
| 商店端版本/发布时间/CTA 可见性 | `[填写：screenshots/NN-*.png]` | `[填写：基线无则写 N/A]` | `[填写]` |
| Pro Funnel（popup）counts/rates | `[填写：bySource.popup.counts + rates]` | `v1-42` | `[填写]` |
| Pro Funnel（options）counts/rates | `[填写]` | `v1-42` | `[填写]` |
| WOM（popup）counts/rates | `[填写]` | `v1-44` | `[填写]` |
| WOM（options）counts/rates | `[填写]` | `v1-44` | `[填写]` |
| rating_prompt（shown/action/rate 转化率） | `[填写]` | `v1-44` | `[填写]` |

产出物（24h 必交）：
- 更新后的 `docs/evidence/v1-45/index.md`
- 完整证据文件落盘（summary + evidence pack）

---

## 5) 7d 复盘（填写表格；必须引用基线 + 24h）

| 维度 | 本次 7d 观测（填 JSON 字段值 / 截图文件名） | 对比（基线 + 24h） | 结论（可执行） |
|---|---|---|---|
| 商店端信息是否变化（版本/更新时间/CTA） | `[填写：screenshots/NN-*.png]` | `[填写]` | `[填写]` |
| Pro Funnel：counts/rates 是否提升 | `[填写]` | `v1-42 + 24h` | `[填写]` |
| WOM：share/rate/feedback 是否提升 | `[填写]` | `v1-44 + 24h` | `[填写]` |
| UTM 归因口径是否仍可核验 | `[填写：打开链接 query 截图/文字]` | `v1-44` | `[填写]` |

产出物（7d 必交）：
- 补拍/补齐的商店端截图
- 更新后的 `docs/evidence/v1-45/index.md`（追加 7d 观测）
- 7d 结论与下一步动作（收入优先 Top3）

