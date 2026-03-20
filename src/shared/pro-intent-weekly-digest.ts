import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvents,
  trimTelemetryEvents,
  type TelemetryEvent
} from './telemetry.ts';

export type ProIntentWeeklyDigestSource = 'popup' | 'options';

export const PRO_INTENT_WEEKLY_DIGEST_EVENT_NAMES = [
  'pro_entry_opened',
  'pro_waitlist_opened',
  'pro_waitlist_copied',
  'pro_waitlist_survey_copied'
] as const;

const NO_CAMPAIGN_BUCKET_KEY = '%%NO_CAMPAIGN%%';

export type ProIntentWeeklyDigestEventName = (typeof PRO_INTENT_WEEKLY_DIGEST_EVENT_NAMES)[number];

export interface ProIntentWeeklyDigestCounts {
  pro_entry_opened: number;
  pro_waitlist_opened: number;
  pro_waitlist_copied: number;
  pro_waitlist_survey_copied: number;
}

export interface ProIntentWeeklyDigestRates {
  waitlist_opened_per_entry_opened: number | null;
  waitlist_copied_per_waitlist_opened: number | null;
  survey_copied_per_entry_opened: number | null;
}

export interface ProIntentWeeklyDigestCampaignCounts {
  pro_waitlist_copied: number;
  pro_waitlist_survey_copied: number;
}

export interface ProIntentWeeklyDigestSummary {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  window: {
    from: number;
    to: number;
    lookbackDays: number;
    maxEvents: number;
    policy: 'fifo';
    scope: 'last_n_days_within_current_window_only';
  };
  bySource: Record<ProIntentWeeklyDigestSource, ProIntentWeeklyDigestCounts>;
  overall: ProIntentWeeklyDigestCounts;
  rates: ProIntentWeeklyDigestRates;
  byCampaign: Record<string, ProIntentWeeklyDigestCampaignCounts>;
}

export interface BuildProIntentWeeklyDigestSummaryParams {
  enabled: boolean;
  telemetryEvents: unknown;
  now: number;
  lookbackDays?: number;
  maxEvents?: number;
}

export type I18nGetMessage = (key: string, substitutions?: string | string[]) => string;

export interface ProIntentWeeklyDigestEnvInfo {
  extensionVersion: string;
  exportedAt: number;
  isAnonymousUsageDataEnabled: boolean;
}

function safeGetMessage(getMessage: I18nGetMessage, key: string, substitutions?: string | string[]) {
  const message = getMessage(key, substitutions);
  return message || key;
}

function isProIntentWeeklyDigestEventName(name: unknown): name is ProIntentWeeklyDigestEventName {
  return typeof name === 'string' && (PRO_INTENT_WEEKLY_DIGEST_EVENT_NAMES as readonly string[]).includes(name);
}

function isProIntentWeeklyDigestSource(value: unknown): value is ProIntentWeeklyDigestSource {
  return value === 'popup' || value === 'options';
}

function createEmptyCounts(): ProIntentWeeklyDigestCounts {
  return {
    pro_entry_opened: 0,
    pro_waitlist_opened: 0,
    pro_waitlist_copied: 0,
    pro_waitlist_survey_copied: 0
  };
}

function createEmptyCampaignCounts(): ProIntentWeeklyDigestCampaignCounts {
  return {
    pro_waitlist_copied: 0,
    pro_waitlist_survey_copied: 0
  };
}

function roundTo4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function safeRate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  const value = numerator / denominator;
  if (!Number.isFinite(value) || value < 0) return null;
  return roundTo4(value);
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

export function buildProIntentWeeklyDigestSummary(params: BuildProIntentWeeklyDigestSummaryParams): ProIntentWeeklyDigestSummary {
  const now = clampNow(params.now);
  const lookbackDays = clampLookbackDays(params.lookbackDays);
  const maxEvents = clampMaxEvents(params.maxEvents);

  const to = now;
  const from = now - lookbackDays * 24 * 60 * 60 * 1000;

  const window = {
    from,
    to,
    lookbackDays,
    maxEvents,
    policy: 'fifo' as const,
    scope: 'last_n_days_within_current_window_only' as const
  };

  const bySource: Record<ProIntentWeeklyDigestSource, ProIntentWeeklyDigestCounts> = {
    popup: createEmptyCounts(),
    options: createEmptyCounts()
  };
  const overall = createEmptyCounts();
  const rates: ProIntentWeeklyDigestRates = {
    waitlist_opened_per_entry_opened: null,
    waitlist_copied_per_waitlist_opened: null,
    survey_copied_per_entry_opened: null
  };
  const byCampaign: Record<string, ProIntentWeeklyDigestCampaignCounts> = {};

  if (!params.enabled) {
    return {
      enabled: false,
      disabledReason: 'anonymous_usage_data_disabled',
      window,
      bySource,
      overall,
      rates,
      byCampaign
    };
  }

  const sanitized = sanitizeTelemetryEvents(params.telemetryEvents);
  const trimmed = trimTelemetryEvents(sanitized, maxEvents);

  for (const event of trimmed) {
    if (!isProIntentWeeklyDigestEventName(event.name)) continue;
    if (!isInWindow(event.ts, from, to)) continue;

    const source = event.props?.source;
    if (!isProIntentWeeklyDigestSource(source)) continue;

    bySource[source][event.name] += 1;
    overall[event.name] += 1;

    if (event.name === 'pro_waitlist_copied' || event.name === 'pro_waitlist_survey_copied') {
      const campaign = typeof event.props?.campaign === 'string' && event.props.campaign ? event.props.campaign : NO_CAMPAIGN_BUCKET_KEY;
      if (!byCampaign[campaign]) byCampaign[campaign] = createEmptyCampaignCounts();
      byCampaign[campaign][event.name] += 1;
    }
  }

  rates.waitlist_opened_per_entry_opened = safeRate(overall.pro_waitlist_opened, overall.pro_entry_opened);
  rates.waitlist_copied_per_waitlist_opened = safeRate(overall.pro_waitlist_copied, overall.pro_waitlist_opened);
  rates.survey_copied_per_entry_opened = safeRate(overall.pro_waitlist_survey_copied, overall.pro_entry_opened);

  return {
    enabled: true,
    window,
    bySource,
    overall,
    rates,
    byCampaign
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatLocalDateTime(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function formatUtcOffset(ts: number): string {
  const d = new Date(ts);
  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = pad2(Math.floor(abs / 60));
  const mm = pad2(abs % 60);
  return `UTC${sign}${hh}:${mm}`;
}

function formatRate(value: number | null): string {
  return value === null ? 'N/A' : String(value);
}

function renderBySourceRow(source: ProIntentWeeklyDigestSource, counts: ProIntentWeeklyDigestCounts): string {
  return `| ${source} | ${counts.pro_entry_opened} | ${counts.pro_waitlist_opened} | ${counts.pro_waitlist_copied} | ${counts.pro_waitlist_survey_copied} |`;
}

function renderCampaignRow(campaign: string, counts: ProIntentWeeklyDigestCampaignCounts): string {
  return `| ${campaign} | ${counts.pro_waitlist_copied} | ${counts.pro_waitlist_survey_copied} |`;
}

export function formatProIntentWeeklyDigestMarkdown(params: {
  summary: ProIntentWeeklyDigestSummary;
  env: ProIntentWeeklyDigestEnvInfo;
  getMessage: I18nGetMessage;
}): string {
  const { summary, env, getMessage } = params;

  const lines: string[] = [];
  lines.push(
    `# ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdTitle', String(summary.window.lookbackDays))}`
  );
  lines.push('');

  if (!summary.enabled) {
    lines.push(`> ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdTelemetryOffNotice')}`);
    lines.push('');
    lines.push(`## ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdSectionEnv')}`);
    lines.push(`- extensionVersion: ${env.extensionVersion || ''}`);
    lines.push(
      `- exportedAt: ${formatLocalDateTime(env.exportedAt)} (${formatUtcOffset(env.exportedAt)}) (${env.exportedAt})`
    );
    lines.push(`- anonymousUsageData: ${env.isAnonymousUsageDataEnabled ? 'ON' : 'OFF'}`);
    lines.push('');
    lines.push(`## ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdSectionPrivacy')}`);
    lines.push(safeGetMessage(getMessage, 'proIntentWeeklyDigestMdPrivacyStatement'));
    lines.push('');
    return `${lines.join('\n')}\n`;
  }

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdSectionWindow')}`);
  lines.push(`- from: ${formatLocalDateTime(summary.window.from)} (${formatUtcOffset(summary.window.from)})`);
  lines.push(`- to: ${formatLocalDateTime(summary.window.to)} (${formatUtcOffset(summary.window.to)})`);
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdSectionCountsOverall')}`);
  lines.push(`- pro_entry_opened: ${summary.overall.pro_entry_opened}`);
  lines.push(`- pro_waitlist_opened: ${summary.overall.pro_waitlist_opened}`);
  lines.push(`- pro_waitlist_copied: ${summary.overall.pro_waitlist_copied}`);
  lines.push(`- pro_waitlist_survey_copied: ${summary.overall.pro_waitlist_survey_copied}`);
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdSectionCountsBySource')}`);
  const bySourceHeaderCells = [
    'source',
    'pro_entry_opened',
    'pro_waitlist_opened',
    'pro_waitlist_copied',
    'pro_waitlist_survey_copied'
  ];
  lines.push(`| ${bySourceHeaderCells.join(' | ')} |`);
  lines.push(`| ${bySourceHeaderCells.map(() => '---').join(' | ')} |`);
  lines.push(renderBySourceRow('popup', summary.bySource.popup));
  lines.push(renderBySourceRow('options', summary.bySource.options));
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdSectionRatesOverall')}`);
  lines.push(`- waitlist_opened_per_entry_opened: ${formatRate(summary.rates.waitlist_opened_per_entry_opened)}`);
  lines.push(`- waitlist_copied_per_waitlist_opened: ${formatRate(summary.rates.waitlist_copied_per_waitlist_opened)}`);
  lines.push(`- survey_copied_per_entry_opened: ${formatRate(summary.rates.survey_copied_per_entry_opened)}`);
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdSectionEnv')}`);
  lines.push(`- extensionVersion: ${env.extensionVersion || ''}`);
  lines.push(
    `- exportedAt: ${formatLocalDateTime(env.exportedAt)} (${formatUtcOffset(env.exportedAt)}) (${env.exportedAt})`
  );
  lines.push(`- anonymousUsageData: ${env.isAnonymousUsageDataEnabled ? 'ON' : 'OFF'}`);
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdSectionPrivacy')}`);
  lines.push(safeGetMessage(getMessage, 'proIntentWeeklyDigestMdPrivacyStatement'));
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentWeeklyDigestMdSectionCampaignBreakdown')}`);
  const campaignHeaderCells = ['campaign', 'pro_waitlist_copied', 'pro_waitlist_survey_copied'];
  lines.push(`| ${campaignHeaderCells.join(' | ')} |`);
  lines.push(`| ${campaignHeaderCells.map(() => '---').join(' | ')} |`);
  const campaignKeys = Object.keys(summary.byCampaign);
  campaignKeys.sort((a, b) => {
    const aTotal = summary.byCampaign[a].pro_waitlist_copied + summary.byCampaign[a].pro_waitlist_survey_copied;
    const bTotal = summary.byCampaign[b].pro_waitlist_copied + summary.byCampaign[b].pro_waitlist_survey_copied;
    if (bTotal !== aTotal) return bTotal - aTotal;
    const aName = a === NO_CAMPAIGN_BUCKET_KEY ? '~' : a;
    const bName = b === NO_CAMPAIGN_BUCKET_KEY ? '~' : b;
    return aName.localeCompare(bName);
  });
  for (const campaign of campaignKeys) {
    const displayCampaign =
      campaign === NO_CAMPAIGN_BUCKET_KEY ? safeGetMessage(getMessage, 'proIntentWeeklyDigestMdCampaignNone') : campaign;
    lines.push(renderCampaignRow(displayCampaign, summary.byCampaign[campaign]));
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
}

export function filterProIntentWeeklyDigestEventsInWindow(params: {
  telemetryEvents: unknown;
  from: number;
  to: number;
  maxEvents?: number;
}): TelemetryEvent[] {
  const maxEvents = clampMaxEvents(params.maxEvents);
  const sanitized = sanitizeTelemetryEvents(params.telemetryEvents);
  const trimmed = trimTelemetryEvents(sanitized, maxEvents);
  return trimmed.filter((event) => {
    if (!isProIntentWeeklyDigestEventName(event.name)) return false;
    if (!isInWindow(event.ts, params.from, params.to)) return false;
    const source = event.props?.source;
    return isProIntentWeeklyDigestSource(source);
  });
}
