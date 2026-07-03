# v1-111 功能迭代简报

## 状态

- 已完成：Popup 首屏承接已统一为“30 秒完成第一次干净复制”，并能基于 `copilot_growth_stats` 切换首次成功前后状态。
- 已完成：Chrome Web Store 中英文说明、截图顺序、官网首页承接规范、安装指引与官方链接资产已对齐到同一套首次成功叙事。
- 已完成：`docs/test-cases/v1-111.md`、`docs/evidence/v1-111/*` 与 `bash scripts/test.sh` 已形成首次成功承接的测试、审计与汇报闭环。

## 效果

- 安装承接从“能安装”推进到“安装后更容易立刻试第一次干净复制”。
- Popup、商店说明、官网承接规范、截图顺序与安装指引现在都围绕同一条主路径：长文 / 表格 / 代码块 -> 复制 -> 粘贴验证。
- 首次成功漏斗的字段来源、导出路径与对账规则已被固定，后续可以直接拿来判断承接优化是否真的缩短了安装到首次 `copy_success` 的距离。

## 反思与优化方向

- 本轮最有效的动作不是再扩写泛功能文案，而是把首屏、商店和官网承接压缩到同一条第一次成功路径上。
- 真正影响增长的下一层，不再是“用户是否知道能装”，而是“第一次成功后有没有第二次打开和继续复用的理由”。
- 因为官网真实源码仍不在当前仓库，本轮把首页承接规范写成了可交付文档；后续若切到站点仓，应优先按这份规范落地而不是重写口径。

## 下一步最重要的 3 件事

1. 把首次成功后的第二步固定成可复用动作：在 Popup / Onboarding 中强化快捷 Prompt 槽位或追加模式，给用户明确的第二次打开理由。
2. 针对长文、表格、代码块三类高频场景补一轮“复制后无需返工”的稳定性专项，优先消灭影响复用的边角失败。
3. 把分享与评价提示绑定到“已完成至少 2 次成功复制”之后，并保留可导出证据，确保口碑动作只发生在价值已被验证之后。

## 修改范围

- Popup 承接与交互：
  - `src/popup/popup.html`
  - `src/popup/popup.ts`
  - `src/popup/popup.css`
  - `_locales/en/messages.json`
  - `_locales/zh/messages.json`
- 商店说明、安装承接与官方链接：
  - `docs/ChromeWebStore-Description-EN.md`
  - `docs/ChromeWebStore-Description-ZH.md`
  - `docs/ChromeWebStoreSetup.md`
  - `src/shared/external-links.ts`
  - `docs/growth/install-first-launch-pack-v1-111.md`
- 测试、证据与路线图：
  - `e2e/popup-flow.spec.ts`
  - `e2e/popup-settings-flow.spec.ts`
  - `scripts/test-helpers/chrome-mock.ts`
  - `scripts/ui-integration-tests.ts`
  - `scripts/unit-tests.ts`
  - `docs/test-cases/v1-111.md`
  - `docs/evidence/v1-111/*`
  - `docs/roadmap.md`
  - `docs/roadmap_status.md`
  - `docs/reports/v1-111-report.md`

## 验证

- 已执行：`bash scripts/test.sh`
- 结果：23 个测试组 `passed`，0 `failed`，1 `skipped`（`playwright:native-ui` 按既有策略跳过）
