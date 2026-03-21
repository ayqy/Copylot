# V1-62 真实发布取证再降摩擦：`publish:cws` 诊断证据包（JSON）一键落盘简报

## 状态
- 已完成：子 PRD `prds/v1-62.md` 全部“具体任务”落地并满足验收标准（离线可推进、可审计、可复核、可发布）
  - `npm run publish:cws -- --dry-run --evidence-dir <dir>` 可一键落盘诊断证据包 JSON（Preflight PASS/FAIL 均落盘）
  - 不提供 `--evidence-dir` 时行为保持不变（仅控制台输出，不额外写文件）
  - dry-run：严格不进行 upload/publish 网络调用；Preflight FAIL 仍退出码 0，但证据包仍会落盘
  - 非 dry-run：Preflight FAIL 阻断真实发布（退出码 1），且证据包仍会落盘

## 交付效果（收入第一：为 Top2“真实 CWS 发布 + 商店端取证”降低取证与归档摩擦）
- 发布取证从“控制台文本 + 手工 tee”升级为“结构化证据资产（JSON）”：可长期归档、可 diff、可审计、可复核
- 证据包包含：版本一致性校验后的 `extensionVersion`、发布 zip 产物信息（bytes/sha256）、Proxy Diagnostic（脱敏）、Preflight Report（v1-47）、修复建议、凭据缺失项（boolean）、publishAttempt（dry-run skipped/非 dry-run 成功或脱敏失败信息）

## 测试
- 自动化测试：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 修改范围（目录/文件）
- `scripts/chrome-webstore.ts`
- `scripts/cws-publish-evidence-pack.ts`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-62.md`
- `docs/evidence/v1-62/`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`
- `docs/reports/v1-62-report.md`
