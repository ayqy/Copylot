import { test, expect } from './fixtures';
import { clearClipboard, expectClipboardTextEventually } from './helpers/clipboard';
import { getOpenedUrls, getStorageSnapshot, seedLocalStorage, seedSyncStorage } from './helpers/extension-state';
import { completePopupOnboardingIfVisible, openPopupForActiveTab } from './helpers/popup';

test('popup share feedback rate and waitlist survey entries open real targets and record telemetry', async ({
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

    const [surveyPage] = await Promise.all([
      extensionContext.waitForEvent('page'),
      popup.locator('#popup-pro-waitlist-survey').click()
    ]);
    await surveyPage.waitForLoadState('domcontentloaded');
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('pro_survey_source=popup');
    expect(surveyPage.url()).toContain('#pro-waitlist-survey');
    await surveyPage.close();

    await page.bringToFront();
    const popupForShare = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popupForShare);
    await popupForShare.locator('#copy-share-button').click();
    await expectClipboardTextEventually(/Copylot/, driverPage);

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
    await expect(popupForRate.locator('#rating-prompt')).toBeVisible();
    await popupForRate.locator('#rating-prompt-rate').click();
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
      .toContain('utm_medium=rating_prompt');

    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const events = snapshot.local.copilot_telemetry_events as Array<{ name?: string }> | undefined;
        return {
          shareCopied: events?.some((event) => event.name === 'wom_share_copied') ?? false,
          shareOpened: events?.some((event) => event.name === 'wom_share_opened') ?? false,
          feedbackOpened: events?.some((event) => event.name === 'wom_feedback_opened') ?? false,
          ratingAction: events?.some((event) => event.name === 'rating_prompt_action') ?? false
        };
      })
      .toEqual({
        shareCopied: true,
        shareOpened: true,
        feedbackOpened: true,
        ratingAction: true
      });
  } finally {
    await page.close();
  }
});
