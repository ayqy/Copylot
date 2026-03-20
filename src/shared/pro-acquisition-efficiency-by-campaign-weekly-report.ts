import { buildProAcquisitionEfficiencyByCampaignCsv } from './pro-acquisition-efficiency-by-campaign-csv.ts';

export type I18nGetMessage = (key: string, substitutions?: string | string[]) => string;

export interface ProAcquisitionEfficiencyByCampaignWeeklyReportEnvInfo {
  extensionVersion: string;
  exportedAt: number;
  isAnonymousUsageDataEnabled: boolean;
}

export interface ProAcquisitionEfficiencyByCampaignWeeklyReportRow {
  campaign: string;
  leads: number;
  distCopies: number;
  leadsPerDistCopy: string;
}

export interface ProAcquisitionEfficiencyByCampaignWeeklyReportSummary {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  windowFrom: number;
  windowTo: number;
  lookbackDays: number;
  maxEvents: number;
  emptyCampaignBucketLabel: string;
  rows: ProAcquisitionEfficiencyByCampaignWeeklyReportRow[];
}

export interface BuildProAcquisitionEfficiencyByCampaignWeeklyReportSummaryParams {
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

function renderRow(row: ProAcquisitionEfficiencyByCampaignWeeklyReportRow): string {
  const cells = [escapeMdCell(row.campaign), String(row.leads), String(row.distCopies), escapeMdCell(row.leadsPerDistCopy)];
  return `| ${cells.join(' | ')} |`;
}

export function buildProAcquisitionEfficiencyByCampaignWeeklyReportSummary(
  params: BuildProAcquisitionEfficiencyByCampaignWeeklyReportSummaryParams
): ProAcquisitionEfficiencyByCampaignWeeklyReportSummary {
  const emptyCampaignBucketLabel =
    typeof params.emptyCampaignBucketLabel === 'string' && params.emptyCampaignBucketLabel.trim().length > 0
      ? params.emptyCampaignBucketLabel.trim()
      : 'N/A';

  const built = buildProAcquisitionEfficiencyByCampaignCsv({
    enabled: params.enabled,
    telemetryEvents: params.telemetryEvents,
    now: params.now,
    extensionVersion: params.extensionVersion || '',
    emptyCampaignBucketLabel,
    lookbackDays: params.lookbackDays,
    maxEvents: params.maxEvents
  });

  const rows: ProAcquisitionEfficiencyByCampaignWeeklyReportRow[] = built.rows.map((row) => ({
    campaign: row.campaign,
    leads: row.leads,
    distCopies: row.distCopies,
    leadsPerDistCopy: row.leadsPerDistCopy
  }));

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

export function formatProAcquisitionEfficiencyByCampaignWeeklyReportMarkdown(params: {
  summary: ProAcquisitionEfficiencyByCampaignWeeklyReportSummary;
  env: ProAcquisitionEfficiencyByCampaignWeeklyReportEnvInfo;
  getMessage: I18nGetMessage;
}): string {
  const { summary, env, getMessage } = params;

  const lines: string[] = [];
  lines.push(
    `# ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdTitle', String(summary.lookbackDays))}`
  );
  lines.push('');

  if (!summary.enabled) {
    lines.push(`> ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMd' + 'TelemetryOffNotice')}`);
    lines.push('');

    lines.push(`## ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdSectionEnv')}`);
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

    lines.push(`## ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdSectionPrivacy')}`);
    lines.push(safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdPrivacyStatement'));
    lines.push('');
    return `${lines.join('\n')}\n`;
  }

  lines.push(`## ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdSectionEnv')}`);
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

  lines.push(`## ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdSectionTable')}`);
  const headerCells = ['campaign', 'leads', 'distCopies', 'leadsPerDistCopy'];
  lines.push(`| ${headerCells.join(' | ')} |`);
  lines.push(`| ${headerCells.map(() => '---').join(' | ')} |`);
  for (const row of summary.rows) {
    lines.push(renderRow(row));
  }
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdSectionInsights')}`);
  const ranked = summary.rows.filter((r) => r.campaign !== summary.emptyCampaignBucketLabel);
  const top1 = ranked[0] || null;

  const totalLeads = summary.rows.reduce((acc, r) => acc + r.leads, 0);
  const emptyRow = summary.rows.find((r) => r.campaign === summary.emptyCampaignBucketLabel) || null;
  const emptyLeads = emptyRow ? emptyRow.leads : 0;
  const emptyShare = safeRate(emptyLeads, totalLeads);

  lines.push(
    `- ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdInsightTop1', [
      top1 ? top1.campaign : 'N/A'
    ])}`
  );
  lines.push(
    `- ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdInsight' + 'Top1Metrics', [
      top1 ? String(top1.leads) : '0',
      top1 ? String(top1.distCopies) : '0',
      top1 ? top1.leadsPerDistCopy : 'N/A'
    ])}`
  );
  lines.push(
    `- ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdInsight' + 'EmptyShare', [
      formatPercent(emptyShare),
      String(emptyLeads),
      String(totalLeads)
    ])}`
  );
  lines.push('');

  lines.push(`## ${safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdSectionPrivacy')}`);
  lines.push(safeGetMessage(getMessage, 'proAcqEffByCampaignWeeklyReportMdPrivacyStatement'));
  lines.push('');

  return `${lines.join('\n')}\n`;
}
