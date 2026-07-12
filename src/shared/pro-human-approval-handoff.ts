import type { I18nGetMessage } from './monetization.ts';
import type { ProHumanApprovalWindowTrackerPack } from './pro-human-approval-window-tracker.ts';
import type { ProPaymentEvaluationAuditPack } from './pro-payment-evaluation-audit.ts';
import type { ProRouteValidationCampaignReviewPack } from './pro-route-validation-campaign-review.ts';
import type { ProStayValidationMessagingGuardPack } from './pro-stay-validation-messaging-guard.ts';

export const PRO_HUMAN_APPROVAL_HANDOFF_VERSION = 'v4-16' as const;

export type ProHumanApprovalHandoffStatus = 'hold_validation' | 'ready_for_human_approval_review';

export interface ProHumanApprovalHandoffEvidenceSource {
  label: 'window_tracker' | 'payment_audit' | 'campaign_review' | 'messaging_guard';
  file?: string;
  sha256?: string;
}

export interface ProHumanApprovalHandoffPack {
  handoffVersion: typeof PRO_HUMAN_APPROVAL_HANDOFF_VERSION;
  handoffStatus: ProHumanApprovalHandoffStatus;
  readyForHumanApproval: boolean;
  messagingBoundary: 'stay_validation';
  blockers: string[];
  approvalQuestions: string[];
  guardrails: string[];
  nextActions: string[];
  sources: ProHumanApprovalHandoffEvidenceSource[];
}

export const PRO_HUMAN_APPROVAL_HANDOFF_FILES = {
  summaryJson: 'copylot-pro-human-approval-handoff-v4-16.json',
  summaryMd: 'copylot-pro-human-approval-handoff-v4-16.md'
} as const;

export function buildProHumanApprovalHandoffPack(params: {
  tracker: ProHumanApprovalWindowTrackerPack;
  audit: ProPaymentEvaluationAuditPack;
  campaignReview: ProRouteValidationCampaignReviewPack;
  messagingGuard: ProStayValidationMessagingGuardPack;
  trackerSource?: { file?: string; sha256?: string };
  auditSource?: { file?: string; sha256?: string };
  campaignReviewSource?: { file?: string; sha256?: string };
  messagingGuardSource?: { file?: string; sha256?: string };
  getMessage: I18nGetMessage;
}): ProHumanApprovalHandoffPack {
  const { tracker, audit, campaignReview, messagingGuard, trackerSource, auditSource, campaignReviewSource, messagingGuardSource, getMessage } =
    params;
  const readyForHumanApproval = tracker.readyForHumanApproval;

  const blockers = readyForHumanApproval
    ? []
    : [
        ...tracker.blockers,
        ...audit.blockers,
        ...campaignReview.blockers.map((blocker) => blocker.summary),
        ...messagingGuard.surfaces
          .filter((surface) => surface.status !== 'aligned')
          .map((surface) => surface.reason)
      ];

  return {
    handoffVersion: PRO_HUMAN_APPROVAL_HANDOFF_VERSION,
    handoffStatus: readyForHumanApproval ? 'ready_for_human_approval_review' : 'hold_validation',
    readyForHumanApproval,
    messagingBoundary: 'stay_validation',
    blockers: [...new Set(blockers)],
    approvalQuestions: [
      getMessage('proHumanApprovalHandoffQuestionEvidence'),
      getMessage('proHumanApprovalHandoffQuestionMessaging'),
      getMessage('proHumanApprovalHandoffQuestionImplementation')
    ],
    guardrails: [
      getMessage('proHumanApprovalHandoffGuardrailNoPayment'),
      getMessage('proHumanApprovalHandoffGuardrailStayValidation'),
      getMessage('proHumanApprovalHandoffGuardrailAnonymousOnly')
    ],
    nextActions: readyForHumanApproval
      ? [
          getMessage('proHumanApprovalHandoffNextReview'),
          getMessage('proHumanApprovalHandoffNextScope'),
          getMessage('proHumanApprovalHandoffNextNoImplementation')
        ]
      : [
          getMessage('proHumanApprovalHandoffNextHoldTracker'),
          getMessage('proHumanApprovalHandoffNextHoldCampaigns'),
          getMessage('proHumanApprovalHandoffNextHoldMessaging')
        ],
    sources: [
      { label: 'window_tracker', file: trackerSource?.file, sha256: trackerSource?.sha256 },
      { label: 'payment_audit', file: auditSource?.file, sha256: auditSource?.sha256 },
      {
        label: 'campaign_review',
        file: campaignReviewSource?.file,
        sha256: campaignReviewSource?.sha256
      },
      {
        label: 'messaging_guard',
        file: messagingGuardSource?.file,
        sha256: messagingGuardSource?.sha256
      }
    ]
  };
}

export function formatProHumanApprovalHandoffMarkdown(
  pack: ProHumanApprovalHandoffPack,
  getMessage: I18nGetMessage
): string {
  return [
    `# ${getMessage('proHumanApprovalHandoffMdTitle')}`,
    '',
    `## ${getMessage('proHumanApprovalHandoffMdSectionStatus')}`,
    `- handoff_status=${pack.handoffStatus}`,
    `- ready_for_human_approval=${pack.readyForHumanApproval}`,
    `- messaging_boundary=${pack.messagingBoundary}`,
    '',
    `## ${getMessage('proHumanApprovalHandoffMdSectionBlockers')}`,
    ...(pack.blockers.length > 0
      ? pack.blockers.map((blocker) => `- ${blocker}`)
      : [`- ${getMessage('proHumanApprovalHandoffNoBlockers')}`]),
    '',
    `## ${getMessage('proHumanApprovalHandoffMdSectionQuestions')}`,
    ...pack.approvalQuestions.map((question) => `- ${question}`),
    '',
    `## ${getMessage('proHumanApprovalHandoffMdSectionGuardrails')}`,
    ...pack.guardrails.map((guardrail) => `- ${guardrail}`),
    '',
    `## ${getMessage('proHumanApprovalHandoffMdSectionNext')}`,
    ...pack.nextActions.map((action) => `- ${action}`),
    '',
    `## ${getMessage('proHumanApprovalHandoffMdSectionEvidence')}`,
    ...pack.sources.map((source) => {
      const file = source.file || 'n/a';
      const sha = source.sha256 ? `#${source.sha256}` : '';
      return `- ${source.label}=${file}${sha}`;
    }),
    ''
  ].join('\n');
}
