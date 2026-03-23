# V1-71 CWS Listing 同步落地 + 商店端取证：证据索引（可审计/可复核/可复盘）

- 生成时间：2026-03-22T09:55:13+08:00
- 证据目录：`docs/evidence/v1-71/`
- 结论：**BLOCKED**
  - BLOCKED-1：当前环境无法访问 Chrome Web Store（Developer Dashboard/公开商店页），无法完成“粘贴同步 + 截图取证”。
  - BLOCKED-2：按子 PRD `prds/v1-71.md` 的离线门禁要求，敏感词搜索命中（即使为否定语境）也需阻断本轮同步。

## 1) 引用源（v1-68 evidence pack：仓库素材基线）

来自 `docs/evidence/v1-68/index.md`（作为“仓库素材基线”与红线结论）：
- baseline pack：`docs/evidence/v1-66/cws-listing-evidence-pack-1.1.28-2026-03-21-041147.json`
  - sha256：`14fa914dea405f79682ed0493888239137a0c2c157cc91aaf18b2af999010ce3`
- current pack：`docs/evidence/v1-68/cws-listing-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`c1e47d6b12da9759a1722a2ce81dee083ab83eabe82afc4532ea146d51327eb7`
- diff pack：`docs/evidence/v1-68/cws-listing-diff-evidence-pack-1.1.28-2026-03-21-000000.json`
  - sha256：`158381627f3e4bcea1f7e701daf30fd5ccbc2d8368049566bc7721da3cac8694`
- v1-68 红线断言（门禁结论）：`redlines=[]`（PASS）

v1-68 `inputs.sha256`（本轮需与 paste pack 互证的 3 个来源）：
- `docs/ChromeWebStore-Description-EN.md` sha256：`0e5ba6e42d46070e59f50a7f6345c6d7fbdb55c399704348b99664f33cbafdc5`
- `docs/ChromeWebStore-Description-ZH.md` sha256：`29bf693c36657f4893337b6bddf1a2f9cde41a157aa1dafe2a5367ae08e320ab`
- `docs/aso/keywords.md` sha256：`76ec62d6759bfb012054d1e4e62491b5690ff2ecf3d95ffa8b1ed6a204490227`

## 2) 上架操作输入（paste pack，禁止临场改字）

- `docs/evidence/v1-71/listing-paste-pack.md`
  - sha256：`ffd3888a5807e72c415823b4f0882b597a2f4d901c4e6b69a3f2019ce4e505e1`
  - 内容：EN 长描述 / ZH 长描述 / Keywords（EN+ZH，comma-separated）

## 3) 离线门禁复核（同步前）

1) v1-68 断言结论复核：
- `docs/evidence/v1-68/index.md` 中 `redlines=[]`（PASS）

2) 素材来源指纹复核（与 v1-68 `inputs.sha256` 一致）：
- `docs/ChromeWebStore-Description-EN.md` sha256：`0e5ba6e42d46070e59f50a7f6345c6d7fbdb55c399704348b99664f33cbafdc5`
- `docs/ChromeWebStore-Description-ZH.md` sha256：`29bf693c36657f4893337b6bddf1a2f9cde41a157aa1dafe2a5367ae08e320ab`
- `docs/aso/keywords.md` sha256：`76ec62d6759bfb012054d1e4e62491b5690ff2ecf3d95ffa8b1ed6a204490227`

3) 敏感词/夸大口径搜索（按 PRD：命中直接阻断同步）：
- 执行命令：`rg -n "付费|订阅|升级|pricing|subscription|trial" docs/ChromeWebStore-Description-*.md docs/aso/keywords.md`
- 命中（本轮 BLOCKED-2）：
  - `docs/ChromeWebStore-Description-ZH.md:33`（包含“付费/订阅”字样：否定语境免责声明）
  - `docs/ChromeWebStore-Description-EN.md:33`（包含“payment/subscription”字样：否定语境免责声明）

## 4) CWS 同步与生效时间（待补齐）

状态：**BLOCKED**（依赖：可访问 CWS Developer Dashboard + 商店可达）

需要记录（网络恢复后补齐）：
- 提交时间（Dashboard Save）：(pending)
- 公开页生效时间（Public page）：(pending)
- 自动格式化差异（如有）：(pending)

## 5) 商店端截图取证索引（待补齐）

目录：`docs/evidence/v1-71/screenshots/`

状态：**BLOCKED**（依赖：商店可达且已完成 Listing 同步）

需补齐截图（文件名固定，便于审计与复盘）：
- `01-cws-listing-quick-start.png`
  - 断言：长描述首屏包含 `QUICK START`（3 步）且不夸大
- `02-cws-listing-pro-waitlist-cta.png`
  - 断言：Pro 候补 CTA 可见且明确“未上线/候补”（不得暗示可订阅/可付费）
- `03-cws-listing-privacy-claims.png`
  - 断言：隐私口径（本地处理/不上传复制内容/匿名默认 OFF）可见
- （可选）`04-cws-listing-version-updated.png`
  - 断言：版本号/更新时间可见（用于与 v1-69/v1-70 取证衔接）

## 6) 一致性结论（商店端 vs 仓库素材）

- 结论：**BLOCKED**
- 原因：
  - 未完成 CWS Dashboard 粘贴同步与公开页生效复核（BLOCKED-1）
  - 未补齐商店端截图取证（BLOCKED-1）
  - 离线门禁敏感词搜索命中（BLOCKED-2）

网络恢复后的下一步动作（按 `prds/v1-71.md`）：
1. 先处理 BLOCKED-2（敏感词门禁）：在不更改 v1-68 素材口径的前提下，明确“是否允许否定语境出现 payment/subscription/付费/订阅”等字样；若不允许，则需先更新素材与 evidence pack（将导致不再是“同步 v1-68 素材”口径）。
2. 处理 BLOCKED-1：按 `docs/evidence/v1-71/listing-paste-pack.md` 逐字段粘贴到 CWS（EN/ZH descriptions + keywords），保存并等待生效。
3. 补齐 `docs/evidence/v1-71/screenshots/` 3 张必选截图，并在本索引中逐条写明断言结论。
4. 将本索引的“一致性结论”更新为 PASS（并记录提交时间/生效时间/差异）。

