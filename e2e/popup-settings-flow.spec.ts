import { test, expect } from './fixtures';
import { clearClipboard } from './helpers/clipboard';
import { getSettingsSnapshot, seedSyncStorage } from './helpers/extension-state';
import { completePopupOnboardingIfVisible, openPopupForActiveTab } from './helpers/popup';

test('popup setting toggles persist interaction mode format table format extras and append mode', async ({
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
    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);

    await popup.locator('label[for="interaction-dblclick"], .radio-option:has(#interaction-dblclick)').first().click();
    await popup.locator('label[for="format-plaintext"], .radio-option:has(#format-plaintext)').first().click();
    await popup.locator('label[for="table-format-csv"], .radio-option:has(#table-format-csv)').first().click();
    await popup.locator('label[for="attach-title"], .checkbox-option:has(#attach-title)').first().click();
    await popup.locator('label[for="attach-url"], .checkbox-option:has(#attach-url)').first().click();
    await popup
      .locator('label[for="enable-clipboard-accumulator-switch"], .switch-control:has(#enable-clipboard-accumulator-switch) .slider')
      .first()
      .click();

    await expect
      .poll(async () => {
        const settings = await getSettingsSnapshot(driverPage);
        return {
          interactionMode: settings.interactionMode,
          outputFormat: settings.outputFormat,
          tableOutputFormat: settings.tableOutputFormat,
          attachTitle: settings.attachTitle,
          attachURL: settings.attachURL,
          isClipboardAccumulatorEnabled: settings.isClipboardAccumulatorEnabled
        };
      })
      .toEqual({
        interactionMode: 'dblclick',
        outputFormat: 'plaintext',
        tableOutputFormat: 'csv',
        attachTitle: true,
        attachURL: true,
        isClipboardAccumulatorEnabled: true
      });
  } finally {
    await page.close();
  }
});

test('popup onboarding recommended settings and reopen flow persist completion state', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard();
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 0,
      popupOnboardingCompletedAt: undefined
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);

    await expect(popup.locator('#popup-onboarding-modal')).toBeVisible();
    await popup.locator('#popup-onboarding-apply-recommended').click();
    await popup.locator('#popup-onboarding-next').click();
    await popup.locator('#popup-onboarding-next').click();
    await popup.locator('#popup-onboarding-finish').click();

    await expect
      .poll(async () => {
        const settings = await getSettingsSnapshot(driverPage);
        return {
          popupOnboardingCompletedVersion: settings.popupOnboardingCompletedVersion,
          popupOnboardingCompletedAt: typeof settings.popupOnboardingCompletedAt
        };
      })
      .toEqual({
        popupOnboardingCompletedVersion: 1,
        popupOnboardingCompletedAt: 'number'
      });

    await popup.locator('#popup-onboarding-reopen').click();
    await expect(popup.locator('#popup-onboarding-modal')).toBeVisible();
    await popup.locator('#popup-onboarding-close').click();
    await expect(popup.locator('#popup-onboarding-modal')).toBeHidden();
  } finally {
    await page.close();
  }
});

test('popup onboarding open-options action opens options deeplink', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard();
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 0,
      popupOnboardingCompletedAt: undefined
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await expect(popup.locator('#popup-onboarding-modal')).toBeVisible();
    await popup.locator('#popup-onboarding-next').click();
    await popup.locator('#popup-onboarding-next').click();

    const optionsPromise = extensionContext.waitForEvent('page', {
      predicate: (candidate) => candidate.url().includes('/src/options/options.html')
    });
    await popup.locator('#popup-onboarding-open-options').click();
    const optionsPage = await optionsPromise;
    await optionsPage.waitForLoadState('domcontentloaded');
    await expect(optionsPage.locator('#add-prompt-btn')).toBeVisible();
    await optionsPage.close();
  } finally {
    await page.close();
  }
});
