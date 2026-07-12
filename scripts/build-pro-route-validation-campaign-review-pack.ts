import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProRouteValidationCampaignReviewPack as buildProRouteValidationCampaignReviewPackShared,
  formatProRouteValidationCampaignReviewMarkdown as formatProRouteValidationCampaignReviewMarkdownShared,
  PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_FILES,
  type ProRouteValidationCampaignReviewPack
} from '../src/shared/pro-route-validation-campaign-review.ts';
import type { ProRouteValidationStabilitySummary } from '../src/shared/pro-route-validation-stability.ts';
import type { ProRouteValidationVerdictPack } from '../src/shared/pro-route-validation-verdict.ts';
import type { I18nGetMessage } from '../src/shared/monetization.ts';

export {
  PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_FILES,
  type ProRouteValidationCampaignReviewPack
} from '../src/shared/pro-route-validation-campaign-review.ts';

export const DEFAULT_PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_EVIDENCE_DIR =
  'docs/evidence/v4-13/campaign-review-pack' as const;

const defaultCampaignReviewGetMessage: I18nGetMessage = (key) => {
  const messages: Record<string, string> = {
    proRouteValidationCampaignReviewActionSupporting:
      'Keep strengthening the same route copy in this campaign.',
    proRouteValidationCampaignReviewActionConflicting:
      'Collect more real tasks here before trusting the current leader.',
    proRouteValidationCampaignReviewActionThin:
      'The sample is still too thin. Add more route opens and copies first.',
    proRouteValidationCampaignReviewActionNoSignals:
      'No usable route sample yet. Seed this campaign before drawing conclusions.',
    proRouteValidationCampaignReviewCampaignConclusionSupporting:
      'This campaign supports the current leader while the product still stays in validation.',
    proRouteValidationCampaignReviewCampaignConclusionConflicting:
      'This campaign currently backs a different route, so acquisition bias is still unresolved here.',
    proRouteValidationCampaignReviewCampaignConclusionThin:
      'This campaign points to the current leader, but the sample is still too thin to treat it as durable demand.',
    proRouteValidationCampaignReviewCampaignConclusionNoSignals:
      'This campaign has no usable route signal yet, so it cannot confirm or reject the current leader.',
    proRouteValidationCampaignReviewCampaignNextSupporting:
      'Keep scaling the same route in this campaign, but keep all external messaging inside stay_validation.',
    proRouteValidationCampaignReviewCampaignNextConflicting:
      'Prioritize this campaign in the next sampling loop before trusting the current leader.',
    proRouteValidationCampaignReviewCampaignNextThin:
      'Add more route opens and validation-copy signals in this campaign before reading monetization intent.',
    proRouteValidationCampaignReviewCampaignNextNoSignals:
      'Seed the first route-open and validation-copy sample in this campaign before drawing conclusions.',
    proRouteValidationCampaignReviewConclusionConflicting:
      'At least one campaign still backs a different leader, so acquisition bias is not resolved yet.',
    proRouteValidationCampaignReviewConclusionThin:
      'The leader is mostly aligned, but one or more campaigns are still too thin to treat the lead as durable demand.',
    proRouteValidationCampaignReviewConclusionNoSignals:
      'There is still no reliable cross-campaign leader, so keep seeding route signals before interpreting demand.',
    proRouteValidationCampaignReviewConclusionSupporting:
      'Current campaigns are aligned enough to keep strengthening the same leader while staying in validation.',
    proRouteValidationCampaignReviewBlockerAcquisitionBias:
      'A different route still leads in at least one campaign, so acquisition bias is not resolved yet.',
    proRouteValidationCampaignReviewBlockerThinSamples:
      'One or more campaigns still have thin samples, so the current lead is not durable enough yet.',
    proRouteValidationCampaignReviewBlockerNoSignals:
      'One or more campaigns still have no usable route signal, so cross-campaign coverage is incomplete.',
    proRouteValidationCampaignReviewNextPrioritized:
      'Next step: prioritize the conflicting or thin campaigns before re-running the payment-evaluation audit.',
    proRouteValidationCampaignReviewNextSteady:
      'Next step: keep collecting balanced cross-campaign samples and maintain stay_validation messaging.',
    proRouteValidationCampaignReviewBoundaryStayValidation:
      'External messaging must remain in stay_validation and can only describe the current priority validation direction.',
    proRouteValidationCampaignReviewMdTitle: 'V4-13 Cross-campaign route review pack',
    proRouteValidationCampaignReviewMdSectionStatus: 'Status',
    proRouteValidationCampaignReviewMdSectionCampaigns: 'Campaign review',
    proRouteValidationCampaignReviewMdSectionBlockers: 'Blockers',
    proRouteValidationCampaignReviewMdSectionDecision: 'Decision',
    proRouteValidationCampaignReviewMdSectionEvidence: 'Evidence chain'
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

export function buildProRouteValidationCampaignReviewPack(params: {
  stability: ProRouteValidationStabilitySummary;
  verdict: ProRouteValidationVerdictPack;
  stabilitySource?: { file?: string; sha256?: string };
  verdictSource?: { file?: string; sha256?: string };
}): ProRouteValidationCampaignReviewPack {
  return buildProRouteValidationCampaignReviewPackShared({
    stability: params.stability,
    verdict: params.verdict,
    stabilitySource: params.stabilitySource,
    verdictSource: params.verdictSource,
    getMessage: defaultCampaignReviewGetMessage
  });
}

export function formatProRouteValidationCampaignReviewMarkdown(
  pack: ProRouteValidationCampaignReviewPack
): string {
  return formatProRouteValidationCampaignReviewMarkdownShared(
    pack,
    defaultCampaignReviewGetMessage
  );
}

async function buildProRouteValidationCampaignReviewPackCli(args?: {
  stability: string;
  verdict: string;
  outDir: string;
}): Promise<void> {
  const stabilityRel = args?.stability ?? '';
  const verdictRel = args?.verdict ?? '';
  assert.ok(
    stabilityRel && verdictRel,
    'Usage: scripts/build-pro-route-validation-campaign-review-pack.ts <stability.json> <verdict.json> [outDir]'
  );

  const outDirRel = args?.outDir ?? DEFAULT_PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_EVIDENCE_DIR;
  await ensureDir(outDirRel);

  const stability = await readJsonFile<ProRouteValidationStabilitySummary>(stabilityRel);
  const verdict = await readJsonFile<ProRouteValidationVerdictPack>(verdictRel);
  const pack = buildProRouteValidationCampaignReviewPack({
    stability,
    verdict,
    stabilitySource: {
      file: stabilityRel,
      sha256: await computeFileSha256(path.resolve(process.cwd(), stabilityRel))
    },
    verdictSource: {
      file: verdictRel,
      sha256: await computeFileSha256(path.resolve(process.cwd(), verdictRel))
    }
  });

  const summaryJsonPath = path.posix.join(
    outDirRel,
    PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_FILES.summaryJson
  );
  const summaryMdPath = path.posix.join(
    outDirRel,
    PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_FILES.summaryMd
  );

  await writeUtf8File(summaryJsonPath, `${JSON.stringify(pack, null, 2)}\n`);
  await writeUtf8File(
    summaryMdPath,
    `${formatProRouteValidationCampaignReviewMarkdown(pack).trimEnd()}\n`
  );
}

const invokedAsScript =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  const argv = process.argv.slice(2);
  const stability = argv[0] || '';
  const verdict = argv[1] || '';
  const outDir = argv[2] || DEFAULT_PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_EVIDENCE_DIR;

  buildProRouteValidationCampaignReviewPackCli({
    stability,
    verdict,
    outDir
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
