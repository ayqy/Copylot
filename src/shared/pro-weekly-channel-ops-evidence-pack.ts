import {
  buildProAcquisitionEfficiencyByCampaignEvidencePack,
  type ProAcquisitionEfficiencyByCampaignEvidencePack,
  type ProAcquisitionEfficiencyByCampaignEvidencePackRow
} from './pro-acquisition-efficiency-by-campaign-evidence-pack.ts';
import type { I18nGetMessage } from './pro-acquisition-efficiency-by-campaign-weekly-report.ts';
import { buildProDistributionByCampaignCsv } from './pro-distribution-by-campaign-csv.ts';
import { buildProIntentEventsCsv } from './pro-intent-events-csv.ts';

export interface ProWeeklyChannelOpsEvidencePackEnv {
  extensionVersion: string;
  exportedAt: number;
  lookbackDays: number;
  windowFrom: number;
  windowTo: number;
  isAnonymousUsageDataEnabled: boolean;
}

export interface ProWeeklyChannelOpsEvidencePackAssets {
  acquisitionEfficiencyEvidencePack: ProAcquisitionEfficiencyByCampaignEvidencePack;
  proDistributionByCampaign7dCsv: string;
  proIntentEvents7dCsv: string;
  verifyMarkdown: string;
}

export interface ProWeeklyChannelOpsEvidencePack {
  packVersion: 'v1-63';
  enabled: boolean;
  disabledReason: 'anonymous_usage_data_disabled' | null;
  telemetryOffNotice: string | null;
  env: ProWeeklyChannelOpsEvidencePackEnv;
  assets: ProWeeklyChannelOpsEvidencePackAssets;
}

export interface BuildProWeeklyChannelOpsEvidencePackParams {
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

function buildVerifyMarkdown(getMessage: I18nGetMessage): string {
  const md = safeGetMessage(getMessage, 'proWeeklyChannelOpsEvidencePackVerifyMarkdown');
  return md.endsWith('\n') ? md : `${md}\n`;
}

function buildStableAcqRows(
  rows: ProAcquisitionEfficiencyByCampaignEvidencePackRow[]
): ProAcquisitionEfficiencyByCampaignEvidencePackRow[] {
  return rows.map((row) => ({
    campaign: row.campaign,
    leads: row.leads,
    distCopies: row.distCopies,
    leadsPerDistCopy: row.leadsPerDistCopy
  }));
}

function toStableAcquisitionEfficiencyEvidencePack(
  pack: ProAcquisitionEfficiencyByCampaignEvidencePack
): ProAcquisitionEfficiencyByCampaignEvidencePack {
  return {
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
    rows: buildStableAcqRows(Array.isArray(pack.rows) ? pack.rows : []),
    csv: typeof pack.csv === 'string' ? pack.csv : '',
    weeklyReportMarkdown: typeof pack.weeklyReportMarkdown === 'string' ? pack.weeklyReportMarkdown : ''
  };
}

export function buildProWeeklyChannelOpsEvidencePack(
  params: BuildProWeeklyChannelOpsEvidencePackParams
): ProWeeklyChannelOpsEvidencePack {
  const verifyMarkdown = buildVerifyMarkdown(params.getMessage);

  const acquisitionEfficiencyEvidencePack = buildProAcquisitionEfficiencyByCampaignEvidencePack({
    enabled: params.enabled,
    telemetryEvents: params.telemetryEvents,
    now: params.now,
    extensionVersion: params.extensionVersion || '',
    emptyCampaignBucketLabel: params.emptyCampaignBucketLabel,
    lookbackDays: params.lookbackDays,
    maxEvents: params.maxEvents,
    getMessage: params.getMessage
  });

  const proDistributionByCampaign7d = buildProDistributionByCampaignCsv({
    enabled: params.enabled,
    telemetryEvents: params.telemetryEvents,
    now: params.now,
    extensionVersion: params.extensionVersion || '',
    emptyCampaignBucketLabel: params.emptyCampaignBucketLabel,
    lookbackDays: params.lookbackDays,
    maxEvents: params.maxEvents
  });

  const proIntentEvents7d = buildProIntentEventsCsv({
    enabled: params.enabled,
    telemetryEvents: params.telemetryEvents,
    now: params.now,
    extensionVersion: params.extensionVersion || '',
    lookbackDays: params.lookbackDays,
    maxEvents: params.maxEvents
  });

  const env: ProWeeklyChannelOpsEvidencePackEnv = {
    extensionVersion: acquisitionEfficiencyEvidencePack.env?.extensionVersion || '',
    exportedAt: acquisitionEfficiencyEvidencePack.env?.exportedAt ?? params.now,
    lookbackDays: acquisitionEfficiencyEvidencePack.env?.lookbackDays ?? 7,
    windowFrom: acquisitionEfficiencyEvidencePack.env?.windowFrom ?? params.now,
    windowTo: acquisitionEfficiencyEvidencePack.env?.windowTo ?? params.now,
    isAnonymousUsageDataEnabled: Boolean(params.enabled)
  };

  const telemetryOffNotice = params.enabled
    ? null
    : safeGetMessage(params.getMessage, 'proWeeklyChannelOpsEvidencePackTelemetryOffNotice');

  return {
    packVersion: 'v1-63',
    enabled: Boolean(params.enabled),
    disabledReason: params.enabled ? null : 'anonymous_usage_data_disabled',
    telemetryOffNotice,
    env,
    assets: {
      acquisitionEfficiencyEvidencePack,
      proDistributionByCampaign7dCsv: proDistributionByCampaign7d.csv,
      proIntentEvents7dCsv: proIntentEvents7d.csv,
      verifyMarkdown
    }
  };
}

export function formatProWeeklyChannelOpsEvidencePackAsJson(pack: ProWeeklyChannelOpsEvidencePack): string {
  const stable: ProWeeklyChannelOpsEvidencePack = {
    packVersion: 'v1-63',
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
    assets: {
      acquisitionEfficiencyEvidencePack: toStableAcquisitionEfficiencyEvidencePack(
        pack.assets?.acquisitionEfficiencyEvidencePack as ProAcquisitionEfficiencyByCampaignEvidencePack
      ),
      proDistributionByCampaign7dCsv: typeof pack.assets?.proDistributionByCampaign7dCsv === 'string'
        ? pack.assets.proDistributionByCampaign7dCsv
        : '',
      proIntentEvents7dCsv:
        typeof pack.assets?.proIntentEvents7dCsv === 'string' ? pack.assets.proIntentEvents7dCsv : '',
      verifyMarkdown: typeof pack.assets?.verifyMarkdown === 'string' ? pack.assets.verifyMarkdown : ''
    }
  };

  return `${JSON.stringify(stable, null, 2)}\n`;
}
