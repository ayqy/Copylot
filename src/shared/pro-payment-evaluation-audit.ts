import type { I18nGetMessage } from './monetization.ts';
import type { ProValidationTrackId } from './pro-route-validation.ts';
import type { ProRouteValidationVerdictPack } from './pro-route-validation-verdict.ts';

export const PRO_PAYMENT_EVALUATION_AUDIT_VERSION = 'v4-12' as const;

export type ProPaymentEvaluationAuditStatus =
  | 'hold_validation'
  | 'enter_payment_evaluation_review';

export interface ProPaymentEvaluationAuditCheck {
  id:
    | 'route_leader_consistent'
    | 'route_stability_ready'
    | 'gate_allows_payment_evaluation';
  passed: boolean;
  summary: string;
}

export interface ProPaymentEvaluationAuditEvidenceSource {
  label: 'comparison' | 'writeback' | 'stability' | 'decision' | 'verdict';
  file?: string;
  sha256?: string;
}

export interface ProPaymentEvaluationAuditPack {
  auditVersion: typeof PRO_PAYMENT_EVALUATION_AUDIT_VERSION;
  readyForPaymentEvaluation: boolean;
  auditStatus: ProPaymentEvaluationAuditStatus;
  verdictCode: ProRouteValidationVerdictPack['verdictCode'];
  routeLeaderTrackId: ProValidationTrackId | 'none';
  routeLeaderTrackTitle: string;
  decisionCode: ProRouteValidationVerdictPack['decisionCode'];
  decisionConclusion: string;
  comparisonSignalGap: number;
  comparisonTotalSignals: number;
  supportingCampaigns: string[];
  conflictingCampaigns: string[];
  checks: ProPaymentEvaluationAuditCheck[];
  blockers: string[];
  boundaries: string[];
  nextActions: string[];
  verdictReasons: string[];
  verdictNextStep: string;
  evidence: ProPaymentEvaluationAuditEvidenceSource[];
}

export const PRO_PAYMENT_EVALUATION_AUDIT_FILES = {
  summaryJson: 'copylot-pro-payment-evaluation-audit-v4-12.json',
  summaryMd: 'copylot-pro-payment-evaluation-audit-v4-12.md'
} as const;

function buildChecks(
  verdict: ProRouteValidationVerdictPack,
  getMessage: I18nGetMessage
): ProPaymentEvaluationAuditCheck[] {
  return [
    {
      id: 'route_leader_consistent',
      passed: verdict.routeLeaderConsistent,
      summary: verdict.routeLeaderConsistent
        ? getMessage('proPaymentEvaluationAuditCheckLeaderPassed', verdict.routeLeaderTrackTitle)
        : getMessage('proPaymentEvaluationAuditCheckLeaderFailed')
    },
    {
      id: 'route_stability_ready',
      passed: verdict.routeStabilityReady,
      summary: verdict.routeStabilityReady
        ? getMessage(
            'proPaymentEvaluationAuditCheckStabilityPassed',
            verdict.stabilityVerdictCode
          )
        : getMessage(
            'proPaymentEvaluationAuditCheckStabilityFailed',
            verdict.stabilityVerdictCode
          )
    },
    {
      id: 'gate_allows_payment_evaluation',
      passed: verdict.gateAllowsPaymentEvaluation,
      summary: verdict.gateAllowsPaymentEvaluation
        ? getMessage('proPaymentEvaluationAuditCheckGatePassed', [
            verdict.decisionCode,
            verdict.decisionConclusion
          ])
        : getMessage('proPaymentEvaluationAuditCheckGateFailed', [
            verdict.decisionCode,
            verdict.decisionConclusion
          ])
    }
  ];
}

function buildBoundaries(getMessage: I18nGetMessage): string[] {
  return [
    getMessage('proPaymentEvaluationAuditBoundaryNoPaymentImplementation'),
    getMessage('proPaymentEvaluationAuditBoundaryNoMessagingDrift'),
    getMessage('proPaymentEvaluationAuditBoundaryNoSensitiveData')
  ];
}

function buildNextActions(
  readyForPaymentEvaluation: boolean,
  getMessage: I18nGetMessage
): string[] {
  if (readyForPaymentEvaluation) {
    return [
      getMessage('proPaymentEvaluationAuditNextEnterReview'),
      getMessage('proPaymentEvaluationAuditNextEnterApproval'),
      getMessage('proPaymentEvaluationAuditNextEnterNoPaymentImplementation')
    ];
  }

  return [
    getMessage('proPaymentEvaluationAuditNextHoldSamples'),
    getMessage('proPaymentEvaluationAuditNextHoldMessaging'),
    getMessage('proPaymentEvaluationAuditNextHoldRecheck')
  ];
}

function buildEvidence(params: {
  verdict: ProRouteValidationVerdictPack;
  verdictSource?: { file?: string; sha256?: string };
}): ProPaymentEvaluationAuditEvidenceSource[] {
  const { verdict, verdictSource } = params;
  return [
    {
      label: 'comparison',
      file: verdict.sources?.comparison?.file,
      sha256: verdict.sources?.comparison?.sha256
    },
    {
      label: 'writeback',
      file: verdict.sources?.writeback?.file,
      sha256: verdict.sources?.writeback?.sha256
    },
    {
      label: 'stability',
      file: verdict.sources?.stability?.file,
      sha256: verdict.sources?.stability?.sha256
    },
    {
      label: 'decision',
      file: verdict.sources?.decision?.file,
      sha256: verdict.sources?.decision?.sha256
    },
    {
      label: 'verdict',
      file: verdictSource?.file,
      sha256: verdictSource?.sha256
    }
  ];
}

export function buildProPaymentEvaluationAuditPack(params: {
  verdict: ProRouteValidationVerdictPack;
  getMessage: I18nGetMessage;
  verdictSource?: { file?: string; sha256?: string };
}): ProPaymentEvaluationAuditPack {
  const { verdict, getMessage, verdictSource } = params;
  const checks = buildChecks(verdict, getMessage);
  const readyForPaymentEvaluation = verdict.verdictCode === 'enter_payment_evaluation';

  return {
    auditVersion: PRO_PAYMENT_EVALUATION_AUDIT_VERSION,
    readyForPaymentEvaluation,
    auditStatus: readyForPaymentEvaluation
      ? 'enter_payment_evaluation_review'
      : 'hold_validation',
    verdictCode: verdict.verdictCode,
    routeLeaderTrackId: verdict.routeLeaderTrackId,
    routeLeaderTrackTitle: verdict.routeLeaderTrackTitle,
    decisionCode: verdict.decisionCode,
    decisionConclusion: verdict.decisionConclusion,
    comparisonSignalGap: verdict.comparisonSignalGap,
    comparisonTotalSignals: verdict.comparisonTotalSignals,
    supportingCampaigns: [...verdict.supportingCampaigns],
    conflictingCampaigns: [...verdict.conflictingCampaigns],
    checks,
    blockers: checks.filter((check) => !check.passed).map((check) => check.summary),
    boundaries: buildBoundaries(getMessage),
    nextActions: buildNextActions(readyForPaymentEvaluation, getMessage),
    verdictReasons: [...verdict.reasons],
    verdictNextStep: verdict.nextStep,
    evidence: buildEvidence({
      verdict,
      verdictSource
    })
  };
}

export function formatProPaymentEvaluationAuditMarkdown(
  pack: ProPaymentEvaluationAuditPack,
  getMessage: I18nGetMessage
): string {
  const blockers =
    pack.blockers.length > 0
      ? pack.blockers.map((blocker) => `- ${blocker}`)
      : [`- ${getMessage('proPaymentEvaluationAuditNoBlockers')}`];

  return [
    `# ${getMessage('proPaymentEvaluationAuditMdTitle')}`,
    '',
    `## ${getMessage('proPaymentEvaluationAuditMdSectionStatus')}`,
    `- audit_status=${pack.auditStatus}`,
    `- verdict_code=${pack.verdictCode}`,
    `- route_leader=${pack.routeLeaderTrackTitle}`,
    `- decision_code=${pack.decisionCode}`,
    `- comparison_signal_gap=${pack.comparisonSignalGap}`,
    `- comparison_total_signals=${pack.comparisonTotalSignals}`,
    `- ${pack.readyForPaymentEvaluation
      ? getMessage('proPaymentEvaluationAuditDecisionEnter')
      : getMessage('proPaymentEvaluationAuditDecisionHold')}`,
    '',
    `## ${getMessage('proPaymentEvaluationAuditMdSectionChecks')}`,
    ...pack.checks.map((check) => `- ${check.id}=${check.passed}; ${check.summary}`),
    `- supporting_campaigns=${pack.supportingCampaigns.length > 0 ? pack.supportingCampaigns.join(', ') : 'none'}`,
    `- conflicting_campaigns=${pack.conflictingCampaigns.length > 0 ? pack.conflictingCampaigns.join(', ') : 'none'}`,
    '',
    `## ${getMessage('proPaymentEvaluationAuditMdSectionBlockers')}`,
    ...blockers,
    '',
    `## ${getMessage('proPaymentEvaluationAuditMdSectionBoundaries')}`,
    ...pack.boundaries.map((boundary) => `- ${boundary}`),
    '',
    `## ${getMessage('proPaymentEvaluationAuditMdSectionNext')}`,
    ...pack.nextActions.map((action) => `- ${action}`),
    `- ${pack.verdictNextStep}`,
    '',
    `## ${getMessage('proPaymentEvaluationAuditMdSectionEvidence')}`,
    ...pack.evidence.map((source) => {
      const file = source.file || 'n/a';
      const sha = source.sha256 ? `#${source.sha256}` : '';
      return `- ${source.label}=${file}${sha}`;
    }),
    ''
  ].join('\n');
}
