# v1-109 功能迭代简报

## 状态

- 已完成：统一测试基线已切到无表单安装闭环，`popup.html` 不再要求旧的 `popup-pro-waitlist` 节点。
- 已完成：路线图状态与 `docs/evidence/v1-75/*` 投放证据已统一到官网首页、商店安装页和 `/pricing` 路线页。
- 已完成：补齐 `docs/test-cases/v1-109.md`，把 Popup、Options Pro 分享工具、投放包和统一测试入口纳入同一回归基线。

## 效果

- Popup 的 Pro 入口现在只要求保留 `#upgrade-pro-entry`，不再把旧候补容器当作必备结构。
- 对外分享资产与官方链接清单已经从“候补页”切到 `/pricing` 路线页，更符合当前不做表单/候补收集的增长边界。
- 路线图与状态看板把阶段反思、优化方向和收入优先 Top3 明确写成“安装承接 + 信任承接 + 无表单投放闭环”。

## 修改范围

- 测试与门禁：
  - `scripts/unit-tests.ts`
  - `docs/test-cases/v1-109.md`
- 路线图与证据：
  - `docs/roadmap.md`
  - `docs/roadmap_status.md`
  - `docs/evidence/v1-75/index.md`
  - `docs/evidence/v1-75/official-links.json`
  - `docs/evidence/v1-75/pro-distribution-pack.sample.md`
- 汇报：
  - `docs/reports/v1-109-report.md`
