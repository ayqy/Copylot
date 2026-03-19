# V1-32 发布流程防呆：publish 脚本接入全量回归 + 失败不污染 Git 简报

## 状态
- 已完成：子 PRD `prds/v1-32.md` 全部“具体任务”落地（发布脚本“先回归后落盘”+ 产物一致性校验 + 文档/用例闭环）
- 已验证：`bash scripts/test.sh` 全量通过；`npm run publish` 成功/失败路径均按验收口径可审计、可回滚

## 效果
- `npm run publish` 变为安全的一键发布入口（失败无副作用）：
  - Preflight：工作区必须干净（`git status --porcelain` 为空）否则直接阻断，避免半途落盘 commit/tag。
  - 版本号确认后仅更新 `manifest.json`，随后强制执行全量回归 `bash scripts/test.sh` 作为唯一门禁。
  - 回归失败：自动写回旧 manifest 原始内容并退出非 0；不会创建 commit/tag/zip，也不会尝试 push/release。
- 成功路径产物一致性更可靠（可审计、可回滚）：
  - 回归通过后才允许创建 commit/tag/zip。
  - 打包前强校验 `dist/manifest.json` 的 `version === newVersion`，避免“版本号已改但 dist 仍是旧产物”的错包风险。
  - commit/tag 之后任意失败（zip/gh release/git push 等）都会在 stderr 输出回滚指令：`git tag -d v${newVersion}` + `git reset --soft HEAD~1`（并提示是否需要 `--hard`）。
- 文档与用例闭环：
  - `BUILD-PRODUCTION.md` 的“构建验证”改为推荐 `bash scripts/test.sh`（包含 `verify-prod-build.sh`），保留 `find/grep` 兜底。
  - 新增 `docs/test-cases/v1-32.md`，覆盖失败不污染 Git / 成功产物校验 / 文档一致性三类用例并记录结论。

## 修改范围（目录/文件）
- `scripts/publish.ts`
- `BUILD-PRODUCTION.md`
- `docs/test-cases/v1-32.md`
- `docs/reports/v1-32-report.md`
- `prds/v1-32-1.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 回归结论：PASS（2026-03-20）

