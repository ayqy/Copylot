import { test, expect } from './fixtures';
import { clearClipboard } from './helpers/clipboard';
import { getStorageSnapshot, seedSyncStorage } from './helpers/extension-state';
import { completePopupOnboardingIfVisible, openPopupForActiveTab } from './helpers/popup';

test('popup opens via extension action and can convert current page selection', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard();
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.locator('#article-paragraph').selectText();
    await page.bringToFront();
    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);

    await expect(popup.locator('#convert-button')).toBeVisible();
    await popup.locator('#convert-button').click();
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const growthStats = snapshot.local.copilot_growth_stats as { successfulCopyCount?: number };
        return growthStats?.successfulCopyCount ?? 0;
      })
      .toBe(1);
  } finally {
    await page.close();
  }
});

test('popup entry points can open options and copy waitlist text', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard();
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isAnonymousUsageDataEnabled: true,
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.bringToFront();
    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);

    const optionsPromise = extensionContext.waitForEvent('page', {
      predicate: (candidate) => candidate.url().includes('/src/options/options.html')
    });
    await popup.locator('#add-prompt-button').click();
    const optionsPage = await optionsPromise;
    await optionsPage.waitForLoadState('domcontentloaded');
    await expect(optionsPage.locator('#add-prompt-btn')).toBeVisible();
    await optionsPage.close();

    await page.bringToFront();
    const popupAgain = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popupAgain);
    await popupAgain.locator('#popup-pro-waitlist-copy').click();
    await expect(popupAgain.locator('#popup-pro-waitlist-copy')).toContainText(/copied|已复制/i);
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const events = snapshot.local.copilot_telemetry_events as Array<{ name?: string }> | undefined;
        return events?.some((event) => event.name === 'pro_waitlist_copied') ?? false;
      })
      .toBe(true);
  } finally {
    await page.close();
  }
});
