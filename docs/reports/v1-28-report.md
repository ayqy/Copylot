# V1-28 对外口径一致性修复：CWS 长描述/ASO 素材/关键词矩阵收敛 + 教程入口补齐 简报

## 状态
- 已完成：子 PRD `prds/v1-28.md` 全部“具体任务”落地（CWS 长描述口径收敛 + 教程入口补齐；ASO 素材/关键词矩阵纠偏；用例文档闭环）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- CWS 长描述口径收敛（EN/ZH）：
  - 移除“提示符自动移除/remove prompts”等未实现能力宣称；将“代码块清理”收敛为可审计口径（保留缩进/空行，仅裁剪首尾空行；Copy 文案仅首/末端整行保守移除；行号仅可识别结构有限支持）。
  - 补齐 “Learn more / Tutorials / 了解更多 / 教程”段落，新增 3 个可直接复用的纯文本教程 URL。
  - 隐私与权限口径保持一致（默认本地处理、不上传复制内容；匿名使用数据默认关闭且仅本地记录、不联网发送；最小权限）。
- ASO 素材与关键词矩阵口径纠偏：
  - `docs/aso/store-assets.md` 截图 05 标题/步骤不再宣称“去提示符”，并明确保守清理边界与悬停复制入口。
  - `docs/aso/keywords.md` 移除“去提示符”关键词，并以可验证词汇替代（代码块去噪 / 去 Copy 文案（保守）/ 保留缩进）。
- 测试/用例与发布闭环：
  - 新增 `docs/test-cases/v1-28.md`，覆盖用例 A-D 并记录一次 `bash scripts/test.sh` 回归结论。

## 修改范围（目录/文件）
- `docs/ChromeWebStore-Description-EN.md`
- `docs/ChromeWebStore-Description-ZH.md`
- `docs/aso/store-assets.md`
- `docs/aso/keywords.md`
- `docs/test-cases/v1-28.md`
- `docs/reports/v1-28-report.md`
- `prds/v1-28-1.md`
- `docs/worklog/2026-03-19.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
