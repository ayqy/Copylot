# V1-5 可观测性 MVP 收尾（匿名事件打点接入 + 用例/单测补齐）简报

## 状态
- 已完成：子 PRD `prds/v1-5.md` 全部“具体任务”落地
- 已验证：`bash scripts/test.sh` 全量通过，可打包发布

## 效果
- Options 页“匿名使用数据”默认关闭；开启后才会记录本地匿名事件日志；关闭后立刻停止记录并清空 `copilot_telemetry_events`
- Popup/复制成功/Prompt 使用/新手引导/评价引导/口碑入口等关键增长动作均接入本地匿名事件日志
- 事件结构严格限定为 `name/ts/props(白名单)`，props 仅允许原子类型；不包含任何复制内容/页面内容/URL/标题；最多保留 100 条，FIFO 丢弃最旧

## 修改范围（目录/文件）
- `scripts/unit-tests.ts`（修复 Settings 字段缺失；新增 telemetry 纯函数单测）
- `src/shared/telemetry.ts`（解耦 settings 运行时依赖；补齐本地日志开关监听/清理/裁剪逻辑复用）
- `src/shared/settings-manager.ts`（新增设置字段 `isAnonymousUsageDataEnabled`；默认关闭）
- `src/options/options.html`（新增“隐私”Tab 与开关 UI）
- `src/options/options.css`（隐私 Tab 样式）
- `src/options/options.ts`（匿名使用数据开关落地；关闭时清空本地日志）
- `src/popup/popup.ts`（Popup/引导/评价/口碑入口事件打点接入）
- `src/content/content.ts`（复制成功 & Prompt 使用事件打点接入；内联 telemetry 模块）
- `docs/growth/telemetry-events.md`（新增：埋点清单）
- `docs/test-cases/v1-5.md`（新增：手工用例 + 自动化测试记录）
- `docs/reports/v1-5-report.md`（本简报）

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
