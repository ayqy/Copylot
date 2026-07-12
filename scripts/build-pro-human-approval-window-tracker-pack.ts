import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProHumanApprovalWindowTrackerPack as buildProHumanApprovalWindowTrackerPackShared,
  formatProHumanApprovalWindowTrackerMarkdown as formatProHumanApprovalWindowTrackerMarkdownShared,
  PRO_HUMAN_APPROVAL_WINDOW_TRACKER_FILES,
  type ProHumanApprovalWindowTrackerPack
} from '../src/shared/pro-human-approval-window-tracker.ts';
import type { ProPaymentEvaluationAuditPack } from '../src/shared/pro-payment-evaluation-audit.ts';
import type { ProRouteValidationCampaignReviewPack } from '../src/shared/pro-route-validation-campaign-review.ts';
import type { ProStayValidationMessagingGuardPack } from '../src/shared/pro-stay-validation-messaging-guard.ts';
import type { I18nGetMessage } from '../src/shared/monetization.ts';

export {
  PRO_HUMAN_APPROVAL_WINDOW_TRACKER_FILES,
  type ProHumanApprovalWindowTrackerPack
} from '../src/shared/pro-human-approval-window-tracker.ts';

export const DEFAULT_PRO_HUMAN_APPROVAL_WINDOW_TRACKER_EVIDENCE_DIR =
  'docs/evidence/v4-15/approval-window-tracker-pack' as const;

const defaultGetMessage: I18nGetMessage = (key, substitutions) => {
  const normalized =
    typeof substitutions === 'string'
      ? [substitutions]
      : Array.isArray(substitutions)
        ? substitutions
        : [];
  const messages: Record<string, string> = {
    proHumanApprovalWindowTrackerCheckAuditPassed:
      'The payment-evaluation audit is ready inside the current window.',
    proHumanApprovalWindowTrackerCheckAuditFailed:
      `The payment-evaluation audit is still ${normalized[0] || 'hold_validation'} in this window.`,
    proHumanApprovalWindowTrackerCheckCampaignPassed:
      'The cross-campaign review is clear in this window.',
    proHumanApprovalWindowTrackerCheckCampaignFailed:
      `The cross-campaign review still has blockers in this window: ${normalized[0] || 'n/a'}.`,
    proHumanApprovalWindowTrackerCheckMessagingPassed:
      'External messaging still stays aligned with stay_validation in this window.',
    proHumanApprovalWindowTrackerCheckMessagingFailed:
      `The messaging guard is still ${normalized[0] || 'needs_review'} in this window.`,
    proHumanApprovalWindowTrackerNextEnter:
      'All three same-window checks are green. A separate human-approval review can now open, but payment implementation still stays blocked.',
    proHumanApprovalWindowTrackerNextHold:
      'Keep holding at stay_validation until the payment audit, campaign review, and messaging guard all pass together in the same window.',
    proHumanApprovalWindowTrackerMdTitle: 'V4-15 human approval window tracker',
    proHumanApprovalWindowTrackerMdSectionStatus: 'Status',
    proHumanApprovalWindowTrackerMdSectionChecks: 'Checks',
    proHumanApprovalWindowTrackerMdSectionBlockers: 'Blockers',
    proHumanApprovalWindowTrackerMdSectionDecision: 'Decision',
    proHumanApprovalWindowTrackerMdSectionEvidence: 'Evidence chain',
    proHumanApprovalWindowTrackerNoBlockers: 'No new blockers are currently open.'
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

export function buildProHumanApprovalWindowTrackerPack(params: {
  audit: ProPaymentEvaluationAuditPack;
  campaignReview: ProRouteValidationCampaignReviewPack;
  messagingGuard: ProStayValidationMessagingGuardPack;
  auditSource?: { file?: string; sha256?: string };
  campaignReviewSource?: { file?: string; sha256?: string };
  messagingGuardSource?: { file?: string; sha256?: string };
}): ProHumanApprovalWindowTrackerPack {
  return buildProHumanApprovalWindowTrackerPackShared({
    ...params,
    getMessage: defaultGetMessage
  });
}

export function formatProHumanApprovalWindowTrackerMarkdown(
  pack: ProHumanApprovalWindowTrackerPack
): string {
  return formatProHumanApprovalWindowTrackerMarkdownShared(pack, defaultGetMessage);
}

async function buildCli(args?: {
  audit: string;
  campaignReview: string;
  messagingGuard: string;
  outDir: string;
}): Promise<void> {
  const auditRel = args?.audit ?? '';
  const campaignReviewRel = args?.campaignReview ?? '';
  const messagingGuardRel = args?.messagingGuard ?? '';
  assert.ok(
    auditRel && campaignReviewRel && messagingGuardRel,
    'Usage: scripts/build-pro-human-approval-window-tracker-pack.ts <payment-audit.json> <campaign-review.json> <messaging-guard.json> [outDir]'
  );

  const outDirRel = args?.outDir ?? DEFAULT_PRO_HUMAN_APPROVAL_WINDOW_TRACKER_EVIDENCE_DIR;
  await ensureDir(outDirRel);

  const audit = await readJsonFile<ProPaymentEvaluationAuditPack>(auditRel);
  const campaignReview = await readJsonFile<ProRouteValidationCampaignReviewPack>(
    campaignReviewRel
  );
  const messagingGuard = await readJsonFile<ProStayValidationMessagingGuardPack>(
    messagingGuardRel
  );
  const pack = buildProHumanApprovalWindowTrackerPack({
    audit,
    campaignReview,
    messagingGuard,
    auditSource: {
      file: auditRel,
      sha256: await computeFileSha256(path.resolve(process.cwd(), auditRel))
    },
    campaignReviewSource: {
      file: campaignReviewRel,
      sha256: await computeFileSha256(path.resolve(process.cwd(), campaignReviewRel))
    },
    messagingGuardSource: {
      file: messagingGuardRel,
      sha256: await computeFileSha256(path.resolve(process.cwd(), messagingGuardRel))
    }
  });

  const summaryJsonPath = path.posix.join(
    outDirRel,
    PRO_HUMAN_APPROVAL_WINDOW_TRACKER_FILES.summaryJson
  );
  const summaryMdPath = path.posix.join(
    outDirRel,
    PRO_HUMAN_APPROVAL_WINDOW_TRACKER_FILES.summaryMd
  );

  await writeUtf8File(summaryJsonPath, `${JSON.stringify(pack, null, 2)}\n`);
  await writeUtf8File(
    summaryMdPath,
    `${formatProHumanApprovalWindowTrackerMarkdown(pack).trimEnd()}\n`
  );
}

const invokedAsScript =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  const argv = process.argv.slice(2);
  const audit = argv[0] || '';
  const campaignReview = argv[1] || '';
  const messagingGuard = argv[2] || '';
  const outDir = argv[3] || DEFAULT_PRO_HUMAN_APPROVAL_WINDOW_TRACKER_EVIDENCE_DIR;

  buildCli({
    audit,
    campaignReview,
    messagingGuard,
    outDir
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
