# V1-44 收入导向 WOM 实验：评分引导触发优化 + UTM v1-44 + 可量化证据落盘 简报

## 状态
- 已完成：子 PRD `prds/v1-44.md` 全部“具体任务”落地并满足验收标准
  - 评分引导触发优化（更早但更精准、低打扰）：安装 >=48h 且成功复制 >=10，并要求 `firstPromptUsedAt` 存在或成功复制 >=20；最多展示 1 次（Later/Never 也不二次打扰）
  - 商店/评价链接 UTM 统一更新为 v1-44：`utm_source=copylot-ext` + `utm_campaign=v1-44` + `utm_medium=popup|options|rating_prompt`
  - 测试用例文档：`docs/test-cases/v1-44.md`
  - 商业化证据资产落盘：`docs/evidence/v1-44/`（含 telemetry off 对照 + 截图索引）
  - 商业化进度落盘：更新 `docs/roadmap_status.md`（勾选 v1-44 里程碑并刷新“当前进度/下一步 Top3”）
- 扩展版本号：`1.1.21`（见 `manifest.json`，并已生成 `plugin-1.1.21.zip`）

## 交付效果（收入优先：更可发生的商店访问/评价点击 + 可归因 + 可审计）
1) 评分引导触发更早但更精准（不增加打扰）
- 更早：安装时长从 72h 下调到 48h；Prompt 用户成功复制门槛从 20 下调到 10
- 更精准：仅在已使用过 Prompt 或重度纯复制（>=20）时触发，避免“刚装就烦”
- 低打扰：最多展示 1 次；Later/Never 都不会再次出现

2) UTM 归因口径可核验
- Popup / Options / 评分引导 三处打开 CWS 详情/评价链接统一携带：
  - `utm_source=copylot-ext`
  - `utm_campaign=v1-44`
  - `utm_medium=popup|options|rating_prompt`
- “复制分享文案”中的商店链接与对应入口打开的链接一致（同 utm_medium）

3) 证据落盘可审计、可对比
- `docs/evidence/v1-44/index.md`：截图索引 + 口径说明 + 与 `docs/evidence/v1-43/` 的对比点
- `docs/evidence/v1-44/`：`wom-summary.json` / `wom-evidence-pack.json` + telemetry off 对照

4) 可发布门禁通过
- `bash scripts/test.sh` 全量回归 PASS（lint/type-check/check-i18n/unit-tests/build:prod/verify）

## 修改范围（目录/文件）
- `src/shared/growth-stats.ts`
- `src/shared/word-of-mouth.ts`
- `_locales/en/messages.json`
- `_locales/zh/messages.json`
- `manifest.json`
- `scripts/unit-tests.ts`
- `docs/test-cases/v1-44.md`
- `docs/evidence/v1-44/`
- `docs/roadmap_status.md`
- `docs/reports/v1-44-report.md`
- `plugin-1.1.21.zip`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 最近执行日期：2026-03-20
- 结论：PASS

