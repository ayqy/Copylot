import type { Settings } from './settings-manager';
import type { GrowthStats } from './growth-stats';
import type { TelemetryEvent } from './telemetry';

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
  utm_medium: 'popup-entry',
  utm_campaign: 'v1-1'
};

export function buildChromeWebStoreDetailUrl(
  extensionId: string,
  utmParams: ChromeWebStoreUtmParams = DEFAULT_CWS_UTM_PARAMS
): string {
  const base = `https://chrome.google.com/webstore/detail/${extensionId}`;
  const url = new URL(base);
  url.search = new URLSearchParams({ ...utmParams }).toString();
  return url.toString();
}

export function buildChromeWebStoreReviewsUrl(extensionId: string): string {
  return `https://chrome.google.com/webstore/detail/${extensionId}/reviews`;
}

function safeGetMessage(getMessage: I18nGetMessage, key: string, substitutions?: string | string[]) {
  const message = getMessage(key, substitutions);
  return message || key;
}

export const DEFAULT_FEEDBACK_TELEMETRY_EVENTS_LIMIT = 20;

// Conservative upper bound to avoid issues when opening GitHub new issue URLs with long query strings.
const MAX_FEEDBACK_ISSUE_URL_LENGTH = 8000;

export interface BuildFeedbackIssueParams {
  env: FeedbackEnvironmentInfo;
  settingsSnapshot: FeedbackSettingsSnapshot;
  growthStatsSnapshot?: GrowthStats;
  telemetryEventsSnapshot?: TelemetryEvent[];
  getMessage: I18nGetMessage;
  githubNewIssueUrl?: string;
}

export function buildFeedbackIssueUrl(params: BuildFeedbackIssueParams): string {
  const githubNewIssueUrl = params.githubNewIssueUrl || DEFAULT_FEEDBACK_GITHUB_NEW_ISSUE_URL;
  const settingsJson = JSON.stringify(params.settingsSnapshot, null, 2);
  const growthStatsJson = JSON.stringify(params.growthStatsSnapshot ?? {}, null, 2) || '{}';

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
