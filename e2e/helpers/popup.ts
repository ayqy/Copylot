import type { BrowserContext, Page } from '@playwright/test';
import { getActiveTabId, openPopupPage } from './extension-state';

export async function openPopupForActiveTab(
  context: BrowserContext,
  extensionId: string,
  driverPage: Page
): Promise<Page> {
  const activeTabId = await getActiveTabId(driverPage);
  const popup = await openPopupPage(context, extensionId, activeTabId);
  await popup.waitForLoadState('domcontentloaded');
  return popup;
}
