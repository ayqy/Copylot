import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvents,
  trimTelemetryEvents,
  type TelemetryEvent
} from './telemetry.ts';

export const PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_EMPTY_BUCKET_KEY = '%%EMPTY_CAMPAIGN%%';

export const PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_CSV_COLUMNS = [
  'exportedAt',
  'extensionVersion',
  'windowFrom',
  'windowTo',
  'lookbackDays',
  'campaign',
  'leads',
  'distCopies',
  'leadsPerDistCopy'
] as const;

export type ProAcquisitionEfficiencyByCampaignCsvColumn =
  (typeof PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_CSV_COLUMNS)[number];

export interface ProAcquisitionEfficiencyByCampaignCsvRow {
  exportedAt: number;
  extensionVersion: string;
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  campaign: string;
  leads: number;
  distCopies: number;
  leadsPerDistCopy: string;
}

export interface BuildProAcquisitionEfficiencyByCampaignCsvParams {
  enabled: boolean;
  telemetryEvents: unknown;
  now: number;
  extensionVersion: string;
  emptyCampaignBucketLabel?: string;
  lookbackDays?: number;
  maxEvents?: number;
}

export interface ProAcquisitionEfficiencyByCampaignCsvResult {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  maxEvents: number;
  events: TelemetryEvent[];
  rows: ProAcquisitionEfficiencyByCampaignCsvRow[];
  csv: string;
}

type ProIntentLeadEventName = 'pro_waitlist_copied' | 'pro_waitlist_survey_copied';

function isProIntentLeadEventName(name: unknown): name is ProIntentLeadEventName {
  return name === 'pro_waitlist_copied' || name === 'pro_waitlist_survey_copied';
}

type ProIntentSource = 'popup' | 'options';

function isProIntentSource(value: unknown): value is ProIntentSource {
  return value === 'popup' || value === 'options';
}

type ProDistributionSource = 'options';

function isProDistributionSource(value: unknown): value is ProDistributionSource {
  return value === 'options';
}

type ProDistributionAssetCopiedAction = 'waitlist_url' | 'recruit_copy' | 'store_url' | 'distribution_pack';

function isProDistributionAssetCopiedAction(value: unknown): value is ProDistributionAssetCopiedAction {
  return value === 'waitlist_url' || value === 'recruit_copy' || value === 'store_url' || value === 'distribution_pack';
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

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function csvEscapeCell(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function compareStrings(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function formatLeadsPerDistCopy(leads: number, distCopies: number): string {
  if (!Number.isFinite(leads) || !Number.isFinite(distCopies) || distCopies <= 0) return 'N/A';
  return (leads / distCopies).toFixed(4);
}

function buildCsv(rows: ProAcquisitionEfficiencyByCampaignCsvRow[]): string {
  const lines: string[] = [];
  lines.push(PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_CSV_COLUMNS.join(','));

  for (const row of rows) {
    const cells = [
      String(row.exportedAt),
      csvEscapeCell(row.extensionVersion || ''),
      String(row.windowFrom),
      String(row.windowTo),
      String(row.lookbackDays),
      csvEscapeCell(row.campaign || ''),
      String(row.leads),
      String(row.distCopies),
      csvEscapeCell(row.leadsPerDistCopy || '')
    ];
    lines.push(cells.join(','));
  }

  return `${lines.join('\n')}\n`;
}

function createEmptyCounts() {
  return { leads: 0, distCopies: 0 };
}

export function buildProAcquisitionEfficiencyByCampaignCsv(
  params: BuildProAcquisitionEfficiencyByCampaignCsvParams
): ProAcquisitionEfficiencyByCampaignCsvResult {
  const now = clampNow(params.now);
  const lookbackDays = clampLookbackDays(params.lookbackDays);
  const maxEvents = clampMaxEvents(params.maxEvents);
  const emptyCampaignBucketLabel =
    typeof params.emptyCampaignBucketLabel === 'string' && params.emptyCampaignBucketLabel.trim()
      ? params.emptyCampaignBucketLabel.trim()
      : 'N/A';

  const windowTo = now;
  const windowFrom = now - lookbackDays * 24 * 60 * 60 * 1000;

  if (!params.enabled) {
    const rows: ProAcquisitionEfficiencyByCampaignCsvRow[] = [];
    return {
      enabled: false,
      disabledReason: 'anonymous_usage_data_disabled',
      windowFrom,
      windowTo,
      lookbackDays,
      maxEvents,
      events: [],
      rows,
      csv: buildCsv(rows)
    };
  }

  const sanitized = sanitizeTelemetryEvents(params.telemetryEvents);
  const trimmed = trimTelemetryEvents(sanitized, maxEvents);

  const filtered: TelemetryEvent[] = [];
  const byCampaign: Record<string, ReturnType<typeof createEmptyCounts>> = {};

  for (const event of trimmed) {
    if (!isInWindow(event.ts, windowFrom, windowTo)) continue;

    if (isProIntentLeadEventName(event.name)) {
      const source = event.props?.source;
      if (!isProIntentSource(source)) continue;

      const campaign =
        typeof event.props?.campaign === 'string' && event.props.campaign
          ? event.props.campaign
          : PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_EMPTY_BUCKET_KEY;

      if (!byCampaign[campaign]) byCampaign[campaign] = createEmptyCounts();
      byCampaign[campaign].leads += 1;
      filtered.push(event);
      continue;
    }

    if (event.name === 'pro_distribution_asset_copied') {
      const source = event.props?.source;
      if (!isProDistributionSource(source)) continue;

      const action = event.props?.action;
      if (!isProDistributionAssetCopiedAction(action)) continue;

      const campaign =
        typeof event.props?.campaign === 'string' && event.props.campaign
          ? event.props.campaign
          : PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_EMPTY_BUCKET_KEY;

      if (!byCampaign[campaign]) byCampaign[campaign] = createEmptyCounts();
      byCampaign[campaign].distCopies += 1;
      filtered.push(event);
      continue;
    }
  }

  const rows: ProAcquisitionEfficiencyByCampaignCsvRow[] = Object.keys(byCampaign)
    .sort((a, b) => {
      const aCounts = byCampaign[a];
      const bCounts = byCampaign[b];
      const aRate = aCounts.distCopies === 0 ? null : aCounts.leads / aCounts.distCopies;
      const bRate = bCounts.distCopies === 0 ? null : bCounts.leads / bCounts.distCopies;

      if (aRate === null && bRate !== null) return 1;
      if (aRate !== null && bRate === null) return -1;
      if (aRate !== null && bRate !== null && bRate !== aRate) return bRate - aRate;

      if (bCounts.leads !== aCounts.leads) return bCounts.leads - aCounts.leads;
      if (bCounts.distCopies !== aCounts.distCopies) return bCounts.distCopies - aCounts.distCopies;

      const aKey = a === PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_EMPTY_BUCKET_KEY ? '\uffff' : a;
      const bKey = b === PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_EMPTY_BUCKET_KEY ? '\uffff' : b;
      return compareStrings(aKey, bKey);
    })
    .map((campaign) => {
      const counts = byCampaign[campaign];
      const displayCampaign =
        campaign === PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_EMPTY_BUCKET_KEY ? emptyCampaignBucketLabel : campaign;
      return {
        exportedAt: now,
        extensionVersion: params.extensionVersion || '',
        windowFrom,
        windowTo,
        lookbackDays,
        campaign: displayCampaign,
        leads: counts.leads,
        distCopies: counts.distCopies,
        leadsPerDistCopy: formatLeadsPerDistCopy(counts.leads, counts.distCopies)
      };
    });

  return {
    enabled: true,
    windowFrom,
    windowTo,
    lookbackDays,
    maxEvents,
    events: filtered,
    rows,
    csv: buildCsv(rows)
  };
}

export function formatProAcquisitionEfficiencyByCampaign7dCsvFilename(exportedAt: number): string {
  const d = new Date(exportedAt);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `copylot-pro-acquisition-efficiency-by-campaign-7d-${yyyy}-${mm}-${dd}.csv`;
}

