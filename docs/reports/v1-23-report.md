# V1-23 ASO 素材规范最小闭环：截图顺序 / GIF 脚本 / 更新日志模板 简报

## 状态
- 已完成：子 PRD `prds/v1-23.md` 全部“具体任务”落地（ASO 截图顺序规范、GIF/短视频脚本、CWS 更新日志模板、测试用例文档、简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- 固化可复用的 CWS 截图顺序与拍摄步骤：
  - `docs/aso/store-assets.md` 提供 7 张截图顺序（价值最强 -> 场景覆盖 -> 隐私与可信）
  - 每张截图包含 EN/ZH 标题、真实功能点、开关前置与可复现拍摄步骤
  - 提供统一隐私提示（EN/ZH）：默认本地处理；不收集/不上传复制内容；匿名使用数据默认关闭且仅本地记录
- 补齐可持续发版所需脚本与模板：
  - `docs/aso/gif-script.md`：固定“场景 A：网页表格一键转 CSV 并粘贴到表格工具”的 20-30s 分镜脚本（EN/ZH 双语）
  - `docs/aso/cws-release-notes-template.md`：CWS 更新日志可复制粘贴模板（Highlights/Fixes/Privacy/Verification 固定结构，明确禁止夸大/禁止写未实现能力）
- 测试/用例与发布检查闭环：
  - `docs/test-cases/v1-23.md` 覆盖用例 A-D（素材完整性/GIF 脚本可执行/模板可复用/口径一致性抽检）并记录一次 `bash scripts/test.sh` 结果

## 修改范围（目录/文件）
- `docs/aso/store-assets.md`
- `docs/aso/gif-script.md`
- `docs/aso/cws-release-notes-template.md`
- `docs/test-cases/v1-23.md`
- `docs/reports/v1-23-report.md`
- `prds/v1-23-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

