# V1-95 CWS 代理就绪门禁与发布取证最小闭环（简报）

## 状态
- 已完成：`publish:cws` 预检新增稳定分类 `proxy_not_started`（目标不可达 + 未命中可用代理配置）。
- 已完成：诊断输出补齐可复制修复动作：`pxy`、`source ~/.bash_profile && pxy`、`npm run publish:cws -- --dry-run`。
- 已完成：证据包（`packVersion=v1-62`）新增 `proxyReadiness.status/fixCommand/blocking`，并保持既有字段与解析链路兼容。
- 已完成：单测与用例文档补齐；`npm run publish:cws -- --dry-run --evidence-dir docs/evidence/v1-95/preflight/` 已落盘证据。

## 效果
- 失败归因从“仅网络失败”升级为“可稳定判定 `proxy_not_started`”，可直接执行修复并复跑。
- 证据包新增代理就绪状态字段后，可区分“代理未启动”和“非代理阻塞”，支持商店端收入链路快速排障。
- 输出持续遵守安全红线：仅暴露脱敏代理信息与布尔状态，不回显 token/secret。

## 自动化与证据
- 全量门禁：`bash scripts/test.sh`（通过，包含新增单测；由 `publish:cws --dry-run` 前置门禁执行）
- dry-run 取证：`npm run publish:cws -- --dry-run --evidence-dir docs/evidence/v1-95/preflight/`
- 证据文件：`docs/evidence/v1-95/preflight/copylot-cws-publish-diagnostic-pack-1.1.28-2026-03-25-005545.dry-run.json`

## 修改范围（目录/文件）
- `scripts/cws-proxy.ts`
- `scripts/cws-preflight.ts`
- `scripts/chrome-webstore.ts`
- `scripts/cws-publish-evidence-pack.ts`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-95.md`
- `docs/evidence/v1-95/preflight/`
- `docs/roadmap.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`
- `docs/reports/v1-95-report.md`
