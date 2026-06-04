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
    await expect(popup.locator('#convert-button')).toContainText(/复制给AI|Copy to AI/);
    await expect(popup.locator('#convert-shortcut')).toContainText(/Alt\+C|Option\+C|⌥C/);
    await expect(popup.locator('#open-shortcut-settings-button')).toBeVisible();
    await expect(popup.locator('#open-shortcut-settings-button')).toContainText(/去设置|Go to settings/);
    await expect(popup.locator('#toggle-more-settings-label')).toHaveText(/展开更多设置|Expand more settings/);
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

test('popup entry points can open options and passive pro targets', async ({
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
    const popupShortcutOptionsPagePromise = extensionContext.waitForEvent('page', {
      predicate: (candidate) => candidate.url().includes('/src/options/options.html')
    });
    await popupAgain.locator('#open-shortcut-settings-button').click();
    const popupShortcutOptionsPage = await popupShortcutOptionsPagePromise;
    await popupShortcutOptionsPage.waitForLoadState('domcontentloaded');
    await expect(popupShortcutOptionsPage.locator('#add-prompt-btn')).toBeVisible();
    await popupShortcutOptionsPage.close();

    await page.bringToFront();
    const popupAfterShortcutSettings = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popupAfterShortcutSettings);
    const [proPage] = await Promise.all([
      extensionContext.waitForEvent('page'),
      popupAfterShortcutSettings.locator('#upgrade-pro-entry').click()
    ]);
    await proPage.waitForLoadState('domcontentloaded');
    await expect(proPage.locator('#pro-tab')).toHaveCount(1);
    await proPage.close();

    await page.bringToFront();
    const popupWaitlist = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popupWaitlist);
    await popupWaitlist.locator('#popup-pro-waitlist').click();
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const events = snapshot.local.copilot_telemetry_events as Array<{ name?: string }> | undefined;
        return {
          proEntryOpened: events?.some((event) => event.name === 'pro_entry_opened') ?? false,
          proWaitlistOpened: events?.some((event) => event.name === 'pro_waitlist_opened') ?? false
        };
      })
      .toEqual({
        proEntryOpened: true,
        proWaitlistOpened: true
      });
  } finally {
    await page.close();
  }
});
