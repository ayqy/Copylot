import type { Settings } from './settings-manager';

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
  interactionMode: Settings['interactionMode'];
  outputFormat: Settings['outputFormat'];
  tableOutputFormat: Settings['tableOutputFormat'];
  attachTitle: boolean;
  attachURL: boolean;
}

export function buildFeedbackSettingsSnapshot(settings: Settings): FeedbackSettingsSnapshot {
  return {
    isMagicCopyEnabled: settings.isMagicCopyEnabled,
    isHoverMagicCopyEnabled: settings.isHoverMagicCopyEnabled,
    isClipboardAccumulatorEnabled: settings.isClipboardAccumulatorEnabled,
    interactionMode: settings.interactionMode,
    outputFormat: settings.outputFormat,
    tableOutputFormat: settings.tableOutputFormat,
    attachTitle: settings.attachTitle,
    attachURL: settings.attachURL
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

export interface BuildFeedbackIssueParams {
  env: FeedbackEnvironmentInfo;
  settingsSnapshot: FeedbackSettingsSnapshot;
  getMessage: I18nGetMessage;
  githubNewIssueUrl?: string;
}

export function buildFeedbackIssueUrl(params: BuildFeedbackIssueParams): string {
  const githubNewIssueUrl = params.githubNewIssueUrl || DEFAULT_FEEDBACK_GITHUB_NEW_ISSUE_URL;
  const settingsJson = JSON.stringify(params.settingsSnapshot, null, 2);

  const title = safeGetMessage(params.getMessage, 'feedbackIssueTitleTemplate');
  const body = safeGetMessage(params.getMessage, 'feedbackIssueBodyTemplate', [
    params.env.extensionVersion,
    params.env.extensionId,
    params.env.userAgent,
    params.env.navigatorLanguage,
    params.env.uiLanguage,
    settingsJson
  ]);

  const url = new URL(githubNewIssueUrl);
  url.search = new URLSearchParams({ title, body }).toString();
  return url.toString();
}

export function buildShareCopyText(getMessage: I18nGetMessage, storeUrl: string): string {
  return safeGetMessage(getMessage, 'shareCopyTextTemplate', [storeUrl]);
}

