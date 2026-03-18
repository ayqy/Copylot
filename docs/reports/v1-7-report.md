# V1-7 商店转化与合规文案 MVP（ASO 话术对齐 + 隐私/数据声明更新）简报

## 状态
- 已完成：子 PRD `prds/v1-7.md` 全部“具体任务”落地（话术基准/短描述/长描述/关键词矩阵/隐私政策/用例文档）
- 已验证：`bash scripts/test.sh` 全量通过，可打包发布

## 效果
- 统一 ASO 话术基准：新增 `docs/aso/value-prop.md`（Slogan/核心卖点/差异化卖点/隐私口径，中英文对照），用于对外文案一致化与审计
- 短描述可上架：更新 `_locales/en/messages.json` 与 `_locales/zh/messages.json` 的 `appDescription`，与话术口径对齐；`npm run check-i18n` 覆盖回归
- 商店长描述可直接粘贴：重写 `docs/ChromeWebStore-Description-EN.md` 与 `docs/ChromeWebStore-Description-ZH.md`，去除 Markdown 标题语法，能力与 `README.md` 对齐，并补齐“匿名使用数据默认关闭且仅本地记录/不联网发送”的合规表述
- ASO 可持续迭代：新增 `docs/aso/keywords.md`（中英文关键词组 + 标题/副标题候选）
- 隐私政策口径修正：更新 `docs/privacy-policy.md`（Copylot 命名统一、日期更新、存储范围与匿名使用数据开关语义明确，可支撑 CWS 数据披露填写）
- 可执行验收用例：新增 `docs/test-cases/v1-7.md`，覆盖短/长描述、隐私政策与回归测试，并记录执行结论

## 修改范围（目录/文件）
- `docs/aso/value-prop.md`
- `docs/aso/keywords.md`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `docs/ChromeWebStore-Description-EN.md`
- `docs/ChromeWebStore-Description-ZH.md`
- `docs/privacy-policy.md`
- `docs/test-cases/v1-7.md`
- `docs/reports/v1-7-report.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅

