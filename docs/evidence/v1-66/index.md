# V1-66 CWS Listing 物料证据包（可审计/可复核/可复用）

- 证据目录：`docs/evidence/v1-66/`
- 生成脚本：`scripts/build-cws-listing-evidence-pack.ts`
- packVersion：`v1-66`
- exportedAt：`2026-03-21T00:00:00.000Z`
- extensionVersion：`1.2.3`
- 证据包文件：`cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`

## 输入文件哈希清单（可追溯基线）

| path | bytes | sha256 |
| --- | ---: | --- |
| `docs/ChromeWebStore-Description-EN.md` | 3416 | `e939f6d58cf780d1e1fb48348a6ea6b68456e91a9c8057e06d16abbda32458c2` |
| `docs/ChromeWebStore-Description-ZH.md` | 3159 | `99fb6176346338dee75afb37321a94e010ecb5f765ec9b7ffd43ef22b958e545` |
| `docs/aso/keywords.md` | 2217 | `eb702760c5b5895d7388b193966aa5f1643ec0ec536c22d42315b5ec6b345ac8` |
| `docs/aso/store-assets.md` | 10906 | `9f1509fc4b671ebf9a310faa07d4650cd48a859d4f3eb6019a0a249adf8210a8` |
| `docs/aso/cws-release-notes-template.md` | 1351 | `4de9cf37ed4cad839640528d8106d5a13604e85dddea05988da1ae4b7c1ca5a3` |
| `docs/aso/value-prop.md` | 4387 | `8a50e975594340f796e25b2e97476c1db68d24d11f36aa488995345830f41540` |

## 关键断言（自动化门禁）

- hasProWaitlistCta: PASS
- hasTutorialLinks: PASS
- hasPrivacyClaims: PASS
- noOverclaimKeywords: PASS

## 使用说明

- 生成（写入 `docs/evidence/v1-66/`）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-evidence-pack.ts`
- 门禁/可重复性（固定 exportedAt，便于 diff）：
  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-evidence-pack.ts --stable-exported-at`
- 复核 sha256（示例）：`shasum -a 256 docs/ChromeWebStore-Description-EN.md`
- 敏感信息搜索（示例）：`rg -n "CWS_|TOKEN|SECRET" docs/evidence/v1-66`

## 与 Top2「真实发布取证」衔接说明

- 本证据包仅固化“商店物料基线”（长描述/关键词/截图脚本/更新日志模板）的可审计快照；不替代真实发布与商店端截图取证。
- 网络恢复后按 `docs/evidence/v1-62/index.md` 与 `docs/test-cases/v1-45.md` 完成真实发布与商店端取证；并在发布证据中引用本包 inputs.sha256 复核“物料一致性”。

---

输出文件：
- `docs/evidence/v1-66/index.md`
- `docs/evidence/v1-66/cws-listing-evidence-pack-1.2.3-2026-03-21-000000.json`

