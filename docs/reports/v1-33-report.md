# V1-33 CWS 发布流程防呆：publish:cws 强制生产回归 + 支持 dry-run 简报

## 状态
- 已完成：子 PRD `prds/v1-33.md` 全部“具体任务”落地（`publish:cws` 强制生产回归与产物校验 + dry-run 演练 + 文档/用例闭环）
- 已验证：`bash scripts/test.sh` 全量通过；`npm run publish:cws` 在缺少凭据时会在任何网络调用前失败退出；`--dry-run` 可无凭据演练且无网络副作用

## 效果
- `npm run publish:cws` 变为安全、可重复、可审计的 CWS 发布入口：
  - 强制门禁：任何网络调用前执行 `bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod/verify-prod-build）
  - 产物一致性：强校验 `dist/manifest.json` 的 `version === manifest.json.version`，避免错包/旧产物
  - 重新打包：基于当前生产 `dist/` 删除同名 zip 后重新生成 `plugin-${version}.zip`，确保 zip 与回归后的产物一致
  - 防误发：脚本严禁走 `npm run build`（开发构建）路径，仅依赖生产回归产出的 `dist/`
- dry-run 演练可落地：
  - `npm run publish:cws -- --dry-run`：不进行任何上传/发布网络调用；仍执行门禁与产物准备；并打印缺失凭据项提示
- 缺凭据失败可审计：
  - 非 dry-run 缺少任一必需环境变量时，会在任何网络调用前退出非 0，并输出缺失项列表；无“上传成功/发布成功”等误导信息

## 修改范围（目录/文件）
- `scripts/chrome-webstore.ts`
- `BUILD-PRODUCTION.md`
- `docs/test-cases/v1-33.md`
- `docs/reports/v1-33-report.md`
- `prds/v1-33-1.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 回归结论：PASS（2026-03-20）
- dry-run 演练：`npm run publish:cws -- --dry-run` ✅
- 缺凭据阻断：`npm run publish:cws`（无凭据）退出非 0 ✅

