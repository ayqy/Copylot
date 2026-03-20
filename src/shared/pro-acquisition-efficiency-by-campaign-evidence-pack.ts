import { buildProAcquisitionEfficiencyByCampaignCsv } from './pro-acquisition-efficiency-by-campaign-csv.ts';
import {
  buildProAcquisitionEfficiencyByCampaignWeeklyReportSummary,
  formatProAcquisitionEfficiencyByCampaignWeeklyReportMarkdown,
  type I18nGetMessage,
  type ProAcquisitionEfficiencyByCampaignWeeklyReportEnvInfo
} from './pro-acquisition-efficiency-by-campaign-weekly-report.ts';

export interface ProAcquisitionEfficiencyByCampaignEvidencePackEnv {
  extensionVersion: string;
  exportedAt: number;
  lookbackDays: number;
  windowFrom: number;
  windowTo: number;
  isAnonymousUsageDataEnabled: boolean;
}

export interface ProAcquisitionEfficiencyByCampaignEvidencePackRow {
  campaign: string;
  leads: number;
  distCopies: number;
  leadsPerDistCopy: string;
}

export interface ProAcquisitionEfficiencyByCampaignEvidencePack {
  enabled: boolean;
  disabledReason: 'anonymous_usage_data_disabled' | null;
  telemetryOffNotice: string | null;
  env: ProAcquisitionEfficiencyByCampaignEvidencePackEnv;
  rows: ProAcquisitionEfficiencyByCampaignEvidencePackRow[];
  csv: string;
  weeklyReportMarkdown: string;
}

export interface BuildProAcquisitionEfficiencyByCampaignEvidencePackParams {
  enabled: boolean;
  telemetryEvents: unknown;
  now: number;
  extensionVersion: string;
  emptyCampaignBucketLabel?: string;
  lookbackDays?: number;
  maxEvents?: number;
  getMessage: I18nGetMessage;
}

function safeGetMessage(getMessage: I18nGetMessage, key: string): string {
  const message = getMessage(key);
  return message || key;
}

function buildStableRows(rows: ProAcquisitionEfficiencyByCampaignEvidencePackRow[]): ProAcquisitionEfficiencyByCampaignEvidencePackRow[] {
  return rows.map((row) => ({
    campaign: row.campaign,
    leads: row.leads,
    distCopies: row.distCopies,
    leadsPerDistCopy: row.leadsPerDistCopy
  }));
}

export function buildProAcquisitionEfficiencyByCampaignEvidencePack(
  params: BuildProAcquisitionEfficiencyByCampaignEvidencePackParams
): ProAcquisitionEfficiencyByCampaignEvidencePack {
  const builtCsv = buildProAcquisitionEfficiencyByCampaignCsv({
    enabled: params.enabled,
    telemetryEvents: params.telemetryEvents,
    now: params.now,
    extensionVersion: params.extensionVersion || '',
    emptyCampaignBucketLabel: params.emptyCampaignBucketLabel,
    lookbackDays: params.lookbackDays,
    maxEvents: params.maxEvents
  });

  const env: ProAcquisitionEfficiencyByCampaignEvidencePackEnv = {
    extensionVersion: params.extensionVersion || '',
    exportedAt: params.now,
    lookbackDays: builtCsv.lookbackDays,
    windowFrom: builtCsv.windowFrom,
    windowTo: builtCsv.windowTo,
    isAnonymousUsageDataEnabled: Boolean(params.enabled)
  };

  const weeklyEnv: ProAcquisitionEfficiencyByCampaignWeeklyReportEnvInfo = {
    extensionVersion: env.extensionVersion,
    exportedAt: env.exportedAt,
    isAnonymousUsageDataEnabled: env.isAnonymousUsageDataEnabled
  };

  const weeklySummary = buildProAcquisitionEfficiencyByCampaignWeeklyReportSummary({
    enabled: params.enabled,
    telemetryEvents: params.telemetryEvents,
    now: params.now,
    extensionVersion: params.extensionVersion || '',
    emptyCampaignBucketLabel: params.emptyCampaignBucketLabel,
    lookbackDays: params.lookbackDays,
    maxEvents: params.maxEvents
  });

  const weeklyReportMarkdown = formatProAcquisitionEfficiencyByCampaignWeeklyReportMarkdown({
    summary: weeklySummary,
    env: weeklyEnv,
    getMessage: params.getMessage
  });

  const rows: ProAcquisitionEfficiencyByCampaignEvidencePackRow[] = builtCsv.rows.map((row) => ({
    campaign: row.campaign,
    leads: row.leads,
    distCopies: row.distCopies,
    leadsPerDistCopy: row.leadsPerDistCopy
  }));

  const telemetryOffNotice = params.enabled
    ? null
    : safeGetMessage(params.getMessage, 'proAcqEffByCampaignEvidencePackTelemetryOffNotice');

  return {
    enabled: builtCsv.enabled,
    disabledReason: builtCsv.enabled ? null : (builtCsv.disabledReason ?? 'anonymous_usage_data_disabled'),
    telemetryOffNotice,
    env,
    rows,
    csv: builtCsv.csv,
    weeklyReportMarkdown
  };
}

export function formatProAcquisitionEfficiencyByCampaignEvidencePackAsJson(
  pack: ProAcquisitionEfficiencyByCampaignEvidencePack
): string {
  const stable: ProAcquisitionEfficiencyByCampaignEvidencePack = {
    enabled: Boolean(pack.enabled),
    disabledReason: pack.disabledReason ?? null,
    telemetryOffNotice: pack.telemetryOffNotice ?? null,
    env: {
      extensionVersion: pack.env?.extensionVersion || '',
      exportedAt: Number.isFinite(pack.env?.exportedAt) ? (pack.env.exportedAt as number) : 0,
      lookbackDays: Number.isFinite(pack.env?.lookbackDays) ? (pack.env.lookbackDays as number) : 7,
      windowFrom: Number.isFinite(pack.env?.windowFrom) ? (pack.env.windowFrom as number) : 0,
      windowTo: Number.isFinite(pack.env?.windowTo) ? (pack.env.windowTo as number) : 0,
      isAnonymousUsageDataEnabled: Boolean(pack.env?.isAnonymousUsageDataEnabled)
    },
    rows: buildStableRows(Array.isArray(pack.rows) ? pack.rows : []),
    csv: typeof pack.csv === 'string' ? pack.csv : '',
    weeklyReportMarkdown: typeof pack.weeklyReportMarkdown === 'string' ? pack.weeklyReportMarkdown : ''
  };

  return `${JSON.stringify(stable, null, 2)}\n`;
}

