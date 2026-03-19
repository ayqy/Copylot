# V1-12 隐私页匿名事件日志可视化与一键导出（可审计）简报

## 状态
- 已完成：子 PRD `prds/v1-12.md` 全部“具体任务”落地（Options 面板/白名单过滤复用/用例文档/最小单测/简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- Options -> 隐私与可观测性新增“本地匿名事件日志”面板（默认折叠），支持：刷新/复制/清空
- 面板展示严格限定为 `copilot_telemetry_events` 的白名单过滤结果：仅 `name/ts/props(白名单)`，对存储污染数据做容错（非数组/字段异常 => `[]`）
- 导出可审计：复制内容为 pretty JSON（仅在用户点击后写入剪贴板），失败不影响 Options 其它功能
- 关闭即清空：关闭“匿名使用数据”开关后立刻清空并刷新面板，避免 UI 残留造成误解（不发送、不缓存、不补发）

## 修改范围（目录/文件）
- `src/options/options.html`
- `src/options/options.css`
- `src/options/options.ts`
- `src/shared/telemetry.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-12.md`
- `docs/reports/v1-12-report.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

