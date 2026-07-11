import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvents,
  trimTelemetryEvents,
  type TelemetryEvent
} from './telemetry.ts';
import { getProValidationTrack, type ProValidationTrackId } from './pro-route-validation.ts';
import type { I18nGetMessage } from './monetization.ts';

export interface ProRouteValidationComparisonTrackSummary {
  trackId: ProValidationTrackId;
  title: string;
  routeOpened: number;
  validationRouteCopied: number;
  validationBriefCopied: number;
  validationChecklistCopied: number;
  totalCopies: number;
  totalSignals: number;
}

export interface ProRouteValidationComparisonSummary {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  exportedAt: number;
  extensionVersion: string;
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  maxEvents: number;
  telemetryFile?: string;
  telemetrySha256?: string;
  campaigns: string[];
  totalSignals: number;
  leadingTrackId: ProValidationTrackId | 'none';
  leadingTrackTitle: string;
  runnerUpTrackId: ProValidationTrackId | 'none';
  runnerUpTrackTitle: string;
  signalGap: number;
  tracks: ProRouteValidationComparisonTrackSummary[];
}

export interface BuildProRouteValidationComparisonSummaryParams {
  enabled: boolean;
  telemetryEvents: unknown;
  now: number;
  extensionVersion: string;
  getMessage: I18nGetMessage;
  lookbackDays?: number;
  maxEvents?: number;
  telemetryFile?: string;
  telemetrySha256?: string;
}

export const PRO_ROUTE_VALIDATION_COMPARISON_FILES = {
  summaryJson: 'copylot-pro-route-validation-comparison-v4-8.json',
  summaryMd: 'copylot-pro-route-validation-comparison-v4-8.md'
} as const;

const TRACK_IDS: readonly ProValidationTrackId[] = [
  'advanced_cleaning',
  'bulk_collection',
  'structured_export'
] as const;

function clampLookbackDays(value: unknown): number {
  if (!Number.isFinite(value)) return 7;
  const num = Math.floor(value as number);
  if (num <= 0) return 7;
  if (num > 365) return 365;
  return num;
}

function clampNow(value: unknown): number {
  if (!Number.isFinite(value)) return Date.now();
  const num = value as number;
  if (num <= 0) return Date.now();
  return num;
}

function clampMaxEvents(value: unknown): number {
  if (!Number.isFinite(value)) return TELEMETRY_MAX_EVENTS;
  const num = Math.floor(value as number);
  if (num <= 0) return TELEMETRY_MAX_EVENTS;
  return num;
}

function isInWindow(ts: number, from: number, to: number): boolean {
  return Number.isFinite(ts) && ts >= from && ts <= to;
}

function isValidationAction(value: unknown): value is 'validation_route' | 'validation_brief' | 'validation_checklist' {
  return value === 'validation_route' || value === 'validation_brief' || value === 'validation_checklist';
}

function compareTracks(
  a: ProRouteValidationComparisonTrackSummary,
  b: ProRouteValidationComparisonTrackSummary
): number {
  if (b.totalSignals !== a.totalSignals) return b.totalSignals - a.totalSignals;
  if (b.totalCopies !== a.totalCopies) return b.totalCopies - a.totalCopies;
  if (b.routeOpened !== a.routeOpened) return b.routeOpened - a.routeOpened;
  return a.trackId.localeCompare(b.trackId);
}

function buildEmptyTrackSummary(trackId: ProValidationTrackId, getMessage: I18nGetMessage): ProRouteValidationComparisonTrackSummary {
  return {
    trackId,
    title: getMessage(getProValidationTrack(trackId).titleKey),
    routeOpened: 0,
    validationRouteCopied: 0,
    validationBriefCopied: 0,
    validationChecklistCopied: 0,
    totalCopies: 0,
    totalSignals: 0
  };
}

function finalizeTrackSummary(track: ProRouteValidationComparisonTrackSummary): ProRouteValidationComparisonTrackSummary {
  const totalCopies =
    track.validationRouteCopied + track.validationBriefCopied + track.validationChecklistCopied;
  return {
    ...track,
    totalCopies,
    totalSignals: track.routeOpened + totalCopies
  };
}

export function buildProRouteValidationComparisonSummary(
  params: BuildProRouteValidationComparisonSummaryParams
): ProRouteValidationComparisonSummary {
  const now = clampNow(params.now);
  const lookbackDays = clampLookbackDays(params.lookbackDays);
  const maxEvents = clampMaxEvents(params.maxEvents);
  const windowTo = now;
  const windowFrom = now - lookbackDays * 24 * 60 * 60 * 1000;

  const emptyTracks = TRACK_IDS.map((trackId) => finalizeTrackSummary(buildEmptyTrackSummary(trackId, params.getMessage)));
  if (!params.enabled) {
    return {
      enabled: false,
      disabledReason: 'anonymous_usage_data_disabled',
      exportedAt: now,
      extensionVersion: params.extensionVersion || '',
      windowFrom,
      windowTo,
      lookbackDays,
      maxEvents,
      telemetryFile: params.telemetryFile,
      telemetrySha256: params.telemetrySha256,
      campaigns: [],
      totalSignals: 0,
      leadingTrackId: 'none',
      leadingTrackTitle: params.getMessage('proRouteValidationComparisonDecisionNoSignals'),
      runnerUpTrackId: 'none',
      runnerUpTrackTitle: params.getMessage('proRouteValidationComparisonDecisionNoSignals'),
      signalGap: 0,
      tracks: emptyTracks
    };
  }

  const trimmed = trimTelemetryEvents(sanitizeTelemetryEvents(params.telemetryEvents), maxEvents);
  const campaigns = new Set<string>();
  const trackMap = new Map<ProValidationTrackId, ProRouteValidationComparisonTrackSummary>(
    TRACK_IDS.map((trackId) => [trackId, buildEmptyTrackSummary(trackId, params.getMessage)])
  );

  for (const event of trimmed) {
    if (!isInWindow(event.ts, windowFrom, windowTo)) continue;
    if (event.props?.source !== 'options') continue;

    const trackId = TRACK_IDS.find(
      (candidate) => getProValidationTrack(candidate).attributionContent === event.props?.content
    );
    if (!trackId) continue;

    const track = trackMap.get(trackId);
    if (!track) continue;

    if (typeof event.props?.campaign === 'string' && event.props.campaign) {
      campaigns.add(event.props.campaign);
    }

    if (event.name === 'pro_waitlist_opened') {
      track.routeOpened += 1;
      continue;
    }

    if (event.name !== 'pro_distribution_asset_copied') continue;
    if (!isValidationAction(event.props?.action)) continue;

    if (event.props.action === 'validation_route') track.validationRouteCopied += 1;
    if (event.props.action === 'validation_brief') track.validationBriefCopied += 1;
    if (event.props.action === 'validation_checklist') track.validationChecklistCopied += 1;
  }

  const tracks = Array.from(trackMap.values()).map(finalizeTrackSummary).sort(compareTracks);
  const totalSignals = tracks.reduce((sum, track) => sum + track.totalSignals, 0);
  const leading = tracks[0];
  const runnerUp = tracks[1];
  const hasSignals = Boolean(leading && leading.totalSignals > 0);

  return {
    enabled: true,
    exportedAt: now,
    extensionVersion: params.extensionVersion || '',
    windowFrom,
    windowTo,
    lookbackDays,
    maxEvents,
    telemetryFile: params.telemetryFile,
    telemetrySha256: params.telemetrySha256,
    campaigns: Array.from(campaigns).sort(),
    totalSignals,
    leadingTrackId: hasSignals ? leading.trackId : 'none',
    leadingTrackTitle: hasSignals ? leading.title : params.getMessage('proRouteValidationComparisonDecisionNoSignals'),
    runnerUpTrackId: hasSignals && runnerUp ? runnerUp.trackId : 'none',
    runnerUpTrackTitle: hasSignals && runnerUp
      ? runnerUp.title
      : params.getMessage('proRouteValidationComparisonDecisionNoSignals'),
    signalGap: hasSignals && runnerUp ? leading.totalSignals - runnerUp.totalSignals : 0,
    tracks
  };
}

export function formatProRouteValidationComparisonMarkdown(
  summary: ProRouteValidationComparisonSummary,
  getMessage: I18nGetMessage
): string {
  const campaignsText = summary.campaigns.length > 0 ? summary.campaigns.join(', ') : 'none';
  const decisionLine =
    summary.leadingTrackId === 'none'
      ? getMessage('proRouteValidationComparisonDecisionNoSignals')
      : getMessage('proRouteValidationComparisonDecisionLeading', [
          summary.leadingTrackTitle,
          String(summary.signalGap)
        ]);
  const nextStepLine =
    summary.leadingTrackId === 'none'
      ? getMessage('proRouteValidationComparisonDecisionNextStepCollect')
      : getMessage('proRouteValidationComparisonDecisionNextStepWriteback', summary.leadingTrackTitle);

  return [
    `# ${getMessage('proRouteValidationComparisonMdTitle')}`,
    '',
    `## ${getMessage('proRouteValidationComparisonMdSectionInput')}`,
    `- ${getMessage('proRouteValidationComparisonInputWindow')}: ${summary.lookbackDays}d`,
    `- ${getMessage('proRouteValidationComparisonInputTotalSignals')}: ${summary.totalSignals}`,
    `- ${getMessage('proRouteValidationComparisonInputCampaigns')}: ${campaignsText}`,
    '',
    `## ${getMessage('proRouteValidationComparisonMdSectionScoreboard')}`,
    ...summary.tracks.map(
      (track) =>
        `- ${track.title}: route_opened=${track.routeOpened}, validation_route=${track.validationRouteCopied}, validation_brief=${track.validationBriefCopied}, validation_checklist=${track.validationChecklistCopied}, total_signals=${track.totalSignals}`
    ),
    '',
    `## ${getMessage('proRouteValidationComparisonMdSectionDecision')}`,
    `- ${decisionLine}`,
    `- ${nextStepLine}`,
    ''
  ].join('\n');
}

export type { I18nGetMessage, ProValidationTrackId, TelemetryEvent };
