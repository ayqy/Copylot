# v1-110 功能迭代简报

## 状态

- 已完成：扩展仓公开分发口径已统一为商店安装、隐私说明页、Pro 路线页与分享文案四类固定资产。
- 已完成：Options -> Pro 的分享文案与完整投放包已补入隐私说明页，不再只强调“路线页”。
- 已完成：新增 `docs/test-cases/v1-110.md` 与 `docs/evidence/v1-110/*`，把截图基线和漏斗导出路径写成可审计证据。

## 效果

- 对第一次接触 Copylot 的用户，分享资料会先强调 Chrome Web Store 安装，而不是历史候补语义。
- 对信任问题，分发资料现在会明确给出隐私说明页，不再把所有疑问都导向 Pro 路线页。
- 本轮证据包把安装优先的分发口径、截图基线和本地漏斗导出路径放在同一目录，便于后续按 S1 继续推进第一次干净复制。

## 修改范围

- 代码与测试：
  - `src/shared/external-links.ts`
  - `src/shared/pro-waitlist-distribution.ts`
  - `src/options/options.ts`
  - `e2e/options-pro-flow.spec.ts`
  - `scripts/ui-integration-tests.ts`
  - `scripts/unit-tests.ts`
- 公开说明与增长文档：
  - `docs/ChromeWebStore-Description-EN.md`
  - `docs/ChromeWebStore-Description-ZH.md`
  - `docs/growth/install-first-launch-pack-v1-110.md`
- 路线图、用例与证据：
  - `docs/roadmap.md`
  - `docs/roadmap_status.md`
  - `docs/test-cases/v1-110.md`
  - `docs/evidence/v1-110/*`
  - `docs/reports/v1-110-report.md`
