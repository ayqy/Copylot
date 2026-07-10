import { test, expect } from './fixtures';
import { clearClipboard, expectClipboardTextEventually } from './helpers/clipboard';
import {
  getOpenedUrls,
  getStorageSnapshot,
  openExtensionPage,
  seedLocalStorage,
  seedSyncStorage
} from './helpers/extension-state';
import { completePopupOnboardingIfVisible, openPopupForActiveTab } from './helpers/popup';

test('popup share feedback rate and passive pro entries open real targets without proactive prompts', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard(driverPage);
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isAnonymousUsageDataEnabled: true,
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1
    }
  });
  await seedLocalStorage(driverPage, {
    copilot_growth_stats: {
      installedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      successfulCopyCount: 25,
      firstPromptUsedAt: Date.now() - 9 * 24 * 60 * 60 * 1000
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.bringToFront();

    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);

    await expect(popup.locator('#rating-prompt')).toHaveCount(0);
    await expect(popup.locator('#pro-waitlist-prompt')).toHaveCount(0);
    await expect(popup.locator('#popup-pro-waitlist-survey')).toHaveCount(0);
    await expect(popup.locator('#popup-pro-waitlist-copy')).toHaveCount(0);

    const [proPage] = await Promise.all([
      extensionContext.waitForEvent('page'),
      popup.locator('#upgrade-pro-entry').click()
    ]);
    await proPage.waitForLoadState('domcontentloaded');
    expect(proPage.url()).toContain('/src/options/options.html#pro');
    await proPage.close();

    await page.bringToFront();
    const popupForShare = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popupForShare);
    await popupForShare.locator('#copy-share-button').click();
    await expectClipboardTextEventually(
      (text) => text.includes('Copylot') && !text.toLowerCase().includes('waitlist') && !text.toLowerCase().includes('survey'),
      driverPage
    );

    await popupForShare.locator('#share-link').click();
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('chromewebstore.google.com/detail/');
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('utm_medium=popup');

    await page.bringToFront();
    const popupForFeedback = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popupForFeedback);
    await popupForFeedback.locator('#feedback-link').click();
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('github.com/ayqy/copy/issues/new');

    await page.bringToFront();
    const popupForRate = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popupForRate);
    await popupForRate.locator('#rate-link').click();
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('/reviews');
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('utm_medium=popup');

    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const events = snapshot.local.copilot_telemetry_events as Array<{ name?: string }> | undefined;
        return {
          shareCopied: events?.some((event) => event.name === 'wom_share_copied') ?? false,
          shareOpened: events?.some((event) => event.name === 'wom_share_opened') ?? false,
          feedbackOpened: events?.some((event) => event.name === 'wom_feedback_opened') ?? false,
          rateOpened: events?.some((event) => event.name === 'wom_rate_opened') ?? false
        };
      })
      .toEqual({
        shareCopied: true,
        shareOpened: true,
        feedbackOpened: true,
        rateOpened: true
      });
  } finally {
    await page.close();
  }
});

test('popup second-open reuse path exposes built-in prompt slot, records audit fields, and exports local summary', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard(driverPage);
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isAnonymousUsageDataEnabled: true,
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1,
      language: 'en'
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.locator('#article-paragraph').selectText();
    await page.bringToFront();

    let popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);
    await popup.locator('#convert-button').click();

    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const stats = snapshot.local.copilot_growth_stats as { successfulCopyCount?: number };
        return stats?.successfulCopyCount ?? 0;
      })
      .toBe(1);

    await page.bringToFront();
    popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);

    await expect(popup.locator('#reuse-primary-card')).toBeVisible();
    await expect(popup.locator('#reuse-primary-button')).toContainText(/Summarize Article/i);
    await expect(popup.locator('#quick-prompt-slot-1-button')).toContainText(/Summarize Article/i);

    await popup.locator('#reuse-primary-button').click();
    await expectClipboardTextEventually(
      (text) => text.includes('Please summarize the main content of the following article:'),
      driverPage
    );

    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const stats = snapshot.local.copilot_growth_stats as Record<string, unknown>;
        const events = (snapshot.local.copilot_telemetry_events as Array<{ name?: string }>) || [];
        return {
          successfulCopyCount: stats.successfulCopyCount ?? 0,
          secondSuccessfulCopyAt: typeof stats.secondSuccessfulCopyAt === 'number',
          quickPromptSlotShownCount: stats.quickPromptSlotShownCount ?? 0,
          quickPromptSlotClickedCount: stats.quickPromptSlotClickedCount ?? 0,
          quickPromptSlotUsedCount: stats.quickPromptSlotUsedCount ?? 0,
          hasShownEvent: events.some((event) => event.name === 'quick_prompt_slot_shown'),
          hasClickedEvent: events.some((event) => event.name === 'quick_prompt_slot_clicked'),
          hasUsedEvent: events.some((event) => event.name === 'quick_prompt_slot_used')
        };
      })
      .toEqual({
        successfulCopyCount: 2,
        secondSuccessfulCopyAt: true,
        quickPromptSlotShownCount: 1,
        quickPromptSlotClickedCount: 1,
        quickPromptSlotUsedCount: 1,
        hasShownEvent: true,
        hasClickedEvent: true,
        hasUsedEvent: true
      });

    const optionsPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'src/options/options.html#data'
    );
    await expect
      .poll(async () => optionsPage.locator('#growth-funnel-view').inputValue())
      .toContain('secondOpenReuseAudit');
    await expect
      .poll(async () => optionsPage.locator('#growth-funnel-view').inputValue())
      .toContain('quickPromptSlotUsedCount');
    await optionsPage.close();
  } finally {
    await page.close();
  }
});
