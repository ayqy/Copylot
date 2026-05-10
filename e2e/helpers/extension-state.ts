import path from 'node:path';
import { mkdirSync, rmSync } from 'node:fs';
import { chromium, expect, type BrowserContext, type Page } from '@playwright/test';

export interface LoadedExtension {
  context: BrowserContext;
  extensionId: string;
  serviceWorkerUrl: string;
}

export async function launchExtension(): Promise<LoadedExtension> {
  const userDataDir = path.resolve(process.cwd(), '.tmp_e2e/chromium-user-data');
  const extensionPath = path.resolve(process.cwd(), 'dist');
  rmSync(userDataDir, { recursive: true, force: true });
  mkdirSync(userDataDir, { recursive: true });

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: process.env.COPYLOT_E2E_HEADED === '1' ? false : true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }

  const serviceWorkerUrl = serviceWorker.url();
  const extensionId = new URL(serviceWorkerUrl).host;

  return {
    context,
    extensionId,
    serviceWorkerUrl
  };
}

export async function openExtensionPage(context: BrowserContext, extensionId: string, relativePath: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${relativePath}`);
  return page;
}

export async function waitForPromptCardById(page: Page, promptId: string): Promise<void> {
  await expect(page.locator(`.prompt-card[data-id="${promptId}"] .prompt-card-title`)).toBeVisible();
}

export async function waitForPromptCardByTitle(page: Page, title: string): Promise<void> {
  await expect(page.locator('.prompt-card-title').filter({ hasText: title })).toHaveCount(1);
}
