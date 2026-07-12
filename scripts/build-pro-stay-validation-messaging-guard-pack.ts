import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProStayValidationMessagingGuardPack as buildProStayValidationMessagingGuardPackShared,
  formatProStayValidationMessagingGuardMarkdown as formatProStayValidationMessagingGuardMarkdownShared,
  PRO_STAY_VALIDATION_MESSAGING_GUARD_FILES,
  type ProStayValidationMessagingGuardPack
} from '../src/shared/pro-stay-validation-messaging-guard.ts';
import type { ProRouteValidationCampaignReviewPack } from '../src/shared/pro-route-validation-campaign-review.ts';
import type { ProRouteValidationWritebackPack } from '../src/shared/pro-route-validation-writeback.ts';
import type { I18nGetMessage } from '../src/shared/monetization.ts';

export {
  PRO_STAY_VALIDATION_MESSAGING_GUARD_FILES,
  type ProStayValidationMessagingGuardPack
} from '../src/shared/pro-stay-validation-messaging-guard.ts';

export const DEFAULT_PRO_STAY_VALIDATION_MESSAGING_GUARD_EVIDENCE_DIR =
  'docs/evidence/v4-14/messaging-guard-pack' as const;

const defaultMessagingGuardGetMessage: I18nGetMessage = (key, substitutions) => {
  const normalized =
    typeof substitutions === 'string'
      ? [substitutions]
      : Array.isArray(substitutions)
        ? substitutions
        : [];
  const messages: Record<string, string> = {
    proRouteValidationCampaignReviewBoundaryStayValidation:
      'External messaging must remain in stay_validation and can only describe the current priority validation direction.',
    proStayValidationMessagingGuardReasonAligned:
      'This surface stays inside the current priority validation boundary.',
    proStayValidationMessagingGuardReasonMissingValidation:
      'This surface still needs explicit current-priority validation language.',
    proStayValidationMessagingGuardReasonBlocked:
      `This surface implies monetization too early via: ${normalized[0] || 'n/a'}.`,
    proStayValidationMessagingGuardConclusionBlocked:
      'At least one external copy surface now implies monetization too early, so the stay_validation boundary is broken.',
    proStayValidationMessagingGuardConclusionNeedsReview:
      'No direct monetization claim was found, but one or more external copy surfaces still lacks explicit validation framing.',
    proStayValidationMessagingGuardConclusionAligned:
      'Current external copy surfaces stay inside current-priority validation language while the product remains in stay_validation.',
    proStayValidationMessagingGuardNextFixBlocked:
      'Rewrite the blocked surfaces first, then rerun this pack before using the copy externally.',
    proStayValidationMessagingGuardNextFixValidation:
      'Tighten the flagged surfaces to say current priority / validation explicitly before the next distribution round.',
    proStayValidationMessagingGuardNextHoldPrioritized:
      `Keep external copy locked to stay_validation and prioritize these campaigns in the next sampling loop: ${normalized[0] || 'n/a'}.`,
    proStayValidationMessagingGuardNextHoldSteady:
      'Keep external copy locked to stay_validation and continue collecting balanced cross-campaign samples.',
    proStayValidationMessagingGuardMdTitle: 'V4-14 stay_validation messaging guard pack',
    proStayValidationMessagingGuardMdSectionStatus: 'Status',
    proStayValidationMessagingGuardMdSectionSurfaces: 'Surfaces',
    proStayValidationMessagingGuardMdSectionBoundaries: 'Boundaries',
    proStayValidationMessagingGuardMdSectionDecision: 'Decision',
    proStayValidationMessagingGuardMdSectionEvidence: 'Evidence chain'
  };
  return messages[key] || key;
};

async function readJsonFile<T>(filePathRel: string): Promise<T> {
  const abs = path.resolve(process.cwd(), filePathRel);
  const raw = await fs.readFile(abs, 'utf-8');
  return JSON.parse(raw) as T;
}

async function ensureDir(dirRel: string): Promise<void> {
  await fs.mkdir(path.resolve(process.cwd(), dirRel), { recursive: true });
}

async function writeUtf8File(filePathRel: string, content: string): Promise<void> {
  const abs = path.resolve(process.cwd(), filePathRel);
  await fs.writeFile(abs, content, 'utf-8');
}

export function buildProStayValidationMessagingGuardPack(params: {
  writeback: ProRouteValidationWritebackPack;
  campaignReview: ProRouteValidationCampaignReviewPack;
  writebackSource?: { file?: string; sha256?: string };
  campaignReviewSource?: { file?: string; sha256?: string };
}): ProStayValidationMessagingGuardPack {
  return buildProStayValidationMessagingGuardPackShared({
    writeback: params.writeback,
    campaignReview: params.campaignReview,
    writebackSource: params.writebackSource,
    campaignReviewSource: params.campaignReviewSource,
    getMessage: defaultMessagingGuardGetMessage
  });
}

export function formatProStayValidationMessagingGuardMarkdown(
  pack: ProStayValidationMessagingGuardPack
): string {
  return formatProStayValidationMessagingGuardMarkdownShared(
    pack,
    defaultMessagingGuardGetMessage
  );
}

async function buildProStayValidationMessagingGuardPackCli(args?: {
  writeback: string;
  campaignReview: string;
  outDir: string;
}): Promise<void> {
  const writebackRel = args?.writeback ?? '';
  const campaignReviewRel = args?.campaignReview ?? '';
  assert.ok(
    writebackRel && campaignReviewRel,
    'Usage: scripts/build-pro-stay-validation-messaging-guard-pack.ts <writeback.json> <campaign-review.json> [outDir]'
  );

  const outDirRel = args?.outDir ?? DEFAULT_PRO_STAY_VALIDATION_MESSAGING_GUARD_EVIDENCE_DIR;
  await ensureDir(outDirRel);

  const writeback = await readJsonFile<ProRouteValidationWritebackPack>(writebackRel);
  const campaignReview = await readJsonFile<ProRouteValidationCampaignReviewPack>(campaignReviewRel);
  const pack = buildProStayValidationMessagingGuardPack({
    writeback,
    campaignReview,
    writebackSource: {
      file: writebackRel,
      sha256: await computeFileSha256(path.resolve(process.cwd(), writebackRel))
    },
    campaignReviewSource: {
      file: campaignReviewRel,
      sha256: await computeFileSha256(path.resolve(process.cwd(), campaignReviewRel))
    }
  });

  const summaryJsonPath = path.posix.join(
    outDirRel,
    PRO_STAY_VALIDATION_MESSAGING_GUARD_FILES.summaryJson
  );
  const summaryMdPath = path.posix.join(
    outDirRel,
    PRO_STAY_VALIDATION_MESSAGING_GUARD_FILES.summaryMd
  );

  await writeUtf8File(summaryJsonPath, `${JSON.stringify(pack, null, 2)}\n`);
  await writeUtf8File(
    summaryMdPath,
    `${formatProStayValidationMessagingGuardMarkdown(pack).trimEnd()}\n`
  );
}

const invokedAsScript =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  const argv = process.argv.slice(2);
  const writeback = argv[0] || '';
  const campaignReview = argv[1] || '';
  const outDir = argv[2] || DEFAULT_PRO_STAY_VALIDATION_MESSAGING_GUARD_EVIDENCE_DIR;

  buildProStayValidationMessagingGuardPackCli({
    writeback,
    campaignReview,
    outDir
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
