# V1-1 口碑闭环 MVP 交付简报

## 状态
- 已完成：反馈模板化入口、分享入口（UTM + 复制文案）、去评价入口、i18n（中英文）、用例文档、统一测试入口
- 自动化检查通过：`npm run lint`、`npm run type-check`、`npm run build:prod`（并额外包含 `npm run check-i18n`、`scripts/unit-tests.ts`）

## 效果
- Popup 底部新增 3 个入口：
  - 反馈与建议：跳转 GitHub `issues/new`，自动预填 title/body；body 包含版本/扩展 ID/浏览器与语言信息/关键开关快照/复现模板，且不包含任何用户复制内容
  - 分享给朋友：打开携带固定 UTM 的商店页；支持一键复制分享文案（含商店链接）
  - 去评价：打开商店 reviews 页面；无任何自动弹窗/强引导
- 以上入口文案与模板均支持 i18n（至少中英文）

## 修改范围（目录/文件）
- `.gitignore`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `docs/test-cases/v1-1.md`
- `docs/reports/v1-1-report.md`
- `scripts/test.sh`
- `scripts/unit-tests.ts`
- `src/popup/popup.html`
- `src/popup/popup.ts`
- `src/popup/popup.css`
- `src/shared/word-of-mouth.ts`
- `src/shared/content-processor.ts`
- `src/shared/settings-manager.ts`
- `src/shared/ui-injector.ts`
- `src/content/content.ts`
- `src/background.ts`
- `src/options/options.ts`
- `scripts/check-i18n.ts`
- `scripts/chrome-webstore.ts`
