# V1-18 本地漏斗指标补齐：GrowthStats 记录关键里程碑时间戳 简报

## 状态
- 已完成：子 PRD `prds/v1-18.md` 全部“具体任务”落地（GrowthStats 扩展/规范化、Popup 首开、成功复制/Prompt 使用/7 日复用里程碑写入、单测、用例文档、简报）
- 已验证：`bash scripts/test.sh` 全量通过，可发布

## 效果
- `copilot_growth_stats` 新增本地可审计漏斗里程碑时间戳（均为 `number` 毫秒时间戳，可选字段）：
  - `firstPopupOpenedAt`：首次打开 Popup（仅写一次）
  - `firstSuccessfulCopyAt`：首次成功复制（仅写一次）
  - `lastSuccessfulCopyAt`：最近一次成功复制（每次更新）
  - `firstPromptUsedAt`：Prompt 触发且复制成功（仅写一次）
  - `reusedWithin7DaysAt`：首次成功复制后 7 天内发生的第二次成功复制时间（仅写一次）
- 规范化与兼容：
  - 非法值（非 number / <=0 / NaN / Infinity）统一清理为 `undefined`
  - 兼容旧数据；必要时自动回写规范化结构；读写失败不阻断主流程（仅 `console.warn`）
- 可观测与导出：
  - Options -> 隐私页“本地增长统计”面板仍可展示/复制导出扩展后的 `copilot_growth_stats`
  - Prompt 复制成功路径通过同一次增长统计更新写入 `firstPromptUsedAt`（不引入新权限/新依赖/新弹窗）

## 修改范围（目录/文件）
- `src/shared/growth-stats.ts`
- `src/popup/popup.ts`
- `src/content/content.ts`
- `src/background.ts`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-18.md`
- `docs/reports/v1-18-report.md`
- `docs/worklog/2026-03-19.md`
- `prds/v1-18-1.md`

## 测试
- 统一入口：`bash scripts/test.sh`（lint/type-check/check-i18n/unit-tests/build:prod）✅
