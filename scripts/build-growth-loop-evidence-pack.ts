import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  EXTERNAL_LINKS_UTM_SOURCE,
  OFFICIAL_SITE_ROOT_URL,
  buildChromeWebStoreUrl,
  buildOfficialSiteUrl,
  buildProWaitlistUrl
} from '../src/shared/external-links.ts';
import { buildProDistributionPackMarkdown, buildProWaitlistRecruitCopyText } from '../src/shared/pro-waitlist-distribution.ts';
import { buildShareCopyText } from '../src/shared/word-of-mouth.ts';

export const GROWTH_LOOP_EVIDENCE_PACK_VERSION = 'v1-75' as const;
export const DEFAULT_GROWTH_LOOP_EVIDENCE_DIR = `docs/evidence/${GROWTH_LOOP_EVIDENCE_PACK_VERSION}` as const;

type ChromeLocaleMessage = Readonly<{
  message: string;
  placeholders?: Record<string, { content?: string }>;
}>;

type ChromeLocaleMessages = Readonly<Record<string, ChromeLocaleMessage>>;

type I18nGetMessage = (key: string, substitutions?: string | string[]) => string;

type OfficialLinksEvidence = Readonly<{
  packVersion: typeof GROWTH_LOOP_EVIDENCE_PACK_VERSION;
  utmSource: string;
  samples: ReadonlyArray<
    Readonly<{
      campaign: string | null;
      surfaces: ReadonlyArray<
        Readonly<{
          medium: string;
          officialSiteUrl: string;
          chromeWebStoreUrl: string;
          proWaitlistUrl: string;
        }>
      >;
    }>
  >;
}>;

const OUTPUT_FILES = Object.freeze({
  officialLinksJson: 'official-links.json',
  proDistributionPackMd: 'pro-distribution-pack.sample.md',
  shareCopyTxt: 'share-copy.sample.txt',
  indexMd: 'index.md'
});

const REQUIRED_INPUT_PATHS = Object.freeze({
  externalLinks: 'src/shared/external-links.ts',
  messagesEn: '_locales/en/messages.json',
  messagesZh: '_locales/zh/messages.json'
});

const REQUIRED_UTM_MEDIA = Object.freeze(['popup', 'options', 'distribution_toolkit'] as const);
const REQUIRED_CAMPAIGN_SAMPLES = Object.freeze([null, 'twitter'] as const);

const SAMPLE_WAITLIST_ENV = Object.freeze({
  extensionVersion: '1.1.28',
  extensionId: 'ehfglnbhoefcdedpkcdnainiifpflbic',
  navigatorLanguage: 'en-US',
  uiLanguage: 'en'
});

const DIRTY_WAITLIST_ENV_FOR_ASSERTION = Object.freeze({
  ...SAMPLE_WAITLIST_ENV,
  pageUrl: 'https://evil.example.com',
  title: 'secret-title',
  copiedText: 'secret-copy'
});

function toPosixPath(p: string): string {
  return p.replace(/\\/g, '/');
}

async function readJsonFile<T>(filePathRel: string): Promise<T> {
  const abs = path.resolve(process.cwd(), filePathRel);
  const raw = await fs.readFile(abs, 'utf-8');
  return JSON.parse(raw) as T;
}

function buildLocaleGetMessage(messages: ChromeLocaleMessages): I18nGetMessage {
  return (key, substitutions) => {
    const entry = messages[key];
    if (!entry) return '';

    const subs = Array.isArray(substitutions) ? substitutions : substitutions != null ? [substitutions] : [];
    let text = String(entry.message ?? '');

    const placeholders = entry.placeholders ?? {};
    const names = Object.keys(placeholders).sort();
    for (const name of names) {
      const content = String(placeholders[name]?.content ?? '');
      const m = content.match(/^\$(\d+)$/);
      const idx = m ? Number(m[1]) - 1 : -1;
      const replacement = idx >= 0 ? String(subs[idx] ?? '') : '';
      text = text.replaceAll(`$${name}$`, replacement);
    }

    // Fallback: support raw $1/$2 placeholders if any exist.
    text = text.replace(/\$(\d+)/g, (_match, n) => String(subs[Number(n) - 1] ?? ''));

    return text;
  };
}

function assertUtmParams(urlStr: string, expected: { medium: string; campaign: string | null }) {
  const u = new URL(urlStr);
  assert.equal(u.searchParams.get('utm_source'), EXTERNAL_LINKS_UTM_SOURCE);
  assert.equal(u.searchParams.get('utm_medium'), expected.medium);

  const campaign = u.searchParams.get('utm_campaign');
  if (expected.campaign) {
    assert.equal(campaign, expected.campaign);
  } else {
    assert.equal(campaign, null);
  }
}

function assertWaitlistEnvWhitelist(u: URL) {
  const allowedKeys = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'ext_version', 'ext_id', 'nav_lang', 'ui_lang']);
  for (const key of u.searchParams.keys()) {
    assert.ok(allowedKeys.has(key), `Unexpected query key in waitlist URL: ${key}`);
  }
}

function buildOfficialLinksEvidence(): OfficialLinksEvidence {
  const samples: Array<{
    campaign: string | null;
    surfaces: Array<{
      medium: string;
      officialSiteUrl: string;
      chromeWebStoreUrl: string;
      proWaitlistUrl: string;
    }>;
  }> = [];

  for (const campaign of REQUIRED_CAMPAIGN_SAMPLES) {
    const surfaces: Array<{
      medium: string;
      officialSiteUrl: string;
      chromeWebStoreUrl: string;
      proWaitlistUrl: string;
    }> = [];

    for (const medium of REQUIRED_UTM_MEDIA) {
      const officialSiteUrl = buildOfficialSiteUrl({ medium, campaign });
      const chromeWebStoreUrl = buildChromeWebStoreUrl({ medium, campaign });
      const proWaitlistUrl = buildProWaitlistUrl({ medium, campaign, env: SAMPLE_WAITLIST_ENV });
      surfaces.push({ medium, officialSiteUrl, chromeWebStoreUrl, proWaitlistUrl });
    }

    samples.push({ campaign, surfaces });
  }

  return {
    packVersion: GROWTH_LOOP_EVIDENCE_PACK_VERSION,
    utmSource: EXTERNAL_LINKS_UTM_SOURCE,
    samples
  };
}

function validateOfficialLinksEvidence(evidence: OfficialLinksEvidence): void {
  const officialSiteRoot = new URL(OFFICIAL_SITE_ROOT_URL);

  for (const sample of evidence.samples) {
    for (const surface of sample.surfaces) {
      assert.ok(REQUIRED_UTM_MEDIA.includes(surface.medium as (typeof REQUIRED_UTM_MEDIA)[number]));

      // official site
      const officialSiteParsed = new URL(surface.officialSiteUrl);
      assert.equal(officialSiteParsed.origin, officialSiteRoot.origin);
      assert.equal(officialSiteParsed.pathname, officialSiteRoot.pathname);
      assert.equal(officialSiteParsed.hash, '');
      assertUtmParams(surface.officialSiteUrl, { medium: surface.medium, campaign: sample.campaign });

      // store
      const storeParsed = new URL(surface.chromeWebStoreUrl);
      assert.equal(storeParsed.hostname, 'chromewebstore.google.com');
      assertUtmParams(surface.chromeWebStoreUrl, { medium: surface.medium, campaign: sample.campaign });

      // waitlist
      const waitlistParsed = new URL(surface.proWaitlistUrl);
      assert.equal(waitlistParsed.origin, officialSiteRoot.origin);
      assert.equal(waitlistParsed.hash, '#pro');
      assertUtmParams(surface.proWaitlistUrl, { medium: surface.medium, campaign: sample.campaign });
      assertWaitlistEnvWhitelist(waitlistParsed);

      assert.equal(waitlistParsed.searchParams.get('ext_version'), SAMPLE_WAITLIST_ENV.extensionVersion);
      assert.equal(waitlistParsed.searchParams.get('ext_id'), SAMPLE_WAITLIST_ENV.extensionId);
      assert.equal(waitlistParsed.searchParams.get('nav_lang'), SAMPLE_WAITLIST_ENV.navigatorLanguage);
      assert.equal(waitlistParsed.searchParams.get('ui_lang'), SAMPLE_WAITLIST_ENV.uiLanguage);
    }
  }

  // Extra guard: ensure dirty env never leaks into URL.
  const dirtyUrl = buildProWaitlistUrl({
    medium: 'popup',
    campaign: 'twitter',
    env: DIRTY_WAITLIST_ENV_FOR_ASSERTION
  });
  assert.ok(!dirtyUrl.includes('evil.example.com'));
  assert.ok(!dirtyUrl.includes('secret-title'));
  assert.ok(!dirtyUrl.includes('secret-copy'));
}

async function ensureDir(dirRel: string): Promise<void> {
  await fs.mkdir(path.resolve(process.cwd(), dirRel), { recursive: true });
}

async function writeUtf8File(filePathRel: string, content: string): Promise<void> {
  const abs = path.resolve(process.cwd(), filePathRel);
  await fs.writeFile(abs, content, 'utf-8');
}

function formatAsStableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function trimEndWithFinalNewline(text: string): string {
  return `${String(text || '').trimEnd()}\n`;
}

function formatEvidenceIndexMarkdown(input: {
  externalLinksSha256: string;
  outputs: Array<{ path: string; sha256: string }>;
  result: { ok: boolean; reasons: string[] };
}): string {
  const lines: string[] = [];
  lines.push(`# ${GROWTH_LOOP_EVIDENCE_PACK_VERSION} 并行增长循环证据包（对外入口一致化 + 投放资产样例）`);
  lines.push('');
  lines.push('## 单一事实来源（可审计）');
  lines.push(`- \`${REQUIRED_INPUT_PATHS.externalLinks}\``);
  lines.push(`  - sha256: \`${input.externalLinksSha256}\``);
  lines.push('');
  lines.push('## 输出文件清单（可复核）');
  for (const out of input.outputs) {
    lines.push(`- \`${out.path}\``);
    lines.push(`  - sha256: \`${out.sha256}\``);
  }
  lines.push('');
  lines.push('## 结论');
  if (input.result.ok) {
    lines.push('- PASS');
  } else {
    lines.push('- BLOCKED');
    lines.push('- 原因：');
    for (const r of input.result.reasons) lines.push(`  - ${r}`);
  }
  lines.push('');
  lines.push('## 生成方式');
  lines.push(`- 命令：\`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-growth-loop-evidence-pack.ts\``);
  lines.push('');

  return `${lines.join('\n')}\n`;
}

export async function buildGrowthLoopEvidencePack(): Promise<void> {
  const evidenceDir = DEFAULT_GROWTH_LOOP_EVIDENCE_DIR;

  const officialLinksPath = toPosixPath(path.join(evidenceDir, OUTPUT_FILES.officialLinksJson));
  const proDistributionPackPath = toPosixPath(path.join(evidenceDir, OUTPUT_FILES.proDistributionPackMd));
  const shareCopyPath = toPosixPath(path.join(evidenceDir, OUTPUT_FILES.shareCopyTxt));
  const indexPath = toPosixPath(path.join(evidenceDir, OUTPUT_FILES.indexMd));

  const externalLinksSha256 = await computeFileSha256(path.resolve(process.cwd(), REQUIRED_INPUT_PATHS.externalLinks));

  await ensureDir(evidenceDir);

  const result: { ok: boolean; reasons: string[] } = { ok: true, reasons: [] };

  try {
    const officialLinksEvidence = buildOfficialLinksEvidence();
    validateOfficialLinksEvidence(officialLinksEvidence);
    await writeUtf8File(officialLinksPath, formatAsStableJson(officialLinksEvidence));

    const enMessages = await readJsonFile<ChromeLocaleMessages>(REQUIRED_INPUT_PATHS.messagesEn);
    const zhMessages = await readJsonFile<ChromeLocaleMessages>(REQUIRED_INPUT_PATHS.messagesZh);
    const getMessageEn = buildLocaleGetMessage(enMessages);
    const getMessageZh = buildLocaleGetMessage(zhMessages);

    const campaign = 'twitter';
    const medium = 'distribution_toolkit';
    const officialSiteUrl = buildOfficialSiteUrl({ medium, campaign });
    const storeUrl = buildChromeWebStoreUrl({ medium, campaign });
    const waitlistUrl = buildProWaitlistUrl({ medium, campaign, env: SAMPLE_WAITLIST_ENV });

    const recruitCopyEn = buildProWaitlistRecruitCopyText({ getMessage: getMessageEn, waitlistUrl, campaign });
    const distributionPackEn = buildProDistributionPackMarkdown({
      getMessage: getMessageEn,
      campaign,
      officialSiteUrl,
      storeUrl,
      waitlistUrl,
      recruitCopy: recruitCopyEn
    });

    const recruitCopyZh = buildProWaitlistRecruitCopyText({ getMessage: getMessageZh, waitlistUrl, campaign });
    const distributionPackZh = buildProDistributionPackMarkdown({
      getMessage: getMessageZh,
      campaign,
      officialSiteUrl,
      storeUrl,
      waitlistUrl,
      recruitCopy: recruitCopyZh
    });

    const proDistributionPackMd = [
      `# ${GROWTH_LOOP_EVIDENCE_PACK_VERSION} 对外投放包样例（campaign=${campaign}）`,
      '',
      '---',
      '',
      '## EN',
      '',
      distributionPackEn.trimEnd(),
      '',
      '---',
      '',
      '## ZH',
      '',
      distributionPackZh.trimEnd(),
      ''
    ].join('\n');
    await writeUtf8File(proDistributionPackPath, trimEndWithFinalNewline(proDistributionPackMd));

    const shareCopyEn = buildShareCopyText(getMessageEn, storeUrl);
    const shareCopyZh = buildShareCopyText(getMessageZh, storeUrl);
    const shareCopyTxt = `${shareCopyEn.trimEnd()}\n\n${shareCopyZh.trimEnd()}\n`;
    await writeUtf8File(shareCopyPath, shareCopyTxt);
  } catch (error) {
    result.ok = false;
    result.reasons.push(error instanceof Error ? error.message : String(error));
  }

  const outputsForIndex: Array<{ path: string; sha256: string }> = [];
  const outputPaths = [officialLinksPath, proDistributionPackPath, shareCopyPath];
  for (const outRel of outputPaths) {
    const sha256 = await computeFileSha256(path.resolve(process.cwd(), outRel));
    outputsForIndex.push({ path: outRel, sha256 });
  }

  const indexMd = formatEvidenceIndexMarkdown({
    externalLinksSha256,
    outputs: outputsForIndex,
    result
  });
  await writeUtf8File(indexPath, indexMd);

  if (!result.ok) {
    throw new Error(`Growth loop evidence pack generation BLOCKED. See: ${indexPath}`);
  }
}

if (import.meta.url === pathToFileURL(path.resolve(process.cwd(), process.argv[1] || '')).toString()) {
  buildGrowthLoopEvidencePack().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
