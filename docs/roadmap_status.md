# Roadmap 状态

## 当前阶段

- 阶段名称：S4 / G4 `跨 campaign 样本复核与增长纪律`
- 阶段目标：在保持 `stay_validation` 边界的前提下，让并行增长循环持续产出可复核的跨 campaign 样本证据，确认 `advanced_cleaning` 的领先是否来自真实需求而非 acquisition 偏差，并为后续收入决策提供可信输入。
- 当前判断：`Options -> Pro` 已新增“跨 campaign 领先路线复核包”，现在最重要的问题不是继续补判断面板，而是优先补 `ph / reddit / seo` 这些薄样本或冲突 campaign，并继续约束对外话术。
- 当前交付边界：继续不做表单、问卷、候补、支付、收款或其他偏航承接；当前只补跨 campaign 复核、话术守门与收费前人类批准门槛。

## 当前进度

- 当前进度：S0 已完成 `6/6`；S1 已完成 `4/4`；S2 已完成 `4/4`；S3 已完成 `4/4`；S4 已完成 `3/4`；全局已完成 `21/22`。
- 当前进度结论：S4 的产品内复核入口、`stay_validation` 话术守门与 campaign 证据导出已经落地；剩余未完成项只剩“当复核与收费评估连续过门槛后，再创建单独的人类批准与收费实现规划”。
- 已完成事项：
  - 已统一官网、商店、扩展内入口与分享链路，形成 `官网 / 商店 -> 安装 -> 首次成功复制 -> 再次复用 -> 分享 / 评价 -> 新安装` 的免费增长闭环基线。
  - 已完成 `v4-8 / v4-9 / v4-10 / v4-11 / v4-12`，当前仓库已经具备路线比较、领先路线回写、稳定性摘要、统一 verdict 与收费评估审计包的产品内导出能力。
  - 已完成本轮 `prds/v4-13.md`：`Options -> Pro` 新增“跨 campaign 领先路线复核包”，支持复制 Markdown 与下载 JSON，并显式区分 `acquisition_bias_unresolved`、`sample_still_thin` 与 `no_campaign_signals`。
  - 已补齐 `docs/test-cases/v4-13.md`、`docs/evidence/v4-13/*` 与 `docs/reports/v4-13-report.md` 的验收路径。
- 进行中事项：
  - 当前 verdict 仍停在 `stay_validation`：`reddit / seo` 仍然支持不同 leader，`ph` 仍然是薄样本，因此还不能把这次领先解释成稳定可收费需求。
  - 当前虽然已经能导出收费评估审计包和跨 campaign 复核包，但它们的意义都是“更精确地继续验证”，不是“允许收费实现开始”。
  - 软件工厂入口仍未恢复稳定自动闭环；本轮跨 campaign 复核继续由人工接管实现、测试与文档收尾。
- 当前经营判断：
  - 收入优先下，本轮最小可交付增量已经完成；下一步应该回到真实样本补齐与对外话术纪律，而不是继续横向扩判断入口。

## 下一步最重要的 3 件事（收入优先）

1. 优先补 `ph / reddit / seo` 的真实任务样本，先清掉 `sample_still_thin` 与 `acquisition_bias_unresolved`。
2. 继续把官网、商店、扩展内导出摘要与分发素材锁在 `stay_validation`，避免任何“已验证收费”或“已接近支付上线”的暗示。
3. 只有当跨 campaign 复核与收费评估审计包在同一套口径下连续通过门槛后，才创建单独的人类批准与收费实现规划。

## 阻塞与需要的人类输入

- 官网真实源码仍不在当前仓库；若后续要把首页承接规范落到真实站点，需要切到对应站点工程，但这不阻塞扩展仓继续推进 S4。
- 当前跨 campaign 复核不依赖新增账号、凭据、支付权限、商店权限或人工审核。
- 当前软件工厂入口 `python3 -m studio run --project /Users/pocket/Documents/project/Copylot --instruction '继续推进 roadmap 并完成下一个可验证里程碑' --once` 仍会长时间无增量输出；最新一次手动中断时堆栈停在 `studio/loops/dev_loop.py -> dev_cycle -> studio/codex_runner.py -> subprocess.run(... communicate) -> selectors.poll`。本轮继续人工接管实现与回归，后续若要完全依赖工厂自动闭环，需要单独修复该阻塞。
