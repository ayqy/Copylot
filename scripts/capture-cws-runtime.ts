#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import { startFixtureServer } from './e2e-fixture-server.ts';
import {
  clearLastCopiedText,
  getActiveTabId,
  getLastCopiedText,
  invokeContextMenu,
  launchExtension,
  openDriverPage,
  openExtensionPage,
  openPopupPage,
  resetExtensionState,
  seedSyncStorage
} from '../e2e/helpers/extension-state.ts';

const VERSION = '1.2.3';
const OUTPUT_DIR = path.resolve(process.cwd(), `release/cws/${VERSION}/assets/runtime-v2`);

const BASE_SETTINGS = {
  isMagicCopyEnabled: true,
  isHoverMagicCopyEnabled: false,
  isAnonymousUsageDataEnabled: false,
  outputFormat: 'markdown',
  tableOutputFormat: 'csv',
  attachTitle: false,
  attachURL: false,
  language: 'en',
  interactionMode: 'click',
  userPrompts: [],
  isClipboardAccumulatorEnabled: false,
  chatServices: [],
  defaultAutoOpenChat: false,
  popupOnboardingVersion: 1,
  popupOnboardingCompletedVersion: 1,
  popupOnboardingCompletedAt: 1
};

async function sha256(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  return createHash('sha256').update(bytes).digest('hex');
}

async function describePng(filePath: string): Promise<Record<string, unknown>> {
  const metadata = await sharp(filePath).metadata();
  return {
    path: path.relative(process.cwd(), filePath),
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    sha256: await sha256(filePath)
  };
}

async function waitForLastCopiedText(
  driverPage: Parameters<typeof getLastCopiedText>[0],
  predicate: (value: string) => boolean
): Promise<string> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const value = await getLastCopiedText(driverPage);
    if (predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return getLastCopiedText(driverPage);
}

async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const fixtureServer = await startFixtureServer();
  const loaded = await launchExtension({ locale: 'en-US' });
  const { context, extensionId } = loaded;
  const driverPage = await openDriverPage(context, extensionId);

  const captures: Record<string, unknown>[] = [];
  const results: Record<string, string> = {};

  try {
    await resetExtensionState(driverPage);
    await seedSyncStorage(driverPage, { copilot_settings: BASE_SETTINGS });

    const articlePage = await context.newPage();
    await articlePage.setViewportSize({ width: 1040, height: 650 });
    await articlePage.goto(`${fixtureServer.origin}/article-noise.html`);
    await articlePage.bringToFront();

    const popupPage = await openPopupPage(context, extensionId, await getActiveTabId(driverPage));
    await popupPage.setViewportSize({ width: 420, height: 720 });
    await popupPage.locator('#convert-button').waitFor({ state: 'visible' });
    const popupPath = path.join(OUTPUT_DIR, '01-popup.png');
    await popupPage.screenshot({ path: popupPath, fullPage: true });
    captures.push(await describePng(popupPath));
    await popupPage.close();

    await articlePage.bringToFront();
    const articlePath = path.join(OUTPUT_DIR, '02-article-source.png');
    await articlePage.screenshot({ path: articlePath, fullPage: false });
    captures.push(await describePng(articlePath));

    await clearLastCopiedText(driverPage);
    await invokeContextMenu(driverPage, {
      menuItemId: 'convert-page-to-ai-friendly-format',
      pageUrl: articlePage.url()
    });
    results.markdown = await waitForLastCopiedText(driverPage, (value) =>
      value.includes('Primary Article For Full-Page Conversion')
    );
    if (!results.markdown.includes('Primary Article For Full-Page Conversion')) {
      throw new Error('Markdown runtime proof did not contain the expected article heading.');
    }
    await writeFile(path.join(OUTPUT_DIR, '02-markdown-result.md'), `${results.markdown.trim()}\n`, 'utf8');
    await articlePage.close();

    await seedSyncStorage(driverPage, {
      copilot_settings: { ...BASE_SETTINGS, outputFormat: 'plaintext', tableOutputFormat: 'csv' }
    });
    const tablePage = await context.newPage();
    await tablePage.setViewportSize({ width: 1040, height: 650 });
    await tablePage.goto(`${fixtureServer.origin}/table.html`);
    await tablePage.locator('#starter-plan').click();
    await tablePage.locator('#ai-copilot-copy-btn').waitFor({ state: 'visible' });
    const tablePath = path.join(OUTPUT_DIR, '03-table-source.png');
    await tablePage.screenshot({ path: tablePath, fullPage: false });
    captures.push(await describePng(tablePath));
    await clearLastCopiedText(driverPage);
    await tablePage.locator('#ai-copilot-copy-btn').click();
    results.csv = await waitForLastCopiedText(driverPage, (value) => value.includes('Plan,Requests,Price'));
    if (!results.csv.includes('Plan,Requests,Price') || !results.csv.includes('Growth,500,$19')) {
      throw new Error('CSV runtime proof did not contain the expected table rows.');
    }
    await writeFile(path.join(OUTPUT_DIR, '03-csv-result.csv'), `${results.csv.trim()}\n`, 'utf8');
    await tablePage.close();

    await seedSyncStorage(driverPage, {
      copilot_settings: { ...BASE_SETTINGS, outputFormat: 'plaintext', isHoverMagicCopyEnabled: true }
    });
    const codePage = await context.newPage();
    await codePage.setViewportSize({ width: 1040, height: 650 });
    await codePage.goto(`${fixtureServer.origin}/code.html`);
    await codePage.bringToFront();
    const codeBlock = codePage.locator('#code-block');
    await codeBlock.waitFor({ state: 'visible' });
    await codePage.waitForTimeout(250);
    const codeBlockBox = await codeBlock.boundingBox();
    if (!codeBlockBox) throw new Error('Code block bounding box is unavailable.');
    await codePage.mouse.move(codeBlockBox.x + 8, codeBlockBox.y + 8);
    await codePage.waitForTimeout(100);
    await codePage.locator('#ai-copilot-copy-btn').waitFor({ state: 'visible' });
    const codePath = path.join(OUTPUT_DIR, '04-code-source.png');
    await codePage.screenshot({ path: codePath, fullPage: false });
    captures.push(await describePng(codePath));
    await clearLastCopiedText(driverPage);
    await codePage.locator('#ai-copilot-copy-btn').click();
    results.code = await waitForLastCopiedText(driverPage, (value) => value.includes('function buildPrompt()'));
    if (
      !results.code.includes('function buildPrompt()') ||
      results.code.includes('Copy code') ||
      results.code.includes('复制代码') ||
      /^\d+(?:Copy|function|\s+const|\})/m.test(results.code)
    ) {
      throw new Error('Code runtime proof did not contain the cleaned code result.');
    }
    await writeFile(path.join(OUTPUT_DIR, '04-code-result.txt'), `${results.code.trim()}\n`, 'utf8');
    await codePage.close();

    await seedSyncStorage(driverPage, {
      copilot_settings: {
        ...BASE_SETTINGS,
        userPrompts: [
          {
            id: 'release-summary-prompt',
            title: 'Summarize for a project brief',
            template: 'Summarize the key facts and decisions:\n\n{content}',
            category: 'summary',
            usageCount: 6,
            createdAt: 1785772800000
          },
          {
            id: 'release-writing-prompt',
            title: 'Rewrite in concise language',
            template: 'Rewrite this clearly and concisely:\n\n{content}',
            category: 'writing',
            usageCount: 3,
            createdAt: 1785772801000
          }
        ]
      }
    });
    const promptsPage = await openExtensionPage(context, extensionId, 'src/options/options.html#prompts');
    await promptsPage.setViewportSize({ width: 1120, height: 700 });
    await promptsPage.locator('.prompt-card').first().waitFor({ state: 'visible' });
    const promptsPath = path.join(OUTPUT_DIR, '05-prompts.png');
    await promptsPage.screenshot({ path: promptsPath, fullPage: false });
    captures.push(await describePng(promptsPath));
    await promptsPage.close();

    const manifest = {
      schema_version: 1,
      product: 'Copylot',
      version: VERSION,
      evidence_kind: 'direct',
      capture_surface: 'Playwright Chromium with the unpacked 1.2.3 E2E build',
      captures,
      text_results: {
        markdown: {
          path: `release/cws/${VERSION}/assets/runtime/02-markdown-result.md`,
          sha256: await sha256(path.join(OUTPUT_DIR, '02-markdown-result.md'))
        },
        csv: {
          path: `release/cws/${VERSION}/assets/runtime/03-csv-result.csv`,
          sha256: await sha256(path.join(OUTPUT_DIR, '03-csv-result.csv'))
        },
        code: {
          path: `release/cws/${VERSION}/assets/runtime/04-code-result.txt`,
          sha256: await sha256(path.join(OUTPUT_DIR, '04-code-result.txt'))
        }
      }
    };
    await writeFile(path.join(OUTPUT_DIR, 'runtime-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  } finally {
    await driverPage.close();
    await context.close();
    await fixtureServer.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
