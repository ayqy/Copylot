# V1-37 真实上架验证：CWS 发布含转化入口 + 商店端物料一致性核对 + 可审计证据落盘 简报

## 状态
- 已完成：
  - 版本已递增至 `manifest.json` `1.1.19`，`npm run publish:cws -- --dry-run` 门禁演练通过（含 `bash scripts/test.sh`、产物一致性校验、重新打包 zip）。
  - 已完成仓库侧商店物料口径核对（EN/ZH 长描述、Pro Planned 口径、稳定链接、截图脚本与教程链接）。
  - 已新增并填写 `docs/test-cases/v1-37.md`，并记录一次 `bash scripts/test.sh` PASS。
- 阻塞：
  - 真实上传/发布到 Chrome Web Store（`npm run publish:cws` 非 dry-run）在当前环境失败：`ENOTFOUND www.googleapis.com`（网络不可达）；需代理/VPN（`HTTPS_PROXY`）后重试。
  - 因未完成真实发布，无法从 CWS 安装该版本做“商店安装回归 + 事件导出审计”闭环取证。

## 1) 真实 CWS 发布证据（可审计）
### 发布信息
- 日期：2026-03-20
- 目标版本号：1.1.19
- CWS 线上当前版本号：未能查询/核对（当前环境无法访问 Google API；需在可用网络下登录后台确认）
- 执行命令：
  - `npm run publish:cws -- --dry-run`
  - `npm run publish:cws`（失败，见下）

### 关键日志片段（脱敏，不包含任何 token/secret）
- 门禁与产物一致性：
  - `[CWS] 发布前置门禁：全量回归通过`
  - `[CWS] 产物一致性校验通过：dist/manifest.json version === 1.1.19`
  - `[CWS] 已生成发布 zip: plugin-1.1.19.zip`
- 凭据检查（仅显示“已设置/未设置”）：
  - `CWS_EXTENSION_ID: 已设置`
  - `CWS_CLIENT_ID: 已设置`
  - `CWS_CLIENT_SECRET: 已设置`
  - `CWS_REFRESH_TOKEN: 已设置`
- 真实上传失败（网络）：
  - `错误消息: fetch failed`
  - `cause.code: ENOTFOUND`
  - `cause.hostname: www.googleapis.com`

### CWS 侧验证结果（后台/商店页版本号与发布时间）
- 结论：未完成（publish 被网络阻塞）。
- 可复查动作（发布成功后补齐证据）：
  - 在 CWS Developer Dashboard 确认该 item 的版本号与发布时间，并截图存档。
  - 打开商店详情页确认版本号与更新时间，并截图存档。

## 2) 商店端物料一致性核对（清单 + 结果）
核对结论：仓库侧口径已就绪；CWS 商店页“实际展示”需在发布成功后人工复核并截图留证。

| 核对项 | 对照源 | 结果 | 备注 |
| --- | --- | --- | --- |
| 长描述（EN）包含 Pro Planned/Waitlist 小节 + 明确 Not shipped yet | `docs/ChromeWebStore-Description-EN.md` | PASS | 引导路径为 Options -> Pro tab |
| 长描述（ZH）包含 Pro 候补/规划中小节 + 明确未上线不可用 | `docs/ChromeWebStore-Description-ZH.md` | PASS | 引导路径为 Options -> Pro Tab |
| 稳定对外链接可审计 | `docs/monetization/pro-scope.md` | PASS | 已在 EN/ZH 长描述引用 GitHub 稳定链接 |
| 截图顺序与标题口径 | `docs/aso/store-assets.md` | PASS（仓库脚本） | CWS 实际截图顺序待发布后复核 |
| 教程/说明链接可达 | `docs/tutorials/*` | PASS（仓库存在） | 在线可达性需发布后人工点开复核 |

## 3) 从 CWS 安装回归（转化入口 + 可导出证据）
结论：阻塞（需先完成真实发布，才能从商店安装该版本取证）。

回归要点（发布成功后执行）：
- 转化入口可见且可用：
  - Popup：存在升级 Pro/候补入口（`#upgrade-pro-entry` / `#popup-pro-waitlist` / `#popup-pro-waitlist-copy`）
  - Options：Pro Tab 可打开；候补入口可打开；“复制候补文案”可写入剪贴板（`#pro-waitlist-copy`）
- 证据可导出（隐私合规）：
  - 开启匿名使用数据后，触发并在隐私面板导出事件：`pro_entry_opened` / `pro_waitlist_opened` / `pro_waitlist_copied`，且 `props.source` 为 `popup|options`
  - 关闭匿名使用数据后：事件日志立即清空，且不会补发

## 修改范围（目录/文件）
- `manifest.json`
- `docs/growth/blocked.md`
- `docs/roadmap_status.md`
- `docs/test-cases/v1-37.md`
- `docs/reports/v1-37-report.md`
- `prds/v1-37-1.md`
- `prds/v1-37-2.md`
- `prds/v1-37-3.md`

## 测试
- 统一入口：`bash scripts/test.sh` ✅
- 最近执行日期：2026-03-20
- 结论：PASS
