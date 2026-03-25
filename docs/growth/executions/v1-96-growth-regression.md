# v1-96 工厂增长回归执行记录（外网预检分流 + xhs 降级闭环）

## 0) 结论摘要

- `curl` 外网预检结论：`network_blocked`（官网/CWS 域名不可解析，`1.1.1.1:443` 不可连通）。
- 分流决策：命中降级路径，禁止 Playwright 打开外网站点，改为“本地素材生成 + 手动发布清单 + 阻塞留痕 + make todo”。
- 产出结果：已落盘 xhs 成套竖版图片（封面 + 第 3-8 页）、素材索引、发布文案、CTA 链接与转化证据索引。

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

## 3) 转化证据口径（可导出/可复核）

- 统一参数：`utm_source=xhs` / `utm_medium=organic_social` / `utm_campaign=v1_96_growth_regression`
- 统一入口：
  - 官网
  - CWS 商店
  - Pro 候补
- 漏斗索引（写入 `conversion-evidence-index.json`）：
  - `distribution_post`
  - `landing_click`
  - `store_visit`
  - `install`
  - `pro_waitlist_open`
  - `pro_waitlist_submit`
