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

