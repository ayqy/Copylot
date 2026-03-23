# V1-76 CWS Listing 合规红线扫描证据（敏感词/夸大口径）

- 证据目录：`docs/evidence/v1-76/`
- 生成脚本：`scripts/scan-cws-listing-redlines.ts`
- 口径（唯一事实来源）：`docs/publish/cws-listing-redlines-policy.md`
  - sha256：`dacea615d63a76dc5f6fa3313770217bfe23329c5d6b7d1e6315591221ee7745`
- 扫描明细：`docs/evidence/v1-76/cws-listing-redlines-scan.json`

## 结论
- 结果：**PASS**
- 命中：total=4 allowed=4 blocked=0
- 门禁：当 blocked > 0 时，脚本以非 0 退出码阻断 `bash scripts/test.sh`。

## 引用源 sha256（用于与 Listing baseline/diff 互证）
- `docs/ChromeWebStore-Description-EN.md` sha256：`0e5ba6e42d46070e59f50a7f6345c6d7fbdb55c399704348b99664f33cbafdc5`
- `docs/ChromeWebStore-Description-ZH.md` sha256：`29bf693c36657f4893337b6bddf1a2f9cde41a157aa1dafe2a5367ae08e320ab`
- `docs/aso/keywords.md` sha256：`76ec62d6759bfb012054d1e4e62491b5690ff2ecf3d95ffa8b1ed6a204490227`

## ALLOWED 命中（必须可解释归因）
- 规则 `desc_allowed_negation_disclaimer`：否定语境免责声明：明确声明商店页不提供任何付费/订阅承诺（允许出现 payment/subscription/付费/订阅，但必须可解释归因）。
  - `docs/ChromeWebStore-Description-EN.md:33` term=`payment`
  - `docs/ChromeWebStore-Description-EN.md:33` term=`subscription`
  - `docs/ChromeWebStore-Description-ZH.md:33` term=`付费`
  - `docs/ChromeWebStore-Description-ZH.md:33` term=`订阅`

## 修复建议
- 无（当前为 PASS）。

