import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256, formatUtcDateTimeCompact } from './cws-publish-evidence-pack.ts';

export const CWS_LISTING_EVIDENCE_PACK_VERSION = 'v1-66' as const;
export const DEFAULT_CWS_LISTING_EVIDENCE_DIR = 'docs/evidence/v1-66';

const REQUIRED_INPUT_PATHS: readonly string[] = [
  'docs/ChromeWebStore-Description-EN.md',
  'docs/ChromeWebStore-Description-ZH.md',
  'docs/aso/keywords.md',
  'docs/aso/store-assets.md',
  'docs/aso/cws-release-notes-template.md'
];

const OPTIONAL_INPUT_PATHS: readonly string[] = ['docs/aso/value-prop.md'];

const PRO_SCOPE_STABLE_PATH = 'docs/monetization/pro-scope.md';

const TUTORIAL_LINK_PATHS: readonly string[] = [
  'docs/tutorials/table-to-csv-markdown.md',
  'docs/tutorials/prompt-workflow.md',
  'docs/tutorials/code-block-cleaning.md'
];

// 可维护词表（用于 noOverclaimKeywords 断言；只用于捕捉“误导性宣称”，不拦截否定语境的说明性文字）
const KEYWORDS_FORBIDDEN_TERMS: readonly RegExp[] = [
  /\bsubscribe\b/i,
  /\bsubscription\b/i,
  /\bpricing\b/i,
  /\bpaid\b/i,
  /\bpayment\b/i,
  /\bupgrade\b/i,
  /\bpremium\b/i,
  /付费/,
  /订阅/,
  /收费/,
  /购买/,
  /价格/,
  /会员/,
  /内购/,
  /高级版/
];

const DESCRIPTIONS_OVERCLAIM_PATTERNS: readonly RegExp[] = [
  /\bsubscribe\s+now\b/i,
  /\bupgrade\s+to\s+pro\b/i,
  /\bpro\s+is\s+available\b/i,
  /\bpro\s+is\s+shipped\b/i,
  /\bpaid\s+version\b/i,
  /\bsubscription\s+available\b/i,
  /立即订阅/,
  /现在订阅/,
  /订阅即可/,
  /付费版已上线/,
  /Pro\s*已上线/,
  /已上线\s*Pro/,
  /现已上线/,
  /已经上线/,
  /开始收费/,
  /付费订阅/
];

export type CwsListingEvidenceInput = Readonly<{
  path: string;
  bytes: number;
  sha256: string;
}>;

export type CwsListingScreenshotPlanItem = Readonly<{
  id: string; // "01".."07"
  titleZh: string;
  titleEn: string;
  assertions: string[];
}>;

export type CwsListingEvidencePack = Readonly<{
  packVersion: typeof CWS_LISTING_EVIDENCE_PACK_VERSION;
  exportedAt: string;
  extensionVersion: string;
  inputs: CwsListingEvidenceInput[];
  listing: Readonly<{
    descriptions: Readonly<{ en: string; zh: string }>;
    keywords: Readonly<{ en: string[]; zh: string[] }>;
    screenshotPlan: CwsListingScreenshotPlanItem[];
    releaseNotesTemplateSha256: string;
  }>;
  assertions: Readonly<{
    hasProWaitlistCta: boolean;
    hasTutorialLinks: boolean;
    hasPrivacyClaims: boolean;
    noOverclaimKeywords: boolean;
  }>;
}>;

function normalizeNewlines(text: string): string {
  return String(text || '').replace(/\r\n/g, '\n');
}

function toPosixPath(p: string): string {
  return p.replace(/\\/g, '/');
}

async function readUtf8Normalized(filePathAbs: string): Promise<string> {
  const raw = await fs.readFile(filePathAbs, 'utf-8');
  return normalizeNewlines(raw);
}

export async function readManifestVersion(manifestPath: string): Promise<string> {
  const raw = await readUtf8Normalized(path.resolve(process.cwd(), manifestPath));
  const parsed = JSON.parse(raw) as { version?: unknown };
  assert.equal(typeof parsed.version, 'string', `${manifestPath}: version should be a string`);
  const v = String(parsed.version || '').trim();
  assert.ok(v.length > 0, `${manifestPath}: version should not be empty`);
  return v;
}

export async function resolveExtensionVersion(options: { requireDistManifest: boolean }): Promise<string> {
  const manifestVersion = await readManifestVersion('manifest.json');

  if (!options.requireDistManifest) return manifestVersion;

  const distManifestPath = 'dist/manifest.json';
  try {
    await fs.stat(path.resolve(process.cwd(), distManifestPath));
  } catch {
    throw new Error(`Missing ${distManifestPath}. Run: npm run build:prod`);
  }

  const distManifestVersion = await readManifestVersion(distManifestPath);
  assert.equal(
    distManifestVersion,
    manifestVersion,
    `manifest.json version (${manifestVersion}) should match dist/manifest.json (${distManifestVersion})`
  );
  return manifestVersion;
}

export function formatCwsListingEvidencePackFilename(options: { extensionVersion: string; exportedAt: Date }): string {
  const dt = formatUtcDateTimeCompact(options.exportedAt);
  return `cws-listing-evidence-pack-${options.extensionVersion}-${dt}.json`;
}

async function buildEvidenceInputs(pathsRel: readonly string[]): Promise<CwsListingEvidenceInput[]> {
  const inputs: CwsListingEvidenceInput[] = [];
  for (const p of pathsRel) {
    const rel = toPosixPath(p);
    const abs = path.resolve(process.cwd(), rel);
    const st = await fs.stat(abs);
    const sha256 = await computeFileSha256(abs);
    inputs.push({ path: rel, bytes: st.size, sha256 });
  }
  return inputs;
}

function extractBulletListUnderHeading(markdown: string, heading: string): string[] {
  const lines = normalizeNewlines(markdown).split('\n');
  const idx = lines.findIndex((l) => l.trim() === heading.trim());
  if (idx < 0) return [];

  const out: string[] = [];
  for (let i = idx + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (line.trim().startsWith('## ')) break;
    const m = line.match(/^\s*-\s+(.*)$/);
    if (!m) continue;
    const value = String(m[1] || '').trim();
    if (value) out.push(value);
  }
  return out;
}

export function parseCwsListingKeywordsFromMarkdown(markdown: string): { en: string[]; zh: string[] } {
  const en = extractBulletListUnderHeading(markdown, '## EN Keywords (Groups)');
  const zh = extractBulletListUnderHeading(markdown, '## ZH 关键词组（建议）');
  return { en, zh };
}

function parseScreenshotPlanSection(id: string, lines: string[]): CwsListingScreenshotPlanItem {
  const titleZhLine = lines.find((l) => l.trim().startsWith('- 截图标题（ZH）：')) || '';
  const titleEnLine = lines.find((l) => l.trim().startsWith('- Title (EN):')) || '';

  const titleZh = titleZhLine.split('：').slice(1).join('：').trim();
  const titleEn = titleEnLine.split(':').slice(1).join(':').trim();

  const assertions: string[] = [];
  const markerIndex = lines.findIndex((l) => l.trim() === '- 要展示的真实功能点（可验证）：');
  if (markerIndex >= 0) {
    for (let i = markerIndex + 1; i < lines.length; i += 1) {
      const line = lines[i] ?? '';
      if (line.trim().startsWith('- ') && !line.startsWith('  - ')) break;
      const m = line.match(/^\s{2}-\s+(.*)$/);
      if (!m) continue;
      const value = String(m[1] || '').trim();
      if (value) assertions.push(value);
    }
  }

  assert.ok(titleZh.length > 0, `store-assets.md screenshot ${id}: missing ZH title`);
  assert.ok(titleEn.length > 0, `store-assets.md screenshot ${id}: missing EN title`);
  assert.ok(assertions.length > 0, `store-assets.md screenshot ${id}: missing assertions list`);

  return { id, titleZh, titleEn, assertions };
}

export function parseCwsListingScreenshotPlanFromMarkdown(markdown: string): CwsListingScreenshotPlanItem[] {
  const lines = normalizeNewlines(markdown).split('\n');
  const sections: Array<{ id: string; start: number; end: number }> = [];

  for (let i = 0; i < lines.length; i += 1) {
    const m = (lines[i] ?? '').match(/^###\s+(\d{2})/);
    if (!m) continue;
    sections.push({ id: m[1] as string, start: i, end: lines.length });
  }

  for (let i = 0; i < sections.length; i += 1) {
    const cur = sections[i] as { id: string; start: number; end: number };
    const next = sections[i + 1] as { id: string; start: number; end: number } | undefined;
    if (next) cur.end = next.start;
  }

  const items: CwsListingScreenshotPlanItem[] = [];
  for (const sec of sections) {
    if (!/^(0[1-7])$/.test(sec.id)) continue;
    const chunk = lines.slice(sec.start, sec.end);
    items.push(parseScreenshotPlanSection(sec.id, chunk));
  }

  items.sort((a, b) => a.id.localeCompare(b.id));
  assert.equal(items.length, 7, 'store-assets.md should contain screenshot plan sections 01..07');
  return items;
}

function hasProWaitlistCtaEn(en: string): boolean {
  const t = en.toLowerCase();
  return t.includes('waitlist') && t.includes('options') && t.includes('pro') && en.includes(PRO_SCOPE_STABLE_PATH);
}

function hasProWaitlistCtaZh(zh: string): boolean {
  const t = zh.toLowerCase();
  return zh.includes('候补') && t.includes('options') && t.includes('pro') && zh.includes(PRO_SCOPE_STABLE_PATH);
}

function hasTutorialLinks(text: string): boolean {
  return TUTORIAL_LINK_PATHS.every((p) => text.includes(p));
}

function hasPrivacyClaimsEn(en: string): boolean {
  return en.includes('Local by default') && en.includes('No copied content') && en.includes('OFF by default');
}

function hasPrivacyClaimsZh(zh: string): boolean {
  return zh.includes('默认本地处理') && zh.includes('不收集/不上传复制内容') && zh.includes('默认关闭');
}

function hasOverclaimKeywords(keywords: string[]): boolean {
  for (const kw of keywords) {
    for (const re of KEYWORDS_FORBIDDEN_TERMS) {
      if (re.test(kw)) return true;
    }
  }
  return false;
}

function hasOverclaimDescription(text: string): boolean {
  return DESCRIPTIONS_OVERCLAIM_PATTERNS.some((re) => re.test(text));
}

export function computeCwsListingEvidenceAssertions(listing: {
  descriptions: { en: string; zh: string };
  keywords: { en: string[]; zh: string[] };
}): CwsListingEvidencePack['assertions'] {
  const hasProWaitlistCta = hasProWaitlistCtaEn(listing.descriptions.en) && hasProWaitlistCtaZh(listing.descriptions.zh);
  const hasTutorialLinksOk = hasTutorialLinks(listing.descriptions.en) && hasTutorialLinks(listing.descriptions.zh);
  const hasPrivacyClaimsOk = hasPrivacyClaimsEn(listing.descriptions.en) && hasPrivacyClaimsZh(listing.descriptions.zh);

  const keywordsOk = !hasOverclaimKeywords([...listing.keywords.en, ...listing.keywords.zh]);
  const descOk = !hasOverclaimDescription(listing.descriptions.en) && !hasOverclaimDescription(listing.descriptions.zh);
  const noOverclaimKeywords = keywordsOk && descOk;

  return {
    hasProWaitlistCta,
    hasTutorialLinks: hasTutorialLinksOk,
    hasPrivacyClaims: hasPrivacyClaimsOk,
    noOverclaimKeywords
  };
}

export function buildCwsListingEvidencePack(input: {
  exportedAtIso: string;
  extensionVersion: string;
  inputs: CwsListingEvidenceInput[];
  listing: CwsListingEvidencePack['listing'];
  assertions: CwsListingEvidencePack['assertions'];
}): CwsListingEvidencePack {
  return {
    packVersion: CWS_LISTING_EVIDENCE_PACK_VERSION,
    exportedAt: input.exportedAtIso,
    extensionVersion: input.extensionVersion,
    inputs: input.inputs.map((v) => ({ path: v.path, bytes: v.bytes, sha256: v.sha256 })),
    listing: {
      descriptions: { en: input.listing.descriptions.en, zh: input.listing.descriptions.zh },
      keywords: { en: [...input.listing.keywords.en], zh: [...input.listing.keywords.zh] },
      screenshotPlan: input.listing.screenshotPlan.map((s) => ({
        id: s.id,
        titleZh: s.titleZh,
        titleEn: s.titleEn,
        assertions: [...s.assertions]
      })),
      releaseNotesTemplateSha256: input.listing.releaseNotesTemplateSha256
    },
    assertions: {
      hasProWaitlistCta: input.assertions.hasProWaitlistCta,
      hasTutorialLinks: input.assertions.hasTutorialLinks,
      hasPrivacyClaims: input.assertions.hasPrivacyClaims,
      noOverclaimKeywords: input.assertions.noOverclaimKeywords
    }
  };
}

type AssertionFailure = Readonly<{
  key: keyof CwsListingEvidencePack['assertions'];
  reason: string;
  fix: string;
}>;

function buildAssertionFailures(assertions: CwsListingEvidencePack['assertions']): AssertionFailure[] {
  const failures: AssertionFailure[] = [];
  if (!assertions.hasProWaitlistCta) {
    failures.push({
      key: 'hasProWaitlistCta',
      reason: `长描述未同时包含 waitlist 加入方式与稳定链接 ${PRO_SCOPE_STABLE_PATH}`,
      fix: '修复：更新 docs/ChromeWebStore-Description-EN.md 与 docs/ChromeWebStore-Description-ZH.md 的 Pro waitlist 段落'
    });
  }
  if (!assertions.hasTutorialLinks) {
    failures.push({
      key: 'hasTutorialLinks',
      reason: `长描述未同时包含 tutorials 链接（应包含：${TUTORIAL_LINK_PATHS.join(', ')}）`,
      fix: '修复：在 docs/ChromeWebStore-Description-EN.md 与 docs/ChromeWebStore-Description-ZH.md 补齐 LEARN MORE / 教程段落'
    });
  }
  if (!assertions.hasPrivacyClaims) {
    failures.push({
      key: 'hasPrivacyClaims',
      reason: '长描述未同时包含“本地处理/不上传复制内容/匿名开关默认 OFF”的隐私口径',
      fix: '修复：在 docs/ChromeWebStore-Description-EN.md 与 docs/ChromeWebStore-Description-ZH.md 的 PRIVACY 段落补齐口径'
    });
  }
  if (!assertions.noOverclaimKeywords) {
    failures.push({
      key: 'noOverclaimKeywords',
      reason: '关键词/长描述出现“已上线 Pro/订阅/付费”等误导性宣称（词表可在脚本内维护）',
      fix: '修复：调整 docs/aso/keywords.md 与两份长描述，避免误导性宣称；必要时更新脚本内词表'
    });
  }
  return failures;
}

export function buildCwsListingEvidenceIndexMarkdown(input: {
  evidenceDir: string;
  packFileName: string;
  pack: CwsListingEvidencePack;
  assertionFailures: AssertionFailure[];
}): string {
  const evidenceDirPosix = toPosixPath(input.evidenceDir);

  const lines: string[] = [];
  lines.push('# V1-66 CWS Listing 物料证据包（可审计/可复核/可复用）');
  lines.push('');
  lines.push(`- 证据目录：\`${evidenceDirPosix.replace(/\\/g, '/')}/\``);
  lines.push('- 生成脚本：`scripts/build-cws-listing-evidence-pack.ts`');
  lines.push(`- packVersion：\`${input.pack.packVersion}\``);
  lines.push(`- exportedAt：\`${input.pack.exportedAt}\``);
  lines.push(`- extensionVersion：\`${input.pack.extensionVersion}\``);
  lines.push(`- 证据包文件：\`${input.packFileName}\``);
  lines.push('');

  lines.push('## 输入文件哈希清单（可追溯基线）');
  lines.push('');
  lines.push('| path | bytes | sha256 |');
  lines.push('| --- | ---: | --- |');
  for (const f of input.pack.inputs) {
    lines.push(`| \`${f.path}\` | ${f.bytes} | \`${f.sha256}\` |`);
  }
  lines.push('');

  lines.push('## 关键断言（自动化门禁）');
  lines.push('');
  for (const [key, value] of Object.entries(input.pack.assertions) as Array<[string, boolean]>) {
    lines.push(`- ${key}: ${value ? 'PASS' : 'FAIL'}`);
  }

  if (input.assertionFailures.length > 0) {
    lines.push('');
    lines.push('## FAIL 原因与修复路径（若门禁失败）');
    lines.push('');
    for (const f of input.assertionFailures) {
      lines.push(`- ${f.key}: ${f.reason}`);
      lines.push(`  - ${f.fix}`);
    }
  }

  lines.push('');
  lines.push('## 使用说明');
  lines.push('');
  lines.push('- 生成（写入 `docs/evidence/v1-66/`）：');
  lines.push('  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-evidence-pack.ts`');
  lines.push('- 门禁/可重复性（固定 exportedAt，便于 diff）：');
  lines.push(
    '  - `node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-evidence-pack.ts --stable-exported-at`'
  );
  lines.push('- 复核 sha256（示例）：`shasum -a 256 docs/ChromeWebStore-Description-EN.md`');
  lines.push('- 敏感信息搜索（示例）：`rg -n "CWS_|TOKEN|SECRET" docs/evidence/v1-66`');

  lines.push('');
  lines.push('## 与 Top2「真实发布取证」衔接说明');
  lines.push('');
  lines.push(
    '- 本证据包仅固化“商店物料基线”（长描述/关键词/截图脚本/更新日志模板）的可审计快照；不替代真实发布与商店端截图取证。'
  );
  lines.push(
    '- 网络恢复后按 `docs/evidence/v1-62/index.md` 与 `docs/test-cases/v1-45.md` 完成真实发布与商店端取证；并在发布证据中引用本包 inputs.sha256 复核“物料一致性”。'
  );

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('输出文件：');
  lines.push(`- \`${evidenceDirPosix}/index.md\``);
  lines.push(`- \`${evidenceDirPosix}/${input.packFileName}\``);
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function ensureNoSecretLikeStrings(pack: CwsListingEvidencePack): void {
  const json = JSON.stringify(pack);

  // 不应包含任何 env key（本脚本也不应读取 env）；此处仅做门禁兜底
  assert.ok(!json.includes('process.env'), 'Evidence pack should not include process.env');

  const forbiddenEnvKeys = ['CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN', 'CWS_CLIENT_ID', 'CWS_EXTENSION_ID'];
  for (const key of forbiddenEnvKeys) {
    assert.ok(!json.includes(key), `Evidence pack should not include env key: ${key}`);
  }
}

export async function buildCwsListingEvidencePackFromRepo(options: {
  exportedAt: Date;
  evidenceDir?: string;
  requireDistManifest?: boolean;
}): Promise<{
  evidenceDir: string;
  packFileName: string;
  pack: CwsListingEvidencePack;
  indexMarkdown: string;
  assertionFailures: AssertionFailure[];
}> {
  const evidenceDir = options.evidenceDir ?? DEFAULT_CWS_LISTING_EVIDENCE_DIR;
  const extensionVersion = await resolveExtensionVersion({ requireDistManifest: options.requireDistManifest ?? false });

  const inputPaths: string[] = [...REQUIRED_INPUT_PATHS];
  for (const optionalPath of OPTIONAL_INPUT_PATHS) {
    try {
      await fs.stat(path.resolve(process.cwd(), optionalPath));
      inputPaths.push(optionalPath);
    } catch {
      // optional: ignore
    }
  }

  const inputs = await buildEvidenceInputs(inputPaths);

  const enDescAbs = path.resolve(process.cwd(), 'docs/ChromeWebStore-Description-EN.md');
  const zhDescAbs = path.resolve(process.cwd(), 'docs/ChromeWebStore-Description-ZH.md');
  const keywordsAbs = path.resolve(process.cwd(), 'docs/aso/keywords.md');
  const storeAssetsAbs = path.resolve(process.cwd(), 'docs/aso/store-assets.md');

  const en = await readUtf8Normalized(enDescAbs);
  const zh = await readUtf8Normalized(zhDescAbs);
  const keywordsMd = await readUtf8Normalized(keywordsAbs);
  const storeAssetsMd = await readUtf8Normalized(storeAssetsAbs);

  const keywords = parseCwsListingKeywordsFromMarkdown(keywordsMd);
  const screenshotPlan = parseCwsListingScreenshotPlanFromMarkdown(storeAssetsMd);

  const releaseNotesTemplatePath = 'docs/aso/cws-release-notes-template.md';
  const releaseNotesTemplateSha256 =
    inputs.find((f) => f.path === releaseNotesTemplatePath)?.sha256 ||
    (await computeFileSha256(path.resolve(process.cwd(), releaseNotesTemplatePath)));

  const listing: CwsListingEvidencePack['listing'] = {
    descriptions: { en, zh },
    keywords,
    screenshotPlan,
    releaseNotesTemplateSha256
  };

  const assertions = computeCwsListingEvidenceAssertions({ descriptions: { en, zh }, keywords });
  const assertionFailures = buildAssertionFailures(assertions);

  const exportedAtIso = options.exportedAt.toISOString();
  const packFileName = formatCwsListingEvidencePackFilename({ extensionVersion, exportedAt: options.exportedAt });

  const pack = buildCwsListingEvidencePack({
    exportedAtIso,
    extensionVersion,
    inputs,
    listing,
    assertions
  });

  ensureNoSecretLikeStrings(pack);

  const indexMarkdown = buildCwsListingEvidenceIndexMarkdown({
    evidenceDir,
    packFileName,
    pack,
    assertionFailures
  });

  return { evidenceDir, packFileName, pack, indexMarkdown, assertionFailures };
}

async function writeEvidenceOutputs(options: {
  evidenceDir: string;
  packFileName: string;
  pack: CwsListingEvidencePack;
  indexMarkdown: string;
}): Promise<{ packFilePath: string; indexFilePath: string }> {
  const evidenceDirAbs = path.resolve(process.cwd(), options.evidenceDir);
  await fs.mkdir(evidenceDirAbs, { recursive: true });

  const packFilePath = path.join(evidenceDirAbs, options.packFileName);
  const indexFilePath = path.join(evidenceDirAbs, 'index.md');

  const json = `${JSON.stringify(options.pack, null, 2)}\n`;
  await fs.writeFile(packFilePath, json, 'utf-8');
  await fs.writeFile(indexFilePath, options.indexMarkdown, 'utf-8');

  return { packFilePath, indexFilePath };
}

function parseArgs(argv: string[]): { stableExportedAt: boolean } {
  const stableExportedAt = argv.includes('--stable-exported-at');
  const unknown = argv.filter((a) => a.startsWith('--') && a !== '--stable-exported-at');
  if (unknown.length > 0) throw new Error(`Unknown args: ${unknown.join(', ')}`);
  return { stableExportedAt };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const exportedAt = args.stableExportedAt ? new Date('2026-03-21T00:00:00.000Z') : new Date();

  const built = await buildCwsListingEvidencePackFromRepo({
    exportedAt,
    evidenceDir: DEFAULT_CWS_LISTING_EVIDENCE_DIR,
    requireDistManifest: true
  });

  await writeEvidenceOutputs({
    evidenceDir: built.evidenceDir,
    packFileName: built.packFileName,
    pack: built.pack,
    indexMarkdown: built.indexMarkdown
  });

  // If assertions fail, we still wrote evidence for audit, but we should block CI.
  if (built.assertionFailures.length > 0) {
    const failures = built.assertionFailures.map((f) => f.key).join(', ');
    throw new Error(`CWS listing evidence assertions failed: ${failures}`);
  }
}

const invokedAsScript = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
