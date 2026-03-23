import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvents,
  trimTelemetryEvents,
  type TelemetryEvent
} from './telemetry.ts';

export type ProWaitlistSurveyPayWilling = 'yes' | 'maybe' | 'no' | 'unknown';
export type ProWaitlistSurveyPayMonthly = 'lt_5' | '5_10' | '10_20' | '20_50' | '50_plus' | 'unknown';
export type ProWaitlistSurveyPayAnnual = 'lt_50' | '50_100' | '100_200' | '200_500' | '500_plus' | 'unknown';

export interface BuildProWaitlistSurveyIntentDistributionParams {
  telemetryEvents: unknown;
  enabled: boolean;
  now: number;
  extensionVersion: string;
  lookbackDays?: number;
  maxEvents?: number;
}

export interface ProWaitlistSurveyIntentDistribution {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';

  exportedAt: number;
  extensionVersion: string;

  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  maxEvents: number;

  definitions: Record<string, string>;

  survey_intent: number;

  pay_willing_yes: number;
  pay_willing_maybe: number;
  pay_willing_no: number;
  pay_willing_unknown: number;

  price_monthly_lt_5: number;
  price_monthly_5_10: number;
  price_monthly_10_20: number;
  price_monthly_20_50: number;
  price_monthly_50_plus: number;
  price_monthly_unknown: number;

  price_annual_lt_50: number;
  price_annual_50_100: number;
  price_annual_100_200: number;
  price_annual_200_500: number;
  price_annual_500_plus: number;
  price_annual_unknown: number;

  capability_advanced_cleaning: number;
  capability_batch_collection: number;
  capability_prompt_pack: number;
  capability_note_export: number;
}

function clampLookbackDays(value: unknown): number {
  if (!Number.isFinite(value)) return 7;
  const num = Math.floor(value as number);
  if (num <= 0) return 7;
  if (num > 365) return 365;
  return num;
}

function clampNow(value: unknown): number {
  if (!Number.isFinite(value)) return Date.now();
  const num = value as number;
  if (num <= 0) return Date.now();
  return num;
}

function clampMaxEvents(value: unknown): number {
  if (!Number.isFinite(value)) return TELEMETRY_MAX_EVENTS;
  const num = Math.floor(value as number);
  if (num <= 0) return TELEMETRY_MAX_EVENTS;
  return num;
}

function isInWindow(ts: number, from: number, to: number): boolean {
  return Number.isFinite(ts) && ts >= from && ts <= to;
}

function asPayWilling(value: unknown): ProWaitlistSurveyPayWilling {
  if (value === 'yes' || value === 'maybe' || value === 'no' || value === 'unknown') return value;
  return 'unknown';
}

function asPayMonthly(value: unknown): ProWaitlistSurveyPayMonthly {
  if (
    value === 'lt_5' ||
    value === '5_10' ||
    value === '10_20' ||
    value === '20_50' ||
    value === '50_plus' ||
    value === 'unknown'
  ) {
    return value;
  }
  return 'unknown';
}

function asPayAnnual(value: unknown): ProWaitlistSurveyPayAnnual {
  if (
    value === 'lt_50' ||
    value === '50_100' ||
    value === '100_200' ||
    value === '200_500' ||
    value === '500_plus' ||
    value === 'unknown'
  ) {
    return value;
  }
  return 'unknown';
}

function createEmptyResult(
  params: BuildProWaitlistSurveyIntentDistributionParams,
  now: number,
  lookbackDays: number,
  maxEvents: number
): ProWaitlistSurveyIntentDistribution {
  const windowTo = now;
  const windowFrom = now - lookbackDays * 24 * 60 * 60 * 1000;

  return {
    enabled: Boolean(params.enabled),
    disabledReason: params.enabled ? undefined : 'anonymous_usage_data_disabled',

    exportedAt: now,
    extensionVersion: params.extensionVersion || '',

    windowFrom,
    windowTo,
    lookbackDays,
    maxEvents,

    definitions: {
      window: '仅统计 windowFrom..windowTo（毫秒时间戳，闭区间）内的事件；超出窗口不计入。',
      survey_intent: 'survey_intent = count(pro_waitlist_survey_copied)。',
      pay_willing: 'pay_willing_*：按 props.pay_willing 聚合计数（yes|maybe|no|unknown）。空/非法 -> unknown。',
      price_monthly:
        'price_monthly_*：按 props.pay_monthly 聚合计数（lt_5|5_10|10_20|20_50|50_plus|unknown）。空/非法 -> unknown。',
      price_annual:
        'price_annual_*：按 props.pay_annual 聚合计数（lt_50|50_100|100_200|200_500|500_plus|unknown）。空/非法 -> unknown。',
      capability:
        'capability_*：按 cap_* 为 true 聚合计数（可多选，总和允许 > survey_intent）。未勾选/缺失 -> 不计入该能力。'
    },

    survey_intent: 0,

    pay_willing_yes: 0,
    pay_willing_maybe: 0,
    pay_willing_no: 0,
    pay_willing_unknown: 0,

    price_monthly_lt_5: 0,
    price_monthly_5_10: 0,
    price_monthly_10_20: 0,
    price_monthly_20_50: 0,
    price_monthly_50_plus: 0,
    price_monthly_unknown: 0,

    price_annual_lt_50: 0,
    price_annual_50_100: 0,
    price_annual_100_200: 0,
    price_annual_200_500: 0,
    price_annual_500_plus: 0,
    price_annual_unknown: 0,

    capability_advanced_cleaning: 0,
    capability_batch_collection: 0,
    capability_prompt_pack: 0,
    capability_note_export: 0
  };
}

export function buildProWaitlistSurveyIntentDistribution(
  params: BuildProWaitlistSurveyIntentDistributionParams
): ProWaitlistSurveyIntentDistribution {
  const now = clampNow(params.now);
  const lookbackDays = clampLookbackDays(params.lookbackDays);
  const maxEvents = clampMaxEvents(params.maxEvents);

  const result = createEmptyResult(params, now, lookbackDays, maxEvents);

  if (!params.enabled) return result;

  const windowTo = result.windowTo;
  const windowFrom = result.windowFrom;

  const sanitized = sanitizeTelemetryEvents(params.telemetryEvents);
  const trimmed = trimTelemetryEvents(sanitized, maxEvents);

  const eventsInWindow: TelemetryEvent[] = [];
  for (const event of trimmed) {
    if (event.name !== 'pro_waitlist_survey_copied') continue;
    if (!isInWindow(event.ts, windowFrom, windowTo)) continue;
    eventsInWindow.push(event);
  }

  for (const event of eventsInWindow) {
    result.survey_intent += 1;

    const payWilling = asPayWilling(event.props?.pay_willing);
    if (payWilling === 'yes') result.pay_willing_yes += 1;
    else if (payWilling === 'maybe') result.pay_willing_maybe += 1;
    else if (payWilling === 'no') result.pay_willing_no += 1;
    else result.pay_willing_unknown += 1;

    const payMonthly = asPayMonthly(event.props?.pay_monthly);
    if (payMonthly === 'lt_5') result.price_monthly_lt_5 += 1;
    else if (payMonthly === '5_10') result.price_monthly_5_10 += 1;
    else if (payMonthly === '10_20') result.price_monthly_10_20 += 1;
    else if (payMonthly === '20_50') result.price_monthly_20_50 += 1;
    else if (payMonthly === '50_plus') result.price_monthly_50_plus += 1;
    else result.price_monthly_unknown += 1;

    const payAnnual = asPayAnnual(event.props?.pay_annual);
    if (payAnnual === 'lt_50') result.price_annual_lt_50 += 1;
    else if (payAnnual === '50_100') result.price_annual_50_100 += 1;
    else if (payAnnual === '100_200') result.price_annual_100_200 += 1;
    else if (payAnnual === '200_500') result.price_annual_200_500 += 1;
    else if (payAnnual === '500_plus') result.price_annual_500_plus += 1;
    else result.price_annual_unknown += 1;

    if (event.props?.cap_advanced_cleaning === true) result.capability_advanced_cleaning += 1;
    if (event.props?.cap_batch_collection === true) result.capability_batch_collection += 1;
    if (event.props?.cap_prompt_pack === true) result.capability_prompt_pack += 1;
    if (event.props?.cap_note_export === true) result.capability_note_export += 1;
  }

  return result;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatProWaitlistSurveyIntentDistribution7dJsonFilename(exportedAt: number): string {
  const d = new Date(exportedAt);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `copylot-pro-waitlist-survey-intent-distribution-7d-${yyyy}-${mm}-${dd}.json`;
}

