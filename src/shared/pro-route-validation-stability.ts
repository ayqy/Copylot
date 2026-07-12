import type { I18nGetMessage } from './monetization.ts';
import {
  buildProRouteValidationComparisonSummary,
  type BuildProRouteValidationComparisonSummaryParams,
  type ProRouteValidationComparisonSummary,
  type ProRouteValidationComparisonTrackSummary
} from './pro-route-validation-comparison.ts';
import type { ProValidationTrackId } from './pro-route-validation.ts';

export type ProRouteValidationStabilityVerdictCode =
  | 'no_signals'
  | 'leader_unstable'
  | 'leader_stable_campaign_thin'
  | 'leader_stable_campaign_split'
  | 'leader_stable';

export interface ProRouteValidationStabilityWindowSummary {
  lookbackDays: number;
  totalSignals: number;
  campaigns: string[];
  leadingTrackId: ProValidationTrackId | 'none';
  leadingTrackTitle: string;
  runnerUpTrackId: ProValidationTrackId | 'none';
  runnerUpTrackTitle: string;
  signalGap: number;
  tracks: ProRouteValidationComparisonTrackSummary[];
}

export interface ProRouteValidationStabilityCampaignSummary {
  campaign: string;
  totalSignals: number;
  leadingTrackId: ProValidationTrackId | 'none';
  leadingTrackTitle: string;
  signalGap: number;
  tracks: ProRouteValidationComparisonTrackSummary[];
}

export interface ProRouteValidationStabilitySummary {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  exportedAt: number;
  extensionVersion: string;
  telemetryFile?: string;
  telemetrySha256?: string;
  windowSetDays: number[];
  overallLeaderTrackId: ProValidationTrackId | 'none';
  overallLeaderTrackTitle: string;
  stableAcrossWindows: boolean;
  supportingCampaigns: string[];
  conflictingCampaigns: string[];
  verdictCode: ProRouteValidationStabilityVerdictCode;
  windows: ProRouteValidationStabilityWindowSummary[];
  campaigns: ProRouteValidationStabilityCampaignSummary[];
}

export type BuildProRouteValidationStabilitySummaryParams = Readonly<
  Omit<BuildProRouteValidationComparisonSummaryParams, 'lookbackDays'> & {
    windowSetDays?: number[];
  }
>;

export const PRO_ROUTE_VALIDATION_STABILITY_FILES = {
  summaryJson: 'copylot-pro-route-validation-stability-v4-10.json',
  summaryMd: 'copylot-pro-route-validation-stability-v4-10.md'
} as const;

const DEFAULT_WINDOW_SET_DAYS = [7, 14] as const;

function normalizeWindowSetDays(value: unknown): number[] {
  const days = Array.isArray(value) ? value : DEFAULT_WINDOW_SET_DAYS;
  const normalized = Array.from(
    new Set(
      days
        .map((item) => (Number.isFinite(item) ? Math.floor(item as number) : 0))
        .filter((item) => item > 0 && item <= 365)
    )
  ).sort((a, b) => a - b);
  return normalized.length > 0 ? normalized : [...DEFAULT_WINDOW_SET_DAYS];
}

function filterTelemetryEventsByCampaign(telemetryEvents: unknown, campaign: string): unknown[] {
  if (!Array.isArray(telemetryEvents) || !campaign) {
    return [];
  }

  return telemetryEvents.filter((event) => {
    if (!event || typeof event !== 'object') return false;
    const props = (event as { props?: { campaign?: unknown } }).props;
    return typeof props?.campaign === 'string' && props.campaign === campaign;
  });
}

function toWindowSummary(
  summary: ProRouteValidationComparisonSummary
): ProRouteValidationStabilityWindowSummary {
  return {
    lookbackDays: summary.lookbackDays,
    totalSignals: summary.totalSignals,
    campaigns: [...summary.campaigns],
    leadingTrackId: summary.leadingTrackId,
    leadingTrackTitle: summary.leadingTrackTitle,
    runnerUpTrackId: summary.runnerUpTrackId,
    runnerUpTrackTitle: summary.runnerUpTrackTitle,
    signalGap: summary.signalGap,
    tracks: summary.tracks.map((track) => ({ ...track }))
  };
}

function toCampaignSummary(
  campaign: string,
  summary: ProRouteValidationComparisonSummary
): ProRouteValidationStabilityCampaignSummary {
  return {
    campaign,
    totalSignals: summary.totalSignals,
    leadingTrackId: summary.leadingTrackId,
    leadingTrackTitle: summary.leadingTrackTitle,
    signalGap: summary.signalGap,
    tracks: summary.tracks.map((track) => ({ ...track }))
  };
}

function buildVerdictCode(params: {
  overallLeaderTrackId: ProValidationTrackId | 'none';
  stableAcrossWindows: boolean;
  supportingCampaigns: string[];
  conflictingCampaigns: string[];
}): ProRouteValidationStabilityVerdictCode {
  if (params.overallLeaderTrackId === 'none') {
    return 'no_signals';
  }
  if (!params.stableAcrossWindows) {
    return 'leader_unstable';
  }
  if (params.conflictingCampaigns.length > 0) {
    return 'leader_stable_campaign_split';
  }
  if (params.supportingCampaigns.length < 2) {
    return 'leader_stable_campaign_thin';
  }
  return 'leader_stable';
}

function buildComparisonWindow(
  params: BuildProRouteValidationStabilitySummaryParams,
  lookbackDays: number,
  telemetryEvents: unknown
): ProRouteValidationComparisonSummary {
  return buildProRouteValidationComparisonSummary({
    enabled: params.enabled,
    telemetryEvents,
    now: params.now,
    extensionVersion: params.extensionVersion,
    getMessage: params.getMessage,
    lookbackDays,
    maxEvents: params.maxEvents,
    telemetryFile: params.telemetryFile,
    telemetrySha256: params.telemetrySha256
  });
}

export function buildProRouteValidationStabilitySummary(
  params: BuildProRouteValidationStabilitySummaryParams
): ProRouteValidationStabilitySummary {
  const windowSetDays = normalizeWindowSetDays(params.windowSetDays);
  const windowsRaw = windowSetDays.map((lookbackDays) =>
    buildComparisonWindow(params, lookbackDays, params.telemetryEvents)
  );
  const windows = windowsRaw.map(toWindowSummary);
  const overallWindow = windowsRaw[windowsRaw.length - 1];
  const overallLeaderTrackId = overallWindow?.leadingTrackId ?? 'none';
  const overallLeaderTrackTitle =
    overallWindow?.leadingTrackTitle ?? params.getMessage('proRouteValidationStabilityNoSignals');
  const windowsWithSignals = windows.filter(
    (windowSummary) =>
      windowSummary.leadingTrackId !== 'none' && windowSummary.totalSignals > 0
  );
  const stableAcrossWindows =
    overallLeaderTrackId !== 'none' &&
    windowsWithSignals.length === windowSetDays.length &&
    windowsWithSignals.every(
      (windowSummary) => windowSummary.leadingTrackId === overallLeaderTrackId
    );

  const campaigns = (overallWindow?.campaigns ?? []).map((campaign) => {
    const campaignTelemetry = filterTelemetryEventsByCampaign(params.telemetryEvents, campaign);
    const campaignSummary = buildComparisonWindow(
      params,
      overallWindow.lookbackDays,
      campaignTelemetry
    );
    return toCampaignSummary(campaign, campaignSummary);
  });

  const supportingCampaigns =
    overallLeaderTrackId === 'none'
      ? []
      : campaigns
          .filter((campaign) => campaign.leadingTrackId === overallLeaderTrackId)
          .map((campaign) => campaign.campaign);
  const conflictingCampaigns =
    overallLeaderTrackId === 'none'
      ? []
      : campaigns
          .filter(
            (campaign) =>
              campaign.leadingTrackId !== 'none' &&
              campaign.leadingTrackId !== overallLeaderTrackId
          )
          .map((campaign) => campaign.campaign);

  return {
    enabled: overallWindow?.enabled ?? params.enabled,
    disabledReason: overallWindow?.disabledReason,
    exportedAt: params.now,
    extensionVersion: params.extensionVersion || '',
    telemetryFile: params.telemetryFile,
    telemetrySha256: params.telemetrySha256,
    windowSetDays,
    overallLeaderTrackId,
    overallLeaderTrackTitle,
    stableAcrossWindows,
    supportingCampaigns,
    conflictingCampaigns,
    verdictCode: buildVerdictCode({
      overallLeaderTrackId,
      stableAcrossWindows,
      supportingCampaigns,
      conflictingCampaigns
    }),
    windows,
    campaigns
  };
}

function getVerdictLine(
  verdictCode: ProRouteValidationStabilityVerdictCode,
  getMessage: I18nGetMessage
): string {
  if (verdictCode === 'leader_stable') {
    return getMessage('proRouteValidationStabilityVerdictStable');
  }
  if (verdictCode === 'leader_stable_campaign_thin') {
    return getMessage('proRouteValidationStabilityVerdictCampaignThin');
  }
  if (verdictCode === 'leader_stable_campaign_split') {
    return getMessage('proRouteValidationStabilityVerdictCampaignSplit');
  }
  if (verdictCode === 'leader_unstable') {
    return getMessage('proRouteValidationStabilityVerdictWindowUnstable');
  }
  return getMessage('proRouteValidationStabilityNoSignals');
}

function getNextStepLine(
  verdictCode: ProRouteValidationStabilityVerdictCode,
  getMessage: I18nGetMessage
): string {
  if (verdictCode === 'leader_stable') {
    return getMessage('proRouteValidationStabilityNextStrengthen');
  }
  if (verdictCode === 'leader_stable_campaign_split') {
    return getMessage('proRouteValidationStabilityNextCrossCampaign');
  }
  return getMessage('proRouteValidationStabilityNextCollect');
}

export function formatProRouteValidationStabilityMarkdown(
  summary: ProRouteValidationStabilitySummary,
  getMessage: I18nGetMessage
): string {
  const overallLeaderText =
    summary.overallLeaderTrackId === 'none'
      ? getMessage('proRouteValidationStabilityNoSignals')
      : summary.overallLeaderTrackTitle;
  const supportingCampaignsText =
    summary.supportingCampaigns.length > 0 ? summary.supportingCampaigns.join(', ') : 'none';
  const conflictingCampaignsText =
    summary.conflictingCampaigns.length > 0 ? summary.conflictingCampaigns.join(', ') : 'none';

  return [
    `# ${getMessage('proRouteValidationStabilityMdTitle')}`,
    '',
    `## ${getMessage('proRouteValidationStabilityMdSectionInput')}`,
    `- window_set=${summary.windowSetDays.map((days) => `${days}d`).join(', ')}`,
    `- campaign_count=${summary.campaigns.length}`,
    `- overall_leader=${overallLeaderText}`,
    '',
    `## ${getMessage('proRouteValidationStabilityMdSectionWindows')}`,
    ...summary.windows.map(
      (windowSummary) =>
        `- ${windowSummary.lookbackDays}d leader=${windowSummary.leadingTrackTitle}, total_signals=${windowSummary.totalSignals}, signal_gap=${windowSummary.signalGap}, campaigns=${windowSummary.campaigns.length}`
    ),
    `- stable_across_windows=${summary.stableAcrossWindows}`,
    '',
    `## ${getMessage('proRouteValidationStabilityMdSectionCampaigns')}`,
    ...summary.campaigns.map(
      (campaign) =>
        `- ${campaign.campaign} leader=${campaign.leadingTrackTitle}, total_signals=${campaign.totalSignals}, signal_gap=${campaign.signalGap}`
    ),
    `- supporting_campaigns=${supportingCampaignsText}`,
    `- conflicting_campaigns=${conflictingCampaignsText}`,
    '',
    `## ${getMessage('proRouteValidationStabilityMdSectionDecision')}`,
    `- ${getVerdictLine(summary.verdictCode, getMessage)}`,
    `- ${getNextStepLine(summary.verdictCode, getMessage)}`,
    ''
  ].join('\n');
}
