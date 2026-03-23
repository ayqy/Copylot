# V1-90 Pro 意向跑数取证执行闭环：证据包一键导出 + 离线落盘复盘材料（证据索引，可审计/可复盘）

- 子 PRD：`prds/v1-90.md`
- 导出入口：Options -> 隐私与可观测性 ->「Pro 意向漏斗摘要」->「下载 Pro 意向跑数证据包（JSON）」
- 离线落盘脚本：`scripts/build-pro-intent-run-evidence-pack.ts`
- 证据目录：`docs/evidence/v1-90/`

## 文件清单（含 sha256）

- `pro-intent-run-evidence-pack.json`
  - sha256：TBD
- `sha256.json`
  - sha256：TBD

复算示例：
- `shasum -a 256 docs/evidence/v1-90/*`

## “无 PII”断言结论

结论：TBD（交付时必须为 PASS）。

规则：
- 不得包含：联系方式明文、问卷自由文本明文、网页 URL/标题/网页内容/复制内容。
- 仅允许：枚举/布尔/计数、去标识化后的 campaign、以及扩展版本/导出时间等环境信息。

