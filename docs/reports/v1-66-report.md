# V1-66 CWS Listing 物料证据包一键生成：上架=获客入口的口径可审计/可复核（简报）

## 状态
- 已完成：子 PRD `prds/v1-66.md` 全部“具体任务”落盘并满足验收标准（离线可推进、可审计、可复核、可复用）
  - 一键生成脚本：`scripts/build-cws-listing-evidence-pack.ts`
  - 证据目录与索引：`docs/evidence/v1-66/` + `docs/evidence/v1-66/index.md`
  - 样例证据包（JSON，可 `JSON.parse`）：`docs/evidence/v1-66/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
  - 门禁：`bash scripts/test.sh` 已接入 v1-66 证据包生成 + 可重复性校验（`--stable-exported-at`）
  - 用例：`docs/test-cases/v1-66.md`（含一次回归记录）
  - 自动化：`bash scripts/test.sh` ✅（2026-03-21 PASS）

## 商业化证据（可审计/可复核/可复用）
- 证据包最小字段稳定（便于长期 diff 与审计）：
  - `packVersion=v1-66`
  - `extensionVersion`（来自 `manifest.json` 且与 `dist/manifest.json` 一致性校验）
  - `inputs[]`（path/bytes/sha256：可追溯“这次上架物料基线到底是什么”）
  - `listing`（长描述 EN/ZH、关键词矩阵 EN/ZH、截图顺序/断言要点、更新日志模板 sha256）
  - `assertions`（门禁断言，全部 PASS）
- 关键断言（当前仓库素材下 PASS）：
  - `hasProWaitlistCta`：长描述包含 Pro waitlist 加入方式 + 稳定链接 `docs/monetization/pro-scope.md`
  - `hasTutorialLinks`：长描述包含 tutorials 链接
  - `hasPrivacyClaims`：长描述包含“本地处理/不上传复制内容/匿名开关默认 OFF”口径
  - `noOverclaimKeywords`：关键词/描述不出现“已上线 Pro/订阅/付费”等误导性宣称

## 对真实发布/获客增长的影响
- 把“上架=获客入口”的关键资产从“散落文档/容易跑偏”升级为“可一键生成、可复核、可审计的结构化基线”，便于后续真实发布与 ASO 迭代做 diff、做回归、做审计复盘。
- 与 Top2 衔接：网络恢复后按 `docs/evidence/v1-62/index.md` 与 `docs/test-cases/v1-45.md` 完成真实发布与商店端截图取证；并在发布证据中引用本包 `inputs.sha256` 证明“物料一致性”。

## 风险/阻塞
- Top2「真实 CWS 发布 + 商店端取证」仍受网络可达性阻塞：需要可用代理/VPN + 商店可达（已在 `docs/roadmap_status.md` 与 `docs/growth/blocked.md` 不断档记录）。

## 修改范围（目录/文件）
- `scripts/build-cws-listing-evidence-pack.ts`
- `scripts/unit-tests.ts`
- `scripts/test.sh`
- `docs/evidence/v1-66/`
- `docs/growth/blocked.md`
- `docs/test-cases/v1-66.md`
- `docs/reports/v1-66-report.md`
- `docs/roadmap_status.md`
- `docs/worklog/2026-03-21.md`
