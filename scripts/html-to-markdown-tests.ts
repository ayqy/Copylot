import fs from 'node:fs/promises';
import path from 'node:path';
import { expect } from '@playwright/test';

import { launchExtension, openExtensionPage } from '../e2e/helpers/extension-state.ts';

const reportPath = path.resolve(process.cwd(), '.tmp_e2e/html-to-markdown-report.json');

interface HtmlToMarkdownReport {
  total: number;
  passed: number;
  failed: number;
  failedTitles: string[];
}

function parseCount(text: string | null): number {
  const match = text?.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

async function writeReport(report: HtmlToMarkdownReport): Promise<void> {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
}

async function run(): Promise<void> {
  const loaded = await launchExtension({
    headed: false,
    userDataDir: path.resolve(process.cwd(), '.tmp_e2e/html-to-markdown-user-data')
  });

  try {
    const page = await openExtensionPage(loaded.context, loaded.extensionId, 'test/index.html');
    await page.waitForLoadState('domcontentloaded');

    await expect
      .poll(async () => {
        return parseCount(await page.locator('#stats-total').textContent());
      })
      .toBeGreaterThan(0);

    await page.locator('#run-all-btn').click();

    await expect
      .poll(async () => {
        const total = parseCount(await page.locator('#stats-total').textContent());
        const passed = parseCount(await page.locator('#stats-passed').textContent());
        const failed = parseCount(await page.locator('#stats-failed').textContent());
        return total > 0 && passed + failed === total;
      }, { timeout: 180_000 })
      .toBe(true);

    const total = parseCount(await page.locator('#stats-total').textContent());
    const passed = parseCount(await page.locator('#stats-passed').textContent());
    const failed = parseCount(await page.locator('#stats-failed').textContent());
    const failedTitles = await page
      .locator('.test-case')
      .evaluateAll((elements) =>
        elements
          .filter((element) => element.querySelector('.test-status')?.textContent?.trim() === 'failed')
          .map((element) => element.querySelector('.test-title')?.textContent?.trim() || 'unknown')
      );

    await writeReport({
      total,
      passed,
      failed,
      failedTitles
    });

    if (total <= 0 || passed !== total || failed !== 0) {
      throw new Error(
        `html-to-markdown-tests failed: total=${total}, passed=${passed}, failed=${failed}, failedTitles=${failedTitles.join(', ')}`
      );
    }

    console.log(`PASS html-to-markdown-tests (${total} cases)`);
    await page.close();
  } finally {
    await loaded.context.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
