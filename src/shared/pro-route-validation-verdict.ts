import type { I18nGetMessage } from './monetization.ts';
import type { ProIntentDecisionPackSummary } from './pro-intent-decision-pack.ts';
import type { ProRouteValidationComparisonSummary } from './pro-route-validation-comparison.ts';
import type { ProValidationTrackId } from './pro-route-validation.ts';
import type { ProRouteValidationStabilitySummary } from './pro-route-validation-stability.ts';
import type { ProRouteValidationWritebackPack } from './pro-route-validation-writeback.ts';

export type ProRouteValidationVerdictCode = 'stay_validation' | 'enter_payment_evaluation';

export interface ProRouteValidationVerdictPack {
  routeLeaderTrackId: ProValidationTrackId | 'none';
  routeLeaderTrackTitle: string;
  comparisonLeaderTrackId: ProValidationTrackId | 'none';
  comparisonLeaderTrackTitle: string;
  comparisonSignalGap: number;
  comparisonTotalSignals: number;
  writebackLeaderTrackId: ProValidationTrackId | 'none';
  stabilityLeaderTrackId: ProValidationTrackId | 'none';
  stabilityLeaderTrackTitle: string;
  stabilityVerdictCode: ProRouteValidationStabilitySummary['verdictCode'];
  supportingCampaigns: string[];
  conflictingCampaigns: string[];
  decisionCode: ProIntentDecisionPackSummary['decision']['code'];
  decisionConclusion: string;
  routeLeaderConsistent: boolean;
  routeStabilityReady: boolean;
  gateAllowsPaymentEvaluation: boolean;
  verdictCode: ProRouteValidationVerdictCode;
  reasons: string[];
  nextStep: string;
  sources?: {
    comparison?: { file?: string; sha256?: string };
    writeback?: { file?: string; sha256?: string };
    stability?: { file?: string; sha256?: string };
    decision?: { file?: string; sha256?: string };
  };
}

export const PRO_ROUTE_VALIDATION_VERDICT_FILES = {
  summaryJson: 'copylot-pro-route-validation-verdict-v4-11.json',
  summaryMd: 'copylot-pro-route-validation-verdict-v4-11.md'
} as const;

function resolveRouteLeader(params: {
  comparison: ProRouteValidationComparisonSummary;
  writeback: ProRouteValidationWritebackPack;
  stability: ProRouteValidationStabilitySummary;
}): {
  routeLeaderTrackId: ProValidationTrackId | 'none';
  routeLeaderTrackTitle: string;
  routeLeaderConsistent: boolean;
} {
  const { comparison, writeback, stability } = params;
  const routeLeaderConsistent =
    comparison.leadingTrackId !== 'none' &&
    comparison.leadingTrackId === writeback.leadingTrackId &&
    comparison.leadingTrackId === stability.overallLeaderTrackId;

  if (!routeLeaderConsistent) {
    return {
      routeLeaderTrackId: 'none',
      routeLeaderTrackTitle: comparison.leadingTrackTitle,
      routeLeaderConsistent: false
    };
  }

  return {
    routeLeaderTrackId: comparison.leadingTrackId,
    routeLeaderTrackTitle: comparison.leadingTrackTitle,
    routeLeaderConsistent: true
  };
}

function buildReasons(params: {
  comparison: ProRouteValidationComparisonSummary;
  stability: ProRouteValidationStabilitySummary;
  decision: ProIntentDecisionPackSummary;
  routeLeaderTrackTitle: string;
  routeLeaderConsistent: boolean;
  getMessage: I18nGetMessage;
}): string[] {
  const reasons: string[] = [];
  const { comparison, stability, decision, routeLeaderTrackTitle, routeLeaderConsistent, getMessage } = params;

  if (routeLeaderConsistent) {
    reasons.push(
      getMessage('proRouteValidationVerdictReasonLeaderAligned', [
        routeLeaderTrackTitle,
        String(comparison.signalGap)
      ])
    );
  } else {
    reasons.push(getMessage('proRouteValidationVerdictReasonLeaderMismatch'));
  }

  if (stability.verdictCode !== 'leader_stable') {
    reasons.push(
      getMessage('proRouteValidationVerdictReasonStabilityBlocked', stability.verdictCode)
    );
  } else {
    reasons.push(
      getMessage('proRouteValidationVerdictReasonStabilityReady', stability.verdictCode)
    );
  }

  if (decision.decision.code !== 'C') {
    reasons.push(
      getMessage('proRouteValidationVerdictReasonGateBlocked', [
        decision.decision.code,
        decision.decision.conclusion
      ])
    );
  } else {
    reasons.push(
      getMessage('proRouteValidationVerdictReasonGateReady', [
        decision.decision.code,
        decision.decision.conclusion
      ])
    );
  }

  return reasons;
}

export function buildProRouteValidationVerdictPack(params: {
  comparison: ProRouteValidationComparisonSummary;
  writeback: ProRouteValidationWritebackPack;
  stability: ProRouteValidationStabilitySummary;
  decision: ProIntentDecisionPackSummary;
  getMessage: I18nGetMessage;
}): ProRouteValidationVerdictPack {
  const { comparison, writeback, stability, decision, getMessage } = params;
  const { routeLeaderTrackId, routeLeaderTrackTitle, routeLeaderConsistent } = resolveRouteLeader({
    comparison,
    writeback,
    stability
  });
  const routeStabilityReady = stability.verdictCode === 'leader_stable';
  const gateAllowsPaymentEvaluation = decision.decision.code === 'C';
  const verdictCode: ProRouteValidationVerdictCode =
    routeLeaderConsistent && routeStabilityReady && gateAllowsPaymentEvaluation
      ? 'enter_payment_evaluation'
      : 'stay_validation';

  return {
    routeLeaderTrackId,
    routeLeaderTrackTitle,
    comparisonLeaderTrackId: comparison.leadingTrackId,
    comparisonLeaderTrackTitle: comparison.leadingTrackTitle,
    comparisonSignalGap: comparison.signalGap,
    comparisonTotalSignals: comparison.totalSignals,
    writebackLeaderTrackId: writeback.leadingTrackId,
    stabilityLeaderTrackId: stability.overallLeaderTrackId,
    stabilityLeaderTrackTitle: stability.overallLeaderTrackTitle,
    stabilityVerdictCode: stability.verdictCode,
    supportingCampaigns: [...stability.supportingCampaigns],
    conflictingCampaigns: [...stability.conflictingCampaigns],
    decisionCode: decision.decision.code,
    decisionConclusion: decision.decision.conclusion,
    routeLeaderConsistent,
    routeStabilityReady,
    gateAllowsPaymentEvaluation,
    verdictCode,
    reasons: buildReasons({
      comparison,
      stability,
      decision,
      routeLeaderTrackTitle,
      routeLeaderConsistent,
      getMessage
    }),
    nextStep:
      verdictCode === 'enter_payment_evaluation'
        ? getMessage('proRouteValidationVerdictNextEnter')
        : getMessage('proRouteValidationVerdictNextStay'),
    sources: {
      comparison: {
        file: comparison.telemetryFile,
        sha256: comparison.telemetrySha256
      },
      writeback: {
        file: writeback.sourceSummaryFile,
        sha256: writeback.sourceSummarySha256
      },
      stability: {
        file: stability.telemetryFile,
        sha256: stability.telemetrySha256
      },
      decision: {
        file: decision.input.distributionFile,
        sha256: decision.input.distributionSha256
      }
    }
  };
}

export function formatProRouteValidationVerdictMarkdown(
  pack: ProRouteValidationVerdictPack,
  getMessage: I18nGetMessage
): string {
  return [
    `# ${getMessage('proRouteValidationVerdictMdTitle')}`,
    '',
    `## ${getMessage('proRouteValidationVerdictMdSectionInputs')}`,
    `- comparison_leader=${pack.comparisonLeaderTrackTitle}`,
    `- writeback_leader=${pack.writebackLeaderTrackId}`,
    `- stability_leader=${pack.stabilityLeaderTrackTitle}`,
    `- stability_verdict=${pack.stabilityVerdictCode}`,
    `- decision_code=${pack.decisionCode}`,
    '',
    `## ${getMessage('proRouteValidationVerdictMdSectionChecks')}`,
    `- route_leader_consistent=${pack.routeLeaderConsistent}`,
    `- route_stability_ready=${pack.routeStabilityReady}`,
    `- gate_allows_payment_evaluation=${pack.gateAllowsPaymentEvaluation}`,
    `- supporting_campaigns=${pack.supportingCampaigns.length > 0 ? pack.supportingCampaigns.join(', ') : 'none'}`,
    `- conflicting_campaigns=${pack.conflictingCampaigns.length > 0 ? pack.conflictingCampaigns.join(', ') : 'none'}`,
    '',
    `## ${getMessage('proRouteValidationVerdictMdSectionDecision')}`,
    `- ${pack.verdictCode === 'enter_payment_evaluation'
      ? getMessage('proRouteValidationVerdictDecisionEnter')
      : getMessage('proRouteValidationVerdictDecisionStay')}`,
    ...pack.reasons.map((reason) => `- ${reason}`),
    `- ${pack.nextStep}`,
    ''
  ].join('\n');
}
