# v4-1 交付简报

## 状态

- 已完成：首次 `copy_success` 后，Popup 首屏与 Onboarding 已切换到快捷 Prompt 槽位复用主路径。
- 已完成：本地增长状态与匿名事件已补齐“曝光 -> 点击 -> 使用 -> 第二次成功复制”的审计字段。
- 已完成：`docs/test-cases/v4-1.md`、`docs/evidence/v4-1/*`、`prds/v4-1-*.md` 与路线图文档已同步更新。

## 效果

- 第二次打开理由从“继续摸索”收敛为“复制网页内容 + 套用 Prompt + 粘贴到 AI”。
- 首次成功后即使用户只保留默认内置 Prompt，也能直接看到并触发至少 1 个真实复用入口。
- Options 的本地 `growth-funnel` 摘要现在可直接导出复用审计对象，便于复核二次成功与商业化前置信号。
- 补齐了 3 个阻塞发布的收尾缺陷：E2E HTML 测试启动链、默认 Prompt 语言与用户设置语言对齐、匿名事件并发写入丢失。

## 修改范围

- 产品实现：
  - `src/popup/`
  - `src/content/content.ts`
  - `src/background.ts`
  - `src/shared/growth-stats.ts`
  - `src/shared/telemetry.ts`
  - `_locales/en/messages.json`
  - `_locales/zh/messages.json`
- 自动化与测试：
  - `e2e/popup-flow.spec.ts`
  - `e2e/popup-growth-flow.spec.ts`
  - `scripts/ui-integration-tests.ts`
  - `scripts/unit-tests.ts`
  - `docs/test-cases/v4-1.md`
- 证据、PRD 与汇报：
  - `prds/v4-1-1.md`
  - `prds/v4-1-2.md`
  - `prds/v4-1-3.md`
  - `docs/evidence/v4-1/*`
  - `docs/reports/v4-1-report.md`
  - `docs/roadmap.md`
  - `docs/roadmap_status.md`

## 测试结果

- 已通过：
  - `npm run lint`
  - `npm run check-i18n`
  - `npm run type-check`
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/unit-tests.ts`
  - `node --no-warnings=ExperimentalWarning scripts/ui-integration-tests.ts`
  - `bash scripts/test.sh`
  - `npx playwright test --config=playwright.config.ts --project=main e2e/popup-growth-flow.spec.ts --grep 'popup second-open reuse path exposes built-in prompt slot, records audit fields, and exports local summary'`
