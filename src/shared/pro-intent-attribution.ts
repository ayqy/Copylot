import { sanitizeCampaign } from './campaign.ts';

export type ProIntentSource = 'popup' | 'options';

export type ProIntentContent =
  | 'popup_upgrade_cta'
  | 'popup_waitlist_cta'
  | 'popup_survey_cta'
  | 'options_waitlist_cta'
  | 'options_survey_cta'
  | 'options_survey_copy_open';

export interface ProIntentAttributionInput {
  source: ProIntentSource;
  content: ProIntentContent;
  campaign?: unknown;
}

export interface ProIntentAttribution {
  source: ProIntentSource;
  medium: ProIntentSource;
  content: ProIntentContent;
  campaign?: string;
}

export function buildProIntentAttribution(input: ProIntentAttributionInput): ProIntentAttribution {
  const campaign = sanitizeCampaign(input.campaign) || undefined;
  return {
    source: input.source,
    medium: input.source,
    content: input.content,
    ...(campaign ? { campaign } : {})
  };
}
