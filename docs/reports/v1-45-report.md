# V1-45 发布取证准备包（离线）：上架前核对清单 + 上架后 24h/7d 复盘模板 + 证据落盘 简报

## 状态
- 已完成：子 PRD `prds/v1-45.md` 全部“具体任务”落地并满足验收标准（离线可审计）
  - 上架前核对清单（离线可执行）：`docs/publish/cws-preflight-checklist.md`
  - 上架后 24h/7d 复盘模板（可直接复用）：`docs/growth/post-release-review-template.md`
  - 用例文档（离线回归 + 网络可达后真实动作）：`docs/test-cases/v1-45.md`
  - 证据目录与索引模板：`docs/evidence/v1-45/` + `docs/evidence/v1-45/index.md`
  - 商业化进度落盘：更新 `docs/roadmap_status.md`（勾选 v1-45 里程碑并刷新“当前进度/下一步 Top3/阻塞”）
- 当前阻塞点（需人类输入）：真实 CWS 发布仍受“网络可达性（可用代理/VPN）”阻塞（见 `docs/roadmap_status.md` 与 `docs/growth/blocked.md`）

## 交付效果（收入第一：把临场发挥变成可复制最短路径）
1) 上架前核对清单固化为可执行门禁
- 版本/产物一致性（manifest / dist / plugin zip）
- 唯一发布门禁：`bash scripts/test.sh`（含 `verify-prod-build` 权限白名单）
- 发布脚本门禁演练：`npm run publish:cws -- --dry-run`（稳定 Proxy Diagnostic Block，可复制可审计、无敏感信息）
- 商店物料/隐私口径/UTM 的核验文件路径与运行态检查动作

2) 上架后 24h/7d 复盘模板可直接复用
- 固定商店端取证截图命名规范与索引位置（落盘到 `docs/evidence/v1-45/`）
- 指标口径与本地导出一致（Pro Funnel / WOM Summary），并强制引用 v1-42/v1-44 基线用于对比
- 固化“从商店安装回归 -> 导出摘要/证据包 -> 落盘索引”的操作步骤

3) 用例/证据/简报闭环
- `docs/test-cases/v1-45.md` 覆盖离线可执行项 + 网络可达后的真实动作；包含门禁回归记录区
- `docs/evidence/v1-45/index.md` 明确“真实发布后需要补齐”的截图与导出文件清单，并给出对比口径

## 一旦网络可达的最短执行路径（不需要临时决策）
1. 按 `docs/publish/cws-preflight-checklist.md` 离线完成所有门禁（含 dry-run）。
2. 在可用代理/VPN 环境下执行真实发布：`npm run publish:cws`。
3. 按 `docs/test-cases/v1-45.md`：
   - 补齐商店端截图到 `docs/evidence/v1-45/screenshots/` 并更新索引
   - 从商店安装回归后导出 `pro-funnel-*` 与 `wom-*` 文件落盘
4. 用 `docs/growth/post-release-review-template.md` 填写 24h/7d 复盘并产出可审计对比结论（引用 v1-42/v1-44 基线）。

## 修改范围（目录/文件）
- `docs/publish/cws-preflight-checklist.md`
- `docs/growth/post-release-review-template.md`
- `docs/test-cases/v1-45.md`
- `docs/evidence/v1-45/`
- `docs/reports/v1-45-report.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 最近执行日期：2026-03-20
- 结论：PASS

补充门禁演练：
- `npm run publish:cws -- --dry-run`
- 最近执行日期：2026-03-20
- 结论：PASS
