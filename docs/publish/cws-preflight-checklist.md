# CWS 上架前核对清单（离线可执行 / 可审计 / 可复用）

> 目标：在不依赖外网的情况下，把“可发布门禁 + 物料/口径一致性 + 可核验转化入口”固化成可执行清单。  
> 适用：真实上架前（或上架后紧急回滚/补证据前）的离线核对。  
> 不做：本清单不包含真实 `upload/publish`（需网络可达）；真实动作见 `docs/test-cases/v1-45.md`。

- 本仓库扩展版本号（以 `manifest.json` 为准）：
  - 命令：`node -p "require('./manifest.json').version"`
- 证据落盘根目录（本轮 v1-45 固定）：`docs/evidence/v1-45/`
  - 离线门禁日志建议落盘：`docs/evidence/v1-45/preflight/`

---

## 1) 版本与产物一致性（可审计）

- [ ] `manifest.json` 与 `dist/manifest.json` 版本一致
  - 命令：
    - `node -p "require('./manifest.json').version"`
    - `node -p "require('./dist/manifest.json').version"`
  - 通过标准：两次输出的 version 字符串完全一致

- [ ] `plugin-*.zip` 与版本一致（zip 内 `manifest.json` 的 version 与仓库一致）
  - 命令：
    - `ls -la plugin-*.zip`
    - `unzip -p plugin-<version>.zip manifest.json | head`
  - 通过标准：
    - 存在 `plugin-<version>.zip`
    - zip 内 `manifest.json` 的 `"version"` 与仓库 `manifest.json` 一致

---

## 2) 唯一发布门禁：全量自动化回归（离线）

- [ ] `bash scripts/test.sh` 必须通过（统一回归入口）
  - 命令（建议留证）：
    - `bash scripts/test.sh | tee docs/evidence/v1-45/preflight/test-$(date +%F).log`
  - 覆盖范围（脚本内置）：lint / type-check / i18n / unit-tests / build:prod / verify-prod-build
  - 通过标准：
    - 退出码为 0
    - `dist/` 产物存在
  - 关键可核验文件路径：
    - 统一入口：`scripts/test.sh`
    - 生产自检：`scripts/verify-prod-build.sh`

- [ ] 权限白名单校验（verify-prod-build 门禁的一部分，且可单独复核）
  - 命令：
    - `bash scripts/verify-prod-build.sh | tee docs/evidence/v1-45/preflight/verify-prod-build-$(date +%F).log`
    - `cat dist/manifest.json | head -n 40`
  - 通过标准：`permissions` 必须严格等于 `[storage, clipboardWrite, contextMenus]`（无新增权限、无重复项）

---

## 3) 发布脚本门禁（dry-run：不执行 upload/publish；会执行 Preflight 最小网络预检用于取证）

- [ ] `npm run publish:cws -- --dry-run` 通过（允许无代理/无凭据演练）
  - 命令（建议留证）：
    - `npm run publish:cws -- --dry-run | tee docs/evidence/v1-45/preflight/publish-cws-dry-run-$(date +%F).log`
  - 通过标准：
    - 必须打印稳定的 Proxy Diagnostic Block（可复制、无敏感信息）：
      - 关键标记：`-----BEGIN CWS PROXY DIAGNOSTIC BLOCK-----` / `-----END CWS PROXY DIAGNOSTIC BLOCK-----`
    - 必须打印 Preflight 预检报告块（可复制、无敏感信息）：
      - 关键标记：`-----BEGIN CWS PREFLIGHT REPORT BLOCK-----` / `-----END CWS PREFLIGHT REPORT BLOCK-----`
      - 以及合并块（便于直接贴到 Issue）：`-----BEGIN CWS PUBLISH DIAGNOSTIC PACK-----` / `-----END CWS PUBLISH DIAGNOSTIC PACK-----`
    - 必须在“未发生任何 upload/publish 网络调用”的前提下完成 dry-run（Preflight 会做最小网络可达性探测并输出 PASS/FAIL，用于取证与定位）
    - 若 Preflight FAIL：必须输出可执行的修复建议（避免只剩 `fetch failed`），且 dry-run 仍应按约定退出 0
    - 若 `.env` 缺失 CWS 凭据项，dry-run 只告警不失败（真实发布前需补齐）
  - 关键可核验文件路径：
    - 发布脚本入口：`scripts/chrome-webstore.ts`
    - 代理解析/脱敏/诊断块：`scripts/cws-proxy.ts`
    - Preflight 预检与报告块：`scripts/cws-preflight.ts`

---

## 4) 商店物料一致性（不夸大、不写未实现能力）

> 要求：所有对外口径必须以“当前实现”为准；Pro 必须明确为 Planned/Waitlist，不得暗示已上线。

- [ ] 商店长描述 EN/ZH 与仓库内口径一致
  - 核验文件路径：
    - `docs/ChromeWebStore-Description-EN.md`
    - `docs/ChromeWebStore-Description-ZH.md`
    - `docs/monetization/pro-scope.md`
  - 快速核验命令（只做定位，不替代人工审读）：
    - `rg -n "Copylot Pro|Planned|Waitlist" docs/ChromeWebStore-Description-EN.md docs/monetization/pro-scope.md`
    - `rg -n "Pro（候补|规划）|未上线|候补名单" docs/ChromeWebStore-Description-ZH.md docs/monetization/pro-scope.md`
  - 通过标准：
    - 描述中不存在“Pro 已上线/可订阅/可支付”等暗示
    - 关键链接可审计且稳定（指向仓库内文档）

- [ ] 截图脚本/顺序与能力一致（可复现）
  - 核验文件路径：`docs/aso/store-assets.md`
  - 通过标准：每张截图都能在当前版本中复现，且不展示未实现能力

- [ ] 关键词与价值主张口径一致
  - 核验文件路径：
    - `docs/aso/keywords.md`
    - `docs/aso/value-prop.md`
  - 通过标准：关键词不暗示未实现能力（例如“AI 自动总结/云同步/付费订阅”等若未实现则不得出现）

---

## 5) 隐私口径一致（本地处理 / 不上传 / 匿名使用数据默认 OFF）

- [ ] 隐私政策与商店描述口径一致
  - 核验文件路径：
    - `docs/privacy-policy.md`
    - `docs/ChromeWebStore-Description-EN.md`
    - `docs/ChromeWebStore-Description-ZH.md`
  - 快速核验命令：
    - `rg -n "Anonymous usage data|OFF by default|not sent" docs/privacy-policy.md docs/ChromeWebStore-Description-EN.md`
    - `rg -n "匿名使用数据|默认关闭|不联网" docs/privacy-policy.md docs/ChromeWebStore-Description-ZH.md`
  - 通过标准：
    - 明确“本地处理、不上传复制内容”
    - 明确“匿名使用数据默认 OFF；开启仅本地记录；关闭立即清空；不联网发送”

---

## 6) 转化入口可核验（Pro 候补 + UTM，不暗示已上线）

- [ ] 扩展内 Pro 候补入口存在且口径正确
  - 可核验路径（运行态验收口径）：
    - 用 `plugin-<version>.zip` 解压后以 unpacked 方式加载（见 `docs/test-cases/v1-45.md`）
    - 打开 Options -> Pro Tab：应存在 “Join waitlist / Copy waitlist template”（或中文等价）入口
  - 通过标准：UI 不暗示 Pro 已上线；仅为候补/意向验证

- [ ] 商店/评价入口 UTM 可核验（至少包含 utm_source/utm_medium/utm_campaign）
  - 运行态核验动作：
    - Popup / Options / 评分引导中分别点击“分享/去评价”等入口，检查新标签 URL query
  - 通过标准：URL query 至少包含：
    - `utm_source=copylot-ext`
    - `utm_medium=popup|options|rating_prompt`（以当前实现为准）
    - `utm_campaign=<当前版本口径>`（当前为 `v1-44`；若后续变更，以实现与文档一致为准）
