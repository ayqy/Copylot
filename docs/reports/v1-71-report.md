# V1-71 CWS Listing 同步落地 + 商店端取证：把 v1-68 的转化素材真正上架并可审计（简报）

## 状态
- 已完成（离线可推进）：v1-68 基线复核（`redlines=[]` + sha256 互证）+ 生成可粘贴字段包（`docs/evidence/v1-71/listing-paste-pack.md`）+ 证据索引落盘（`docs/evidence/v1-71/index.md`）+ 用例文档闭环（`docs/test-cases/v1-71.md`）。
- 未完成（BLOCKED）：CWS Developer Dashboard 粘贴同步 + 公开页生效复核 + 商店端截图取证（依赖：可用代理/VPN + 商店可达 + 账号权限）。
- 未完成（BLOCKED）：按 `prds/v1-71.md` 的离线门禁要求，敏感词搜索命中即阻断同步；本轮命中为否定语境免责声明（见 `docs/evidence/v1-71/index.md` 第 3 节），需先明确处理口径后才能继续上架同步。

## 商业化证据（可审计/可复核/可复盘）
- v1-71 证据索引：`docs/evidence/v1-71/index.md`（引用 v1-68 pack sha256 + paste pack sha256 + 截图索引模板 + 一致性结论 BLOCKED）
- v1-71 可粘贴字段包：`docs/evidence/v1-71/listing-paste-pack.md`（EN/ZH 长描述 + keywords；记录来源 sha256）
- 截图目录占位：`docs/evidence/v1-71/screenshots/`（文件名规范已固化，待网络恢复后补齐）
- v1-68 仓库素材基线（唯一真实来源）：`docs/evidence/v1-68/`（current/diff pack + `inputs.sha256` + `redlines=[]`）

## 效果
- 将“上架字段输入（EN/ZH descriptions + keywords）”固化为可直接复制粘贴的 paste pack，并用 sha256 指纹防止口径漂移。
- 固化截图命名规范与证据索引结构，网络恢复后可快速补齐商店端取证并形成可审计证据链。

## 测试
- 自动化回归：`bash scripts/test.sh`（2026-03-22 PASS）

## 与 v1-69 / v1-70 衔接
- v1-69：真实发布与商店端取证仍受网络可达性阻塞；v1-71 已把“上架字段输入（paste pack）+ 一致性索引 + 截图命名规范”提前固化，待网络恢复后可直接执行同步并补齐截图。
- v1-70：依赖 v1-69 真实发布/商店可达；v1-71 的 Listing 取证将作为 v1-70 24h/7d 复盘证据链的一部分（证明商店端素材已按转化口径生效）。

## 修改范围（目录/文件）
- `docs/evidence/v1-71/`
- `docs/test-cases/v1-71.md`
- `docs/reports/v1-71-report.md`
- `docs/roadmap_status.md`
- `docs/growth/blocked.md`
