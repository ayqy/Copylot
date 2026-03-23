import { formatCampaignLineForTemplate } from './campaign.ts';

export type I18nGetMessage = (key: string, substitutions?: string | string[]) => string;

export interface ProWaitlistEnvironmentInfo {
  extensionVersion: string;
  extensionId: string;
  navigatorLanguage: string;
  uiLanguage: string;
}

export const DEFAULT_PRO_WAITLIST_GITHUB_NEW_ISSUE_URL = 'https://github.com/ayqy/copy/issues/new';

function safeGetMessage(getMessage: I18nGetMessage, key: string, substitutions?: string | string[]) {
  const message = getMessage(key, substitutions);
  return message || key;
}

export interface BuildProWaitlistIssueParams {
  env: ProWaitlistEnvironmentInfo;
  getMessage: I18nGetMessage;
  githubNewIssueUrl?: string;
  campaign?: unknown;
}

export interface BuildProWaitlistCopyTextParams {
  env: ProWaitlistEnvironmentInfo;
  getMessage: I18nGetMessage;
  campaign?: unknown;
}

/**
 * 低摩擦留资备选：复制候补文案（不依赖联网/账号）。
 * 注意：该文案来自 i18n 模板，与“打开官网候补落地页”并行存在。
 */
export function buildProWaitlistCopyText(params: BuildProWaitlistCopyTextParams): string {
  const campaignLine = formatCampaignLineForTemplate(params.campaign);
  return safeGetMessage(params.getMessage, 'proWaitlistIssueBodyTemplate', [
    params.env.extensionVersion,
    params.env.extensionId,
    params.env.navigatorLanguage,
    params.env.uiLanguage,
    campaignLine
  ]);
}

export function buildProWaitlistIssueUrl(params: BuildProWaitlistIssueParams): string {
  const githubNewIssueUrl = params.githubNewIssueUrl || DEFAULT_PRO_WAITLIST_GITHUB_NEW_ISSUE_URL;

  const title = safeGetMessage(params.getMessage, 'proWaitlistIssueTitleTemplate');
  const campaignLine = formatCampaignLineForTemplate(params.campaign);
  const body = safeGetMessage(params.getMessage, 'proWaitlistIssueBodyTemplate', [
    params.env.extensionVersion,
    params.env.extensionId,
    params.env.navigatorLanguage,
    params.env.uiLanguage,
    campaignLine
  ]);

  const url = new URL(githubNewIssueUrl);
  url.search = new URLSearchParams({ title, body }).toString();
  return url.toString();
}
