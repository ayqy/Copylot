# v1-96 xhs CTA 链接（转化参数统一口径）

## 1) 固定命名规则（官网 / CWS / Pro 候补）

- `campaign=v1_96_growth_regression`
- `source=xhs`
- `medium=organic_social`
- URL 参数键统一使用：`utm_campaign` / `utm_source` / `utm_medium`
- 禁止同源流量出现别名参数（如 `campaign/source/medium` 直接拼接）

## 2) 入口映射（入口 -> 目标页 -> 期望行为）

1. 官网入口  
   - targetUrl: `https://copy.useai.online/?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression`  
   - 期望行为：访问落地页并进入安装/升级链路（`landing_click`）

2. CWS 商店入口  
   - targetUrl: `https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression`  
   - 期望行为：进入商店并触发安装行为（`store_visit_or_install`）

3. Pro 候补入口  
   - targetUrl: `https://copy.useai.online/?utm_source=xhs&utm_medium=organic_social&utm_campaign=v1_96_growth_regression#pro`  
   - 期望行为：打开候补并提交意向（`pro_waitlist_opened` / `pro_waitlist_survey_copied`）
