import type { I18nGetMessage } from './monetization.ts';
import type { ProValidationTrackId } from './pro-route-validation.ts';
import type {
  ProRouteValidationStabilityCampaignSummary,
  ProRouteValidationStabilitySummary
} from './pro-route-validation-stability.ts';
import type { ProRouteValidationVerdictPack } from './pro-route-validation-verdict.ts';

export const PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_VERSION = 'v4-13' as const;

export type ProRouteValidationCampaignReviewStatus =
  | 'supporting'
  | 'conflicting'
  | 'thin'
  | 'no_signals';

export type ProRouteValidationCampaignReviewBlockerCode =
  | 'acquisition_bias_unresolved'
  | 'sample_still_thin'
  | 'no_campaign_signals';

export interface ProRouteValidationCampaignReviewItemEvidenceTrack {
  trackId: ProValidationTrackId;
  title: string;
  routeOpened: number;
  totalCopies: number;
  totalSignals: number;
}

export interface ProRouteValidationCampaignReviewItemEvidence {
  leaderSignals: number;
  runnerUpTrackId: ProValidationTrackId | 'none';
  runnerUpTrackTitle: string;
  runnerUpSignals: number;
  trackSignals: ProRouteValidationCampaignReviewItemEvidenceTrack[];
}

export interface ProRouteValidationCampaignReviewItem {
  campaign: string;
  totalSignals: number;
  leadingTrackId: ProValidationTrackId | 'none';
  leadingTrackTitle: string;
  signalGap: number;
  reviewStatus: ProRouteValidationCampaignReviewStatus;
  prioritized: boolean;
  conclusion: string;
  nextStep: string;
  reviewAction: string;
  evidence: ProRouteValidationCampaignReviewItemEvidence;
}

export interface ProRouteValidationCampaignReviewBlocker {
  code: ProRouteValidationCampaignReviewBlockerCode;
  campaigns: string[];
  summary: string;
}

export interface ProRouteValidationCampaignReviewEvidenceSource {
  label:
    | 'stability_summary'
    | 'stability_telemetry'
    | 'verdict_summary'
    | 'comparison'
    | 'writeback'
    | 'decision';
  file?: string;
  sha256?: string;
}

export interface ProRouteValidationCampaignReviewPack {
  reviewVersion: typeof PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_VERSION;
  messagingBoundary: 'stay_validation';
  overallLeaderTrackId: ProValidationTrackId | 'none';
  overallLeaderTrackTitle: string;
  verdictCode: ProRouteValidationVerdictPack['verdictCode'];
  stabilityVerdictCode: ProRouteValidationStabilitySummary['verdictCode'];
  campaigns: ProRouteValidationCampaignReviewItem[];
  supportingCampaigns: string[];
  conflictingCampaigns: string[];
  thinCampaigns: string[];
  noSignalCampaigns: string[];
  prioritizedCampaigns: string[];
  blockers: ProRouteValidationCampaignReviewBlocker[];
  conclusion: string;
  nextStep: string;
  sources: ProRouteValidationCampaignReviewEvidenceSource[];
}

export const PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_FILES = {
  summaryJson: 'copylot-pro-route-validation-campaign-review-v4-13.json',
  summaryMd: 'copylot-pro-route-validation-campaign-review-v4-13.md'
} as const;

function resolveReviewStatus(params: {
  campaign: ProRouteValidationStabilityCampaignSummary;
  overallLeaderTrackId: ProValidationTrackId | 'none';
}): ProRouteValidationCampaignReviewStatus {
  const { campaign, overallLeaderTrackId } = params;
  if (campaign.totalSignals <= 0 || campaign.leadingTrackId === 'none') {
    return 'no_signals';
  }
  if (overallLeaderTrackId === 'none') {
    return 'thin';
  }
  if (campaign.leadingTrackId !== overallLeaderTrackId) {
    return 'conflicting';
  }
  if (campaign.totalSignals < 3 || campaign.signalGap < 1) {
    return 'thin';
  }
  return 'supporting';
}

function getTrackSignals(
  campaign: ProRouteValidationStabilityCampaignSummary,
  trackId: ProValidationTrackId | 'none'
): number {
  if (trackId === 'none') {
    return 0;
  }

  return campaign.tracks.find((track) => track.trackId === trackId)?.totalSignals ?? 0;
}

function getRunnerUp(campaign: ProRouteValidationStabilityCampaignSummary): {
  trackId: ProValidationTrackId | 'none';
  title: string;
  totalSignals: number;
} {
  const runnerUp = campaign.tracks[1];
  if (!runnerUp || runnerUp.totalSignals <= 0) {
    return {
      trackId: 'none',
      title: 'none',
      totalSignals: 0
    };
  }

  return {
    trackId: runnerUp.trackId,
    title: runnerUp.title,
    totalSignals: runnerUp.totalSignals
  };
}

function buildReviewAction(
  reviewStatus: ProRouteValidationCampaignReviewStatus,
  getMessage: I18nGetMessage
): string {
  if (reviewStatus === 'supporting') {
    return getMessage('proRouteValidationCampaignReviewActionSupporting');
  }
  if (reviewStatus === 'conflicting') {
    return getMessage('proRouteValidationCampaignReviewActionConflicting');
  }
  if (reviewStatus === 'thin') {
    return getMessage('proRouteValidationCampaignReviewActionThin');
  }
  return getMessage('proRouteValidationCampaignReviewActionNoSignals');
}

function buildCampaignConclusion(
  reviewStatus: ProRouteValidationCampaignReviewStatus,
  getMessage: I18nGetMessage
): string {
  if (reviewStatus === 'supporting') {
    return getMessage('proRouteValidationCampaignReviewCampaignConclusionSupporting');
  }
  if (reviewStatus === 'conflicting') {
    return getMessage('proRouteValidationCampaignReviewCampaignConclusionConflicting');
  }
  if (reviewStatus === 'thin') {
    return getMessage('proRouteValidationCampaignReviewCampaignConclusionThin');
  }
  return getMessage('proRouteValidationCampaignReviewCampaignConclusionNoSignals');
}

function buildCampaignNextStep(
  reviewStatus: ProRouteValidationCampaignReviewStatus,
  getMessage: I18nGetMessage
): string {
  if (reviewStatus === 'supporting') {
    return getMessage('proRouteValidationCampaignReviewCampaignNextSupporting');
  }
  if (reviewStatus === 'conflicting') {
    return getMessage('proRouteValidationCampaignReviewCampaignNextConflicting');
  }
  if (reviewStatus === 'thin') {
    return getMessage('proRouteValidationCampaignReviewCampaignNextThin');
  }
  return getMessage('proRouteValidationCampaignReviewCampaignNextNoSignals');
}

function buildConclusion(params: {
  conflictingCampaigns: string[];
  thinCampaigns: string[];
  noSignalCampaigns: string[];
  overallLeaderTrackId: ProValidationTrackId | 'none';
  getMessage: I18nGetMessage;
}): string {
  if (params.overallLeaderTrackId === 'none') {
    return params.getMessage('proRouteValidationCampaignReviewConclusionNoSignals');
  }
  if (params.conflictingCampaigns.length > 0) {
    return params.getMessage('proRouteValidationCampaignReviewConclusionConflicting');
  }
  if (params.thinCampaigns.length > 0) {
    return params.getMessage('proRouteValidationCampaignReviewConclusionThin');
  }
  if (params.noSignalCampaigns.length > 0) {
    return params.getMessage('proRouteValidationCampaignReviewConclusionNoSignals');
  }
  return params.getMessage('proRouteValidationCampaignReviewConclusionSupporting');
}

function buildBlockers(params: {
  conflictingCampaigns: string[];
  thinCampaigns: string[];
  noSignalCampaigns: string[];
  overallLeaderTrackId: ProValidationTrackId | 'none';
  getMessage: I18nGetMessage;
}): ProRouteValidationCampaignReviewBlocker[] {
  const blockers: ProRouteValidationCampaignReviewBlocker[] = [];

  if (params.conflictingCampaigns.length > 0) {
    blockers.push({
      code: 'acquisition_bias_unresolved',
      campaigns: [...params.conflictingCampaigns],
      summary: params.getMessage('proRouteValidationCampaignReviewBlockerAcquisitionBias')
    });
  }

  if (params.thinCampaigns.length > 0) {
    blockers.push({
      code: 'sample_still_thin',
      campaigns: [...params.thinCampaigns],
      summary: params.getMessage('proRouteValidationCampaignReviewBlockerThinSamples')
    });
  }

  if (params.noSignalCampaigns.length > 0 || params.overallLeaderTrackId === 'none') {
    blockers.push({
      code: 'no_campaign_signals',
      campaigns:
        params.noSignalCampaigns.length > 0 ? [...params.noSignalCampaigns] : ['all_campaigns'],
      summary: params.getMessage('proRouteValidationCampaignReviewBlockerNoSignals')
    });
  }

  return blockers;
}

function buildSources(params: {
  stability: ProRouteValidationStabilitySummary;
  verdict: ProRouteValidationVerdictPack;
  stabilitySource?: { file?: string; sha256?: string };
  verdictSource?: { file?: string; sha256?: string };
}): ProRouteValidationCampaignReviewEvidenceSource[] {
  const { stability, verdict, stabilitySource, verdictSource } = params;

  return [
    {
      label: 'stability_summary',
      file: stabilitySource?.file,
      sha256: stabilitySource?.sha256
    },
    {
      label: 'stability_telemetry',
      file: stability.telemetryFile,
      sha256: stability.telemetrySha256
    },
    {
      label: 'verdict_summary',
      file: verdictSource?.file,
      sha256: verdictSource?.sha256
    },
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
      label: 'decision',
      file: verdict.sources?.decision?.file,
      sha256: verdict.sources?.decision?.sha256
    }
  ];
}

export function buildProRouteValidationCampaignReviewPack(params: {
  stability: ProRouteValidationStabilitySummary;
  verdict: ProRouteValidationVerdictPack;
  getMessage: I18nGetMessage;
  stabilitySource?: { file?: string; sha256?: string };
  verdictSource?: { file?: string; sha256?: string };
}): ProRouteValidationCampaignReviewPack {
  const { stability, verdict, getMessage, stabilitySource, verdictSource } = params;
  const campaigns = stability.campaigns.map((campaign) => {
    const reviewStatus = resolveReviewStatus({
      campaign,
      overallLeaderTrackId: stability.overallLeaderTrackId
    });
    const prioritized = reviewStatus !== 'supporting';
    const runnerUp = getRunnerUp(campaign);

    return {
      campaign: campaign.campaign,
      totalSignals: campaign.totalSignals,
      leadingTrackId: campaign.leadingTrackId,
      leadingTrackTitle: campaign.leadingTrackTitle,
      signalGap: campaign.signalGap,
      reviewStatus,
      prioritized,
      conclusion: buildCampaignConclusion(reviewStatus, getMessage),
      nextStep: buildCampaignNextStep(reviewStatus, getMessage),
      reviewAction: buildReviewAction(reviewStatus, getMessage),
      evidence: {
        leaderSignals: getTrackSignals(campaign, campaign.leadingTrackId),
        runnerUpTrackId: runnerUp.trackId,
        runnerUpTrackTitle: runnerUp.title,
        runnerUpSignals: runnerUp.totalSignals,
        trackSignals: campaign.tracks.map((track) => ({
          trackId: track.trackId,
          title: track.title,
          routeOpened: track.routeOpened,
          totalCopies: track.totalCopies,
          totalSignals: track.totalSignals
        }))
      }
    };
  });

  const thinCampaigns = campaigns
    .filter((campaign) => campaign.reviewStatus === 'thin')
    .map((campaign) => campaign.campaign);
  const noSignalCampaigns = campaigns
    .filter((campaign) => campaign.reviewStatus === 'no_signals')
    .map((campaign) => campaign.campaign);
  const prioritizedCampaigns = campaigns
    .filter((campaign) => campaign.prioritized)
    .map((campaign) => campaign.campaign);
  const blockers = buildBlockers({
    conflictingCampaigns: stability.conflictingCampaigns,
    thinCampaigns,
    noSignalCampaigns,
    overallLeaderTrackId: stability.overallLeaderTrackId,
    getMessage
  });

  return {
    reviewVersion: PRO_ROUTE_VALIDATION_CAMPAIGN_REVIEW_VERSION,
    messagingBoundary: 'stay_validation',
    overallLeaderTrackId: stability.overallLeaderTrackId,
    overallLeaderTrackTitle: stability.overallLeaderTrackTitle,
    verdictCode: verdict.verdictCode,
    stabilityVerdictCode: stability.verdictCode,
    campaigns,
    supportingCampaigns: [...stability.supportingCampaigns],
    conflictingCampaigns: [...stability.conflictingCampaigns],
    thinCampaigns,
    noSignalCampaigns,
    prioritizedCampaigns,
    blockers,
    conclusion: buildConclusion({
      conflictingCampaigns: stability.conflictingCampaigns,
      thinCampaigns,
      noSignalCampaigns,
      overallLeaderTrackId: stability.overallLeaderTrackId,
      getMessage
    }),
    nextStep:
      prioritizedCampaigns.length > 0
        ? getMessage('proRouteValidationCampaignReviewNextPrioritized')
        : getMessage('proRouteValidationCampaignReviewNextSteady'),
    sources: buildSources({
      stability,
      verdict,
      stabilitySource,
      verdictSource
    })
  };
}

export function formatProRouteValidationCampaignReviewMarkdown(
  pack: ProRouteValidationCampaignReviewPack,
  getMessage: I18nGetMessage
): string {
  const blockers =
    pack.blockers.length > 0
      ? pack.blockers.map(
          (blocker) =>
            `- ${blocker.code}: campaigns=${blocker.campaigns.length > 0 ? blocker.campaigns.join(', ') : 'none'}; ${blocker.summary}`
        )
      : [`- ${getMessage('proRouteValidationCampaignReviewNoBlockers')}`];

  return [
    `# ${getMessage('proRouteValidationCampaignReviewMdTitle')}`,
    '',
    `## ${getMessage('proRouteValidationCampaignReviewMdSectionStatus')}`,
    `- messaging_boundary=${pack.messagingBoundary}`,
    `- overall_leader_track_id=${pack.overallLeaderTrackId}`,
    `- overall_leader=${pack.overallLeaderTrackTitle}`,
    `- stability_verdict=${pack.stabilityVerdictCode}`,
    `- verdict_code=${pack.verdictCode}`,
    `- supporting_campaigns=${pack.supportingCampaigns.length > 0 ? pack.supportingCampaigns.join(', ') : 'none'}`,
    `- conflicting_campaigns=${pack.conflictingCampaigns.length > 0 ? pack.conflictingCampaigns.join(', ') : 'none'}`,
    `- thin_campaigns=${pack.thinCampaigns.length > 0 ? pack.thinCampaigns.join(', ') : 'none'}`,
    `- no_signal_campaigns=${pack.noSignalCampaigns.length > 0 ? pack.noSignalCampaigns.join(', ') : 'none'}`,
    `- prioritized_campaigns=${pack.prioritizedCampaigns.length > 0 ? pack.prioritizedCampaigns.join(', ') : 'none'}`,
    '',
    `## ${getMessage('proRouteValidationCampaignReviewMdSectionCampaigns')}`,
    ...pack.campaigns.map(
      (campaign) =>
        `- ${campaign.campaign}: status=${campaign.reviewStatus}; prioritized=${campaign.prioritized}; leader=${campaign.leadingTrackTitle}; total_signals=${campaign.totalSignals}; signal_gap=${campaign.signalGap}; conclusion=${campaign.conclusion}; next_step=${campaign.nextStep}; action=${campaign.reviewAction}; leader_signals=${campaign.evidence.leaderSignals}; runner_up=${campaign.evidence.runnerUpTrackTitle}; runner_up_signals=${campaign.evidence.runnerUpSignals}`
    ),
    '',
    `## ${getMessage('proRouteValidationCampaignReviewMdSectionBlockers')}`,
    ...blockers,
    '',
    `## ${getMessage('proRouteValidationCampaignReviewMdSectionDecision')}`,
    `- ${pack.conclusion}`,
    `- ${pack.nextStep}`,
    `- ${getMessage('proRouteValidationCampaignReviewBoundaryStayValidation')}`,
    '',
    `## ${getMessage('proRouteValidationCampaignReviewMdSectionEvidence')}`,
    ...pack.sources.map((source) => {
      const file = source.file || 'n/a';
      const sha = source.sha256 ? `#${source.sha256}` : '';
      return `- ${source.label}=${file}${sha}`;
    }),
    ''
  ].join('\n');
}
