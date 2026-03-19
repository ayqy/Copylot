# V1-11 含表格混合内容转换一致性修复（复用 convertToMarkdown/PlainText 链路）简报

## 状态
- 已完成：子 PRD `prds/v1-11.md` 全部“具体任务”落地（ISSUE-009 修复/DOM 回归用例与快照/用例文档/简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- mixed content 链路统一：含表格场景不再走 `convertHtmlToMarkdown(outerHTML)` 特殊路径，改为复用 `convertToMarkdown()/convertToPlainText()`，确保与无表格路径一致（链接正文不丢、链接规范化、Markdown 清理生效）
- token 更稳：表格占位符使用 block 包裹，保证替换前后与上下文稳定分隔，避免表格与文本粘连
- 回归闭环：新增用例 `mixed-content-with-table-and-links`（含表格 + 相对链接 + 含 img/svg 链接正文 + 空锚点），落地快照并更新 `test/test-manifest.json`，可在 `public/test/index.html` 一键跑
- 文档齐全：补齐 `docs/test-cases/v1-11.md`，包含 Markdown/PlainText 手工回归与自动化回归记录；同步 `review-issues.md` ISSUE-009 状态

## 修改范围（目录/文件）
- `src/shared/content-processor.ts`
- `test/cases/mixed-content-with-table-and-links.html`
- `test/snapshots/mixed-content-with-table-and-links.expected.md`
- `test/test-manifest.json`
- `docs/test-cases/v1-11.md`
- `docs/reports/v1-11-report.md`
- `review-issues.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

