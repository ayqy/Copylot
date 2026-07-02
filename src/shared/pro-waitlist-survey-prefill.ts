const PREFILL_CAPABILITY_KEYS = [
  'advanced_cleaning',
  'batch_collection',
  'prompt_pack',
  'note_export'
] as const;

export type ProWaitlistSurveyCapabilityKey = (typeof PREFILL_CAPABILITY_KEYS)[number];

export interface ProWaitlistSurveyPrefillState {
  useCase: string;
  capabilities: ProWaitlistSurveyCapabilityKey[];
}

export const PRO_WAITLIST_SURVEY_PREFILL_QUERY_PARAM = 'pro_survey_prefill';

export const DEFAULT_PRO_WAITLIST_SURVEY_PREFILL_STATE: ProWaitlistSurveyPrefillState = Object.freeze({
  useCase: '',
  capabilities: []
});

export function normalizeProWaitlistSurveyPrefillState(
  input: Partial<ProWaitlistSurveyPrefillState> | null | undefined
): ProWaitlistSurveyPrefillState {
  const useCase = typeof input?.useCase === 'string' ? input.useCase.trim().slice(0, 120) : '';
  const capabilities = Array.isArray(input?.capabilities)
    ? Array.from(
        new Set(
          input.capabilities.filter((item): item is ProWaitlistSurveyCapabilityKey =>
            PREFILL_CAPABILITY_KEYS.includes(item as ProWaitlistSurveyCapabilityKey)
          )
        )
      )
    : [];

  return {
    useCase,
    capabilities
  };
}

export function encodeProWaitlistSurveyPrefill(
  input: Partial<ProWaitlistSurveyPrefillState> | null | undefined
): string | null {
  const normalized = normalizeProWaitlistSurveyPrefillState(input);
  if (!normalized.useCase && normalized.capabilities.length === 0) {
    return null;
  }

  const payload = {
    u: normalized.useCase,
    c: normalized.capabilities.join(',')
  };

  const compact = JSON.stringify(payload);
  return encodeURIComponent(compact);
}

export function decodeProWaitlistSurveyPrefill(
  raw: string | null | undefined
): ProWaitlistSurveyPrefillState {
  if (!raw) {
    return { ...DEFAULT_PRO_WAITLIST_SURVEY_PREFILL_STATE };
  }

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as { u?: unknown; c?: unknown };
    const useCase = typeof parsed.u === 'string' ? parsed.u : '';
    const capabilities =
      typeof parsed.c === 'string' && parsed.c.trim()
        ? parsed.c
            .split(',')
            .map((item) => item.trim())
            .filter((item): item is ProWaitlistSurveyCapabilityKey =>
              PREFILL_CAPABILITY_KEYS.includes(item as ProWaitlistSurveyCapabilityKey)
            )
        : [];
    return normalizeProWaitlistSurveyPrefillState({ useCase, capabilities });
  } catch {
    return { ...DEFAULT_PRO_WAITLIST_SURVEY_PREFILL_STATE };
  }
}

export interface ParseProWaitlistSurveyPrefillFromUrlResult {
  prefill: ProWaitlistSurveyPrefillState;
  hadPrefillParam: boolean;
  cleanedUrl: string;
}

export function parseProWaitlistSurveyPrefillFromUrl(
  url: string
): ParseProWaitlistSurveyPrefillFromUrlResult {
  const parsed = new URL(url);
  const hadPrefillParam = parsed.searchParams.has(PRO_WAITLIST_SURVEY_PREFILL_QUERY_PARAM);
  const rawPrefill = parsed.searchParams.get(PRO_WAITLIST_SURVEY_PREFILL_QUERY_PARAM);
  const prefill = decodeProWaitlistSurveyPrefill(rawPrefill);

  if (hadPrefillParam) {
    parsed.searchParams.delete(PRO_WAITLIST_SURVEY_PREFILL_QUERY_PARAM);
  }

  return {
    prefill,
    hadPrefillParam,
    cleanedUrl: parsed.toString()
  };
}
