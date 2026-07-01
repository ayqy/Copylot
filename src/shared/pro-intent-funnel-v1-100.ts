import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvents,
  trimTelemetryEvents,
  type TelemetryEvent
} from './telemetry.ts';
import type { ProIntentSource } from './pro-intent-attribution.ts';

export const PRO_INTENT_V1_100_EVENT_NAMES = [
  'pro_entry_opened',
  'pro_intent_form_start',
  'pro_intent_form_submit'
] as const;

export type ProIntentV1_100EventName = (typeof PRO_INTENT_V1_100_EVENT_NAMES)[number];

export interface ProIntentV1_100Row {
  source: ProIntentSource;
  medium: string;
  content: string;
  campaign: string;
  upgradeEntryClicks: number;
  formStarts: number;
  formSubmits: number;
  formStartRate: number | null;
  intentSubmitRate: number | null;
}

export interface ProIntentV1_100Summary {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  window: {
    from: number;
    to: number;
    lookbackDays: number;
    maxEvents: number;
  };
  rows: ProIntentV1_100Row[];
  totals: {
    upgradeEntryClicks: number;
    formStarts: number;
    formSubmits: number;
    formStartRate: number | null;
    intentSubmitRate: number | null;
  };
}

export interface BuildProIntentV1_100SummaryParams {
  enabled: boolean;
  telemetryEvents: unknown;
  now: number;
  lookbackDays?: number;
  maxEvents?: number;
}

const EMPTY_CAMPAIGN = 'N/A';
const EMPTY_CONTENT = 'unknown';

function clampLookbackDays(value: unknown): number {
  if (!Number.isFinite(value)) return 30;
  const num = Math.floor(value as number);
  if (num <= 0) return 30;
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

function isTrackedEventName(name: unknown): name is ProIntentV1_100EventName {
  return typeof name === 'string' && (PRO_INTENT_V1_100_EVENT_NAMES as readonly string[]).includes(name);
}

function roundTo4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function safeRate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return roundTo4(numerator / denominator);
}

function rowKey(event: TelemetryEvent): string | null {
  const source = event.props?.source;
  const medium = event.props?.medium;
  if ((source !== 'popup' && source !== 'options') || typeof medium !== 'string' || !medium) {
    return null;
  }
  const content = typeof event.props?.content === 'string' && event.props.content ? event.props.content : EMPTY_CONTENT;
  const campaign = typeof event.props?.campaign === 'string' && event.props.campaign ? event.props.campaign : EMPTY_CAMPAIGN;
  return [source, medium, content, campaign].join('::');
}

function createRow(source: ProIntentSource, medium: string, content: string, campaign: string): ProIntentV1_100Row {
  return {
    source,
    medium,
    content,
    campaign,
    upgradeEntryClicks: 0,
    formStarts: 0,
    formSubmits: 0,
    formStartRate: null,
    intentSubmitRate: null
  };
}

export function buildProIntentV1_100Summary(
  params: BuildProIntentV1_100SummaryParams
): ProIntentV1_100Summary {
  const now = clampNow(params.now);
  const lookbackDays = clampLookbackDays(params.lookbackDays);
  const maxEvents = clampMaxEvents(params.maxEvents);
  const from = now - lookbackDays * 24 * 60 * 60 * 1000;
  const to = now;

  if (!params.enabled) {
    return {
      enabled: false,
      disabledReason: 'anonymous_usage_data_disabled',
      window: { from, to, lookbackDays, maxEvents },
      rows: [],
      totals: {
        upgradeEntryClicks: 0,
        formStarts: 0,
        formSubmits: 0,
        formStartRate: null,
        intentSubmitRate: null
      }
    };
  }

  const events = trimTelemetryEvents(sanitizeTelemetryEvents(params.telemetryEvents), maxEvents);
  const buckets = new Map<string, ProIntentV1_100Row>();

  for (const event of events) {
    if (!isTrackedEventName(event.name)) continue;
    if (!isInWindow(event.ts, from, to)) continue;
    const key = rowKey(event);
    if (!key) continue;

    if (!buckets.has(key)) {
      const source = event.props?.source as ProIntentSource;
      const medium = event.props?.medium as string;
      const content =
        typeof event.props?.content === 'string' && event.props.content ? event.props.content : EMPTY_CONTENT;
      const campaign =
        typeof event.props?.campaign === 'string' && event.props.campaign ? event.props.campaign : EMPTY_CAMPAIGN;
      buckets.set(key, createRow(source, medium, content, campaign));
    }

    const row = buckets.get(key)!;
    if (event.name === 'pro_entry_opened') row.upgradeEntryClicks += 1;
    if (event.name === 'pro_intent_form_start') row.formStarts += 1;
    if (event.name === 'pro_intent_form_submit') row.formSubmits += 1;
  }

  const rows = [...buckets.values()]
    .map((row) => ({
      ...row,
      formStartRate: safeRate(row.formStarts, row.upgradeEntryClicks),
      intentSubmitRate: safeRate(row.formSubmits, row.upgradeEntryClicks)
    }))
    .sort((a, b) => {
      if (b.formSubmits !== a.formSubmits) return b.formSubmits - a.formSubmits;
      if (b.upgradeEntryClicks !== a.upgradeEntryClicks) return b.upgradeEntryClicks - a.upgradeEntryClicks;
      return `${a.source}:${a.content}`.localeCompare(`${b.source}:${b.content}`);
    });

  const totals = rows.reduce(
    (acc, row) => {
      acc.upgradeEntryClicks += row.upgradeEntryClicks;
      acc.formStarts += row.formStarts;
      acc.formSubmits += row.formSubmits;
      return acc;
    },
    {
      upgradeEntryClicks: 0,
      formStarts: 0,
      formSubmits: 0,
      formStartRate: null as number | null,
      intentSubmitRate: null as number | null
    }
  );

  totals.formStartRate = safeRate(totals.formStarts, totals.upgradeEntryClicks);
  totals.intentSubmitRate = safeRate(totals.formSubmits, totals.upgradeEntryClicks);

  return {
    enabled: true,
    window: { from, to, lookbackDays, maxEvents },
    rows,
    totals
  };
}

export function formatProIntentV1_100Csv(summary: ProIntentV1_100Summary): string {
  const header = [
    'source',
    'medium',
    'content',
    'campaign',
    'upgradeEntryClicks',
    'formStarts',
    'formSubmits',
    'formStartRate',
    'intentSubmitRate'
  ];
  const rows = [header.join(',')];

  for (const row of summary.rows) {
    rows.push(
      [
        row.source,
        row.medium,
        row.content,
        row.campaign,
        row.upgradeEntryClicks,
        row.formStarts,
        row.formSubmits,
        row.formStartRate ?? '',
        row.intentSubmitRate ?? ''
      ].join(',')
    );
  }

  return `${rows.join('\n')}\n`;
}
