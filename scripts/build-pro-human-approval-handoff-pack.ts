import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProHumanApprovalHandoffPack as buildProHumanApprovalHandoffPackShared,
  formatProHumanApprovalHandoffMarkdown as formatProHumanApprovalHandoffMarkdownShared,
  PRO_HUMAN_APPROVAL_HANDOFF_FILES,
  type ProHumanApprovalHandoffPack
} from '../src/shared/pro-human-approval-handoff.ts';
import type { ProHumanApprovalWindowTrackerPack } from '../src/shared/pro-human-approval-window-tracker.ts';
import type { ProPaymentEvaluationAuditPack } from '../src/shared/pro-payment-evaluation-audit.ts';
import type { ProRouteValidationCampaignReviewPack } from '../src/shared/pro-route-validation-campaign-review.ts';
import type { ProStayValidationMessagingGuardPack } from '../src/shared/pro-stay-validation-messaging-guard.ts';
import type { I18nGetMessage } from '../src/shared/monetization.ts';

export { PRO_HUMAN_APPROVAL_HANDOFF_FILES, type ProHumanApprovalHandoffPack } from '../src/shared/pro-human-approval-handoff.ts';

export const DEFAULT_PRO_HUMAN_APPROVAL_HANDOFF_EVIDENCE_DIR =
  'docs/evidence/v4-16/human-approval-handoff-pack' as const;

const defaultGetMessage: I18nGetMessage = (key) => {
  const messages: Record<string, string> = {
    proHumanApprovalHandoffQuestionEvidence:
      'Do the evidence chain and current samples justify opening a separate human approval review?',
    proHumanApprovalHandoffQuestionMessaging:
      'Can all external copy stay inside current-priority validation language until approval is explicitly granted?',
    proHumanApprovalHandoffQuestionImplementation:
      'If approval opens, what is the narrowest monetization scope that still avoids direct payment implementation in this loop?',
    proHumanApprovalHandoffGuardrailNoPayment:
      'This handoff does not approve or implement payment, checkout, subscriptions, or collection.',
    proHumanApprovalHandoffGuardrailStayValidation:
      'External messaging stays inside stay_validation until a separate human approval decision is recorded.',
    proHumanApprovalHandoffGuardrailAnonymousOnly:
      'The handoff only uses local anonymous aggregate evidence and never includes copied page content, URLs, titles, or contact details.',
    proHumanApprovalHandoffNextReview:
      'Open a separate human approval review with this evidence chain and keep monetization implementation out of scope.',
    proHumanApprovalHandoffNextScope:
      'If approval is granted, define the narrowest evaluation-only monetization scope before any implementation work starts.',
    proHumanApprovalHandoffNextNoImplementation:
      'Even after approval, this round still stops at planning and review only.',
    proHumanApprovalHandoffNextHoldTracker:
      'Do not open human approval yet. Wait until the same-window tracker turns green.',
    proHumanApprovalHandoffNextHoldCampaigns:
      'Keep resolving cross-campaign blockers before reopening the tracker.',
    proHumanApprovalHandoffNextHoldMessaging:
      'Keep external copy locked to stay_validation while blocked.',
    proHumanApprovalHandoffMdTitle: 'V4-16 human approval handoff pack',
    proHumanApprovalHandoffMdSectionStatus: 'Status',
    proHumanApprovalHandoffMdSectionBlockers: 'Blockers',
    proHumanApprovalHandoffMdSectionQuestions: 'Approval questions',
    proHumanApprovalHandoffMdSectionGuardrails: 'Guardrails',
    proHumanApprovalHandoffMdSectionNext: 'Next steps',
    proHumanApprovalHandoffMdSectionEvidence: 'Evidence chain',
    proHumanApprovalHandoffNoBlockers: 'No new blockers are currently open.'
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

export function buildProHumanApprovalHandoffPack(params: {
  tracker: ProHumanApprovalWindowTrackerPack;
  audit: ProPaymentEvaluationAuditPack;
  campaignReview: ProRouteValidationCampaignReviewPack;
  messagingGuard: ProStayValidationMessagingGuardPack;
  trackerSource?: { file?: string; sha256?: string };
  auditSource?: { file?: string; sha256?: string };
  campaignReviewSource?: { file?: string; sha256?: string };
  messagingGuardSource?: { file?: string; sha256?: string };
}): ProHumanApprovalHandoffPack {
  return buildProHumanApprovalHandoffPackShared({
    ...params,
    getMessage: defaultGetMessage
  });
}

export function formatProHumanApprovalHandoffMarkdown(pack: ProHumanApprovalHandoffPack): string {
  return formatProHumanApprovalHandoffMarkdownShared(pack, defaultGetMessage);
}

async function buildCli(args?: {
  tracker: string;
  audit: string;
  campaignReview: string;
  messagingGuard: string;
  outDir: string;
}): Promise<void> {
  const trackerRel = args?.tracker ?? '';
  const auditRel = args?.audit ?? '';
  const campaignReviewRel = args?.campaignReview ?? '';
  const messagingGuardRel = args?.messagingGuard ?? '';
  assert.ok(
    trackerRel && auditRel && campaignReviewRel && messagingGuardRel,
    'Usage: scripts/build-pro-human-approval-handoff-pack.ts <window-tracker.json> <payment-audit.json> <campaign-review.json> <messaging-guard.json> [outDir]'
  );

  const outDirRel = args?.outDir ?? DEFAULT_PRO_HUMAN_APPROVAL_HANDOFF_EVIDENCE_DIR;
  await ensureDir(outDirRel);

  const tracker = await readJsonFile<ProHumanApprovalWindowTrackerPack>(trackerRel);
  const audit = await readJsonFile<ProPaymentEvaluationAuditPack>(auditRel);
  const campaignReview = await readJsonFile<ProRouteValidationCampaignReviewPack>(
    campaignReviewRel
  );
  const messagingGuard = await readJsonFile<ProStayValidationMessagingGuardPack>(
    messagingGuardRel
  );
  const pack = buildProHumanApprovalHandoffPack({
    tracker,
    audit,
    campaignReview,
    messagingGuard,
    trackerSource: {
      file: trackerRel,
      sha256: await computeFileSha256(path.resolve(process.cwd(), trackerRel))
    },
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
    PRO_HUMAN_APPROVAL_HANDOFF_FILES.summaryJson
  );
  const summaryMdPath = path.posix.join(
    outDirRel,
    PRO_HUMAN_APPROVAL_HANDOFF_FILES.summaryMd
  );

  await writeUtf8File(summaryJsonPath, `${JSON.stringify(pack, null, 2)}\n`);
  await writeUtf8File(summaryMdPath, `${formatProHumanApprovalHandoffMarkdown(pack).trimEnd()}\n`);
}

const invokedAsScript =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  const argv = process.argv.slice(2);
  const tracker = argv[0] || '';
  const audit = argv[1] || '';
  const campaignReview = argv[2] || '';
  const messagingGuard = argv[3] || '';
  const outDir = argv[4] || DEFAULT_PRO_HUMAN_APPROVAL_HANDOFF_EVIDENCE_DIR;

  buildCli({
    tracker,
    audit,
    campaignReview,
    messagingGuard,
    outDir
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
