# v4-2 交付简报

## 状态

- 待执行：代码块场景“复制后无需返工”稳定性专项已立项为 `prds/v4-2.md`。
- 待执行：`docs/test-cases/v4-2.md` 已固定本轮自动化与手工验收范围。
- 待执行：`docs/evidence/v4-2/*` 将承接本轮复用证据与商业化证明。

## 目标效果

- 让代码块场景成为第二次打开后更稳的真实复用入口，而不是需要手工返工的高摩擦路径。
- 先解决缩进、行号和复制按钮噪声残留三个最直接阻碍复用的问题。
- 保留能证明“减少返工 -> 更容易再次复用”的回归与商业化证据。

## 预期修改范围

- 产品实现：
  - `src/shared/code-block-cleaner.ts`
  - `src/shared/content-processor.ts`
  - `src/content/content.ts`
- 自动化与测试：
  - `e2e/code-block-flow.spec.ts`
  - `e2e/fixtures/code.html`
  - `docs/test-cases/v4-2.md`
- 证据、PRD 与汇报：
  - `prds/v4-2.md`
  - `docs/evidence/v4-2/*`
  - `docs/reports/v4-2-report.md`
  - `docs/roadmap.md`
  - `docs/roadmap_status.md`

## 测试要求

- 统一入口：`bash scripts/test.sh`
- 核心专项：
  - 代码块悬停复制保留缩进与空行
  - 行号剥离稳定且不误删真实代码
  - 复制按钮噪声清理稳定且不误伤正文
  - 整页转换保留 fenced code 与周边上下文
