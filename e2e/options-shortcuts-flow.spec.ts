import { test, expect } from './fixtures';
import { getSettingsSnapshot, getStorageSnapshot, openExtensionPage, seedSyncStorage, waitForPromptCardByTitle } from './helpers/extension-state';

test('options shortcut settings panel shows current bindings and opens Chrome shortcuts page', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1
    }
  });

  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    const shortcutColumns = await page.locator('.shortcut-settings-grid').evaluate((element) => {
      return window.getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length;
    });
    expect(shortcutColumns).toBe(4);

    await expect(page.locator('[data-shortcut-command-card="slot-1"] .shortcut-command-card-copy strong')).toHaveText(/快捷键 1|Shortcut 1/);
    await expect(page.locator('[data-shortcut-command-card="slot-2"] .shortcut-command-card-copy strong')).toHaveText(/快捷键 2|Shortcut 2/);
    await expect(page.locator('[data-shortcut-command-card="slot-3"] .shortcut-command-card-copy strong')).toHaveText(/快捷键 3|Shortcut 3/);
    await expect(page.locator('#options-shortcut-current-convert')).toContainText(/Alt\+C|Option\+C|⌥C/);
    await expect(page.locator('#options-shortcut-current-slot-1')).toContainText(/Alt\+1|Option\+1|⌥1/);
    await expect(page.locator('#options-shortcut-current-slot-2')).toContainText(/Alt\+2|Option\+2|⌥2/);
    await expect(page.locator('#options-shortcut-current-slot-3')).toContainText(/Alt\+3|Option\+3|⌥3/);
    await expect(page.locator('#options-open-shortcut-settings')).toContainText(/去设置|Go to settings/);
    await expect(page.locator('.shortcut-settings-panel-hint')).toHaveCount(0);

    await page.locator('#options-open-shortcut-settings').click();
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const opened = snapshot.local.copilot_e2e_opened_urls as string[] | undefined;
        return opened?.includes('chrome://extensions/shortcuts') ?? false;
      })
      .toBe(true);

    await page.locator('[data-shortcut-command-card="slot-2"]').click();
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const opened = snapshot.local.copilot_e2e_opened_urls as string[] | undefined;
        return (opened?.filter((url) => url === 'chrome://extensions/shortcuts').length ?? 0) >= 2;
      })
      .toBe(true);
  } finally {
    await page.close();
  }
});

test('options prompt quick slot assignment updates shortcut panel labels', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1
    }
  });

  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await page.locator('#add-prompt-btn').click();
    await expect(page.locator('#prompt-editor-modal')).toBeVisible();
    await page.locator('#prompt-title').fill('Slot 2 Summary');
    await page.locator('#prompt-template').fill('Slot 2 template:\n\n{content}');
    await page.locator('#prompt-quick-access-slot').selectOption('2');
    await page.locator('#save-btn').click();

    await waitForPromptCardByTitle(page, 'Slot 2 Summary');
    await expect(page.locator('#options-shortcut-slot-2-prompt-name')).toHaveText('Slot 2 Summary');

    const settings = await getSettingsSnapshot(driverPage);
    const prompt = ((settings.userPrompts as Array<{ title?: string; quickAccessSlot?: number }>) ?? []).find(
      (item) => item.title === 'Slot 2 Summary'
    );
    expect(prompt?.quickAccessSlot).toBe(2);
  } finally {
    await page.close();
  }
});
