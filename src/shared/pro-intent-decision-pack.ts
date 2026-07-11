import type { ProWaitlistSurveyIntentDistribution } from './pro-waitlist-survey-intent-distribution.ts';

export const PRO_INTENT_DECISION_PACK_VERSION = 'v1-81' as const;
export const PRO_INTENT_DECISION_THRESHOLDS_VERSION = 'v1-81' as const;

export type ProIntentDecisionCode = 'A' | 'B' | 'C';

export type ProIntentDecisionThresholds = Readonly<{
  version: typeof PRO_INTENT_DECISION_THRESHOLDS_VERSION;
  sampleSizeMinSurveyIntent: number;
  highIntentRateMinForC: number;
  pricePeakRateMinForC: number;
}>;

export const DEFAULT_PRO_INTENT_DECISION_THRESHOLDS: ProIntentDecisionThresholds = Object.freeze({
  version: PRO_INTENT_DECISION_THRESHOLDS_VERSION,
  sampleSizeMinSurveyIntent: 30,
  highIntentRateMinForC: 0.6,
  pricePeakRateMinForC: 0.4
});

type ProWaitlistSurveyIntentDistributionInput = Readonly<Record<string, unknown>>;

export type SanitizedProWaitlistSurveyIntentDistribution = Readonly<{
  enabled: boolean;
  disabledReason?: string;
  exportedAt: number;
  extensionVersion: string;
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  maxEvents: number;
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
}>;

type BucketPeak = Readonly<{
  bucket: string;
  count: number;
  rate: number;
}>;

type CapabilityRank = Readonly<{
  capability: string;
  count: number;
  rate: number;
}>;

export type ProIntentDecisionPackSummary = Readonly<{
  packVersion: typeof PRO_INTENT_DECISION_PACK_VERSION;
  thresholds: ProIntentDecisionThresholds;
  input: Readonly<{
    distributionFile: string;
    distributionSha256: string;
    enabled: boolean;
    disabledReason: string | null;
    exportedAt: number;
    extensionVersion: string;
    windowFrom: number;
    windowTo: number;
    lookbackDays: number;
    maxEvents: number;
  }>;
  definitions: Readonly<Record<string, string>>;
  metrics: Readonly<{
    survey_intent: number;
    high_intent_count: number;
    high_intent_rate: number;
    pay_willing: Readonly<{
      yes: number;
      maybe: number;
      no: number;
      unknown: number;
    }>;
    price_monthly_peak: BucketPeak;
    price_annual_peak: BucketPeak;
    capability_top2: ReadonlyArray<CapabilityRank>;
  }>;
  decision: Readonly<{
    code: ProIntentDecisionCode;
    conclusion: string;
    reasons: ReadonlyArray<string>;
  }>;
}>;

export type I18nGetMessage = (key: string, substitutions?: string | string[]) => string;

export const PRO_INTENT_DECISION_SUMMARY_FILES = Object.freeze({
  summaryJson: `copylot-pro-intent-decision-summary-${PRO_INTENT_DECISION_PACK_VERSION}.json`,
  summaryMd: `copylot-pro-intent-decision-summary-${PRO_INTENT_DECISION_PACK_VERSION}.md`
});

function asNonNegInt(value: unknown): number {
  if (!Number.isFinite(value)) return 0;
  const n = Math.floor(value as number);
  if (n < 0) return 0;
  return n;
}

function asBool(value: unknown): boolean {
  return value === true;
}

function asString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value;
}

function round4(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10_000) / 10_000;
}

function clampRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function pickPeakBucket(surveyIntent: number, buckets: Array<{ bucket: string; count: number }>): BucketPeak {
  const sorted = buckets
    .map((bucket) => ({ bucket: bucket.bucket, count: asNonNegInt(bucket.count) }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.bucket.localeCompare(b.bucket);
    });
  const top = sorted[0] ?? { bucket: 'unknown', count: 0 };
  return {
    bucket: top.bucket,
    count: top.count,
    rate: round4(clampRate(top.count, surveyIntent))
  };
}

function pickTopCapabilities(
  surveyIntent: number,
  capabilities: Array<{ capability: string; count: number }>
): CapabilityRank[] {
  const sorted = capabilities
    .map((capability) => ({
      capability: capability.capability,
      count: asNonNegInt(capability.count)
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.capability.localeCompare(b.capability);
    });

  return sorted.slice(0, 2).map((capability) => ({
    capability: capability.capability,
    count: capability.count,
    rate: round4(clampRate(capability.count, surveyIntent))
  }));
}

function buildDecisionResult(params: {
  dist: SanitizedProWaitlistSurveyIntentDistribution;
  thresholds: ProIntentDecisionThresholds;
  highIntentRate: number;
  monthlyPeak: BucketPeak;
  annualPeak: BucketPeak;
  getMessage?: I18nGetMessage;
}): ProIntentDecisionPackSummary['decision'] {
  const { dist, thresholds, highIntentRate, monthlyPeak, annualPeak, getMessage } = params;

  if (!dist.enabled) {
    return {
      code: 'A',
      conclusion: safeGetMessage(getMessage, 'proIntentDecisionConclusionADataOff'),
      reasons: ['anonymous_usage_data_disabled']
    };
  }

  if (dist.survey_intent < thresholds.sampleSizeMinSurveyIntent) {
    return {
      code: 'A',
      conclusion: safeGetMessage(getMessage, 'proIntentDecisionConclusionASampleInsufficient'),
      reasons: ['survey_intent_insufficient']
    };
  }

  if (highIntentRate < thresholds.highIntentRateMinForC) {
    return {
      code: 'B',
      conclusion: safeGetMessage(
        getMessage,
        'proIntentDecisionConclusionBHighIntent' + 'Insufficient'
      ),
      reasons: ['high_intent_rate_insufficient']
    };
  }

  const bestPeak = monthlyPeak.rate >= annualPeak.rate ? monthlyPeak : annualPeak;
  const hasNonUnknownPeak = monthlyPeak.bucket !== 'unknown' || annualPeak.bucket !== 'unknown';
  if (!hasNonUnknownPeak || bestPeak.rate < thresholds.pricePeakRateMinForC) {
    return {
      code: 'B',
      conclusion: safeGetMessage(getMessage, 'proIntentDecisionConclusionBPriceInsufficient'),
      reasons: ['price_concentration_insufficient']
    };
  }

  return {
    code: 'C',
    conclusion: safeGetMessage(getMessage, 'proIntentDecisionConclusionCGo'),
    reasons: ['go_for_subscription_mvp']
  };
}

function safeGetMessage(getMessage: I18nGetMessage | undefined, key: string, substitutions?: string | string[]) {
  if (typeof getMessage !== 'function') {
    return key;
  }
  return getMessage(key, substitutions) || key;
}

export function sanitizeProWaitlistSurveyIntentDistribution(
  raw: unknown
): SanitizedProWaitlistSurveyIntentDistribution {
  const obj = (raw && typeof raw === 'object' ? (raw as ProWaitlistSurveyIntentDistributionInput) : {}) as ProWaitlistSurveyIntentDistributionInput;

  return {
    enabled: asBool(obj.enabled),
    disabledReason: typeof obj.disabledReason === 'string' ? obj.disabledReason : undefined,
    exportedAt: asNonNegInt(obj.exportedAt),
    extensionVersion: asString(obj.extensionVersion),
    windowFrom: asNonNegInt(obj.windowFrom),
    windowTo: asNonNegInt(obj.windowTo),
    lookbackDays: asNonNegInt(obj.lookbackDays) || 7,
    maxEvents: asNonNegInt(obj.maxEvents) || 0,
    survey_intent: asNonNegInt(obj.survey_intent),
    pay_willing_yes: asNonNegInt(obj.pay_willing_yes),
    pay_willing_maybe: asNonNegInt(obj.pay_willing_maybe),
    pay_willing_no: asNonNegInt(obj.pay_willing_no),
    pay_willing_unknown: asNonNegInt(obj.pay_willing_unknown),
    price_monthly_lt_5: asNonNegInt(obj.price_monthly_lt_5),
    price_monthly_5_10: asNonNegInt(obj.price_monthly_5_10),
    price_monthly_10_20: asNonNegInt(obj.price_monthly_10_20),
    price_monthly_20_50: asNonNegInt(obj.price_monthly_20_50),
    price_monthly_50_plus: asNonNegInt(obj.price_monthly_50_plus),
    price_monthly_unknown: asNonNegInt(obj.price_monthly_unknown),
    price_annual_lt_50: asNonNegInt(obj.price_annual_lt_50),
    price_annual_50_100: asNonNegInt(obj.price_annual_50_100),
    price_annual_100_200: asNonNegInt(obj.price_annual_100_200),
    price_annual_200_500: asNonNegInt(obj.price_annual_200_500),
    price_annual_500_plus: asNonNegInt(obj.price_annual_500_plus),
    price_annual_unknown: asNonNegInt(obj.price_annual_unknown),
    capability_advanced_cleaning: asNonNegInt(obj.capability_advanced_cleaning),
    capability_batch_collection: asNonNegInt(obj.capability_batch_collection),
    capability_prompt_pack: asNonNegInt(obj.capability_prompt_pack),
    capability_note_export: asNonNegInt(obj.capability_note_export)
  };
}

export function buildProIntentDecisionPackSummary(options: {
  rawDistribution: unknown;
  distributionFile: string;
  distributionSha256: string;
  thresholds?: ProIntentDecisionThresholds;
  getMessage?: I18nGetMessage;
}): ProIntentDecisionPackSummary {
  const dist = sanitizeProWaitlistSurveyIntentDistribution(options.rawDistribution);
  const thresholds = options.thresholds ?? DEFAULT_PRO_INTENT_DECISION_THRESHOLDS;

  const surveyIntent = dist.survey_intent;
  const highIntentCount = dist.pay_willing_yes + dist.pay_willing_maybe;
  const highIntentRate = round4(clampRate(highIntentCount, surveyIntent));

  const monthlyPeak = pickPeakBucket(surveyIntent, [
    { bucket: 'lt_5', count: dist.price_monthly_lt_5 },
    { bucket: '5_10', count: dist.price_monthly_5_10 },
    { bucket: '10_20', count: dist.price_monthly_10_20 },
    { bucket: '20_50', count: dist.price_monthly_20_50 },
    { bucket: '50_plus', count: dist.price_monthly_50_plus },
    { bucket: 'unknown', count: dist.price_monthly_unknown }
  ]);

  const annualPeak = pickPeakBucket(surveyIntent, [
    { bucket: 'lt_50', count: dist.price_annual_lt_50 },
    { bucket: '50_100', count: dist.price_annual_50_100 },
    { bucket: '100_200', count: dist.price_annual_100_200 },
    { bucket: '200_500', count: dist.price_annual_200_500 },
    { bucket: '500_plus', count: dist.price_annual_500_plus },
    { bucket: 'unknown', count: dist.price_annual_unknown }
  ]);

  const capabilityTop2 = pickTopCapabilities(surveyIntent, [
    { capability: 'advanced_cleaning', count: dist.capability_advanced_cleaning },
    { capability: 'batch_collection', count: dist.capability_batch_collection },
    { capability: 'prompt_pack', count: dist.capability_prompt_pack },
    { capability: 'note_export', count: dist.capability_note_export }
  ]);

  const decision = buildDecisionResult({
    dist,
    thresholds,
    highIntentRate,
    monthlyPeak,
    annualPeak,
    getMessage: options.getMessage
  });

  return {
    packVersion: PRO_INTENT_DECISION_PACK_VERSION,
    thresholds,
    input: {
      distributionFile: options.distributionFile,
      distributionSha256: options.distributionSha256,
      enabled: dist.enabled,
      disabledReason: dist.disabledReason ?? null,
      exportedAt: dist.exportedAt,
      extensionVersion: dist.extensionVersion,
      windowFrom: dist.windowFrom,
      windowTo: dist.windowTo,
      lookbackDays: dist.lookbackDays,
      maxEvents: dist.maxEvents
    },
    definitions: {
      survey_intent: 'survey_intent = count(pro_waitlist_survey_copied)。',
      high_intent_rate:
        'high_intent_rate = (pay_willing_yes + pay_willing_maybe) / survey_intent。用于判断“高意向占比”。',
      price_peak:
        'price_*_peak：找出 price_monthly_* / price_annual_* 的主峰 bucket（含 unknown）与占比（count / survey_intent）。',
      capability_top2:
        'capability_top2：按 capability_* 计数降序取 Top2，并给出各自覆盖率（count / survey_intent）。'
    },
    metrics: {
      survey_intent: surveyIntent,
      high_intent_count: highIntentCount,
      high_intent_rate: highIntentRate,
      pay_willing: {
        yes: dist.pay_willing_yes,
        maybe: dist.pay_willing_maybe,
        no: dist.pay_willing_no,
        unknown: dist.pay_willing_unknown
      },
      price_monthly_peak: monthlyPeak,
      price_annual_peak: annualPeak,
      capability_top2: capabilityTop2
    },
    decision
  };
}

export function buildProIntentDecisionPackFromDistribution(params: {
  distribution: ProWaitlistSurveyIntentDistribution;
  distributionFile?: string;
  distributionSha256?: string;
  thresholds?: ProIntentDecisionThresholds;
  getMessage?: I18nGetMessage;
}): ProIntentDecisionPackSummary {
  return buildProIntentDecisionPackSummary({
    rawDistribution: params.distribution,
    distributionFile: params.distributionFile ?? 'local://options/pro-waitlist-survey-intent-distribution-7d.json',
    distributionSha256: params.distributionSha256 ?? 'not_applicable_browser_export',
    thresholds: params.thresholds,
    getMessage: params.getMessage
  });
}

export function formatProIntentDecisionPackMarkdown(
  summary: ProIntentDecisionPackSummary,
  getMessage?: I18nGetMessage
): string {
  const lines: string[] = [];
  lines.push(`# ${safeGetMessage(getMessage, 'proIntentDecisionMdTitle')}`);
  lines.push('');
  lines.push(`## ${safeGetMessage(getMessage, 'proIntentDecisionMdSectionInput')}`);
  lines.push(`- 分布文件：\`${summary.input.distributionFile}\``);
  lines.push(`- sha256：\`${summary.input.distributionSha256}\``);
  lines.push(`- enabled：\`${summary.input.enabled}\``);
  if (!summary.input.enabled) {
    lines.push(`- disabledReason：\`${summary.input.disabledReason}\``);
  }
  lines.push(`- lookbackDays：\`${summary.input.lookbackDays}\``);
  lines.push(`- windowFrom..windowTo：\`${summary.input.windowFrom}..${summary.input.windowTo}\``);
  lines.push('');
  lines.push(`## ${safeGetMessage(getMessage, 'proIntentDecisionMdSectionMetrics')}`);
  lines.push(`- survey_intent：\`${summary.metrics.survey_intent}\``);
  lines.push(`- high_intent_rate：\`${summary.metrics.high_intent_rate}\``);
  lines.push(
    `- pay_willing：yes=\`${summary.metrics.pay_willing.yes}\` maybe=\`${summary.metrics.pay_willing.maybe}\` no=\`${summary.metrics.pay_willing.no}\` unknown=\`${summary.metrics.pay_willing.unknown}\``
  );
  lines.push(
    `- price_monthly_peak：bucket=\`${summary.metrics.price_monthly_peak.bucket}\` rate=\`${summary.metrics.price_monthly_peak.rate}\``
  );
  lines.push(
    `- price_annual_peak：bucket=\`${summary.metrics.price_annual_peak.bucket}\` rate=\`${summary.metrics.price_annual_peak.rate}\``
  );
  if (summary.metrics.capability_top2.length > 0) {
    const capabilityText = summary.metrics.capability_top2
      .map((capability) => `${capability.capability}=${capability.count}(${capability.rate})`)
      .join(' ');
    lines.push(`- capability_top2：${capabilityText}`);
  }
  lines.push('');
  lines.push(`## ${safeGetMessage(getMessage, 'proIntentDecisionMdSectionDecision')}`);
  lines.push(`- code：\`${summary.decision.code}\``);
  lines.push(`- 结论：${summary.decision.conclusion}`);
  lines.push(`- reasons：${summary.decision.reasons.map((reason) => `\`${reason}\``).join(' ')}`);
  lines.push('');
  return lines.join('\n');
}
