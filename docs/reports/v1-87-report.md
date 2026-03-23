# V1-87 Pro 意向转化提升：Popup 问卷入口前置 + 一次性来源归因 + 可导出证据落盘（简报）

## 状态
- 已完成：Popup Pro 区新增“Pro 问卷（1 分钟）”按钮，点击后直达 Options `#pro-waitlist-survey`，并透传一次性归因参数 `?pro_survey_source=popup`（仅用于下一次问卷复制事件归因）。
- 已完成：Options 支持 `#pro-waitlist-survey` 深链接定位与一次性归因消费；复制问卷时 `pro_waitlist_survey_copied.props.source` 严格为 `popup|options`，且一次性归因仅消费 1 次，避免后续误归因。
- 已完成：补齐单测门禁（`scripts/unit-tests.ts`），并通过 `bash scripts/test.sh`。
- 已完成：用例与证据落盘（`docs/test-cases/v1-87.md` + `docs/evidence/v1-87/`）。

## 效果（商业化/增长）
- 入口更低摩擦：Popup 直接可发现并直达问卷区，减少“打开 Options 再寻找入口”的阻力。
- 归因可审计：`pro_waitlist_survey_copied` 的 `source` 严格归因到 `popup|options`，支持在 Options -> 隐私页 ->「Pro 意向漏斗摘要」按来源观察并导出复盘证据。
- 决策输入更快：推动 `survey_intent = count(pro_waitlist_survey_copied)` 的样本量增长路径更清晰，并可落盘证据用于后续 S4 go/no-go 复盘。

## 测试
- 自动化回归：`bash scripts/test.sh`（PASS）

## 修改范围（目录/文件）
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `src/popup/popup.html`
- `src/popup/popup.ts`
- `src/popup/popup.css`
- `src/options/options.ts`
- `src/shared/pro-waitlist-survey-source-once.ts`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-87.md`
- `docs/evidence/v1-87/`
- `docs/reports/v1-87-report.md`
- `docs/roadmap.md`
- `docs/roadmap_status.md`

