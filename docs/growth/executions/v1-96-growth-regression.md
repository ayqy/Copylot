# v1-96 工厂增长回归执行记录（Top1 阻塞顺延 Top2）

## 0) 结论摘要

- Top1 阻塞保持不变：`CWS 权限 + 代理未启动（source ~/.bash_profile && pxy）`。
- 本轮按顺延规则完成 Top2：官网/CWS/Pro 候补入口参数统一，补齐可导出转化证据索引。
- 已完成“入口 -> 目标页 -> 转化动作 -> 意向信号”最小审计链路，并对齐 Pro 意向证据包口径。

## 1) 外网预检（先验门禁）

执行命令（本轮）：

```bash
curl -I -L --max-time 15 https://copy.useai.online/
curl -I -L --max-time 15 https://chromewebstore.google.com/
curl -I --max-time 10 https://1.1.1.1
```

证据目录：
- `docs/evidence/growth/v1-96-20260325-103441/curl-copy-useai-online.txt`
- `docs/evidence/growth/v1-96-20260325-103441/curl-chromewebstore-google.txt`
- `docs/evidence/growth/v1-96-20260325-103441/curl-1.1.1.1.txt`
- `docs/evidence/growth/v1-96-20260325-103441/network-preflight-summary.json`

结果摘要：
- 官网：`Could not resolve host: copy.useai.online`
- CWS：`Could not resolve host: chromewebstore.google.com`
- 直连外网：`Failed to connect to 1.1.1.1 port 443`

## 2) 分流动作（network_blocked）

### 2.1 Playwright 外网禁用证据

- 预检摘要 `network-preflight-summary.json` 已明确：
  - `network_blocked: true`
  - `routing_decision: degrade_to_manual`
  - `playwright_external_access: forbidden`
- 本轮未执行任何 Playwright 外网站点访问动作。

### 2.2 降级交付物（收入主链路不断）

- xhs 成套素材：`docs/growth/assets/social/xhs/v1-96/`
  - 图片：`01-cover.png` + `03-08` 内页 PNG
  - 索引：`asset-index.md`
  - 文案：`xhs-post-copy.md`
  - CTA：`cta-links.md`
  - 转化证据索引：`conversion-evidence-index.json`
- 手动发布清单：`docs/growth/checklists/manual-posting-xhs-v1-96.md`
- 阻塞留痕：`docs/growth/blocked.md`
- TODO 队列：`docs/growth/todo.md`（由 `make todo` 生成）

## 3) Top2 交付：参数统一与可审计证据

### 3.1 参数统一规则（官网 / CWS / Pro 候补）

- 统一命名：`campaign=v1_96_growth_regression` / `source=xhs` / `medium=organic_social`
- 固定参数键：`utm_campaign` / `utm_source` / `utm_medium`
- 三类入口均使用同一组命名，避免同源流量在漏斗中被拆分。

### 3.2 入口映射（入口 -> 目标页 -> 期望行为）

| 入口 | 目标页 | 期望行为 | 信号 |
| --- | --- | --- | --- |
| 官网 | `https://copy.useai.online/?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression` | 访问并进入安装/升级路径 | `landing_click` |
| CWS | `https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression` | 进入商店并触发安装 | `store_visit_or_install` |
| Pro 候补 | `https://copy.useai.online/?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression#pro` | 打开候补并提交/复制问卷 | `pro_waitlist_survey_copied` |

### 3.3 证据索引字段（可导出 / 可审计）

`docs/growth/assets/social/xhs/v1-96/conversion-evidence-index.json` 已补齐并固定：

- `channel`
- `postUrl`
- `targetUrl`
- `campaign`
- `source`
- `medium`
- `intentSignal`
- `evidencePath`

同时补齐：
- `traceability.proIntentEvidence`：对齐 `docs/evidence/v1-90/pro-intent-run-evidence-pack.json` 与 `docs/evidence/v1-81/copylot-pro-intent-decision-summary-v1-81.json`
- `auditChainSamples`：至少 1 条完整链路样例（xhs -> Pro 候补 -> 意向信号）

### 3.4 最小完整链路（可复核）

- 分发入口：xhs 图文（`postUrl=manual_post_pending`，待人工发布回填）
- 转化动作：点击 Pro 候补入口并复制意向问卷
- 意向信号：`pro_waitlist_survey_copied`
- 证据路径：
  - `docs/growth/assets/social/xhs/v1-96/conversion-evidence-index.json`
  - `docs/evidence/v1-90/pro-intent-run-evidence-pack.json`

## 4) 回切 Top1 的恢复条件

- 代理服务启动：`source ~/.bash_profile && pxy`
- CWS Developer Dashboard 编辑/发布权限到位
- 阻塞解除后按 S0 主路径回切 v1-70/v1-71（商店安装回归 + Listing 同步 + 商店端取证）
