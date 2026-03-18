# V1-6 商业化意向验证 MVP（升级 Pro / 候补名单入口）简报

## 状态
- 已完成：子 PRD `prds/v1-6.md` 全部“具体任务”落地
- 已验证：`bash scripts/test.sh` 全量通过，可打包发布

## 效果
- Popup 增加稳定入口：`#upgrade-pro-entry`（升级 Pro）与候补入口（加入候补名单）；升级 Pro 会打开 Options 并定位到 `#pro`
- Options 增加 Pro Tab：`.tab-btn[data-tab="pro"]` + `#pro-tab`；支持 URL hash 定位（`src/options/options.html#pro`），并提供价值说明与行动按钮（`#pro-waitlist-button` / `#pro-waitlist-copy`）
- 候补登记链接统一由 `src/shared/monetization.ts` 构造：跳转 GitHub `issues/new` 并预填 title/body；body 仅包含扩展版本/扩展 ID/语言信息 + 占位提示，明确提醒不要填写任何网页内容或复制内容
- “匿名使用数据”开关开启时记录本地匿名意向事件：`pro_entry_opened` / `pro_waitlist_opened` / `pro_waitlist_copied`；关闭时立即清空 `copilot_telemetry_events` 且不再记录；props 严格白名单过滤且仅原子类型；最多保留 100 条并 FIFO 丢弃最旧

## 修改范围（目录/文件）
- `src/shared/monetization.ts`（新增：候补登记 GitHub Issue URL 构造与模板集中管理）
- `src/shared/telemetry.ts`（新增：`pro_*` 事件名与 props allowlist）
- `scripts/unit-tests.ts`（新增：`pro_*` 事件 sanitizeTelemetryEvent 白名单过滤单测）
- `src/popup/popup.html` / `src/popup/popup.css` / `src/popup/popup.ts`（新增：升级 Pro / 候补入口 + 跳转 + 埋点）
- `src/options/options.html` / `src/options/options.css` / `src/options/options.ts`（新增：Pro Tab + hash 定位 + 候补跳转/复制 + 埋点；修复 Tabs 切换影响导入导出弹窗的耦合问题）
- `_locales/en/messages.json` / `_locales/zh/messages.json`（新增：Pro 相关 UI 文案与候补 Issue 模板）
- `docs/growth/telemetry-events.md`（更新：补齐 `pro_*` 事件清单）
- `docs/test-cases/v1-6.md`（新增：手工用例 + 自动化测试记录）
- `docs/reports/v1-6-report.md`（本简报）

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

