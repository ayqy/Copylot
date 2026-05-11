import type { BrowserContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { getActiveTabId, openPopupPage } from './extension-state';

export async function completePopupOnboardingIfVisible(popup: Page): Promise<void> {
  const modal = popup.locator('#popup-onboarding-modal');
  if (!(await modal.isVisible())) {
    return;
  }

  await popup.locator('#popup-onboarding-next').click();
  await popup.locator('#popup-onboarding-next').click();
  await popup.locator('#popup-onboarding-finish').click();
  await expect(modal).toBeHidden();
}

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
