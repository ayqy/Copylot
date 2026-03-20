import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvents,
  trimTelemetryEvents,
  type TelemetryEvent
} from './telemetry.ts';

export const PRO_DISTRIBUTION_BY_CAMPAIGN_EMPTY_BUCKET_KEY = '%%EMPTY_CAMPAIGN%%';

export const PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS = [
  'exportedAt',
  'extensionVersion',
  'windowFrom',
  'windowTo',
  'lookbackDays',
  'campaign',
  'waitlistUrlCopied',
  'recruitCopyCopied',
  'storeUrlCopied',
  'distributionPackCopied',
  'distCopies'
] as const;

export type ProDistributionByCampaignCsvColumn = (typeof PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS)[number];

export interface ProDistributionByCampaignCsvRow {
  exportedAt: number;
  extensionVersion: string;
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  campaign: string;
  waitlistUrlCopied: number;
  recruitCopyCopied: number;
  storeUrlCopied: number;
  distributionPackCopied: number;
  distCopies: number;
}

export interface BuildProDistributionByCampaignCsvParams {
  enabled: boolean;
  telemetryEvents: unknown;
  now: number;
  extensionVersion: string;
  emptyCampaignBucketLabel?: string;
  lookbackDays?: number;
  maxEvents?: number;
}

export interface ProDistributionByCampaignCsvResult {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  maxEvents: number;
  events: TelemetryEvent[];
  rows: ProDistributionByCampaignCsvRow[];
  csv: string;
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

function buildCsv(rows: ProDistributionByCampaignCsvRow[]): string {
  const lines: string[] = [];
  lines.push(PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS.join(','));

  for (const row of rows) {
    const cells = [
      String(row.exportedAt),
      csvEscapeCell(row.extensionVersion || ''),
      String(row.windowFrom),
      String(row.windowTo),
      String(row.lookbackDays),
      csvEscapeCell(row.campaign || ''),
      String(row.waitlistUrlCopied),
      String(row.recruitCopyCopied),
      String(row.storeUrlCopied),
      String(row.distributionPackCopied),
      String(row.distCopies)
    ];
    lines.push(cells.join(','));
  }

  return `${lines.join('\n')}\n`;
}

function createEmptyCounts() {
  return {
    waitlistUrlCopied: 0,
    recruitCopyCopied: 0,
    storeUrlCopied: 0,
    distributionPackCopied: 0
  };
}

export function buildProDistributionByCampaignCsv(
  params: BuildProDistributionByCampaignCsvParams
): ProDistributionByCampaignCsvResult {
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
    const rows: ProDistributionByCampaignCsvRow[] = [];
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
    if (event.name !== 'pro_distribution_asset_copied') continue;
    if (!isInWindow(event.ts, windowFrom, windowTo)) continue;

    const source = event.props?.source;
    if (source !== 'options') continue;

    const action = event.props?.action;
    if (!isProDistributionAssetCopiedAction(action)) continue;

    const campaign =
      typeof event.props?.campaign === 'string' && event.props.campaign
        ? event.props.campaign
        : PRO_DISTRIBUTION_BY_CAMPAIGN_EMPTY_BUCKET_KEY;

    if (!byCampaign[campaign]) byCampaign[campaign] = createEmptyCounts();
    const counts = byCampaign[campaign];

    if (action === 'waitlist_url') counts.waitlistUrlCopied += 1;
    if (action === 'recruit_copy') counts.recruitCopyCopied += 1;
    if (action === 'store_url') counts.storeUrlCopied += 1;
    if (action === 'distribution_pack') counts.distributionPackCopied += 1;

    filtered.push(event);
  }

  const rows: ProDistributionByCampaignCsvRow[] = Object.keys(byCampaign)
    .sort((a, b) => {
      const aCounts = byCampaign[a];
      const bCounts = byCampaign[b];
      const aCopies =
        aCounts.waitlistUrlCopied + aCounts.recruitCopyCopied + aCounts.storeUrlCopied + aCounts.distributionPackCopied;
      const bCopies =
        bCounts.waitlistUrlCopied + bCounts.recruitCopyCopied + bCounts.storeUrlCopied + bCounts.distributionPackCopied;
      if (bCopies !== aCopies) return bCopies - aCopies;
      const aKey = a === PRO_DISTRIBUTION_BY_CAMPAIGN_EMPTY_BUCKET_KEY ? '\uffff' : a;
      const bKey = b === PRO_DISTRIBUTION_BY_CAMPAIGN_EMPTY_BUCKET_KEY ? '\uffff' : b;
      return compareStrings(aKey, bKey);
    })
    .map((campaign) => {
      const counts = byCampaign[campaign];
      const distCopies =
        counts.waitlistUrlCopied + counts.recruitCopyCopied + counts.storeUrlCopied + counts.distributionPackCopied;
      const displayCampaign =
        campaign === PRO_DISTRIBUTION_BY_CAMPAIGN_EMPTY_BUCKET_KEY ? emptyCampaignBucketLabel : campaign;
      return {
        exportedAt: now,
        extensionVersion: params.extensionVersion || '',
        windowFrom,
        windowTo,
        lookbackDays,
        campaign: displayCampaign,
        waitlistUrlCopied: counts.waitlistUrlCopied,
        recruitCopyCopied: counts.recruitCopyCopied,
        storeUrlCopied: counts.storeUrlCopied,
        distributionPackCopied: counts.distributionPackCopied,
        distCopies
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

export function formatProDistributionByCampaign7dCsvFilename(exportedAt: number): string {
  const d = new Date(exportedAt);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `copylot-pro-distribution-by-campaign-7d-${yyyy}-${mm}-${dd}.csv`;
}

