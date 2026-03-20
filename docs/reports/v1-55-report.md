# V1-55 渠道分发工具包：Pro 候补链接/招募文案一键复制 + campaign 强制取证 简报

## 状态
- 已完成：子 PRD `prds/v1-55.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - Options -> Pro Tab 新增「渠道分发工具包」两个一键复制入口（稳定 DOM：`#pro-waitlist-url-copy` / `#pro-waitlist-recruit-copy`）
  - 分发工具包强制 campaign：`campaign` 为空/非法时按钮置灰 + 明确提示；合法时可复制成功（不影响原有加入候补/复制候补文案主链路）
  - 候补链接可解码复核：GitHub new issue URL 的 body 中必含 `campaign: <value>` 行
  - 证据落盘：`docs/evidence/v1-55/index.md` 含候补链接样例/招募文案样例/截图索引/按 campaign 聚合 CSV 样例
  - 测试与用例：新增 `docs/test-cases/v1-55.md`，并要求 `bash scripts/test.sh` 全量通过

## 交付效果（收入第一：让“分发动作”更低摩擦，且做了就能取证）

1) 一键复制（对外分发/投放更快、更不容易做错）
- 复制候补链接：直接得到预填 title/body 的 GitHub new issue URL（用于对外分发），且强制写入 `campaign` 行，便于后续归因。
- 复制招募文案：直接得到可粘贴到 Twitter/小红书/群聊/邮件的招募文案，并内置候补链接（同样强制 campaign）。

2) 取证闭环（可审计/可复核/可复用）
- 分发侧证据：候补链接与招募文案样例已落盘（可解码复核 `campaign` 行）。
- 结果侧复核：保持与既有 weekly digest（v1-50）/7d 明细 CSV（v1-51）/按 campaign 聚合 CSV（v1-54）兼容，用 3 件套即可复核各 campaign 的 `leads` 与 `leads_per_entry_opened`。

3) 合规与兼容性
- 未新增扩展权限；不联网发送数据；不采集用户复制内容。
- 未修改 v1-50/v1-51/v1-54 的既有导出字段与统计口径；本轮以新增入口 + 新证据目录为主。

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `manifest.json`
- `plugin-1.1.27.zip`
- `src/options/options.html`
- `src/options/options.ts`
- `src/shared/pro-waitlist-distribution.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-55.md`
- `docs/evidence/v1-55/`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-21.md`
- `docs/reports/v1-55-report.md`
