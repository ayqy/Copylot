import { sanitizeCampaign } from './campaign.ts';
import {
  buildProWaitlistIssueUrl,
  type I18nGetMessage,
  type ProWaitlistEnvironmentInfo
} from './monetization.ts';

export interface ProWaitlistDistributionState {
  enabled: boolean;
  campaign: string | null;
}

export function computeProWaitlistDistributionState(rawCampaign: unknown): ProWaitlistDistributionState {
  const campaign = sanitizeCampaign(rawCampaign);
  return { enabled: Boolean(campaign), campaign };
}

export interface BuildProWaitlistDistributionIssueUrlParams {
  env: ProWaitlistEnvironmentInfo;
  getMessage: I18nGetMessage;
  campaign: string;
  githubNewIssueUrl?: string;
}

/**
 * 分发工具包专用：强制确保 issue body 中包含 "campaign: <value>" 行（可解码复核）。
 */
export function buildProWaitlistDistributionIssueUrl(params: BuildProWaitlistDistributionIssueUrlParams): string {
  const url = buildProWaitlistIssueUrl({
    env: params.env,
    getMessage: params.getMessage,
    githubNewIssueUrl: params.githubNewIssueUrl,
    campaign: params.campaign
  });

  try {
    const parsed = new URL(url);
    const body = parsed.searchParams.get('body') || '';
    if (!body.includes(`campaign: ${params.campaign}`)) {
      parsed.searchParams.set('body', `${body}\n- campaign: ${params.campaign}\n`);
      return parsed.toString();
    }
    return parsed.toString();
  } catch (_error) {
    return url;
  }
}

function safeGetMessage(getMessage: I18nGetMessage, key: string, substitutions?: string | string[]): string {
  const message = getMessage(key, substitutions);
  return message || '';
}

export interface BuildProWaitlistRecruitCopyParams {
  getMessage: I18nGetMessage;
  waitlistUrl: string;
  campaign: string;
}

export function buildProWaitlistRecruitCopyText(params: BuildProWaitlistRecruitCopyParams): string {
  const text = safeGetMessage(params.getMessage, 'proWaitlistRecruitCopyTemplate', [
    params.waitlistUrl,
    params.campaign
  ]);

  if (text) return text;

  return `Copylot Pro waitlist:\n${params.waitlistUrl}\n\ncampaign: ${params.campaign}\n`;
}

export const PRO_DISTRIBUTION_TOOLKIT_UTM_SOURCE = 'copylot-ext';
export const PRO_DISTRIBUTION_TOOLKIT_UTM_MEDIUM = 'distribution_toolkit';

export interface BuildProStoreUrlParams {
  extensionId: string;
  campaign: string;
}

/**
 * 渠道分发工具包：商店安装链接（可解码复核，带 UTM + campaign）
 */
export function buildProStoreUrl(params: BuildProStoreUrlParams): string {
  const base = `https://chrome.google.com/webstore/detail/${params.extensionId}`;
  const url = new URL(base);
  url.search = new URLSearchParams({
    utm_source: PRO_DISTRIBUTION_TOOLKIT_UTM_SOURCE,
    utm_medium: PRO_DISTRIBUTION_TOOLKIT_UTM_MEDIUM,
    utm_campaign: params.campaign
  }).toString();
  return url.toString();
}

export interface BuildProDistributionPackMarkdownParams {
  getMessage: I18nGetMessage;
  campaign: string;
  storeUrl: string;
  waitlistUrl: string;
  recruitCopy: string;
}

/**
 * 渠道分发工具包：完整投放包（Markdown）。
 * - 固定模板 + campaign + 商店/候补链接 + 招募文案 + 可选问卷引导
 * - 不拼入网页内容/复制内容/URL/标题
 */
export function buildProDistributionPackMarkdown(params: BuildProDistributionPackMarkdownParams): string {
  const text = safeGetMessage(params.getMessage, 'proDistributionPackTemplate', [
    params.campaign,
    params.storeUrl,
    params.waitlistUrl,
    params.recruitCopy.trimEnd()
  ]);

  if (text) return text;

  // Fallback (should not happen when i18n keys are present).
  return `${params.storeUrl}\n${params.waitlistUrl}\n${params.recruitCopy.trimEnd()}\n`;
}
