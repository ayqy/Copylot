# CWS Listing 合规红线门禁口径（敏感词/夸大口径，唯一口径）

> 目标：把 Chrome Web Store Listing 的合规风险（敏感词/夸大口径/诱导付费）固化为**自动化门禁 + 可审计证据**，避免“临场改文案”导致返工与审核风险。  
> 本文档是本轮（v1-76）**唯一口径**；扫描脚本 `scripts/scan-cws-listing-redlines.ts` 会直接读取本文档中的“可执行规则 JSON”来执行断言。

适用范围（本轮只覆盖以下 3 个输入）：
- `docs/aso/keywords.md`（Keywords）
- `docs/ChromeWebStore-Description-EN.md`（EN 长描述）
- `docs/ChromeWebStore-Description-ZH.md`（ZH 长描述）

## 规则总览（人类可读）

### 1) Keywords（零容忍）

原则：
- Keywords 命中任一“敏感词/付费诱导词”即 **BLOCKED**（不允许出现免责声明语境，因为 keywords 没有语境可审计）。

敏感词（可维护清单，规则以 JSON 为准）包括但不限于：
- EN：subscribe / subscription / payment / pricing / upgrade / trial / paid / premium
- ZH：付费 / 订阅 / 升级 / 价格 / 试用 / 收费 / 购买 / 支付 / 会员 / 内购 / 高级版

### 2) 长描述（EN/ZH）：拦截误导性宣称/诱导付费；允许否定语境免责声明

原则：
- 误导性宣称/诱导付费（例如“立即订阅/马上付费/升级到 Pro/Pro 已上线”等）=> **BLOCKED**
- 出现敏感词（如 payment/subscription/付费/订阅 等）时：
  - 若命中“否定语境免责声明”规则（明确声明“不提供/没有付费/订阅承诺”等）=> **ALLOWED**
  - 否则 => **BLOCKED**（避免模糊语境造成审核风险）

### 3) 证据化要求（可审计/可复核）

扫描必须输出：
- 命中明细 JSON：每条包含 `file/line/term/rule/result`
- 索引摘要 Markdown：给出 PASS/BLOCKED 结论、修复建议、并引用输入文件 sha256（便于与 Listing baseline/diff 互证）

固定落盘路径（本轮固定）：
- `docs/evidence/v1-76/cws-listing-redlines-scan.json`
- `docs/evidence/v1-76/index.md`

---

## 可执行规则 JSON（唯一机器口径）

<!-- CWS_LISTING_REDLINES_POLICY_JSON_BEGIN -->
```json
{
  "policyVersion": "v1-76",
  "keywords": {
    "ruleId": "kw_zero_tolerance_sensitive_terms",
    "blockedTermPattern": {
      "pattern": "\\bsubscribe\\b|\\bsubscription\\b|\\bpayment\\b|\\bpricing\\b|\\bupgrade\\b|\\btrial\\b|\\bpaid\\b|\\bpremium\\b|付费|订阅|升级|价格|试用|收费|购买|支付|会员|内购|高级版",
      "flags": "i"
    }
  },
  "descriptions": {
    "sensitiveTermRuleId": "desc_sensitive_terms",
    "sensitiveTermPattern": {
      "pattern": "\\bsubscribe\\b|\\bsubscription\\b|\\bpayment\\b|\\bpricing\\b|\\bupgrade\\b|\\btrial\\b|\\bpaid\\b|\\bpremium\\b|付费|订阅|升级|价格|试用|收费|购买|支付|会员|内购|高级版",
      "flags": "i"
    },
    "allowedContextPatterns": [
      {
        "id": "desc_allowed_negation_disclaimer",
        "pattern": "\\bno\\s+payment\\s*(?:\\/\\s*subscription)?\\b|\\bno\\s+subscription\\b|不提供[^\\n]*(?:付费\\s*\\/\\s*订阅|付费|订阅)[^\\n]*承诺",
        "flags": "i",
        "explanation": "否定语境免责声明：明确声明商店页不提供任何付费/订阅承诺（允许出现 payment/subscription/付费/订阅，但必须可解释归因）。"
      }
    ],
    "blockedPhrasePatterns": [
      {
        "id": "desc_blocked_misleading_or_paid_cta",
        "pattern": "\\bsubscribe\\s+now\\b|\\bupgrade\\s+to\\s+pro\\b|\\bpro\\s+(?:is\\s+)?(?:available|shipped)\\b|\\bpaid\\s+version\\b|\\bsubscription\\s+available\\b|立即订阅|马上付费|付费版已上线|Pro\\s*已上线|已上线\\s*Pro|开始收费|付费订阅",
        "flags": "i",
        "explanation": "误导性宣称/诱导付费：暗示 Pro 已上线或引导订阅/付费/升级，必须拦截。"
      }
    ]
  }
}
```
<!-- CWS_LISTING_REDLINES_POLICY_JSON_END -->
