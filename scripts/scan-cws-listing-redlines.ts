import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';

export const DEFAULT_CWS_LISTING_REDLINES_POLICY_PATH = 'docs/publish/cws-listing-redlines-policy.md';

export const DEFAULT_CWS_LISTING_REDLINES_INPUTS: readonly string[] = [
  'docs/ChromeWebStore-Description-EN.md',
  'docs/ChromeWebStore-Description-ZH.md',
  'docs/aso/keywords.md'
];

export const DEFAULT_CWS_LISTING_REDLINES_EVIDENCE_DIR = 'docs/evidence/v1-76';
export const DEFAULT_CWS_LISTING_REDLINES_SCAN_JSON_PATH = `${DEFAULT_CWS_LISTING_REDLINES_EVIDENCE_DIR}/cws-listing-redlines-scan.json`;
export const DEFAULT_CWS_LISTING_REDLINES_INDEX_MD_PATH = `${DEFAULT_CWS_LISTING_REDLINES_EVIDENCE_DIR}/index.md`;

export type CwsListingRedlinesPolicy = Readonly<{
  policyVersion: string;
  keywords: Readonly<{
    ruleId: string;
    blockedTermPattern: Readonly<{ pattern: string; flags: string }>;
  }>;
  descriptions: Readonly<{
    sensitiveTermRuleId: string;
    sensitiveTermPattern: Readonly<{ pattern: string; flags: string }>;
    allowedContextPatterns: ReadonlyArray<Readonly<{ id: string; pattern: string; flags: string; explanation: string }>>;
    blockedPhrasePatterns: ReadonlyArray<Readonly<{ id: string; pattern: string; flags: string; explanation: string }>>;
  }>;
}>;

export type CwsListingRedlinesHit = Readonly<{
  file: string;
  line: number;
  term: string;
  rule: string;
  result: 'allowed' | 'blocked';
}>;

export type CwsListingRedlinesScanEvidence = Readonly<{
  policy: Readonly<{ path: string; sha256: string }>;
  inputs: ReadonlyArray<Readonly<{ path: string; bytes: number; sha256: string }>>;
  hits: ReadonlyArray<CwsListingRedlinesHit>;
  summary: Readonly<{ result: 'PASS' | 'BLOCKED'; total: number; allowed: number; blocked: number }>;
}>;

type ParsedKeywordItem = Readonly<{ value: string; line: number }>;

function normalizeNewlines(text: string): string {
  return String(text || '').replace(/\r\n/g, '\n');
}

function toPosixPath(p: string): string {
  return p.split(path.sep).join(path.posix.sep);
}

function uniqueFlags(flags: string): string {
  return Array.from(new Set(String(flags || '').split(''))).join('');
}

function compileRegex(input: { pattern: string; flags: string }, options?: { global?: boolean }): RegExp {
  const baseFlags = uniqueFlags(input.flags);
  const flags = options?.global ? uniqueFlags(`${baseFlags}g`) : baseFlags;
  return new RegExp(input.pattern, flags);
}

export function parseCwsListingRedlinesPolicyFromMarkdown(markdown: string): CwsListingRedlinesPolicy {
  const md = normalizeNewlines(markdown);
  const m = md.match(
    /<!--\s*CWS_LISTING_REDLINES_POLICY_JSON_BEGIN\s*-->[\s\S]*?```json\s*([\s\S]*?)\s*```[\s\S]*?<!--\s*CWS_LISTING_REDLINES_POLICY_JSON_END\s*-->/
  );
  assert.ok(m?.[1], 'Failed to locate policy JSON block in policy markdown');

  const raw = String(m[1]).trim();
  const parsed = JSON.parse(raw) as CwsListingRedlinesPolicy;

  assert.equal(typeof parsed.policyVersion, 'string');
  assert.equal(typeof parsed.keywords?.ruleId, 'string');
  assert.equal(typeof parsed.keywords?.blockedTermPattern?.pattern, 'string');
  assert.equal(typeof parsed.keywords?.blockedTermPattern?.flags, 'string');

  assert.equal(typeof parsed.descriptions?.sensitiveTermRuleId, 'string');
  assert.equal(typeof parsed.descriptions?.sensitiveTermPattern?.pattern, 'string');
  assert.equal(typeof parsed.descriptions?.sensitiveTermPattern?.flags, 'string');

  assert.ok(Array.isArray(parsed.descriptions?.allowedContextPatterns));
  assert.ok(Array.isArray(parsed.descriptions?.blockedPhrasePatterns));

  for (const rule of parsed.descriptions.allowedContextPatterns) {
    assert.equal(typeof rule.id, 'string');
    assert.equal(typeof rule.pattern, 'string');
    assert.equal(typeof rule.flags, 'string');
    assert.equal(typeof rule.explanation, 'string');
  }
  for (const rule of parsed.descriptions.blockedPhrasePatterns) {
    assert.equal(typeof rule.id, 'string');
    assert.equal(typeof rule.pattern, 'string');
    assert.equal(typeof rule.flags, 'string');
    assert.equal(typeof rule.explanation, 'string');
  }

  return parsed;
}

export function parseKeywordsWithLineNumbersFromMarkdown(markdown: string): { en: ParsedKeywordItem[]; zh: ParsedKeywordItem[] } {
  const md = normalizeNewlines(markdown);
  const lines = md.split('\n');

  let mode: 'none' | 'en' | 'zh' = 'none';
  const en: ParsedKeywordItem[] = [];
  const zh: ParsedKeywordItem[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    if (trimmed === '## EN Keywords (Groups)') {
      mode = 'en';
      continue;
    }
    if (trimmed === '## ZH 关键词组（建议）') {
      mode = 'zh';
      continue;
    }
    if (trimmed.startsWith('## ')) {
      mode = 'none';
      continue;
    }
    if (mode === 'none') continue;

    const m = line.match(/^\s*-\s+(.*)$/);
    if (!m?.[1]) continue;
    const value = String(m[1]).trim();
    if (!value) continue;

    const item = { value, line: i + 1 } as const;
    if (mode === 'en') en.push(item);
    if (mode === 'zh') zh.push(item);
  }

  return { en, zh };
}

function scanTextLineForAllMatches(text: string, re: RegExp): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(re)) {
    const term = String(m[0] ?? '').trim();
    if (term) out.push(term);
  }
  return out;
}

function sortHitsStable(hits: CwsListingRedlinesHit[]): CwsListingRedlinesHit[] {
  return [...hits].sort((a, b) => {
    const fileCmp = a.file.localeCompare(b.file);
    if (fileCmp !== 0) return fileCmp;
    if (a.line !== b.line) return a.line - b.line;
    const termCmp = a.term.localeCompare(b.term);
    if (termCmp !== 0) return termCmp;
    const ruleCmp = a.rule.localeCompare(b.rule);
    if (ruleCmp !== 0) return ruleCmp;
    return a.result.localeCompare(b.result);
  });
}

export function scanCwsListingRedlinesFromText(input: {
  policy: CwsListingRedlinesPolicy;
  descriptionEnMarkdown: string;
  descriptionZhMarkdown: string;
  keywordsMarkdown: string;
}): { hits: CwsListingRedlinesHit[]; summary: { total: number; allowed: number; blocked: number; result: 'PASS' | 'BLOCKED' } } {
  const policy = input.policy;

  const keywordBlockedRe = compileRegex(policy.keywords.blockedTermPattern, { global: true });
  const descSensitiveRe = compileRegex(policy.descriptions.sensitiveTermPattern, { global: true });
  const allowedContextRules = policy.descriptions.allowedContextPatterns.map((r) => ({
    id: r.id,
    re: compileRegex({ pattern: r.pattern, flags: r.flags })
  }));
  const blockedPhraseRules = policy.descriptions.blockedPhrasePatterns.map((r) => ({
    id: r.id,
    re: compileRegex({ pattern: r.pattern, flags: r.flags }, { global: true })
  }));

  const hits: CwsListingRedlinesHit[] = [];

  // 1) Keywords（零容忍）
  {
    const parsed = parseKeywordsWithLineNumbersFromMarkdown(input.keywordsMarkdown);
    const all = [
      ...parsed.en.map((v) => ({ ...v, file: 'docs/aso/keywords.md' })),
      ...parsed.zh.map((v) => ({ ...v, file: 'docs/aso/keywords.md' }))
    ];

    for (const item of all) {
      const terms = scanTextLineForAllMatches(item.value, keywordBlockedRe);
      for (const term of terms) {
        hits.push({ file: item.file, line: item.line, term, rule: policy.keywords.ruleId, result: 'blocked' });
      }
    }
  }

  // 2) Descriptions（允许否定语境免责声明；拦截误导性宣称/诱导付费）
  const scanDescription = (file: string, markdown: string) => {
    const lines = normalizeNewlines(markdown).split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const lineText = lines[i] ?? '';
      const lineNo = i + 1;

      let hasBlockedPhrase = false;
      for (const rule of blockedPhraseRules) {
        const terms = scanTextLineForAllMatches(lineText, rule.re);
        for (const term of terms) {
          hasBlockedPhrase = true;
          hits.push({ file, line: lineNo, term, rule: rule.id, result: 'blocked' });
        }
      }

      if (hasBlockedPhrase) continue;

      const sensitiveTerms = scanTextLineForAllMatches(lineText, descSensitiveRe);
      if (sensitiveTerms.length === 0) continue;

      const allowedContextRuleId = allowedContextRules.find((r) => r.re.test(lineText))?.id ?? null;
      const result = allowedContextRuleId ? ('allowed' as const) : ('blocked' as const);
      const rule = allowedContextRuleId ?? policy.descriptions.sensitiveTermRuleId;

      for (const term of sensitiveTerms) {
        hits.push({ file, line: lineNo, term, rule, result });
      }
    }
  };

  scanDescription('docs/ChromeWebStore-Description-EN.md', input.descriptionEnMarkdown);
  scanDescription('docs/ChromeWebStore-Description-ZH.md', input.descriptionZhMarkdown);

  const blocked = hits.filter((h) => h.result === 'blocked').length;
  const allowed = hits.filter((h) => h.result === 'allowed').length;
  const total = hits.length;

  return {
    hits: sortHitsStable(hits),
    summary: { total, allowed, blocked, result: blocked > 0 ? 'BLOCKED' : 'PASS' }
  };
}

function formatJsonStable(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildFixSuggestionsForBlocked(hits: ReadonlyArray<CwsListingRedlinesHit>): string[] {
  const suggestions: string[] = [];

  const hasKeywordBlocked = hits.some((h) => h.file === 'docs/aso/keywords.md');
  if (hasKeywordBlocked) {
    suggestions.push('Keywords：移除/替换命中的敏感词（keywords 无语境，零容忍）。');
  }

  const hasDescriptionBlocked = hits.some(
    (h) => h.file === 'docs/ChromeWebStore-Description-EN.md' || h.file === 'docs/ChromeWebStore-Description-ZH.md'
  );
  if (hasDescriptionBlocked) {
    suggestions.push('长描述：删除“诱导订阅/付费/升级”口径；如需出现敏感词，必须改写为可被规则识别的否定语境免责声明。');
  }

  suggestions.push('修复后重新执行 `bash scripts/test.sh`，确保扫描门禁为 PASS。');
  return suggestions;
}

export function formatCwsListingRedlinesIndexMarkdown(input: {
  evidenceDir: string;
  policy: { path: string; sha256: string; policy: CwsListingRedlinesPolicy };
  evidence: CwsListingRedlinesScanEvidence;
}): string {
  const evidenceDirPosix = toPosixPath(input.evidenceDir);
  const policyPath = input.policy.path;
  const policySha256 = input.policy.sha256;
  const policyObj = input.policy.policy;

  const lines: string[] = [];
  lines.push('# V1-76 CWS Listing 合规红线扫描证据（敏感词/夸大口径）');
  lines.push('');
  lines.push(`- 证据目录：\`${evidenceDirPosix}/\``);
  lines.push('- 生成脚本：`scripts/scan-cws-listing-redlines.ts`');
  lines.push(`- 口径（唯一事实来源）：\`${policyPath}\``);
  lines.push(`  - sha256：\`${policySha256}\``);
  lines.push(`- 扫描明细：\`${toPosixPath(path.join(input.evidenceDir, 'cws-listing-redlines-scan.json'))}\``);
  lines.push('');

  lines.push('## 结论');
  lines.push(`- 结果：**${input.evidence.summary.result}**`);
  lines.push(`- 命中：total=${input.evidence.summary.total} allowed=${input.evidence.summary.allowed} blocked=${input.evidence.summary.blocked}`);
  lines.push('- 门禁：当 blocked > 0 时，脚本以非 0 退出码阻断 `bash scripts/test.sh`。');
  lines.push('');

  lines.push('## 引用源 sha256（用于与 Listing baseline/diff 互证）');
  for (const f of input.evidence.inputs) {
    lines.push(`- \`${f.path}\` sha256：\`${f.sha256}\``);
  }
  lines.push('');

  const allowedHits = input.evidence.hits.filter((h) => h.result === 'allowed');
  const blockedHits = input.evidence.hits.filter((h) => h.result === 'blocked');

  if (allowedHits.length > 0) {
    lines.push('## ALLOWED 命中（必须可解释归因）');
    for (const rule of policyObj.descriptions.allowedContextPatterns) {
      const grouped = allowedHits.filter((h) => h.rule === rule.id);
      if (grouped.length === 0) continue;
      lines.push(`- 规则 \`${rule.id}\`：${rule.explanation}`);
      for (const h of grouped) lines.push(`  - \`${h.file}:${h.line}\` term=\`${h.term}\``);
    }
    lines.push('');
  }

  if (blockedHits.length > 0) {
    lines.push('## BLOCKED 命中（必须修复）');
    const byRule = new Map<string, CwsListingRedlinesHit[]>();
    for (const h of blockedHits) {
      const arr = byRule.get(h.rule) ?? [];
      arr.push(h);
      byRule.set(h.rule, arr);
    }

    for (const [ruleId, arr] of [...byRule.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const ruleExplain =
        policyObj.descriptions.blockedPhrasePatterns.find((r) => r.id === ruleId)?.explanation ||
        (ruleId === policyObj.descriptions.sensitiveTermRuleId ? '敏感词命中但未满足否定语境免责声明。' : '');
      lines.push(`- 规则 \`${ruleId}\`${ruleExplain ? `：${ruleExplain}` : ''}`);
      for (const h of arr) lines.push(`  - \`${h.file}:${h.line}\` term=\`${h.term}\``);
    }
    lines.push('');
  }

  lines.push('## 修复建议');
  if (blockedHits.length === 0) {
    lines.push('- 无（当前为 PASS）。');
  } else {
    for (const s of buildFixSuggestionsForBlocked(blockedHits)) lines.push(`- ${s}`);
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
}

export async function buildCwsListingRedlinesScanEvidenceFromRepo(options?: {
  policyPath?: string;
  evidenceDir?: string;
  inputs?: readonly string[];
}): Promise<{
  evidenceDir: string;
  evidence: CwsListingRedlinesScanEvidence;
  scanJson: string;
  indexMarkdown: string;
}> {
  const policyPath = toPosixPath(options?.policyPath ?? DEFAULT_CWS_LISTING_REDLINES_POLICY_PATH);
  const evidenceDir = toPosixPath(options?.evidenceDir ?? DEFAULT_CWS_LISTING_REDLINES_EVIDENCE_DIR);
  const inputs = (options?.inputs ?? DEFAULT_CWS_LISTING_REDLINES_INPUTS).map(toPosixPath);

  const policyAbs = path.resolve(process.cwd(), policyPath);
  const policyMarkdown = await fs.readFile(policyAbs, 'utf-8');
  const policySha256 = await computeFileSha256(policyAbs);
  const policy = parseCwsListingRedlinesPolicyFromMarkdown(policyMarkdown);

  const inputItems: Array<{ path: string; abs: string; bytes: number; sha256: string; content: string }> = [];
  for (const p of inputs) {
    const abs = path.resolve(process.cwd(), p);
    const st = await fs.stat(abs);
    const sha256 = await computeFileSha256(abs);
    const content = await fs.readFile(abs, 'utf-8');
    inputItems.push({ path: p, abs, bytes: st.size, sha256, content: normalizeNewlines(content) });
  }

  const findInput = (p: string) => {
    const found = inputItems.find((i) => i.path === p);
    assert.ok(found, `Missing input: ${p}`);
    return found;
  };

  const scan = scanCwsListingRedlinesFromText({
    policy,
    descriptionEnMarkdown: findInput('docs/ChromeWebStore-Description-EN.md').content,
    descriptionZhMarkdown: findInput('docs/ChromeWebStore-Description-ZH.md').content,
    keywordsMarkdown: findInput('docs/aso/keywords.md').content
  });

  const evidence: CwsListingRedlinesScanEvidence = {
    policy: { path: policyPath, sha256: policySha256 },
    inputs: inputItems.map((i) => ({ path: i.path, bytes: i.bytes, sha256: i.sha256 })),
    hits: scan.hits,
    summary: scan.summary
  };

  const scanJson = formatJsonStable({
    policy: evidence.policy,
    inputs: evidence.inputs,
    hits: evidence.hits,
    summary: evidence.summary
  });

  const indexMarkdown = formatCwsListingRedlinesIndexMarkdown({
    evidenceDir,
    policy: { path: policyPath, sha256: policySha256, policy },
    evidence
  });

  return { evidenceDir, evidence, scanJson, indexMarkdown };
}

async function writeEvidenceOutputs(input: { evidenceDir: string; scanJson: string; indexMarkdown: string }): Promise<void> {
  const evidenceDirAbs = path.resolve(process.cwd(), input.evidenceDir);
  await fs.mkdir(evidenceDirAbs, { recursive: true });

  const scanJsonAbs = path.resolve(process.cwd(), path.join(input.evidenceDir, 'cws-listing-redlines-scan.json'));
  const indexAbs = path.resolve(process.cwd(), path.join(input.evidenceDir, 'index.md'));

  await fs.writeFile(scanJsonAbs, input.scanJson, 'utf-8');
  await fs.writeFile(indexAbs, input.indexMarkdown, 'utf-8');
}

async function main() {
  const built = await buildCwsListingRedlinesScanEvidenceFromRepo({
    policyPath: DEFAULT_CWS_LISTING_REDLINES_POLICY_PATH,
    evidenceDir: DEFAULT_CWS_LISTING_REDLINES_EVIDENCE_DIR,
    inputs: DEFAULT_CWS_LISTING_REDLINES_INPUTS
  });

  await writeEvidenceOutputs({
    evidenceDir: built.evidenceDir,
    scanJson: built.scanJson,
    indexMarkdown: built.indexMarkdown
  });

  if (built.evidence.summary.blocked > 0) {
    throw new Error(`CWS listing redlines scan blocked: blocked=${built.evidence.summary.blocked}`);
  }
}

const invokedAsScript = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
