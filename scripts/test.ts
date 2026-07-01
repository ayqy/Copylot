import { spawn, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

type StepStatus = 'passed' | 'failed' | 'skipped' | 'pending';
type StepCategory = 'quality' | 'build' | 'script' | 'playwright';

interface StepCounts {
  total?: number;
  passed?: number;
  failed?: number;
  skipped?: number;
  flaky?: number;
}

interface StepSummary {
  name: string;
  category: StepCategory;
  status: StepStatus;
  detail?: string;
  counts?: StepCounts;
}

interface HtmlToMarkdownReport {
  total: number;
  passed: number;
  failed: number;
  failedTitles: string[];
}

interface PlaywrightJsonReport {
  suites?: PlaywrightSuite[];
}

interface PlaywrightSuite {
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

interface PlaywrightSpec {
  tests?: PlaywrightProjectTest[];
}

interface PlaywrightProjectTest {
  projectId?: string;
  projectName?: string;
  expectedStatus?: string;
  status?: string;
  results?: Array<{ status?: string }>;
}

const summary: StepSummary[] = [];
const htmlToMarkdownReportPath = path.resolve(process.cwd(), '.tmp_e2e/html-to-markdown-report.json');
const playwrightReportPath = path.resolve(process.cwd(), '.tmp_e2e/report.json');

function runCommand(command: string, args: string[], env?: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...env }
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function ensureProductionZipArtifact(): Promise<void> {
  const rootDir = process.cwd();
  const rootManifest = JSON.parse(await fs.readFile(path.resolve(rootDir, 'manifest.json'), 'utf-8')) as {
    version?: string;
  };
  const version = rootManifest.version;
  if (!version) {
    throw new Error('manifest.json version is required before creating plugin zip artifact');
  }

  const distDir = path.resolve(rootDir, 'dist');
  const zipFileName = `plugin-${version}.zip`;
  const zipFilePath = path.resolve(rootDir, zipFileName);

  await fs.rm(zipFilePath, { force: true });
  execSync(`zip -r ../${zipFileName} .`, { cwd: distDir, stdio: 'inherit' });
}

async function sha256Files(paths: string[]): Promise<string> {
  const hash = createHash('sha256');
  for (const filePath of paths) {
    hash.update(await fs.readFile(filePath));
  }
  return hash.digest('hex');
}

async function assertDeterministic(
  command: string,
  args: string[],
  files: string[],
  errorMessage: string
): Promise<void> {
  await runCommand(command, args);
  const before = await sha256Files(files);
  await runCommand(command, args);
  const after = await sha256Files(files);
  if (before !== after) {
    throw new Error(errorMessage);
  }
}

async function resolvePackFile(indexPath: string, pattern: RegExp, errorMessage: string): Promise<string> {
  const markdown = await fs.readFile(indexPath, 'utf-8');
  const match = markdown.match(pattern);
  if (!match?.[0]) {
    throw new Error(errorMessage);
  }
  return match[0];
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function startStep(name: string, category: StepCategory, detail?: string): StepSummary {
  const step: StepSummary = {
    name,
    category,
    status: 'pending',
    detail
  };
  summary.push(step);
  return step;
}

function skipStep(name: string, category: StepCategory, detail: string): void {
  summary.push({
    name,
    category,
    status: 'skipped',
    detail
  });
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function runStep(step: StepSummary, action: () => Promise<void>): Promise<void> {
  try {
    await action();
    if (step.status === 'pending') {
      step.status = 'passed';
    }
  } catch (error) {
    if (step.status === 'pending') {
      step.status = 'failed';
    }
    if (!step.detail) {
      step.detail = toErrorMessage(error);
    }
    throw error;
  }
}

async function attachHtmlToMarkdownSummary(step: StepSummary): Promise<void> {
  const report = await readJsonFile<HtmlToMarkdownReport>(htmlToMarkdownReportPath);
  if (report) {
    step.counts = {
      total: report.total,
      passed: report.passed,
      failed: report.failed
    };
    if (report.failedTitles.length > 0) {
      step.detail = `failedTitles: ${report.failedTitles.join(', ')}`;
    }
    return;
  }

  const manifest = await readJsonFile<Array<unknown>>(path.resolve(process.cwd(), 'test/test-manifest.json'));
  if (manifest) {
    step.counts = {
      total: manifest.length
    };
  }
}

function classifyPlaywrightTestStatus(test: PlaywrightProjectTest): 'passed' | 'failed' | 'skipped' | 'flaky' {
  const status = test.status;
  if (status === 'skipped') {
    return 'skipped';
  }
  if (status === 'flaky') {
    return 'flaky';
  }
  if (status === 'passed' || status === 'expected') {
    return 'passed';
  }
  if (status === 'failed' || status === 'unexpected' || status === 'timedOut' || status === 'interrupted') {
    return 'failed';
  }

  const resultStatuses = (test.results ?? []).map((result) => result.status);
  if (resultStatuses.includes('failed') || resultStatuses.includes('timedOut') || resultStatuses.includes('interrupted')) {
    return 'failed';
  }
  if (resultStatuses.includes('passed')) {
    return 'passed';
  }
  if (test.expectedStatus === 'skipped') {
    return 'skipped';
  }
  return 'failed';
}

function walkPlaywrightSuites(suites: PlaywrightSuite[] | undefined, visitor: (test: PlaywrightProjectTest) => void): void {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        visitor(test);
      }
    }
    walkPlaywrightSuites(suite.suites, visitor);
  }
}

function summarizePlaywrightProject(report: PlaywrightJsonReport, projectName: string): StepCounts {
  const counts: StepCounts = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0
  };

  walkPlaywrightSuites(report.suites, (test) => {
    if (test.projectName !== projectName && test.projectId !== projectName) {
      return;
    }

    counts.total = (counts.total ?? 0) + 1;
    const outcome = classifyPlaywrightTestStatus(test);
    counts[outcome] = (counts[outcome] ?? 0) + 1;
  });

  return counts;
}

async function attachPlaywrightSummary(step: StepSummary, projectName: string): Promise<void> {
  const report = await readJsonFile<PlaywrightJsonReport>(playwrightReportPath);
  if (!report) {
    return;
  }

  step.counts = summarizePlaywrightProject(report, projectName);
  const archivedReportPath = path.resolve(process.cwd(), `.tmp_e2e/report-${projectName}.json`);
  await fs.mkdir(path.dirname(archivedReportPath), { recursive: true });
  await fs.copyFile(playwrightReportPath, archivedReportPath);
}

function formatCounts(counts: StepCounts | undefined): string | null {
  if (!counts || counts.total === undefined) {
    return null;
  }

  const parts = [`${counts.total} total`];
  if (counts.passed !== undefined) {
    parts.push(`${counts.passed} passed`);
  }
  if ((counts.failed ?? 0) > 0) {
    parts.push(`${counts.failed} failed`);
  }
  if ((counts.flaky ?? 0) > 0) {
    parts.push(`${counts.flaky} flaky`);
  }
  if ((counts.skipped ?? 0) > 0) {
    parts.push(`${counts.skipped} skipped`);
  }
  return parts.join(', ');
}

function printSummary(): void {
  const categoryOrder: StepCategory[] = ['quality', 'build', 'script', 'playwright'];
  const categoryLabels: Record<StepCategory, string> = {
    quality: '门禁校验',
    build: '构建产物',
    script: '脚本测试',
    playwright: 'Playwright'
  };

  console.log('\n=== Copylot Unified Test Summary ===');

  for (const category of categoryOrder) {
    const steps = summary.filter((step) => step.category === category);
    if (steps.length === 0) {
      continue;
    }

    console.log(`\n${categoryLabels[category]}:`);
    for (const step of steps) {
      const extras = [formatCounts(step.counts), step.detail].filter(Boolean).join('; ');
      const suffix = extras ? ` (${extras})` : '';
      console.log(`- ${step.status.toUpperCase()} ${step.name}${suffix}`);
    }
  }

  const passed = summary.filter((step) => step.status === 'passed').length;
  const failed = summary.filter((step) => step.status === 'failed').length;
  const skipped = summary.filter((step) => step.status === 'skipped').length;
  const playwrightTotal = summary
    .filter((step) => step.category === 'playwright')
    .reduce((total, step) => total + (step.counts?.total ?? 0), 0);
  const htmlToMarkdownTotal = summary.find((step) => step.name === 'html-to-markdown-tests')?.counts?.total ?? 0;

  console.log('\n覆盖统计:');
  console.log(`- Playwright: ${playwrightTotal}`);
  console.log(`- HTML->Markdown: ${htmlToMarkdownTotal}`);
  console.log(`\n组结果: ${passed} passed, ${failed} failed, ${skipped} skipped`);
}

async function run(): Promise<void> {
  const skipBuild = process.env.COPYLOT_TEST_SKIP_BUILD === '1';
  const onlyNativeUi = process.env.COPYLOT_TEST_ONLY_NATIVE_UI === '1';
  const nativeUiSupported = process.platform === 'darwin';
  const nativeUiOptIn = process.env.COPYLOT_TEST_NATIVE_UI === '1';
  const skipNativeUi = onlyNativeUi
    ? false
    : process.env.COPYLOT_TEST_NATIVE_UI_SKIP === '1' || !nativeUiSupported || !nativeUiOptIn;

  await runStep(startStep('lint', 'quality'), () => runCommand('npm', ['run', 'lint']));
  await runStep(startStep('type-check', 'quality'), () => runCommand('npm', ['run', 'type-check']));
  await runStep(startStep('check-i18n', 'quality'), () => runCommand('npm', ['run', 'check-i18n']));
  const unitTestsStep = startStep('unit-tests', 'script');
  await runStep(startStep('build-test-manifest', 'build'), () =>
    runCommand('./node_modules/.bin/ts-node', ['scripts/build-test-manifest.ts'])
  );
  await runStep(startStep('scan-cws-listing-redlines', 'quality'), () =>
    assertDeterministic(
      './node_modules/.bin/ts-node',
      ['scripts/scan-cws-listing-redlines.ts'],
      ['docs/evidence/v1-76/index.md', 'docs/evidence/v1-76/cws-listing-redlines-scan.json'],
      'CWS listing redlines scan outputs should be deterministic'
    )
  );
  await runStep(startStep('build-growth-loop-evidence-pack', 'quality'), () =>
    assertDeterministic(
      './node_modules/.bin/ts-node',
      ['scripts/build-growth-loop-evidence-pack.ts'],
      [
        'docs/evidence/v1-75/index.md',
        'docs/evidence/v1-75/official-links.json',
        'docs/evidence/v1-75/pro-distribution-pack.sample.md',
        'docs/evidence/v1-75/share-copy.sample.txt'
      ],
      'Growth loop evidence pack outputs should be deterministic'
    )
  );
  await runStep(startStep('build-pro-intent-run-evidence-pack', 'quality'), () =>
    assertDeterministic(
      './node_modules/.bin/ts-node',
      ['scripts/build-pro-intent-run-evidence-pack.ts', 'docs/evidence/v1-90/pro-intent-run-evidence-pack.json'],
      [
        'docs/evidence/v1-90/index.md',
        'docs/evidence/v1-90/pro-intent-run-evidence-pack.json',
        'docs/evidence/v1-90/sha256.json'
      ],
      'Pro intent run evidence pack outputs should be deterministic'
    )
  );
  await runStep(startStep('build-pro-intent-v1-100-evidence', 'quality'), () =>
    assertDeterministic(
      './node_modules/.bin/ts-node',
      ['scripts/build-pro-intent-v1-100-evidence.ts'],
      [
        'docs/evidence/v1-100/index.md',
        'docs/evidence/v1-100/intent-funnel-v1-100.csv',
        'docs/evidence/v1-100/intent-funnel-summary-v1-100.json',
        'docs/evidence/v1-100/intent-sample-audit-v1-100.json'
      ],
      'Pro intent v1-100 evidence outputs should be deterministic'
    )
  );
  await runStep(startStep('build-pro-intent-decision-pack', 'quality'), () =>
    assertDeterministic(
      './node_modules/.bin/ts-node',
      [
        'scripts/build-pro-intent-decision-pack.ts',
        'docs/evidence/v1-81/copylot-pro-waitlist-survey-intent-distribution-7d-2026-03-23.json'
      ],
      [
        'docs/evidence/v1-81/copylot-pro-intent-decision-summary-v1-81.md',
        'docs/evidence/v1-81/copylot-pro-intent-decision-summary-v1-81.json'
      ],
      'Pro intent decision pack outputs should be deterministic'
    )
  );
  await runStep(startStep('build-weekly-channel-ops-trend', 'quality'), () =>
    assertDeterministic(
      './node_modules/.bin/ts-node',
      ['scripts/build-weekly-channel-ops-trend.ts', 'docs/evidence/v1-65'],
      ['docs/evidence/v1-65/index.md', 'docs/evidence/v1-65/trend.csv'],
      'Weekly channel ops trend outputs should be deterministic'
    )
  );
  await runStep(startStep('verify-weekly-channel-ops-evidence-pack v1-64', 'quality'), () =>
    runCommand('./node_modules/.bin/ts-node', ['scripts/verify-weekly-channel-ops-evidence-pack.ts', 'docs/evidence/v1-64'])
  );
  await runStep(startStep('verify-weekly-channel-ops-evidence-pack v1-65', 'quality'), () =>
    runCommand('./node_modules/.bin/ts-node', ['scripts/verify-weekly-channel-ops-evidence-pack.ts', 'docs/evidence/v1-65'])
  );
  await runStep(startStep('build:prod', 'build'), () => runCommand('npm', ['run', 'build:prod']));
  await runStep(startStep('build:prod-zip', 'build'), () => ensureProductionZipArtifact());
  await runStep(unitTestsStep, () =>
    runCommand('node', ['--no-warnings=ExperimentalWarning', '--loader=ts-node/esm', 'scripts/unit-tests.ts'])
  );

  if (!skipBuild) {
    await runStep(startStep('build:e2e', 'build'), () => runCommand('npm', ['run', 'build:e2e']));
  } else {
    skipStep('build:e2e', 'build', 'COPYLOT_TEST_SKIP_BUILD=1');
  }

  await runStep(startStep('ui-integration-tests', 'script'), () =>
    runCommand('node', ['--no-warnings=ExperimentalWarning', 'scripts/ui-integration-tests.ts'])
  );
  await runStep(startStep('content-interaction-tests', 'script'), () =>
    runCommand('node', ['--no-warnings=ExperimentalWarning', 'scripts/content-interaction-tests.ts'])
  );

  const htmlToMarkdownStep = startStep('html-to-markdown-tests', 'script');
  await runStep(htmlToMarkdownStep, async () => {
    try {
      await runCommand('./node_modules/.bin/ts-node', ['scripts/html-to-markdown-tests.ts']);
    } finally {
      await attachHtmlToMarkdownSummary(htmlToMarkdownStep);
    }
  });

  if (!onlyNativeUi) {
    const playwrightMainStep = startStep('playwright:main', 'playwright');
    await runStep(playwrightMainStep, async () => {
      try {
        await runCommand('npx', ['playwright', 'test', '--config=playwright.config.ts', '--project=main'], {
          COPYLOT_E2E_SKIP_BUILD: '1'
        });
      } finally {
        await attachPlaywrightSummary(playwrightMainStep, 'main');
      }
    });
  } else {
    skipStep('playwright:main', 'playwright', 'COPYLOT_TEST_ONLY_NATIVE_UI=1');
  }

  if (!skipNativeUi) {
    const playwrightNativeUiStep = startStep('playwright:native-ui', 'playwright');
    await runStep(playwrightNativeUiStep, async () => {
      try {
        await runCommand('npx', ['playwright', 'test', '--config=playwright.config.ts', '--project=native-ui'], {
          COPYLOT_E2E_SKIP_BUILD: '1',
          COPYLOT_E2E_ONLY_NATIVE_UI: '1',
          COPYLOT_E2E_HEADED: '1'
        });
      } finally {
        await attachPlaywrightSummary(playwrightNativeUiStep, 'native-ui');
      }
    });
  } else {
    skipStep(
      'playwright:native-ui',
      'playwright',
      !nativeUiSupported
        ? 'native-ui 仅在 macOS 运行'
        : !nativeUiOptIn
          ? 'COPYLOT_TEST_NATIVE_UI=1 才执行原生 UI 自动化'
          : 'COPYLOT_TEST_NATIVE_UI_SKIP=1'
    );
  }

  await runStep(startStep('build-cws-listing-evidence-pack', 'quality'), async () =>
    assertDeterministic(
      './node_modules/.bin/ts-node',
      ['scripts/build-cws-listing-evidence-pack.ts', '--stable-exported-at'],
      [
        'docs/evidence/v1-66/index.md',
        `docs/evidence/v1-66/${await resolvePackFile(
          'docs/evidence/v1-66/index.md',
          /cws-listing-evidence-pack-[0-9A-Za-z._-]+\.json/,
          'Failed to resolve v1-66 listing evidence pack filename from docs/evidence/v1-66/index.md'
        )}`
      ],
      'CWS listing evidence pack outputs should be deterministic'
    )
  );
  await runStep(startStep('build-cws-listing-diff-evidence-pack', 'quality'), async () =>
    assertDeterministic(
      './node_modules/.bin/ts-node',
      ['scripts/build-cws-listing-diff-evidence-pack.ts', '--stable-exported-at'],
      [
        'docs/evidence/v1-67/index.md',
        `docs/evidence/v1-67/${await resolvePackFile(
          'docs/evidence/v1-67/index.md',
          /cws-listing-diff-evidence-pack-[0-9A-Za-z._-]+\.json/,
          'Failed to resolve v1-67 listing diff evidence pack filename from docs/evidence/v1-67/index.md'
        )}`
      ],
      'CWS listing diff evidence pack outputs should be deterministic'
    )
  );
  await runStep(startStep('verify-prod-build', 'quality'), () => runCommand('bash', ['scripts/verify-prod-build.sh']));

  printSummary();
}

void run().catch((error) => {
  printSummary();
  console.error(error);
  process.exit(1);
});
