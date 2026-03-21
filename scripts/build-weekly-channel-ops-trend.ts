import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS } from '../src/shared/pro-distribution-by-campaign-csv.ts';
import { PRO_INTENT_EVENTS_CSV_COLUMNS } from '../src/shared/pro-intent-events-csv.ts';

type WeeklyOpsRow = Readonly<{
  campaign: string;
  leads: number;
  distCopies: number;
  leadsPerDistCopy: string;
}>;

type WeeklyOpsEnv = Readonly<{
  extensionVersion: string;
  exportedAt: number;
  lookbackDays: number;
  windowFrom: number;
  windowTo: number;
  isAnonymousUsageDataEnabled: boolean;
}>;

type WeeklyOpsEvidencePack = Readonly<{
  packVersion: string;
  env: WeeklyOpsEnv;
  assets: Readonly<{
    acquisitionEfficiencyEvidencePack: Readonly<{
      rows: WeeklyOpsRow[];
    }>;
    proDistributionByCampaign7dCsv: string;
    proIntentEvents7dCsv: string;
  }>;
}>;

export type WeeklyChannelOpsTrendRow = Readonly<{
  weekEndDate: string;
  evidencePackFilename: string;
  exportedAtIso: string;
  extensionVersion: string;
  lookbackDays: number;
  windowFromIso: string;
  windowToIso: string;
  campaigns: string[];
  distCopies: number;
  leads: number;
  leadsPerDistCopy: string;
  campaignsCount: number;
  nonEmptyCampaignsCount: number;
  verify: 'PASS' | 'FAIL';
  verifyHint?: string;
  rows: WeeklyOpsRow[];
}>;

const DEFAULT_EVIDENCE_DIR = 'docs/evidence/v1-65';
const EVIDENCE_PACK_PREFIX = 'copylot-pro-weekly-channel-ops-evidence-pack-';
const EVIDENCE_PACK_SUFFIX = '.on.json';
const EMPTY_CAMPAIGN_BUCKET_LABEL = '空 campaign';
const UTC_OFFSET_MINUTES = 8 * 60; // 固定口径：UTC+08:00（避免依赖运行机器时区）

function formatIso8601WithFixedOffset(tsMs: number, offsetMinutes: number = UTC_OFFSET_MINUTES): string {
  const shifted = new Date(tsMs + offsetMinutes * 60 * 1000);
  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const min = String(shifted.getUTCMinutes()).padStart(2, '0');
  const ss = String(shifted.getUTCSeconds()).padStart(2, '0');

  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const offH = String(Math.floor(abs / 60)).padStart(2, '0');
  const offM = String(abs % 60).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}${sign}${offH}:${offM}`;
}

function formatYyyyMmDdWithFixedOffset(tsMs: number, offsetMinutes: number = UTC_OFFSET_MINUTES): string {
  const shifted = new Date(tsMs + offsetMinutes * 60 * 1000);
  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseCsvLines(csv: string): string[] {
  return String(csv || '')
    .trim()
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function parseCsvRow(line: string): string[] {
  // Campaign is strictly sanitized (no commas). Other cells are numbers/ids without commas.
  return String(line || '').split(',');
}

function recomputeLeadsPerDistCopy(leads: number, distCopies: number): string {
  if (!Number.isFinite(leads) || !Number.isFinite(distCopies) || distCopies <= 0) return 'N/A';
  return (leads / distCopies).toFixed(4);
}

function verifyWeeklyOpsEvidencePack(pack: WeeklyOpsEvidencePack, hint: string) {
  assert.equal(pack.packVersion, 'v1-63', `${hint}: packVersion should be v1-63`);

  const rows = pack.assets?.acquisitionEfficiencyEvidencePack?.rows ?? [];
  assert.ok(Array.isArray(rows), `${hint}: rows should be an array`);
  assert.ok(rows.length >= 1, `${hint}: rows should not be empty`);

  // PRD sampling constraints: >=2 non-empty campaigns + empty bucket + distCopies=0 control + at least one real closed loop
  const hasEmptyCampaign = rows.some((r) => r.campaign === EMPTY_CAMPAIGN_BUCKET_LABEL);
  assert.ok(hasEmptyCampaign, `${hint}: should include empty campaign bucket label "${EMPTY_CAMPAIGN_BUCKET_LABEL}"`);
  const nonEmptyCampaigns = new Set(rows.map((r) => r.campaign).filter((c) => c !== EMPTY_CAMPAIGN_BUCKET_LABEL));
  assert.ok(nonEmptyCampaigns.size >= 2, `${hint}: should include at least 2 non-empty campaigns`);
  assert.ok(
    rows.some((r) => Number(r.distCopies) === 0),
    `${hint}: should include at least one distCopies=0 control row`
  );
  assert.ok(
    rows.some((r) => Number(r.distCopies) >= 1 && Number(r.leads) >= 1),
    `${hint}: should include at least one campaign with distCopies>=1 and leads>=1`
  );

  // Mutual verification #1: leadsPerDistCopy can be recomputed from rows
  for (const row of rows) {
    const leads = Number(row.leads);
    const distCopies = Number(row.distCopies);
    assert.ok(Number.isInteger(leads), `${hint}: leads should be integer for campaign=${row.campaign}`);
    assert.ok(Number.isInteger(distCopies), `${hint}: distCopies should be integer for campaign=${row.campaign}`);
    assert.equal(
      row.leadsPerDistCopy,
      recomputeLeadsPerDistCopy(leads, distCopies),
      `${hint}: leadsPerDistCopy mismatch for campaign=${row.campaign}`
    );
  }

  // Mutual verification #2: distCopies totals should match v1-57 CSV (sum of distCopies column)
  const distLines = parseCsvLines(pack.assets.proDistributionByCampaign7dCsv);
  assert.equal(
    distLines[0],
    PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS.join(','),
    `${hint}: proDistributionByCampaign7dCsv header mismatch`
  );
  const distHeader = parseCsvRow(distLines[0]);
  const distCampaignIndex = distHeader.indexOf('campaign');
  const distCopiesIndex = distHeader.indexOf('distCopies');
  assert.ok(distCampaignIndex >= 0, `${hint}: campaign column not found in dist CSV`);
  assert.ok(distCopiesIndex >= 0, `${hint}: distCopies column not found in dist CSV`);

  let distCopiesSum = 0;
  const distByCampaign: Record<string, number> = {};
  for (const line of distLines.slice(1)) {
    const cells = parseCsvRow(line);
    const campaign = cells[distCampaignIndex] || '';
    const distCopies = Number(cells[distCopiesIndex] || 0);
    distCopiesSum += distCopies;
    distByCampaign[campaign] = distCopies;
  }
  const rowsDistCopiesSum = rows.reduce((acc, row) => acc + Number(row.distCopies), 0);
  assert.equal(rowsDistCopiesSum, distCopiesSum, `${hint}: distCopies sum mismatch (rows <-> dist CSV)`);
  for (const row of rows) {
    assert.equal(
      Number(row.distCopies),
      distByCampaign[row.campaign] ?? 0,
      `${hint}: distCopies mismatch for campaign=${row.campaign} (rows <-> dist CSV)`
    );
  }

  // Mutual verification #3: leads totals should match v1-51 event CSV (count lead events)
  const intentLines = parseCsvLines(pack.assets.proIntentEvents7dCsv);
  assert.equal(
    intentLines[0],
    PRO_INTENT_EVENTS_CSV_COLUMNS.join(','),
    `${hint}: proIntentEvents7dCsv header mismatch`
  );
  const intentHeader = parseCsvRow(intentLines[0]);
  const eventNameIndex = intentHeader.indexOf('eventName');
  assert.ok(eventNameIndex >= 0, `${hint}: eventName column not found in intent CSV`);

  let leadsFromEvents = 0;
  for (const line of intentLines.slice(1)) {
    const cells = parseCsvRow(line);
    const eventName = cells[eventNameIndex] || '';
    if (eventName === 'pro_waitlist_copied' || eventName === 'pro_waitlist_survey_copied') leadsFromEvents += 1;
  }
  const rowsLeadsSum = rows.reduce((acc, row) => acc + Number(row.leads), 0);
  assert.equal(rowsLeadsSum, leadsFromEvents, `${hint}: leads sum mismatch (rows <-> intent events CSV)`);
}

function computeDeltaNumber(current: number, prev: number | null): string {
  if (prev === null) return 'N/A';
  const delta = current - prev;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}`;
}

function computeDeltaRate(current: string, prev: string | null): string {
  if (!prev) return 'N/A';
  if (current === 'N/A' || prev === 'N/A') return 'N/A';
  const curNum = Number(current);
  const prevNum = Number(prev);
  if (!Number.isFinite(curNum) || !Number.isFinite(prevNum)) return 'N/A';
  const delta = curNum - prevNum;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(4)}`;
}

function buildTrendCsv(rows: WeeklyChannelOpsTrendRow[]): string {
  const header = 'weekEndDate,distCopies,leads,leadsPerDistCopy,campaignsCount,nonEmptyCampaignsCount';
  const lines = [header];
  for (const row of rows) {
    lines.push(
      [
        row.weekEndDate,
        String(row.distCopies),
        String(row.leads),
        row.leadsPerDistCopy,
        String(row.campaignsCount),
        String(row.nonEmptyCampaignsCount)
      ].join(',')
    );
  }
  return `${lines.join('\n')}\n`;
}

function buildIndexMarkdown(evidenceDir: string, rows: WeeklyChannelOpsTrendRow[]): string {
  const installMethod =
    '使用仓库内最新 `plugin-*.zip` 解压后以 unpacked 方式加载（禁止用 `src/` 开发态代替验收）';

  const lines: string[] = [];
  lines.push('# V1-65 真实渠道跑数持续化：周度证据归档规范 + 趋势索引（可审计）');
  lines.push('');
  lines.push(`- 证据目录：\`${evidenceDir.replace(/\\/g, '/')}/\``);
  lines.push(`- 生成脚本：\`scripts/build-weekly-channel-ops-trend.ts\``);
  lines.push(`- 互证断言口径：\`scripts/verify-weekly-channel-ops-evidence-pack.ts\``);
  lines.push(
    '- 约束：仅使用证据包内聚合 `rows` + `env`（以及互证所需的两份 CSV）；不得读取/推断 URL/标题/网页内容/复制内容。'
  );
  lines.push('');

  lines.push('## 趋势表（按 weekEndDate 升序）');
  lines.push('');
  lines.push('| weekEndDate | distCopies | leads | leadsPerDistCopy | campaignsCount | nonEmptyCampaignsCount | verify |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const row of rows) {
    lines.push(
      `| ${row.weekEndDate} | ${row.distCopies} | ${row.leads} | ${row.leadsPerDistCopy} | ${row.campaignsCount} | ${row.nonEmptyCampaignsCount} | ${row.verify} |`
    );
  }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] as WeeklyChannelOpsTrendRow;
    const prev = i >= 1 ? (rows[i - 1] as WeeklyChannelOpsTrendRow) : null;

    lines.push('');
    lines.push(`## ${row.weekEndDate}`);
    lines.push('');
    lines.push(`- 生成时间：${row.exportedAtIso}`);
    lines.push(`- 扩展版本号：\`${row.extensionVersion}\``);
    lines.push(`- 安装方式（验收口径）：${installMethod}`);
    lines.push(
      `- 导出窗口（${row.lookbackDays}d）：${row.windowFromIso} ~ ${row.windowToIso}`
    );
    lines.push(
      `- 本周 campaign（可公开测试标识）：${row.campaigns.map((c) => `\`${c}\``).join(' / ')}`
    );
    lines.push(`- 证据包文件：\`${row.evidencePackFilename}\``);

    lines.push('');
    lines.push('### Baseline（按 campaign）');
    lines.push('');
    lines.push('| campaign | distCopies | leads | leadsPerDistCopy |');
    lines.push('| --- | --- | --- | --- |');
    for (const r of row.rows) {
      lines.push(`| ${r.campaign} | ${r.distCopies} | ${r.leads} | ${r.leadsPerDistCopy} |`);
    }

    lines.push('');
    lines.push('### 与上一周对比 delta（总计）');
    lines.push('');
    lines.push(`- distCopies：${computeDeltaNumber(row.distCopies, prev ? prev.distCopies : null)}`);
    lines.push(`- leads：${computeDeltaNumber(row.leads, prev ? prev.leads : null)}`);
    lines.push(
      `- leadsPerDistCopy：${computeDeltaRate(row.leadsPerDistCopy, prev ? prev.leadsPerDistCopy : null)}`
    );

    lines.push('');
    lines.push('### 互证复核结论（rows <-> 两份 CSV）');
    lines.push('');
    if (row.verify === 'PASS') {
      lines.push(`- 结论：PASS（断言口径见 \`scripts/verify-weekly-channel-ops-evidence-pack.ts\`）`);
    } else {
      lines.push(`- 结论：FAIL（断言口径见 \`scripts/verify-weekly-channel-ops-evidence-pack.ts\`）`);
      if (row.verifyHint) lines.push(`- 失败原因：${row.verifyHint}`);
    }

    lines.push('');
    lines.push('### 截图索引（入口位置 + 文件下载落地）');
    lines.push('');
    const date = row.weekEndDate;
    lines.push(`1. \`screenshots/01-privacy-pro-weekly-channel-ops-evidence-pack-download-entry-${date}.png\``);
    lines.push('   - 断言：Options -> 隐私与可观测性 -> Pro 面板存在稳定入口 `#download-pro-weekly-channel-ops-evidence-pack`。');
    lines.push(`2. \`screenshots/02-privacy-pro-weekly-channel-ops-evidence-pack-on-downloaded-${date}.png\``);
    lines.push(`   - 断言：下载落地成功，文件名可见 \`${row.evidencePackFilename}\`。`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('输出文件：');
  lines.push(`- \`${evidenceDir.replace(/\\/g, '/')}/index.md\``);
  lines.push(`- \`${evidenceDir.replace(/\\/g, '/')}/trend.csv\``);
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function resolveEvidencePackFiles(evidenceDirAbs: string): Promise<string[]> {
  const entries = await fs.readdir(evidenceDirAbs);
  return entries
    .filter((name) => name.startsWith(EVIDENCE_PACK_PREFIX) && name.endsWith(EVIDENCE_PACK_SUFFIX))
    .map((name) => path.join(evidenceDirAbs, name))
    .sort();
}

export async function buildWeeklyChannelOpsTrend(
  evidenceDir: string = DEFAULT_EVIDENCE_DIR
): Promise<{ rows: WeeklyChannelOpsTrendRow[]; indexMarkdown: string; trendCsv: string }> {
  const evidenceDirAbs = path.resolve(process.cwd(), evidenceDir);
  await fs.mkdir(evidenceDirAbs, { recursive: true });

  const packFilesAbs = await resolveEvidencePackFiles(evidenceDirAbs);
  assert.ok(packFilesAbs.length >= 1, 'No evidence pack files found to build trend');

  const trendRows: WeeklyChannelOpsTrendRow[] = [];
  for (const filePathAbs of packFilesAbs) {
    const content = await fs.readFile(filePathAbs, 'utf-8');
    const parsed = JSON.parse(content) as WeeklyOpsEvidencePack;

    const env = parsed.env;
    const rows = parsed.assets?.acquisitionEfficiencyEvidencePack?.rows ?? [];
    assert.ok(Array.isArray(rows), `rows should be an array: ${path.basename(filePathAbs)}`);
    assert.ok(rows.length >= 1, `rows should not be empty: ${path.basename(filePathAbs)}`);

    const windowTo = Number(env.windowTo) || Number(env.exportedAt) || 0;
    const weekEndDate = formatYyyyMmDdWithFixedOffset(windowTo);

    const campaigns = rows.map((r) => String(r.campaign || ''));
    const campaignsCount = new Set(campaigns).size;
    const nonEmptyCampaignsCount = new Set(campaigns.filter((c) => c !== EMPTY_CAMPAIGN_BUCKET_LABEL)).size;

    const distCopies = rows.reduce((acc, r) => acc + Number(r.distCopies || 0), 0);
    const leads = rows.reduce((acc, r) => acc + Number(r.leads || 0), 0);
    const leadsPerDistCopy = recomputeLeadsPerDistCopy(leads, distCopies);

    let verify: 'PASS' | 'FAIL' = 'PASS';
    let verifyHint: string | undefined;
    try {
      verifyWeeklyOpsEvidencePack(parsed, path.relative(process.cwd(), filePathAbs));
    } catch (error) {
      verify = 'FAIL';
      verifyHint = error instanceof Error ? error.message : String(error);
    }

    trendRows.push({
      weekEndDate,
      evidencePackFilename: path.basename(filePathAbs),
      exportedAtIso: formatIso8601WithFixedOffset(Number(env.exportedAt) || windowTo),
      extensionVersion: String(env.extensionVersion || ''),
      lookbackDays: Number(env.lookbackDays) || 7,
      windowFromIso: formatIso8601WithFixedOffset(Number(env.windowFrom) || 0),
      windowToIso: formatIso8601WithFixedOffset(Number(env.windowTo) || 0),
      campaigns,
      distCopies,
      leads,
      leadsPerDistCopy,
      campaignsCount,
      nonEmptyCampaignsCount,
      verify,
      verifyHint,
      rows
    });
  }

  const sorted = trendRows
    .slice()
    .sort((a, b) => a.weekEndDate.localeCompare(b.weekEndDate) || a.evidencePackFilename.localeCompare(b.evidencePackFilename));

  const evidenceDirNormalized = path.relative(process.cwd(), evidenceDirAbs) || evidenceDir;
  const indexMarkdown = buildIndexMarkdown(evidenceDirNormalized.replace(/\\/g, '/'), sorted);
  const trendCsv = buildTrendCsv(sorted);

  await fs.writeFile(path.join(evidenceDirAbs, 'index.md'), indexMarkdown, 'utf-8');
  await fs.writeFile(path.join(evidenceDirAbs, 'trend.csv'), trendCsv, 'utf-8');

  return { rows: sorted, indexMarkdown, trendCsv };
}

async function main() {
  const evidenceDir = process.argv[2] || DEFAULT_EVIDENCE_DIR;
  await buildWeeklyChannelOpsTrend(evidenceDir);
}

const invokedAsScript = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
