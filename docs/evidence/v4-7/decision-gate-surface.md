# 收费前门槛判断入口说明

## 位置

- 页面：`Options -> Pro`
- 区块：`#pro-decision-gate-panel`
- 按钮：
  - `#copy-pro-intent-decision-summary`
  - `#download-pro-intent-decision-summary-json`

## 使用口径

- 输入来源：最近 7 天本地匿名问卷意向聚合
- 输出形态：
  - Markdown 摘要
  - JSON 摘要
- 决策范围：仅限 `A / B / C`

## 隐私边界

- 不包含网页正文
- 不包含复制内容
- 不包含页面 URL
- 不包含页面标题
- 不包含联系方式或其他 PII
