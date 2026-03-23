export const PRO_WAITLIST_SURVEY_SOURCE_QUERY_PARAM = 'pro_survey_source';

export type ProWaitlistSurveySource = 'popup' | 'options';
export type ProWaitlistSurveySourceOnce = 'popup';

export interface ParseProWaitlistSurveySourceOnceFromUrlResult {
  onceSource: ProWaitlistSurveySourceOnce | null;
  cleanedUrl: string;
  hadSourceParam: boolean;
}

export function parseProWaitlistSurveySourceOnceFromUrl(
  url: string
): ParseProWaitlistSurveySourceOnceFromUrlResult {
  const parsed = new URL(url);
  const hadSourceParam = parsed.searchParams.has(PRO_WAITLIST_SURVEY_SOURCE_QUERY_PARAM);
  const raw = parsed.searchParams.get(PRO_WAITLIST_SURVEY_SOURCE_QUERY_PARAM);

  const onceSource: ProWaitlistSurveySourceOnce | null = raw === 'popup' ? 'popup' : null;

  if (hadSourceParam) {
    parsed.searchParams.delete(PRO_WAITLIST_SURVEY_SOURCE_QUERY_PARAM);
  }

  return { onceSource, cleanedUrl: parsed.toString(), hadSourceParam };
}

export interface ConsumeProWaitlistSurveySourceOnceResult {
  source: ProWaitlistSurveySource;
  nextOnceSource: null;
}

export function consumeProWaitlistSurveySourceOnce(onceSource: unknown): ConsumeProWaitlistSurveySourceOnceResult {
  if (onceSource === 'popup') return { source: 'popup', nextOnceSource: null };
  return { source: 'options', nextOnceSource: null };
}

