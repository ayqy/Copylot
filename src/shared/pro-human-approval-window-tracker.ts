import type { I18nGetMessage } from './monetization.ts';
import type { ProPaymentEvaluationAuditPack } from './pro-payment-evaluation-audit.ts';
import type { ProRouteValidationCampaignReviewPack } from './pro-route-validation-campaign-review.ts';
import type { ProStayValidationMessagingGuardPack } from './pro-stay-validation-messaging-guard.ts';

export const PRO_HUMAN_APPROVAL_WINDOW_TRACKER_VERSION = 'v4-15' as const;

export type ProHumanApprovalWindowTrackerStatus =
  | 'hold_validation'
  | 'enter_human_approval_review';

export interface ProHumanApprovalWindowTrackerCheck {
  id: 'payment_audit_ready' | 'campaign_review_clear' | 'messaging_guard_aligned';
  passed: boolean;
  summary: string;
}

export interface ProHumanApprovalWindowTrackerEvidenceSource {
  label: 'payment_audit' | 'campaign_review' | 'messaging_guard';
  file?: string;
  sha256?: string;
}

export interface ProHumanApprovalWindowTrackerPack {
  trackerVersion: typeof PRO_HUMAN_APPROVAL_WINDOW_TRACKER_VERSION;
  trackerStatus: ProHumanApprovalWindowTrackerStatus;
  readyForHumanApproval: boolean;
  messagingBoundary: 'stay_validation';
  verdictCode: ProPaymentEvaluationAuditPack['verdictCode'];
  auditStatus: ProPaymentEvaluationAuditPack['auditStatus'];
  campaignBlockerCodes: ProRouteValidationCampaignReviewPack['blockers'][number]['code'][];
  guardStatus: ProStayValidationMessagingGuardPack['guardStatus'];
  prioritizedCampaigns: string[];
  checks: ProHumanApprovalWindowTrackerCheck[];
  blockers: string[];
  nextStep: string;
  sources: ProHumanApprovalWindowTrackerEvidenceSource[];
}

export const PRO_HUMAN_APPROVAL_WINDOW_TRACKER_FILES = {
  summaryJson: 'copylot-pro-human-approval-window-tracker-v4-15.json',
  summaryMd: 'copylot-pro-human-approval-window-tracker-v4-15.md'
} as const;

function buildChecks(params: {
  audit: ProPaymentEvaluationAuditPack;
  campaignReview: ProRouteValidationCampaignReviewPack;
  messagingGuard: ProStayValidationMessagingGuardPack;
  getMessage: I18nGetMessage;
}): ProHumanApprovalWindowTrackerCheck[] {
  const { audit, campaignReview, messagingGuard, getMessage } = params;
  return [
    {
      id: 'payment_audit_ready',
      passed: audit.readyForPaymentEvaluation,
      summary: audit.readyForPaymentEvaluation
        ? getMessage('proHumanApprovalWindowTrackerCheckAuditPassed')
        : getMessage('proHumanApprovalWindowTrackerCheckAuditFailed', audit.auditStatus)
    },
    {
      id: 'campaign_review_clear',
      passed: campaignReview.blockers.length === 0,
      summary:
        campaignReview.blockers.length === 0
          ? getMessage('proHumanApprovalWindowTrackerCheckCampaignPassed')
          : getMessage(
              'proHumanApprovalWindowTrackerCheckCampaignFailed',
              campaignReview.blockers.map((blocker) => blocker.code).join(', ')
            )
    },
    {
      id: 'messaging_guard_aligned',
      passed: messagingGuard.guardStatus === 'aligned',
      summary:
        messagingGuard.guardStatus === 'aligned'
          ? getMessage('proHumanApprovalWindowTrackerCheckMessagingPassed')
          : getMessage(
              'proHumanApprovalWindowTrackerCheckMessagingFailed',
              messagingGuard.guardStatus
            )
    }
  ];
}

export function buildProHumanApprovalWindowTrackerPack(params: {
  audit: ProPaymentEvaluationAuditPack;
  campaignReview: ProRouteValidationCampaignReviewPack;
  messagingGuard: ProStayValidationMessagingGuardPack;
  auditSource?: { file?: string; sha256?: string };
  campaignReviewSource?: { file?: string; sha256?: string };
  messagingGuardSource?: { file?: string; sha256?: string };
  getMessage: I18nGetMessage;
}): ProHumanApprovalWindowTrackerPack {
  const { audit, campaignReview, messagingGuard, auditSource, campaignReviewSource, messagingGuardSource, getMessage } =
    params;
  const checks = buildChecks({ audit, campaignReview, messagingGuard, getMessage });
  const readyForHumanApproval = checks.every((check) => check.passed);

  return {
    trackerVersion: PRO_HUMAN_APPROVAL_WINDOW_TRACKER_VERSION,
    trackerStatus: readyForHumanApproval ? 'enter_human_approval_review' : 'hold_validation',
    readyForHumanApproval,
    messagingBoundary: 'stay_validation',
    verdictCode: audit.verdictCode,
    auditStatus: audit.auditStatus,
    campaignBlockerCodes: campaignReview.blockers.map((blocker) => blocker.code),
    guardStatus: messagingGuard.guardStatus,
    prioritizedCampaigns: [...campaignReview.prioritizedCampaigns],
    checks,
    blockers: checks.filter((check) => !check.passed).map((check) => check.summary),
    nextStep: readyForHumanApproval
      ? getMessage('proHumanApprovalWindowTrackerNextEnter')
      : getMessage('proHumanApprovalWindowTrackerNextHold'),
    sources: [
      {
        label: 'payment_audit',
        file: auditSource?.file,
        sha256: auditSource?.sha256
      },
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

export function formatProHumanApprovalWindowTrackerMarkdown(
  pack: ProHumanApprovalWindowTrackerPack,
  getMessage: I18nGetMessage
): string {
  return [
    `# ${getMessage('proHumanApprovalWindowTrackerMdTitle')}`,
    '',
    `## ${getMessage('proHumanApprovalWindowTrackerMdSectionStatus')}`,
    `- tracker_status=${pack.trackerStatus}`,
    `- ready_for_human_approval=${pack.readyForHumanApproval}`,
    `- messaging_boundary=${pack.messagingBoundary}`,
    `- audit_status=${pack.auditStatus}`,
    `- guard_status=${pack.guardStatus}`,
    `- campaign_blocker_codes=${pack.campaignBlockerCodes.length > 0 ? pack.campaignBlockerCodes.join(', ') : 'none'}`,
    '',
    `## ${getMessage('proHumanApprovalWindowTrackerMdSectionChecks')}`,
    ...pack.checks.map((check) => `- ${check.id}=${check.passed}; ${check.summary}`),
    '',
    `## ${getMessage('proHumanApprovalWindowTrackerMdSectionBlockers')}`,
    ...(pack.blockers.length > 0
      ? pack.blockers.map((blocker) => `- ${blocker}`)
      : [`- ${getMessage('proHumanApprovalWindowTrackerNoBlockers')}`]),
    '',
    `## ${getMessage('proHumanApprovalWindowTrackerMdSectionDecision')}`,
    `- ${pack.nextStep}`,
    '',
    `## ${getMessage('proHumanApprovalWindowTrackerMdSectionEvidence')}`,
    ...pack.sources.map((source) => {
      const file = source.file || 'n/a';
      const sha = source.sha256 ? `#${source.sha256}` : '';
      return `- ${source.label}=${file}${sha}`;
    }),
    ''
  ].join('\n');
}
