import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS } from '../src/shared/pro-distribution-by-campaign-csv.ts';
import { PRO_INTENT_EVENTS_CSV_COLUMNS } from '../src/shared/pro-intent-events-csv.ts';

type WeeklyOpsRow = Readonly<{
  campaign: string;
  leads: number;
  distCopies: number;
  leadsPerDistCopy: string;
}>;

type WeeklyOpsEvidencePack = Readonly<{
  packVersion: string;
  assets: Readonly<{
    acquisitionEfficiencyEvidencePack: Readonly<{
      rows: WeeklyOpsRow[];
    }>;
    proDistributionByCampaign7dCsv: string;
    proIntentEvents7dCsv: string;
  }>;
}>;

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
  const hasEmptyCampaign = rows.some((r) => r.campaign === '空 campaign');
  assert.ok(hasEmptyCampaign, `${hint}: should include empty campaign bucket label "空 campaign"`);
  const nonEmptyCampaigns = new Set(rows.map((r) => r.campaign).filter((c) => c !== '空 campaign'));
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

async function resolveTargets(args: string[]): Promise<string[]> {
  const inputTargets = args.length > 0 ? args : ['docs/evidence/v1-64'];
  const resolved: string[] = [];

  for (const input of inputTargets) {
    const abs = path.resolve(process.cwd(), input);
    const stat = await fs.stat(abs);

    if (stat.isFile()) {
      resolved.push(abs);
      continue;
    }

    if (!stat.isDirectory()) continue;

    const entries = await fs.readdir(abs);
    for (const name of entries) {
      if (!name.startsWith('copylot-pro-weekly-channel-ops-evidence-pack-')) continue;
      if (!name.endsWith('.on.json')) continue;
      resolved.push(path.join(abs, name));
    }
  }

  return resolved;
}

async function main() {
  const targets = await resolveTargets(process.argv.slice(2));
  assert.ok(targets.length > 0, 'No evidence pack files found to verify');

  for (const filePath of targets) {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content) as WeeklyOpsEvidencePack;
    verifyWeeklyOpsEvidencePack(parsed, path.relative(process.cwd(), filePath));
  }

  console.log(`PASS (${targets.length} files)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

