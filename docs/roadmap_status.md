# Roadmap 状态

## 当前阶段

- 阶段名称：S3 / G3 `Pro 路线验证（已收口）`
- 阶段目标：只用真实激活/复用/口碑样本去验证 Pro 路线说明与分发素材，不提前上支付、留资或其他收款承接。
- 当前判断：`prds/v4-12.md` 已把统一 verdict 固化成收费评估审计包，当前结论仍是 `stay_validation`；`S3 Pro 路线验证` 已完成，但这轮完成的是“收费评估能力”，不是“支付实现开始”。
- 当前交付边界：继续不做表单、问卷、候补、支付、收款或其他偏航承接；当前只验证 3 条路线说明与素材效果，并把收费前判断做成可导出的产品能力与审计包。

## 当前进度

- 当前进度：S0 已完成 `6/6`；S1 已完成 `4/4`；S2 已完成 `4/4`；S3 已完成 `4/4`；全局已完成 `18/18`。
- 已完成事项：
  - 已统一扩展仓可控的官网首页、商店安装页、隐私说明页、Pro 路线页四类固定链接。
  - 已把 Popup 首屏、Chrome Web Store 中英文说明、截图顺序、官网首页承接规范与安装指引统一成“第一次干净复制”叙事。
  - 已补齐 `docs/test-cases/v1-111.md`、`docs/growth/install-first-launch-pack-v1-111.md` 与 `docs/evidence/v1-111/*`，形成首次成功承接的测试与审计基线。
  - 已通过 `bash scripts/test.sh` 完成首次成功路径全量回归，包含 Popup、Options、外链、增长状态与 Playwright 主流程。
  - 已完成 `prds/v4-1.md` 的第 1 项：首次成功后 Popup / Onboarding 已切到快捷 Prompt 槽位复用主路径，并补齐二次成功复制的本地审计摘要。
  - 已补齐第二次打开主路径的发布级收尾：修复 i18n 占位符错误、让默认内置 Prompt 跟随用户设置语言生成，并把本地匿名事件写入改为串行，避免复用事件丢失。
  - 已完成 `prds/v4-2.md`：代码块悬停复制与整页转换补齐了缩进保留、行号剥离、复制按钮噪声清理与 fenced code 回归，并落盘 `docs/evidence/v4-2/*` 作为复用证据。
  - 已完成 WOM 门禁收尾：Popup / Options 的分享与评价入口已绑定到第二次成功复制之后，并补齐 `womQualificationAudit` 本地导出证据。
  - 已完成本轮 `prds/v4-3.md`：Shift 追加模式补齐了 Popup / Options 状态承接、会话清理与匿名审计导出，并通过 `bash scripts/test.sh`。
  - 已完成本轮 `prds/v4-4.md`：`Options -> Pro` 新增高级页面清洗验证素材实验区，路线打开与素材复制进入匿名 intent / distribution 导出，并通过 `bash scripts/test.sh`。
  - 已完成本轮 `prds/v4-5.md`：`Options -> Pro` 新增批量采集与整理验证卡片，路线打开与素材复制通过 `content=options_bulk_collection_cta` 进入匿名导出，并通过 `bash scripts/test.sh`。
  - 已完成本轮 `prds/v4-6.md`：`Options -> Pro` 新增结构化导出与下游工作流验证卡片，路线打开与素材复制通过 `content=options_structured_export_cta` 进入匿名导出，并通过 `bash scripts/test.sh`。
  - 已完成本轮 `prds/v4-7.md`：`Options -> Pro` 新增“收费前门槛判断”区块，可直接复制 Markdown 摘要或下载 JSON 摘要，把 `v1-81` 的 A/B/C 判断从离线脚本推进成产品内能力。
  - 已完成本轮 `prds/v4-8.md`：`Options -> Pro` 新增“三条路线样本比较”区块，可直接复制 Markdown 摘要或下载 JSON 摘要，把高级页面清洗 / 批量采集 / 结构化导出三条路线的真实打开与复制信号拉到同一张记分板上。
  - 已完成本轮 `prds/v4-9.md`：`Options -> Pro` 新增“领先路线回写包”区块，可直接复制 Markdown 回写包或下载 JSON，把当前领先路线整理成路线页、商店说明和下一轮汇总三段可复用文案。
  - 已完成本轮 `prds/v4-10.md`：`Options -> Pro` 新增“领先路线稳定性摘要”区块，可直接复制 Markdown 摘要或下载 JSON，把 `7d / 14d` 窗口与 `campaign` 支撑冲突放到同一张可复核摘要里。
  - 已完成本轮 `prds/v4-11.md`：`Options -> Pro` 新增“Pro 路线融合判断摘要”区块，可直接复制 Markdown 摘要或下载 JSON，把路线比较、回写、稳定性和 A/B/C 门槛合成统一 verdict，并明确当前仍应停留在 `stay_validation`。
  - 已完成本轮 `prds/v4-12.md`：`Options -> Pro` 新增“收费评估审计包”区块，可直接复制 Markdown 审计摘要或下载 JSON，把统一 verdict 进一步整理成 go/no-go、阻塞项、边界、下一步与证据链，并正式收口 `S3 Pro 路线验证`。
- 进行中事项：
  - 当前 verdict 仍停在 `stay_validation`：`campaign` 支撑尚未完全收敛，收费前门槛也还没有稳定达到 `C`，因此仍需继续扩大真实样本，而不是把一次领先误判成长期需求。
  - 现在虽然已经能导出收费评估审计包，但这只意味着判断闭环已完成，不代表可以直接进入支付/收款实现。
  - 软件工厂入口仍未恢复稳定自动闭环；本轮收费评估审计仍需在人工接管下推进。
- 当前经营判断：
  - 当前最小可交付增量已经把三条 Pro 验证路线的说明、分发素材、匿名归因口径、样本比较摘要、领先路线回写包、领先路线稳定性摘要、A/B/C 门槛摘要、统一 verdict 和收费评估审计包接到一起；后续应停止扩判断入口，回到真实样本、对外话术和人类批准门槛。

## 下一步最重要的 3 件事（收入优先）

1. 继续收集跨 campaign 的真实任务样本，确认 `advanced_cleaning` 的领先不是 acquisition 偏差。
2. 持续把对外话术约束在“当前优先验证方向 / stay_validation”，避免任何已验证收费或已上线支付的暗示。
3. 只有当收费评估审计包在同一窗口内连续通过三项检查后，才进入单独的人类批准与收费实现规划。

## 阻塞与需要的人类输入

- 官网真实源码仍不在当前仓库；若后续要把首页承接规范落到真实站点，需要切到对应站点工程，但这不阻塞扩展仓先推进 S3 路线验证。
- 当前高级页面清洗验证不依赖新增账号、凭据、支付权限、商店权限或人工审核。
- 当前软件工厂入口 `python3 -m studio run --project /Users/pocket/Documents/project/Copylot --instruction '继续推进 roadmap 并完成下一个可验证里程碑' --once` 本轮再次长时间无增量输出；最新一次手动中断时堆栈停在 `studio/loops/dev_loop.py -> dev_cycle -> studio/codex_runner.py -> subprocess.run(... communicate) -> selectors.poll`。本轮已人工接管实现与回归，后续若要完全依赖工厂自动闭环，需要单独修复该阻塞。
