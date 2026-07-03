import { sanitizeCampaign } from './campaign.ts';
import type { I18nGetMessage } from './monetization.ts';

export interface ProWaitlistDistributionState {
  enabled: boolean;
  campaign: string | null;
}

export function computeProWaitlistDistributionState(rawCampaign: unknown): ProWaitlistDistributionState {
  const campaign = sanitizeCampaign(rawCampaign);
  return { enabled: Boolean(campaign), campaign };
}

function safeGetMessage(getMessage: I18nGetMessage, key: string, substitutions?: string | string[]): string {
  const message = getMessage(key, substitutions);
  return message || '';
}

export interface BuildProWaitlistRecruitCopyParams {
  getMessage: I18nGetMessage;
  waitlistUrl: string;
  storeUrl: string;
  privacyUrl: string;
  campaign: string;
}

export function buildProWaitlistRecruitCopyText(params: BuildProWaitlistRecruitCopyParams): string {
  const text = safeGetMessage(params.getMessage, 'proWaitlistRecruitCopyTemplate', [
    params.waitlistUrl,
    params.campaign,
    params.storeUrl,
    params.privacyUrl
  ]);

  if (text) return text;

  return [params.storeUrl, params.privacyUrl, params.waitlistUrl, params.campaign].join('\n');
}

export interface BuildProDistributionPackMarkdownParams {
  getMessage: I18nGetMessage;
  campaign: string;
  officialSiteUrl: string;
  storeUrl: string;
  privacyUrl: string;
  waitlistUrl: string;
  recruitCopy: string;
}

/**
 * 渠道分发工具包：完整投放包（Markdown）。
 * - 固定模板 + campaign + 官网/商店/Pro 路线链接 + 分享文案
 * - 不拼入网页内容/复制内容/URL/标题
 */
export function buildProDistributionPackMarkdown(params: BuildProDistributionPackMarkdownParams): string {
  const text = safeGetMessage(params.getMessage, 'proDistributionPackTemplate', [
    params.campaign,
    params.officialSiteUrl,
    params.storeUrl,
    params.privacyUrl,
    params.waitlistUrl,
    params.recruitCopy.trimEnd()
  ]);

  if (text) return text;

  // Fallback (should not happen when i18n keys are present).
  return (
    `${params.officialSiteUrl}\n` +
    `${params.storeUrl}\n` +
    `${params.privacyUrl}\n` +
    `${params.waitlistUrl}\n` +
    `${params.recruitCopy.trimEnd()}\n`
  );
}
