import path from 'node:path';
import { mkdirSync, rmSync } from 'node:fs';
import { chromium, expect, type BrowserContext, type Page } from '@playwright/test';

export interface LoadedExtension {
  context: BrowserContext;
  extensionId: string;
  serviceWorkerUrl: string;
  userDataDir: string;
}

export interface StorageSnapshot {
  sync: Record<string, unknown>;
  local: Record<string, unknown>;
}

export interface ContextMenuSnapshotItem {
  id: string;
  title: string;
  parentId?: string;
  contexts: chrome.contextMenus.ContextType[];
}

const E2E_EXTENSION_DIR = path.resolve(process.cwd(), '.tmp_e2e/extension');
export async function launchExtension(options?: {
  headed?: boolean;
  userDataDir?: string;
}): Promise<LoadedExtension> {
  const userDataDir = options?.userDataDir || path.resolve(process.cwd(), '.tmp_e2e/chromium-user-data');
  const headed = options?.headed ?? (process.env.COPYLOT_E2E_HEADED === '1');

  rmSync(userDataDir, { recursive: true, force: true });
  mkdirSync(userDataDir, { recursive: true });

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: !headed,
    args: [`--disable-extensions-except=${E2E_EXTENSION_DIR}`, `--load-extension=${E2E_EXTENSION_DIR}`]
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
    serviceWorkerUrl,
    userDataDir
  };
}

export async function openExtensionPage(context: BrowserContext, extensionId: string, relativePath: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${relativePath}`);
  return page;
}

export async function openDriverPage(context: BrowserContext, extensionId: string): Promise<Page> {
  return openExtensionPage(context, extensionId, 'src/e2e/driver.html');
}

export async function openPopupPage(
  context: BrowserContext,
  extensionId: string,
  tabId?: number | null
): Promise<Page> {
  const suffix = typeof tabId === 'number' ? `?tab=${tabId}` : '';
  return openExtensionPage(context, extensionId, `src/popup/popup.html${suffix}`);
}

async function runDriverCommand<T>(
  driverPage: Page,
  request: Record<string, unknown>
): Promise<T> {
  return driverPage.evaluate(async (payload) => {
    return window.copylotE2E.run(payload as never);
  }, request) as Promise<T>;
}

export async function resetExtensionState(driverPage: Page): Promise<void> {
  await runDriverCommand(driverPage, { type: 'reset-state' });
}

export async function seedSyncStorage(driverPage: Page, data: Record<string, unknown>): Promise<void> {
  await runDriverCommand(driverPage, { type: 'seed-sync-storage', data });
}

export async function seedLocalStorage(driverPage: Page, data: Record<string, unknown>): Promise<void> {
  await runDriverCommand(driverPage, { type: 'seed-local-storage', data });
}

export async function getStorageSnapshot(driverPage: Page): Promise<StorageSnapshot> {
  const response = await runDriverCommand<{ sync: Record<string, unknown>; local: Record<string, unknown> }>(driverPage, {
    type: 'get-storage-snapshot'
  });
  return {
    sync: response.sync || {},
    local: response.local || {}
  };
}

export async function getSettingsSnapshot(driverPage: Page): Promise<Record<string, unknown>> {
  const snapshot = await getStorageSnapshot(driverPage);
  const settings = snapshot.sync.copilot_settings;
  return settings && typeof settings === 'object' ? (settings as Record<string, unknown>) : {};
}

export async function getContextMenuItems(driverPage: Page): Promise<ContextMenuSnapshotItem[]> {
  const response = await runDriverCommand<{ items?: ContextMenuSnapshotItem[] }>(driverPage, {
    type: 'get-context-menu-items'
  });
  return Array.isArray(response.items) ? response.items : [];
}

export async function clearLastCopiedText(driverPage: Page): Promise<void> {
  await runDriverCommand(driverPage, { type: 'clear-last-copied-text' });
}

export async function getLastCopiedText(driverPage: Page): Promise<string> {
  const response = await runDriverCommand<{ text?: string }>(driverPage, {
    type: 'get-last-copied-text'
  });
  return typeof response.text === 'string' ? response.text : '';
}

export async function getOpenedUrls(driverPage: Page): Promise<string[]> {
  const response = await runDriverCommand<{ urls?: string[] }>(driverPage, {
    type: 'get-opened-urls'
  });
  return Array.isArray(response.urls) ? response.urls.filter((item): item is string => typeof item === 'string') : [];
}

export async function openPopupViaAction(driverPage: Page): Promise<void> {
  await runDriverCommand(driverPage, { type: 'open-popup' });
}

export async function triggerCommand(
  driverPage: Page,
  command: string,
  tabId?: number
): Promise<void> {
  await runDriverCommand(driverPage, { type: 'trigger-command', command, tabId });
}

export async function getBadgeText(driverPage: Page): Promise<string> {
  const response = await runDriverCommand<{ text?: string }>(driverPage, { type: 'get-badge-text' });
  return response.text || '';
}

export async function getActiveTabId(driverPage: Page): Promise<number | null> {
  const response = await runDriverCommand<{ tabId?: number | null }>(driverPage, { type: 'get-active-tab-id' });
  return typeof response.tabId === 'number' ? response.tabId : null;
}

export async function invokeContextMenu(
  driverPage: Page,
  params: {
    tabId?: number;
    menuItemId: string;
    selectionText?: string;
    pageUrl?: string;
  }
): Promise<void> {
  await runDriverCommand(driverPage, {
    type: 'invoke-context-menu',
    tabId: params.tabId,
    info: {
      menuItemId: params.menuItemId,
      selectionText: params.selectionText,
      pageUrl: params.pageUrl
    }
  });
}

export async function waitForPopupPage(context: BrowserContext, extensionId: string): Promise<Page> {
  const existing = context
    .pages()
    .find((page) => page.url().startsWith(`chrome-extension://${extensionId}/src/popup/popup.html`));

  if (existing) {
    await existing.waitForLoadState('domcontentloaded');
    return existing;
  }

  const page = await context.waitForEvent('page', {
    predicate: (candidate) => candidate.url().startsWith(`chrome-extension://${extensionId}/src/popup/popup.html`)
  });
  await page.waitForLoadState('domcontentloaded');
  return page;
}

export async function waitForPromptCardById(page: Page, promptId: string): Promise<void> {
  await expect(page.locator(`.prompt-card[data-id="${promptId}"] .prompt-card-title`)).toBeVisible();
}

export async function waitForPromptCardByTitle(page: Page, title: string): Promise<void> {
  await expect(page.locator('.prompt-card-title').filter({ hasText: title })).toHaveCount(1);
}

declare global {
  interface Window {
    copylotE2E: {
      run(request: Record<string, unknown>): Promise<unknown>;
    };
  }
}
