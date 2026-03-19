# V1-29 商业化边界收敛：Pro 功能包/免费功能清单固化 + Pro Tab 口径补齐 + 候补模板强化 简报

## 状态
- 已完成：子 PRD `prds/v1-29.md` 全部“具体任务”落地（Pro scope 文档固化；Pro Tab Free vs Planned 口径补齐；候补 Issue 模板强化；用例文档闭环）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- Pro 范围与边界文档可审计固化：
  - 新增 `docs/monetization/pro-scope.md`，明确 Free（永久免费）与 Pro（规划/候补、未实现）清单；补齐边界与原则/非目标；口径与隐私政策一致且不暗示 Pro 已上线。
- Options -> Pro Tab 口径补齐（避免误解与差评）：
  - 新增 Free（永久免费）能力清单区块与 Pro（规划中，未上线）区块；增加固定“了解更多”入口指向 Pro scope 文档；新增稳定 DOM：`#pro-free-scope` / `#pro-planned-scope` / `#pro-scope-learn-more`。
  - Pro 能力列表统一收敛为“规划/候补（Not shipped yet）”口径；不引入付费墙、不新增权限、不改变候补登记跳转目标（仍为 GitHub `issues/new`）。
- 候补登记模板强化：
  - `_locales/en/messages.json` / `_locales/zh/messages.json` 的 `proWaitlistIssueBodyTemplate` 新增 Pro scope 段落与可审计文档入口，同时保持严格隐私（不预填网页/复制内容/URL/标题，仅保留环境信息与用户自填段落）。
- 测试/用例与发布闭环：
  - 新增 `docs/test-cases/v1-29.md`，覆盖用例 A-D 并记录一次 `bash scripts/test.sh` 回归结论。

## 修改范围（目录/文件）
- `docs/monetization/pro-scope.md`
- `src/options/options.html`
- `src/options/options.css`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `docs/test-cases/v1-29.md`
- `docs/reports/v1-29-report.md`
- `prds/v1-29-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
