import type { Settings } from './settings-manager';
import type { GrowthFunnelSummary, GrowthStats } from './growth-stats';
import type { TelemetryEvent } from './telemetry';
import { buildChromeWebStoreUrl } from './external-links.ts';

export type I18nGetMessage = (key: string, substitutions?: string | string[]) => string;

export interface FeedbackEnvironmentInfo {
  extensionVersion: string;
  extensionId: string;
  userAgent: string;
  navigatorLanguage: string;
  uiLanguage: string;
}

export interface FeedbackSettingsSnapshot {
  isMagicCopyEnabled: boolean;
  isHoverMagicCopyEnabled: boolean;
  isClipboardAccumulatorEnabled: boolean;
  isAnonymousUsageDataEnabled: boolean;
  interactionMode: Settings['interactionMode'];
  outputFormat: Settings['outputFormat'];
  tableOutputFormat: Settings['tableOutputFormat'];
  attachTitle: boolean;
  attachURL: boolean;
  popupOnboardingVersion: number;
  popupOnboardingCompletedVersion: number;
  defaultChatServiceId?: string;
  defaultAutoOpenChat: boolean;
  language: Settings['language'];
}

export function buildFeedbackSettingsSnapshot(settings: Settings): FeedbackSettingsSnapshot {
  return {
    isMagicCopyEnabled: settings.isMagicCopyEnabled,
    isHoverMagicCopyEnabled: settings.isHoverMagicCopyEnabled,
    isClipboardAccumulatorEnabled: settings.isClipboardAccumulatorEnabled,
    isAnonymousUsageDataEnabled: settings.isAnonymousUsageDataEnabled,
    interactionMode: settings.interactionMode,
    outputFormat: settings.outputFormat,
    tableOutputFormat: settings.tableOutputFormat,
    attachTitle: settings.attachTitle,
    attachURL: settings.attachURL,
    popupOnboardingVersion: settings.popupOnboardingVersion,
    popupOnboardingCompletedVersion: settings.popupOnboardingCompletedVersion,
    defaultChatServiceId: settings.defaultChatServiceId,
    defaultAutoOpenChat: settings.defaultAutoOpenChat,
    language: settings.language
  };
}

export const DEFAULT_FEEDBACK_GITHUB_NEW_ISSUE_URL = 'https://github.com/ayqy/copy/issues/new';

export interface ChromeWebStoreUtmParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

export const DEFAULT_CWS_UTM_PARAMS: ChromeWebStoreUtmParams = {
  utm_source: 'copylot-ext',
  utm_medium: 'popup',
  utm_campaign: 'v1-44'
};

export type WomUtmMedium = 'popup' | 'options' | 'rating_prompt';

export function buildWomUtmParams(medium: WomUtmMedium): ChromeWebStoreUtmParams {
  return {
    utm_source: 'copylot-ext',
    utm_medium: medium,
    utm_campaign: 'v1-44'
  };
}

export function buildChromeWebStoreDetailUrl(
  _extensionId: string,
  utmParams: ChromeWebStoreUtmParams = DEFAULT_CWS_UTM_PARAMS
): string {
  return buildChromeWebStoreUrl({
    medium: utmParams.utm_medium,
    campaign: utmParams.utm_campaign
  });
}

export function buildChromeWebStoreReviewsUrl(
  extensionId: string,
  utmParams: ChromeWebStoreUtmParams = DEFAULT_CWS_UTM_PARAMS
): string {
  const base = `https://chrome.google.com/webstore/detail/${extensionId}/reviews`;
  const url = new URL(base);
  url.search = new URLSearchParams({ ...utmParams }).toString();
  return url.toString();
}

function safeGetMessage(getMessage: I18nGetMessage, key: string, substitutions?: string | string[]) {
  const message = getMessage(key, substitutions);
  return message || key;
}

export const DEFAULT_FEEDBACK_TELEMETRY_EVENTS_LIMIT = 20;

// Conservative upper bound to avoid issues when opening GitHub new issue URLs with long query strings.
const MAX_FEEDBACK_ISSUE_URL_LENGTH = 8000;

const GROWTH_FUNNEL_SUMMARY_KEYS: Array<keyof GrowthFunnelSummary> = [
  'installedAt',
  'successfulCopyCount',
  'firstPopupOpenedAt',
  'firstSuccessfulCopyAt',
  'firstPromptUsedAt',
  'reusedWithin7DaysAt',
  'isPopupOpened',
  'isActivated',
  'isPromptUsed',
  'isReusedWithin7Days',
  'timeFromFirstPopupToFirstCopyMs',
  'activatedWithin3MinutesFromFirstPopup'
];

type SafeGrowthFunnelSummarySnapshot = Partial<Record<keyof GrowthFunnelSummary, number | boolean>>;

function buildSafeGrowthFunnelSummarySnapshot(
  snapshot: GrowthFunnelSummary | undefined
): SafeGrowthFunnelSummarySnapshot {
  if (!snapshot || typeof snapshot !== 'object') return {};

  const safe: SafeGrowthFunnelSummarySnapshot = {};
  for (const key of GROWTH_FUNNEL_SUMMARY_KEYS) {
    const value = snapshot[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      safe[key] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      safe[key] = value;
    }
  }
  return safe;
}

export interface BuildFeedbackIssueParams {
  env: FeedbackEnvironmentInfo;
  settingsSnapshot: FeedbackSettingsSnapshot;
  growthStatsSnapshot?: GrowthStats;
  growthFunnelSummarySnapshot?: GrowthFunnelSummary;
  telemetryEventsSnapshot?: TelemetryEvent[];
  getMessage: I18nGetMessage;
  githubNewIssueUrl?: string;
}

export function buildFeedbackIssueUrl(params: BuildFeedbackIssueParams): string {
  const githubNewIssueUrl = params.githubNewIssueUrl || DEFAULT_FEEDBACK_GITHUB_NEW_ISSUE_URL;
  const settingsJson = JSON.stringify(params.settingsSnapshot, null, 2);
  const growthStatsJson = JSON.stringify(params.growthStatsSnapshot ?? {}, null, 2) || '{}';
  let growthFunnelJson = '{}';
  try {
    growthFunnelJson =
      JSON.stringify(buildSafeGrowthFunnelSummarySnapshot(params.growthFunnelSummarySnapshot), null, 2) || '{}';
  } catch (error) {
    console.warn('Failed to serialize growth funnel summary snapshot for feedback template:', error);
    growthFunnelJson = '{}';
  }

  const telemetryEventsLimit = DEFAULT_FEEDBACK_TELEMETRY_EVENTS_LIMIT;
  const rawTelemetryEvents = Array.isArray(params.telemetryEventsSnapshot) ? params.telemetryEventsSnapshot : [];
  const telemetryEventsEnabled = Boolean(params.settingsSnapshot?.isAnonymousUsageDataEnabled);
  const telemetryEventsForBody = telemetryEventsEnabled
    ? [...rawTelemetryEvents].sort((a, b) => b.ts - a.ts).slice(0, telemetryEventsLimit)
    : [];

  const title = safeGetMessage(params.getMessage, 'feedbackIssueTitleTemplate');

  const buildUrlWithTelemetryEvents = (events: TelemetryEvent[]): string => {
    const telemetryEventsJson = JSON.stringify(events, null, 2) || '[]';
    const body = safeGetMessage(params.getMessage, 'feedbackIssueBodyTemplate', [
      params.env.extensionVersion,
      params.env.extensionId,
      params.env.userAgent,
      params.env.navigatorLanguage,
      params.env.uiLanguage,
      settingsJson,
      growthStatsJson,
      growthFunnelJson,
      telemetryEventsJson,
      String(telemetryEventsLimit)
    ]);

    const url = new URL(githubNewIssueUrl);
    url.search = new URLSearchParams({ title, body }).toString();
    return url.toString();
  };

  // 1) Default: last N events
  let currentEvents = telemetryEventsForBody;
  let nextUrl = buildUrlWithTelemetryEvents(currentEvents);

  // 2) If too long, keep truncating telemetry events only (drop the oldest first).
  while (nextUrl.length > MAX_FEEDBACK_ISSUE_URL_LENGTH && currentEvents.length > 0) {
    currentEvents = currentEvents.slice(0, currentEvents.length - 1);
    nextUrl = buildUrlWithTelemetryEvents(currentEvents);
  }

  return nextUrl;
}

export function buildShareCopyText(getMessage: I18nGetMessage, storeUrl: string): string {
  return safeGetMessage(getMessage, 'shareCopyTextTemplate', [storeUrl]);
}
