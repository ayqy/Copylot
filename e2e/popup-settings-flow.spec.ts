import { test, expect } from './fixtures';
import { clearClipboard } from './helpers/clipboard';
import { getSettingsSnapshot, seedSyncStorage } from './helpers/extension-state';
import { openPopupForActiveTab } from './helpers/popup';

test('popup settings persist copy behavior without interrupting the primary action', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard(driverPage);
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      interactionMode: 'click',
      outputFormat: 'markdown',
      tableOutputFormat: 'markdown',
      attachTitle: false,
      attachURL: false,
      isClipboardAccumulatorEnabled: false
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.bringToFront();
    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);

    await expect(popup.locator('#convert-button')).toBeVisible();
    await expect(popup.locator('#more-settings-panel')).toBeHidden();
    await expect(popup.locator('#toggle-more-settings')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(popup.locator('#popup-onboarding-modal')).toHaveCount(0);

    await popup.locator('#toggle-more-settings').click();
    await expect(popup.locator('#more-settings-panel')).toBeVisible();
    await expect(popup.locator('#toggle-more-settings')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expect(popup.locator('#toggle-more-settings-label')).toContainText(
      /收起复制设置|Hide copy settings/i
    );

    await popup.locator('label:has(#interaction-dblclick)').click();
    await popup.locator('label:has(#format-plaintext)').click();
    await popup.locator('label:has(#table-format-csv)').click();
    await popup.locator('label:has(#attach-title)').click();
    await popup.locator('label:has(#attach-url)').click();
    await popup.locator('#enable-clipboard-accumulator-switch + .slider').click();

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

    await popup.locator('#toggle-more-settings').click();
    await expect(popup.locator('#more-settings-panel')).toBeHidden();
    await expect(popup.locator('#toggle-more-settings')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  } finally {
    await page.close();
  }
});
