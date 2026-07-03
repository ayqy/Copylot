# v1-108 功能回退与增长主线修正报告

日期：2026-07-03

## 目标

- 回退最近的“你最想先解决什么”相关功能，避免 Popup 主路径继续把用户导向需求收集。
- 把 Copylot 的商业计划与增长执行主线从“调查问卷优先”切回“浏览器插件增长闭环优先”。
- 重构官网承接面，使其围绕 `安装 -> 激活 -> 复用 -> 分享/评价 -> 带来新安装`。

## 已完成

- 已执行整枚回滚提交：
  - `git revert --no-edit 30903ea`
  - 生成回滚提交：`39c8a1f`
- 已移除 Popup 意向卡与预填链路：
  - 不再展示“你最想先解决什么”
  - 不再引导问卷或候补
- 已把 Options Pro 页收敛为：
  - Free / Pro 路线说明
  - 官网路线页链接
  - 商店安装链接
  - 分享文案与完整投放包
- 已重写活跃 roadmap / growth 文档，明确当前阶段完全不做表单、问卷、候补收集
- 已开始重构 `sites/copy` 官网与 `/pricing`、`/privacy` 承接页

## 预期结果

- Popup 恢复以复制与设置为主，不再出现意向卡、问卷、候补入口
- Options Pro 页不再提供任何表单、问卷、联系方式或候补动作
- 官网主 CTA 以安装、上手、隐私、Pro 路线说明为主
- 投放资产全部服务于增长闭环，而不是留资闭环

## 验证命令

插件仓：
- `npm run type-check`
- `npm run check-i18n`
- `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts`
- `npm run build:e2e`
- `COPYLOT_E2E_SKIP_BUILD=1 npx playwright test --config=playwright.config.ts --project=main e2e/popup-flow.spec.ts e2e/options-pro-flow.spec.ts e2e/popup-growth-flow.spec.ts`

站点仓：
- `node multisite/run-site-script.mjs lint --site copy`
- `node multisite/run-site-script.mjs build --site copy`
