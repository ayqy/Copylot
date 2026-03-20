# V1-36 Pro 候补转化闭环：商店页 CTA + Popup 复制候补文案 + 可导出意向证据 简报

## 状态
- 已完成：子 PRD `prds/v1-36.md` 全部“具体任务”落地（商店页 CTA 补齐 + Popup 复制候补文案 + `pro_waitlist_copied` 支持 `source=popup` + 用例/回归闭环）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 商店页（CWS）长描述新增“Copylot Pro（候补/规划中）/ Copylot Pro (Planned / Waitlist)”小节：
  - 明确 Pro 未上线、不可用（Not shipped yet）
  - 引导用户在扩展内 Options -> Pro Tab 加入候补/复制候补文案（不在商店页承诺付费/订阅）
  - 提供 `docs/monetization/pro-scope.md` 的 GitHub 稳定链接作为对外可审计口径
- Popup 低摩擦候补补齐：
  - 新增“复制候补文案”按钮（`#popup-pro-waitlist-copy`），复制内容与 Options Pro Tab 保持一致（复制 waitlist issue `body` 模板）
  - 若开启匿名使用数据（默认关闭）：复制成功记录本地匿名事件 `pro_waitlist_copied` 且 `props.source === 'popup'`，可在 Options -> 隐私面板导出审计
  - 若关闭匿名使用数据：不写入/不补发，且关闭后仍按既有规则立即清空本地日志

## 修改范围（目录/文件）
- `docs/ChromeWebStore-Description-ZH.md`
- `docs/ChromeWebStore-Description-EN.md`
- `src/popup/popup.html`
- `src/popup/popup.ts`
- `src/popup/popup.css`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `src/shared/telemetry.ts`
- `docs/growth/telemetry-events.md`
- `docs/growth/blocked.md`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-36.md`
- `docs/reports/v1-36-report.md`
- `docs/roadmap_status.md`
- `prds/v1-36-1.md`
- `prds/v1-36-2.md`
- `prds/v1-36-3.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 回归结论：PASS（2026-03-20）
