import { buildProIntentByCampaignCsv } from './pro-intent-by-campaign-csv.ts';

export type I18nGetMessage = (key: string, substitutions?: string | string[]) => string;

export interface ProIntentByCampaignWeeklyReportEnvInfo {
  extensionVersion: string;
  exportedAt: number;
  isAnonymousUsageDataEnabled: boolean;
}

export interface ProIntentByCampaignWeeklyReportRow {
  campaign: string;
  pro_entry_opened: number;
  pro_waitlist_opened: number;
  pro_waitlist_copied: number;
  pro_waitlist_survey_copied: number;
  leads: number;
  leads_per_entry_opened: number | null;
}

export interface ProIntentByCampaignWeeklyReportSummary {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  maxEvents: number;
  emptyCampaignBucketLabel: string;
  rows: ProIntentByCampaignWeeklyReportRow[];
}

export interface BuildProIntentByCampaignWeeklyReportSummaryParams {
  enabled: boolean;
  telemetryEvents: unknown;
  now: number;
  extensionVersion: string;
  emptyCampaignBucketLabel?: string;
  lookbackDays?: number;
  maxEvents?: number;
}

function safeGetMessage(getMessage: I18nGetMessage, key: string, substitutions?: string | string[]) {
  const message = getMessage(key, substitutions);
  return message || key;
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

function formatRate(value: number | null): string {
  return value === null ? 'N/A' : String(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return 'N/A';
  const percent = value * 100;
  if (!Number.isFinite(percent) || percent < 0) return 'N/A';
  return `${percent.toFixed(2)}%`;
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

function escapeMdCell(value: string): string {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ').replaceAll('\r', ' ');
}

function renderRow(row: ProIntentByCampaignWeeklyReportRow): string {
  const cells = [
    escapeMdCell(row.campaign),
    String(row.pro_entry_opened),
    String(row.pro_waitlist_opened),
    String(row.pro_waitlist_copied),
    String(row.pro_waitlist_survey_copied),
    String(row.leads),
    formatRate(row.leads_per_entry_opened)
  ];
  return `| ${cells.join(' | ')} |`;
}

export function buildProIntentByCampaignWeeklyReportSummary(
  params: BuildProIntentByCampaignWeeklyReportSummaryParams
): ProIntentByCampaignWeeklyReportSummary {
  const emptyCampaignBucketLabel =
    typeof params.emptyCampaignBucketLabel === 'string' && params.emptyCampaignBucketLabel.trim().length > 0
      ? params.emptyCampaignBucketLabel.trim()
      : 'N/A';

  const built = buildProIntentByCampaignCsv({
    enabled: params.enabled,
    telemetryEvents: params.telemetryEvents,
    now: params.now,
    extensionVersion: params.extensionVersion || '',
    emptyCampaignBucketLabel,
    lookbackDays: params.lookbackDays,
    maxEvents: params.maxEvents
  });

  const rows: ProIntentByCampaignWeeklyReportRow[] = built.rows.map((row) => {
    const leadsPerEntryOpened = safeRate(row.leads, row.proEntryOpened);
    return {
      campaign: row.campaign,
      pro_entry_opened: row.proEntryOpened,
      pro_waitlist_opened: row.proWaitlistOpened,
      pro_waitlist_copied: row.proWaitlistCopied,
      pro_waitlist_survey_copied: row.proWaitlistSurveyCopied,
      leads: row.leads,
      leads_per_entry_opened: leadsPerEntryOpened
    };
  });

  // MUST include the empty campaign row (even when there are no events in-window).
  if (built.enabled && !rows.some((r) => r.campaign === emptyCampaignBucketLabel)) {
    rows.push({
      campaign: emptyCampaignBucketLabel,
      pro_entry_opened: 0,
      pro_waitlist_opened: 0,
      pro_waitlist_copied: 0,
      pro_waitlist_survey_copied: 0,
      leads: 0,
      leads_per_entry_opened: null
    });
  }

  return {
    enabled: built.enabled,
    disabledReason: built.disabledReason,
    windowFrom: built.windowFrom,
    windowTo: built.windowTo,
    lookbackDays: built.lookbackDays,
    maxEvents: built.maxEvents,
    emptyCampaignBucketLabel,
    rows
  };
}

export function formatProIntentByCampaignWeeklyReportMarkdown(params: {
  summary: ProIntentByCampaignWeeklyReportSummary;
  env: ProIntentByCampaignWeeklyReportEnvInfo;
  getMessage: I18nGetMessage;
}): string {
  const { summary, env, getMessage } = params;

  const lines: string[] = [];
  lines.push(
    `# ${safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdTitle', String(summary.lookbackDays))}`
  );
  lines.push('');

  if (!summary.enabled) {
    lines.push(`> ${safeGetMessage(getMessage, 'proIntentByCampWeeklyMdTelemetryOffNotice')}`);
    lines.push('');

    lines.push(`## ${safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdSectionEnv')}`);
    lines.push(`- extensionVersion: ${env.extensionVersion || ''}`);
    lines.push(
      `- exportedAt: ${formatLocalDateTime(env.exportedAt)} (${formatUtcOffset(env.exportedAt)}) (${env.exportedAt})`
    );
    lines.push(`- lookbackDays: ${summary.lookbackDays}`);
    lines.push(
      `- windowFrom: ${formatLocalDateTime(summary.windowFrom)} (${formatUtcOffset(summary.windowFrom)}) (${summary.windowFrom})`
    );
    lines.push(
      `- windowTo: ${formatLocalDateTime(summary.windowTo)} (${formatUtcOffset(summary.windowTo)}) (${summary.windowTo})`
    );
    lines.push(`- anonymousUsageData: ${env.isAnonymousUsageDataEnabled ? 'ON' : 'OFF'}`);
    lines.push('');

    lines.push(`## ${safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdSectionPrivacy')}`);
    lines.push(safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdPrivacyStatement'));
    lines.push('');
    return `${lines.join('\n')}\n`;
  }

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdSectionEnv')}`);
  lines.push(`- extensionVersion: ${env.extensionVersion || ''}`);
  lines.push(
    `- exportedAt: ${formatLocalDateTime(env.exportedAt)} (${formatUtcOffset(env.exportedAt)}) (${env.exportedAt})`
  );
  lines.push(`- lookbackDays: ${summary.lookbackDays}`);
  lines.push(
    `- windowFrom: ${formatLocalDateTime(summary.windowFrom)} (${formatUtcOffset(summary.windowFrom)}) (${summary.windowFrom})`
  );
  lines.push(
    `- windowTo: ${formatLocalDateTime(summary.windowTo)} (${formatUtcOffset(summary.windowTo)}) (${summary.windowTo})`
  );
  lines.push(`- anonymousUsageData: ${env.isAnonymousUsageDataEnabled ? 'ON' : 'OFF'}`);
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdSectionTable')}`);
  const headerCells = [
    'campaign',
    'pro_entry_opened',
    'pro_waitlist_opened',
    'pro_waitlist_copied',
    'pro_waitlist_survey_copied',
    'leads',
    'leads_per_entry_opened'
  ];
  lines.push(`| ${headerCells.join(' | ')} |`);
  lines.push(`| ${headerCells.map(() => '---').join(' | ')} |`);
  for (const row of summary.rows) {
    lines.push(renderRow(row));
  }
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdSectionInsights')}`);
  const ranked = summary.rows.filter((r) => r.campaign !== summary.emptyCampaignBucketLabel);
  ranked.sort((a, b) => {
    if (b.leads !== a.leads) return b.leads - a.leads;
    return a.campaign.localeCompare(b.campaign);
  });
  const top1 = ranked[0] || null;
  const top3 = ranked[2] || null;

  const totalLeads = summary.rows.reduce((acc, r) => acc + r.leads, 0);
  const emptyRow = summary.rows.find((r) => r.campaign === summary.emptyCampaignBucketLabel) || null;
  const emptyLeads = emptyRow ? emptyRow.leads : 0;
  const emptyShare = safeRate(emptyLeads, totalLeads);

  lines.push(
    `- ${safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdInsightTop1', [
      top1 ? top1.campaign : 'N/A',
      top1 ? String(top1.leads) : '0'
    ])}`
  );
  lines.push(
    `- ${safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdInsightTop3', [
      top3 ? top3.campaign : 'N/A',
      top3 ? String(top3.leads) : '0'
    ])}`
  );
  lines.push(
    `- ${safeGetMessage(getMessage, 'proIntentByCampWeeklyMdInsightEmptyShare', [
      formatPercent(emptyShare),
      String(emptyLeads),
      String(totalLeads)
    ])}`
  );
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdSectionPrivacy')}`);
  lines.push(safeGetMessage(getMessage, 'proIntentByCampaignWeeklyReportMdPrivacyStatement'));
  lines.push('');

  return `${lines.join('\n')}\n`;
}
