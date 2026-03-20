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

export const PRO_INTENT_EVENTS_CSV_COLUMNS = [
  'exportedAt',
  'extensionVersion',
  'windowFrom',
  'windowTo',
  'lookbackDays',
  'eventTs',
  'eventLocalTime',
  'eventName',
  'source'
] as const;

export type ProIntentEventsCsvColumn = (typeof PRO_INTENT_EVENTS_CSV_COLUMNS)[number];

export interface ProIntentEventsCsvRow {
  exportedAt: number;
  extensionVersion: string;
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  eventTs: number;
  eventLocalTime: string;
  eventName: ProIntentWeeklyDigestEventName;
  source: ProIntentWeeklyDigestSource;
}

export interface BuildProIntentEventsCsvParams {
  enabled: boolean;
  telemetryEvents: unknown;
  now: number;
  extensionVersion: string;
  lookbackDays?: number;
  maxEvents?: number;
}

export interface ProIntentEventsCsvResult {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  maxEvents: number;
  events: TelemetryEvent[];
  rows: ProIntentEventsCsvRow[];
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

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatLocalDateTime(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function isProIntentEventName(name: unknown): name is ProIntentWeeklyDigestEventName {
  return typeof name === 'string' && (PRO_INTENT_WEEKLY_DIGEST_EVENT_NAMES as readonly string[]).includes(name);
}

function isProIntentSource(value: unknown): value is ProIntentWeeklyDigestSource {
  return value === 'popup' || value === 'options';
}

function csvEscapeCell(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function buildCsv(rows: ProIntentEventsCsvRow[]): string {
  const lines: string[] = [];
  lines.push(PRO_INTENT_EVENTS_CSV_COLUMNS.join(','));

  for (const row of rows) {
    const cells = [
      String(row.exportedAt),
      csvEscapeCell(row.extensionVersion || ''),
      String(row.windowFrom),
      String(row.windowTo),
      String(row.lookbackDays),
      String(row.eventTs),
      csvEscapeCell(row.eventLocalTime),
      csvEscapeCell(row.eventName),
      csvEscapeCell(row.source)
    ];
    lines.push(cells.join(','));
  }

  return `${lines.join('\n')}\n`;
}

export function buildProIntentEventsCsv(params: BuildProIntentEventsCsvParams): ProIntentEventsCsvResult {
  const now = clampNow(params.now);
  const lookbackDays = clampLookbackDays(params.lookbackDays);
  const maxEvents = clampMaxEvents(params.maxEvents);

  const windowTo = now;
  const windowFrom = now - lookbackDays * 24 * 60 * 60 * 1000;

  if (!params.enabled) {
    const rows: ProIntentEventsCsvRow[] = [];
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
  for (const event of trimmed) {
    if (!isProIntentEventName(event.name)) continue;
    if (!isInWindow(event.ts, windowFrom, windowTo)) continue;

    const source = event.props?.source;
    if (!isProIntentSource(source)) continue;

    filtered.push(event);
  }

  const sorted = filtered
    .map((event, index) => ({ event, index }))
    .sort((a, b) => (a.event.ts - b.event.ts) || (a.index - b.index))
    .map(({ event }) => event);

  const rows: ProIntentEventsCsvRow[] = sorted.map((event) => ({
    exportedAt: now,
    extensionVersion: params.extensionVersion || '',
    windowFrom,
    windowTo,
    lookbackDays,
    eventTs: event.ts,
    eventLocalTime: formatLocalDateTime(event.ts),
    eventName: event.name as ProIntentWeeklyDigestEventName,
    source: event.props?.source as ProIntentWeeklyDigestSource
  }));

  return {
    enabled: true,
    windowFrom,
    windowTo,
    lookbackDays,
    maxEvents,
    events: sorted,
    rows,
    csv: buildCsv(rows)
  };
}

export function formatProIntentEvents7dCsvFilename(exportedAt: number): string {
  const d = new Date(exportedAt);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `copylot-pro-intent-events-7d-${yyyy}-${mm}-${dd}.csv`;
}

