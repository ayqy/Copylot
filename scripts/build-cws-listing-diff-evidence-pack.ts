import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256, formatUtcDateTimeCompact } from './cws-publish-evidence-pack.ts';
import { buildCwsListingEvidencePackFromRepo, type CwsListingEvidencePack } from './build-cws-listing-evidence-pack.ts';

export const CWS_LISTING_DIFF_EVIDENCE_PACK_VERSION = 'v1-67' as const;
export const DEFAULT_CWS_LISTING_DIFF_EVIDENCE_DIR = 'docs/evidence/v1-67';
export const DEFAULT_V1_66_EVIDENCE_INDEX_PATH = 'docs/evidence/v1-66/index.md';
export const DEFAULT_STABLE_EXPORTED_AT_ISO = '2026-03-21T00:00:00.000Z';

export type CwsListingDiffRedline = 'lostProWaitlistCta' | 'lostPrivacyClaims' | 'overclaimDetected';

export type CwsListingDiffEvidencePack = Readonly<{
  packVersion: typeof CWS_LISTING_DIFF_EVIDENCE_PACK_VERSION;
  exportedAt: string;
  extensionVersion: string;
  baseline: Readonly<{
    packPath: string;
    sha256: string;
    extensionVersion: string;
    exportedAt: string;
    assertions: CwsListingEvidencePack['assertions'];
  }>;
  current: Readonly<{
    packPath: string;
    sha256: string;
    extensionVersion: string;
    exportedAt: string;
    assertions: CwsListingEvidencePack['assertions'];
  }>;
  diff: Readonly<{
    keywords: Readonly<{
      enAdded: string[];
      enRemoved: string[];
      zhAdded: string[];
      zhRemoved: string[];
    }>;
    descriptions: Readonly<{
      enSha256From: string;
      enSha256To: string;
      zhSha256From: string;
      zhSha256To: string;
    }>;
    screenshotPlan: Readonly<{
      changedIds: string[];
    }>;
    assertions: Readonly<{
      changedKeys: Array<keyof CwsListingEvidencePack['assertions']>;
    }>;
  }>;
  redlines: CwsListingDiffRedline[];
}>;

function normalizeNewlines(text: string): string {
  return String(text || '').replace(/\r\n/g, '\n');
}

function toPosixPath(p: string): string {
  return p.split(path.sep).join(path.posix.sep);
}

function computeSha256ForText(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf-8').digest('hex');
}

export function formatCwsListingDiffEvidencePackFilename(options: { extensionVersion: string; exportedAt: Date }): string {
  const dt = formatUtcDateTimeCompact(options.exportedAt);
  return `cws-listing-diff-evidence-pack-${options.extensionVersion}-${dt}.json`;
}

export function parseCwsListingEvidencePackFileNameFromIndexMarkdown(markdown: string): string {
  const md = normalizeNewlines(markdown);
  const m = md.match(/cws-listing-evidence-pack-[0-9A-Za-z._-]+\.json/);
  assert.ok(m?.[0], 'Failed to resolve v1-66 listing evidence pack filename from index.md');
  return m[0] as string;
}

export async function resolveBaselineListingEvidencePackPathFromIndexFile(
  indexPath: string = DEFAULT_V1_66_EVIDENCE_INDEX_PATH
): Promise<string> {
  const indexAbs = path.resolve(process.cwd(), indexPath);
  const md = await fs.readFile(indexAbs, 'utf-8');
  const packFileName = parseCwsListingEvidencePackFileNameFromIndexMarkdown(md);
  const packRel = toPosixPath(path.join(path.dirname(indexPath), packFileName));
  const packAbs = path.resolve(process.cwd(), packRel);
  await fs.stat(packAbs);
  return packRel;
}

function cloneAssertions(assertions: CwsListingEvidencePack['assertions']): CwsListingEvidencePack['assertions'] {
  return {
    hasProWaitlistCta: assertions.hasProWaitlistCta,
    hasTutorialLinks: assertions.hasTutorialLinks,
    hasPrivacyClaims: assertions.hasPrivacyClaims,
    noOverclaimKeywords: assertions.noOverclaimKeywords
  };
}

function sortedSetDiff(from: readonly string[], to: readonly string[]): { added: string[]; removed: string[] } {
  const fromSet = new Set(from);
  const toSet = new Set(to);

  const added: string[] = [];
  const removed: string[] = [];

  for (const v of toSet) if (!fromSet.has(v)) added.push(v);
  for (const v of fromSet) if (!toSet.has(v)) removed.push(v);

  added.sort((a, b) => a.localeCompare(b));
  removed.sort((a, b) => a.localeCompare(b));
  return { added, removed };
}

function findInputSha256(pack: CwsListingEvidencePack, relPath: string): string {
  const found = pack.inputs.find((f) => f.path === relPath);
  assert.ok(found?.sha256, `Missing inputs sha256 for ${relPath}`);
  return found.sha256;
}

function computeScreenshotPlanChangedIds(
  baselinePlan: readonly CwsListingEvidencePack['listing']['screenshotPlan'][number][],
  currentPlan: readonly CwsListingEvidencePack['listing']['screenshotPlan'][number][]
): string[] {
  const curById = new Map<string, CwsListingEvidencePack['listing']['screenshotPlan'][number]>();
  for (const item of currentPlan) curById.set(item.id, item);

  const changed: string[] = [];
  for (const base of baselinePlan) {
    const cur = curById.get(base.id);
    if (!cur) {
      changed.push(base.id);
      continue;
    }
    const sameTitleZh = base.titleZh === cur.titleZh;
    const sameTitleEn = base.titleEn === cur.titleEn;
    const sameAssertions = JSON.stringify(base.assertions) === JSON.stringify(cur.assertions);
    if (!sameTitleZh || !sameTitleEn || !sameAssertions) changed.push(base.id);
  }

  changed.sort((a, b) => a.localeCompare(b));
  return changed;
}

export function computeCwsListingDiffRedlines(assertions: CwsListingEvidencePack['assertions']): CwsListingDiffRedline[] {
  const redlines: CwsListingDiffRedline[] = [];
  if (!assertions.hasProWaitlistCta) redlines.push('lostProWaitlistCta');
  if (!assertions.hasPrivacyClaims) redlines.push('lostPrivacyClaims');
  if (!assertions.noOverclaimKeywords) redlines.push('overclaimDetected');
  return redlines;
}

function ensureNoSecretLikeStrings(text: string): void {
  assert.ok(!text.includes('process.env'), 'Evidence outputs should not include process.env');

  const forbiddenEnvKeys = ['CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN', 'CWS_CLIENT_ID', 'CWS_EXTENSION_ID'];
  for (const key of forbiddenEnvKeys) {
    assert.ok(!text.includes(key), `Evidence outputs should not include env key: ${key}`);
  }
}

function formatJsonStable(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function buildCwsListingDiffEvidencePackFromRepo(options: {
  exportedAt: Date;
  baselinePackPath: string;
  evidenceDir?: string;
  requireDistManifest?: boolean;
}): Promise<{
  evidenceDir: string;
  baseline: { packPath: string; sha256: string; pack: CwsListingEvidencePack };
  current: { packPath: string; packFileName: string; sha256: string; pack: CwsListingEvidencePack; json: string };
  diff: { packPath: string; packFileName: string; sha256: string; pack: CwsListingDiffEvidencePack; json: string };
  indexMarkdown: string;
  redlines: CwsListingDiffRedline[];
}> {
  const evidenceDir = options.evidenceDir ?? DEFAULT_CWS_LISTING_DIFF_EVIDENCE_DIR;

  const baselinePackPath = toPosixPath(options.baselinePackPath);
  const baselineAbs = path.resolve(process.cwd(), baselinePackPath);
  await fs.stat(baselineAbs);

  const baselineSha256 = await computeFileSha256(baselineAbs);
  const baselineRaw = await fs.readFile(baselineAbs, 'utf-8');
  const baselinePack = JSON.parse(baselineRaw) as CwsListingEvidencePack;
  assert.ok(baselinePack?.packVersion, 'Baseline pack should contain packVersion');

  const currentBuilt = await buildCwsListingEvidencePackFromRepo({
    exportedAt: options.exportedAt,
    evidenceDir,
    requireDistManifest: options.requireDistManifest ?? false
  });

  const currentPack = currentBuilt.pack;
  const currentPackFileName = currentBuilt.packFileName;
  const currentPackPath = toPosixPath(path.join(evidenceDir, currentPackFileName));
  const currentPackJson = formatJsonStable(currentPack);
  const currentSha256 = computeSha256ForText(currentPackJson);

  const { added: enAdded, removed: enRemoved } = sortedSetDiff(baselinePack.listing.keywords.en, currentPack.listing.keywords.en);
  const { added: zhAdded, removed: zhRemoved } = sortedSetDiff(baselinePack.listing.keywords.zh, currentPack.listing.keywords.zh);

  const enSha256From = findInputSha256(baselinePack, 'docs/ChromeWebStore-Description-EN.md');
  const zhSha256From = findInputSha256(baselinePack, 'docs/ChromeWebStore-Description-ZH.md');
  const enSha256To = findInputSha256(currentPack, 'docs/ChromeWebStore-Description-EN.md');
  const zhSha256To = findInputSha256(currentPack, 'docs/ChromeWebStore-Description-ZH.md');

  const screenshotPlanChangedIds = computeScreenshotPlanChangedIds(
    baselinePack.listing.screenshotPlan,
    currentPack.listing.screenshotPlan
  );

  const assertionKeys: Array<keyof CwsListingEvidencePack['assertions']> = [
    'hasProWaitlistCta',
    'hasTutorialLinks',
    'hasPrivacyClaims',
    'noOverclaimKeywords'
  ];
  const changedKeys: Array<keyof CwsListingEvidencePack['assertions']> = [];
  for (const key of assertionKeys) {
    if (baselinePack.assertions[key] !== currentPack.assertions[key]) changedKeys.push(key);
  }

  const redlines = computeCwsListingDiffRedlines(currentPack.assertions);

  const diffPack: CwsListingDiffEvidencePack = {
    packVersion: CWS_LISTING_DIFF_EVIDENCE_PACK_VERSION,
    exportedAt: options.exportedAt.toISOString(),
    extensionVersion: currentPack.extensionVersion,
    baseline: {
      packPath: baselinePackPath,
      sha256: baselineSha256,
      extensionVersion: baselinePack.extensionVersion,
      exportedAt: baselinePack.exportedAt,
      assertions: cloneAssertions(baselinePack.assertions)
    },
    current: {
      packPath: currentPackPath,
      sha256: currentSha256,
      extensionVersion: currentPack.extensionVersion,
      exportedAt: currentPack.exportedAt,
      assertions: cloneAssertions(currentPack.assertions)
    },
    diff: {
      keywords: {
        enAdded,
        enRemoved,
        zhAdded,
        zhRemoved
      },
      descriptions: {
        enSha256From,
        enSha256To,
        zhSha256From,
        zhSha256To
      },
      screenshotPlan: {
        changedIds: screenshotPlanChangedIds
      },
      assertions: {
        changedKeys
      }
    },
    redlines: [...redlines]
  };

  const diffPackFileName = formatCwsListingDiffEvidencePackFilename({
    extensionVersion: currentPack.extensionVersion,
    exportedAt: options.exportedAt
  });
  const diffPackPath = toPosixPath(path.join(evidenceDir, diffPackFileName));
  const diffPackJson = formatJsonStable(diffPack);
  const diffSha256 = computeSha256ForText(diffPackJson);

  ensureNoSecretLikeStrings(diffPackJson);
  ensureNoSecretLikeStrings(currentPackJson);

  const indexMarkdown = buildCwsListingDiffEvidenceIndexMarkdown({
    evidenceDir,
    diffPackFileName,
    diffSha256,
    pack: diffPack,
    currentPackFileName,
    currentSha256
  });
  ensureNoSecretLikeStrings(indexMarkdown);

  return {
    evidenceDir,
    baseline: { packPath: baselinePackPath, sha256: baselineSha256, pack: baselinePack },
    current: { packPath: currentPackPath, packFileName: currentPackFileName, sha256: currentSha256, pack: currentPack, json: currentPackJson },
    diff: { packPath: diffPackPath, packFileName: diffPackFileName, sha256: diffSha256, pack: diffPack, json: diffPackJson },
    indexMarkdown,
    redlines
  };
}

export function buildCwsListingDiffEvidenceIndexMarkdown(input: {
  evidenceDir: string;
  diffPackFileName: string;
  diffSha256: string;
  currentPackFileName: string;
  currentSha256: string;
  pack: CwsListingDiffEvidencePack;
}): string {
  const evidenceDirPosix = toPosixPath(input.evidenceDir);
  const evidenceDirPosixTrimmed = evidenceDirPosix.replace(/\/+$/, '');
  const evidenceDirBaseName = evidenceDirPosixTrimmed.split('/').pop() || evidenceDirPosixTrimmed;
  const evidenceLabel = /^v\d+-\d+$/i.test(evidenceDirBaseName) ? evidenceDirBaseName.toUpperCase() : evidenceDirBaseName;

  const lines: string[] = [];
  lines.push(`# ${evidenceLabel} CWS Listing ASO diff 证据包（可审计/可复核/可复用）`);
  lines.push('');
  lines.push(`- 证据目录：\`${evidenceDirPosix.replace(/\\/g, '/')}/\``);
  lines.push('- 生成脚本：`scripts/build-cws-listing-diff-evidence-pack.ts`');
  lines.push(`- packVersion：\`${input.pack.packVersion}\``);
  lines.push(`- exportedAt：\`${input.pack.exportedAt}\``);
  lines.push(`- extensionVersion：\`${input.pack.extensionVersion}\``);
  lines.push(`- baseline pack：\`${input.pack.baseline.packPath}\``);
  lines.push(`  - sha256：\`${input.pack.baseline.sha256}\``);
  lines.push(`- current pack：\`${evidenceDirPosix}/${input.currentPackFileName}\``);
  lines.push(`  - sha256：\`${input.currentSha256}\``);
  lines.push(`- diff pack：\`${evidenceDirPosix}/${input.diffPackFileName}\``);
  lines.push(`  - sha256：\`${input.diffSha256}\``);
  lines.push('');

  lines.push('## 关键变更摘要（baseline -> current）');
  lines.push('');
  lines.push(`- keywords.enAdded：${input.pack.diff.keywords.enAdded.length > 0 ? input.pack.diff.keywords.enAdded.join(', ') : '(none)'}`);
  lines.push(`- keywords.enRemoved：${input.pack.diff.keywords.enRemoved.length > 0 ? input.pack.diff.keywords.enRemoved.join(', ') : '(none)'}`);
  lines.push(`- keywords.zhAdded：${input.pack.diff.keywords.zhAdded.length > 0 ? input.pack.diff.keywords.zhAdded.join(', ') : '(none)'}`);
  lines.push(`- keywords.zhRemoved：${input.pack.diff.keywords.zhRemoved.length > 0 ? input.pack.diff.keywords.zhRemoved.join(', ') : '(none)'}`);
  lines.push(
    `- descriptions.enSha256：\`${input.pack.diff.descriptions.enSha256From}\` -> \`${input.pack.diff.descriptions.enSha256To}\``
  );
  lines.push(
    `- descriptions.zhSha256：\`${input.pack.diff.descriptions.zhSha256From}\` -> \`${input.pack.diff.descriptions.zhSha256To}\``
  );
  lines.push(
    `- screenshotPlan.changedIds：${
      input.pack.diff.screenshotPlan.changedIds.length > 0 ? input.pack.diff.screenshotPlan.changedIds.join(', ') : '(none)'
    }`
  );
  lines.push(
    `- assertions.changedKeys：${
      input.pack.diff.assertions.changedKeys.length > 0 ? input.pack.diff.assertions.changedKeys.join(', ') : '(none)'
    }`
  );
  lines.push('');

  lines.push('## 红线断言结果（门禁）');
  lines.push('');
  lines.push(`- hasProWaitlistCta: ${input.pack.current.assertions.hasProWaitlistCta ? 'PASS' : 'FAIL'}`);
  lines.push(`- hasPrivacyClaims: ${input.pack.current.assertions.hasPrivacyClaims ? 'PASS' : 'FAIL'}`);
  lines.push(`- noOverclaimKeywords: ${input.pack.current.assertions.noOverclaimKeywords ? 'PASS' : 'FAIL'}`);
  lines.push(`- redlines: ${input.pack.redlines.length > 0 ? input.pack.redlines.join(', ') : '[]'}`);
  lines.push('');

  lines.push('## 使用说明');
  lines.push('');
  lines.push(`- 生成（写入 \`${evidenceDirPosix}/\`）：`);
  lines.push(
    `  - \`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir ${evidenceDirPosix}\``
  );
  lines.push('- 门禁/可重复性（固定 exportedAt，便于 diff）：');
  lines.push(
    `  - \`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir ${evidenceDirPosix} --stable-exported-at\``
  );
  lines.push('- 指定 baseline pack（可选）：');
  lines.push(
    `  - \`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-cws-listing-diff-evidence-pack.ts --evidence-dir ${evidenceDirPosix} --baseline-pack docs/evidence/v1-66/cws-listing-evidence-pack-<extensionVersion>-<utcCompact>.json\``
  );
  lines.push(`- 复核 sha256（示例）：\`shasum -a 256 ${evidenceDirPosix}/*.json\``);
  lines.push(`- 敏感信息搜索（示例）：\`rg -n "CWS_|TOKEN|SECRET" ${evidenceDirPosix}\``);
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('输出文件：');
  lines.push(`- \`${evidenceDirPosix}/index.md\``);
  lines.push(`- \`${evidenceDirPosix}/${input.currentPackFileName}\``);
  lines.push(`- \`${evidenceDirPosix}/${input.diffPackFileName}\``);
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function writeEvidenceOutputs(options: {
  evidenceDir: string;
  currentPackFileName: string;
  currentPackJson: string;
  diffPackFileName: string;
  diffPackJson: string;
  indexMarkdown: string;
}): Promise<{ currentPackFilePath: string; diffPackFilePath: string; indexFilePath: string }> {
  const evidenceDirAbs = path.resolve(process.cwd(), options.evidenceDir);
  await fs.mkdir(evidenceDirAbs, { recursive: true });

  const currentPackFilePath = path.join(evidenceDirAbs, options.currentPackFileName);
  const diffPackFilePath = path.join(evidenceDirAbs, options.diffPackFileName);
  const indexFilePath = path.join(evidenceDirAbs, 'index.md');

  await fs.writeFile(currentPackFilePath, options.currentPackJson, 'utf-8');
  await fs.writeFile(diffPackFilePath, options.diffPackJson, 'utf-8');
  await fs.writeFile(indexFilePath, options.indexMarkdown, 'utf-8');

  return { currentPackFilePath, diffPackFilePath, indexFilePath };
}

function parseArgs(argv: string[]): { stableExportedAt: boolean; baselinePackPath: string | null; evidenceDir: string | null } {
  let stableExportedAt = false;
  let baselinePackPath: string | null = null;
  let evidenceDir: string | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] as string;
    if (arg === '--stable-exported-at') {
      stableExportedAt = true;
      continue;
    }
    if (arg === '--baseline-pack') {
      const value = argv[i + 1];
      if (!value) throw new Error('Missing value for --baseline-pack');
      baselinePackPath = String(value);
      i += 1;
      continue;
    }
    if (arg === '--evidence-dir') {
      const value = argv[i + 1];
      if (!value) throw new Error('Missing value for --evidence-dir');
      evidenceDir = String(value);
      i += 1;
      continue;
    }
    if (arg.startsWith('--')) throw new Error(`Unknown args: ${arg}`);
    throw new Error(`Unexpected arg: ${arg}`);
  }

  return { stableExportedAt, baselinePackPath, evidenceDir };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const exportedAt = args.stableExportedAt ? new Date(DEFAULT_STABLE_EXPORTED_AT_ISO) : new Date();
  const evidenceDir = args.evidenceDir ?? DEFAULT_CWS_LISTING_DIFF_EVIDENCE_DIR;

  const baselinePackPath =
    args.baselinePackPath ??
    (await resolveBaselineListingEvidencePackPathFromIndexFile(DEFAULT_V1_66_EVIDENCE_INDEX_PATH));

  const built = await buildCwsListingDiffEvidencePackFromRepo({
    exportedAt,
    baselinePackPath,
    evidenceDir,
    requireDistManifest: true
  });

  await writeEvidenceOutputs({
    evidenceDir: built.evidenceDir,
    currentPackFileName: built.current.packFileName,
    currentPackJson: built.current.json,
    diffPackFileName: built.diff.packFileName,
    diffPackJson: built.diff.json,
    indexMarkdown: built.indexMarkdown
  });

  // If redlines hit, we still wrote evidence for audit, but we should block CI.
  if (built.redlines.length > 0) {
    throw new Error(`CWS listing diff redlines detected: ${built.redlines.join(', ')}`);
  }
}

const invokedAsScript = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
