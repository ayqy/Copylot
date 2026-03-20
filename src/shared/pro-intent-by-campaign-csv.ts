import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvents,
  trimTelemetryEvents,
  type TelemetryEvent
} from './telemetry.ts';
import {
  PRO_INTENT_WEEKLY_DIGEST_EVENT_NAMES,
  type ProIntentWeeklyDigestEventName,
  type ProIntentWeeklyDigestSource
} from './pro-intent-weekly-digest.ts';

export const PRO_INTENT_BY_CAMPAIGN_EMPTY_BUCKET_KEY = '%%EMPTY_CAMPAIGN%%';

export const PRO_INTENT_BY_CAMPAIGN_CSV_COLUMNS = [
  'exportedAt',
  'extensionVersion',
  'windowFrom',
  'windowTo',
  'lookbackDays',
  'campaign',
  'proEntryOpened',
  'proWaitlistOpened',
  'proWaitlistCopied',
  'proWaitlistSurveyCopied',
  'leads'
] as const;

export type ProIntentByCampaignCsvColumn = (typeof PRO_INTENT_BY_CAMPAIGN_CSV_COLUMNS)[number];

export interface ProIntentByCampaignCsvRow {
  exportedAt: number;
  extensionVersion: string;
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  campaign: string;
  proEntryOpened: number;
  proWaitlistOpened: number;
  proWaitlistCopied: number;
  proWaitlistSurveyCopied: number;
  leads: number;
}

export interface BuildProIntentByCampaignCsvParams {
  enabled: boolean;
  telemetryEvents: unknown;
  now: number;
  extensionVersion: string;
  emptyCampaignBucketLabel?: string;
  lookbackDays?: number;
  maxEvents?: number;
}

export interface ProIntentByCampaignCsvResult {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  maxEvents: number;
  events: TelemetryEvent[];
  rows: ProIntentByCampaignCsvRow[];
  csv: string;
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

function isProIntentEventName(name: unknown): name is ProIntentWeeklyDigestEventName {
  return typeof name === 'string' && (PRO_INTENT_WEEKLY_DIGEST_EVENT_NAMES as readonly string[]).includes(name);
}

function isProIntentSource(value: unknown): value is ProIntentWeeklyDigestSource {
  return value === 'popup' || value === 'options';
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

function buildCsv(rows: ProIntentByCampaignCsvRow[]): string {
  const lines: string[] = [];
  lines.push(PRO_INTENT_BY_CAMPAIGN_CSV_COLUMNS.join(','));

  for (const row of rows) {
    const cells = [
      String(row.exportedAt),
      csvEscapeCell(row.extensionVersion || ''),
      String(row.windowFrom),
      String(row.windowTo),
      String(row.lookbackDays),
      csvEscapeCell(row.campaign || ''),
      String(row.proEntryOpened),
      String(row.proWaitlistOpened),
      String(row.proWaitlistCopied),
      String(row.proWaitlistSurveyCopied),
      String(row.leads)
    ];
    lines.push(cells.join(','));
  }

  return `${lines.join('\n')}\n`;
}

function createEmptyCounts() {
  return {
    proEntryOpened: 0,
    proWaitlistOpened: 0,
    proWaitlistCopied: 0,
    proWaitlistSurveyCopied: 0
  };
}

export function buildProIntentByCampaignCsv(params: BuildProIntentByCampaignCsvParams): ProIntentByCampaignCsvResult {
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
    const rows: ProIntentByCampaignCsvRow[] = [];
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
    if (!isProIntentEventName(event.name)) continue;
    if (!isInWindow(event.ts, windowFrom, windowTo)) continue;

    const source = event.props?.source;
    if (!isProIntentSource(source)) continue;

    const campaign =
      typeof event.props?.campaign === 'string' && event.props.campaign ? event.props.campaign : PRO_INTENT_BY_CAMPAIGN_EMPTY_BUCKET_KEY;

    if (!byCampaign[campaign]) byCampaign[campaign] = createEmptyCounts();
    const counts = byCampaign[campaign];

    if (event.name === 'pro_entry_opened') counts.proEntryOpened += 1;
    if (event.name === 'pro_waitlist_opened') counts.proWaitlistOpened += 1;
    if (event.name === 'pro_waitlist_copied') counts.proWaitlistCopied += 1;
    if (event.name === 'pro_waitlist_survey_copied') counts.proWaitlistSurveyCopied += 1;

    filtered.push(event);
  }

  const rows: ProIntentByCampaignCsvRow[] = Object.keys(byCampaign)
    .sort((a, b) => {
      const aCounts = byCampaign[a];
      const bCounts = byCampaign[b];
      const aLeads = aCounts.proWaitlistCopied + aCounts.proWaitlistSurveyCopied;
      const bLeads = bCounts.proWaitlistCopied + bCounts.proWaitlistSurveyCopied;
      if (bLeads !== aLeads) return bLeads - aLeads;
      const aKey = a === PRO_INTENT_BY_CAMPAIGN_EMPTY_BUCKET_KEY ? '\uffff' : a;
      const bKey = b === PRO_INTENT_BY_CAMPAIGN_EMPTY_BUCKET_KEY ? '\uffff' : b;
      return compareStrings(aKey, bKey);
    })
    .map((campaign) => {
      const counts = byCampaign[campaign];
      const leads = counts.proWaitlistCopied + counts.proWaitlistSurveyCopied;
      const displayCampaign = campaign === PRO_INTENT_BY_CAMPAIGN_EMPTY_BUCKET_KEY ? emptyCampaignBucketLabel : campaign;
      return {
        exportedAt: now,
        extensionVersion: params.extensionVersion || '',
        windowFrom,
        windowTo,
        lookbackDays,
        campaign: displayCampaign,
        proEntryOpened: counts.proEntryOpened,
        proWaitlistOpened: counts.proWaitlistOpened,
        proWaitlistCopied: counts.proWaitlistCopied,
        proWaitlistSurveyCopied: counts.proWaitlistSurveyCopied,
        leads
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

export function formatProIntentByCampaign7dCsvFilename(exportedAt: number): string {
  const d = new Date(exportedAt);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `copylot-pro-intent-by-campaign-7d-${yyyy}-${mm}-${dd}.csv`;
}
