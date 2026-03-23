import { buildProFunnelSummary, type ProFunnelSummary } from './pro-funnel.ts';
import { buildProIntentEventsCsv } from './pro-intent-events-csv.ts';
import {
  buildProIntentWeeklyDigestSummary,
  formatProIntentWeeklyDigestMarkdown,
  type I18nGetMessage,
  type ProIntentWeeklyDigestEnvInfo
} from './pro-intent-weekly-digest.ts';
import {
  buildProWaitlistSurveyIntentDistribution,
  type ProWaitlistSurveyIntentDistribution
} from './pro-waitlist-survey-intent-distribution.ts';

export const PRO_INTENT_RUN_EVIDENCE_PACK_VERSION = 'v1-90' as const;

export type ProIntentRunEvidencePackDisabledReason = 'anonymous_usage_data_disabled';

export interface ProIntentRunEvidencePackEnv {
  exportedAt: number;
  extensionVersion: string;
  isAnonymousUsageDataEnabled: boolean;
}

export interface ProIntentRunEvidencePack {
  packVersion: typeof PRO_INTENT_RUN_EVIDENCE_PACK_VERSION;
  enabled: boolean;
  disabledReason: ProIntentRunEvidencePackDisabledReason | null;

  env: ProIntentRunEvidencePackEnv;

  proFunnelSummary: ProFunnelSummary;
  proWaitlistSurveyIntentDistribution: ProWaitlistSurveyIntentDistribution;
  proIntentEvents7dCsv: string;
  proIntentWeeklyDigestMarkdown: string;
}

export interface BuildProIntentRunEvidencePackParams {
  enabled: boolean;
  telemetryEvents: unknown;
  now: number;
  extensionVersion: string;
  lookbackDays?: number;
  maxEvents?: number;
  getMessage: I18nGetMessage;
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function formatProIntentRunEvidencePackJsonFilename(
  exportedAt: number,
  isAnonymousUsageDataEnabled: boolean
): string {
  const d = new Date(exportedAt);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const suffix = isAnonymousUsageDataEnabled ? 'on' : 'off';
  return `copylot-pro-intent-run-evidence-pack-${PRO_INTENT_RUN_EVIDENCE_PACK_VERSION}-${yyyy}-${mm}-${dd}.${suffix}.json`;
}

export function buildProIntentRunEvidencePack(params: BuildProIntentRunEvidencePackParams): ProIntentRunEvidencePack {
  const enabled = Boolean(params.enabled);
  const now = Number.isFinite(params.now) ? (params.now as number) : Date.now();
  const extensionVersion = params.extensionVersion || '';

  const env: ProIntentRunEvidencePackEnv = {
    exportedAt: now,
    extensionVersion,
    isAnonymousUsageDataEnabled: enabled
  };

  const lookbackDays = Number.isFinite(params.lookbackDays) ? (params.lookbackDays as number) : 7;

  const proFunnelSummary = buildProFunnelSummary({
    enabled,
    telemetryEvents: params.telemetryEvents,
    maxEvents: params.maxEvents
  });

  const proWaitlistSurveyIntentDistribution = buildProWaitlistSurveyIntentDistribution({
    enabled,
    telemetryEvents: params.telemetryEvents,
    now,
    extensionVersion,
    lookbackDays,
    maxEvents: params.maxEvents
  });

  const proIntentEvents7dCsv = enabled
    ? buildProIntentEventsCsv({
      enabled: true,
      telemetryEvents: params.telemetryEvents,
      now,
      extensionVersion,
      lookbackDays,
      maxEvents: params.maxEvents
    }).csv
    : '';

  const proIntentWeeklyDigestSummary = buildProIntentWeeklyDigestSummary({
    enabled,
    telemetryEvents: params.telemetryEvents,
    now,
    lookbackDays,
    maxEvents: params.maxEvents
  });

  const weeklyDigestEnv: ProIntentWeeklyDigestEnvInfo = {
    extensionVersion,
    exportedAt: now,
    isAnonymousUsageDataEnabled: enabled
  };

  const proIntentWeeklyDigestMarkdown = formatProIntentWeeklyDigestMarkdown({
    summary: proIntentWeeklyDigestSummary,
    env: weeklyDigestEnv,
    getMessage: params.getMessage
  });

  return {
    packVersion: PRO_INTENT_RUN_EVIDENCE_PACK_VERSION,
    enabled,
    disabledReason: enabled ? null : 'anonymous_usage_data_disabled',
    env,
    proFunnelSummary,
    proWaitlistSurveyIntentDistribution,
    proIntentEvents7dCsv,
    proIntentWeeklyDigestMarkdown
  };
}

export function formatProIntentRunEvidencePackAsJson(pack: ProIntentRunEvidencePack): string {
  const stable: ProIntentRunEvidencePack = {
    packVersion: PRO_INTENT_RUN_EVIDENCE_PACK_VERSION,
    enabled: Boolean(pack.enabled),
    disabledReason: pack.disabledReason ?? null,
    env: {
      exportedAt: Number.isFinite(pack.env?.exportedAt) ? (pack.env.exportedAt as number) : 0,
      extensionVersion: pack.env?.extensionVersion || '',
      isAnonymousUsageDataEnabled: Boolean(pack.env?.isAnonymousUsageDataEnabled)
    },
    proFunnelSummary: pack.proFunnelSummary as ProFunnelSummary,
    proWaitlistSurveyIntentDistribution: pack.proWaitlistSurveyIntentDistribution as ProWaitlistSurveyIntentDistribution,
    proIntentEvents7dCsv: typeof pack.proIntentEvents7dCsv === 'string' ? pack.proIntentEvents7dCsv : '',
    proIntentWeeklyDigestMarkdown:
      typeof pack.proIntentWeeklyDigestMarkdown === 'string' ? pack.proIntentWeeklyDigestMarkdown : ''
  };

  return `${JSON.stringify(stable, null, 2)}\n`;
}

