import { test, expect } from './fixtures';
import { clearClipboard } from './helpers/clipboard';
import { getSettingsSnapshot, getStorageSnapshot, seedSyncStorage } from './helpers/extension-state';
import { completePopupOnboardingIfVisible, openPopupForActiveTab } from './helpers/popup';

test('popup quick actions execute copy-to-ai and bound prompt slots', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard(driverPage);
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isMagicCopyEnabled: true,
      isHoverMagicCopyEnabled: false,
      isAnonymousUsageDataEnabled: false,
      outputFormat: 'markdown',
      tableOutputFormat: 'markdown',
      attachTitle: false,
      attachURL: false,
      language: 'en',
      interactionMode: 'click',
      userPrompts: [
        {
          id: 'slot-1-prompt',
          title: 'Slot 1 Prompt',
          template: 'Slot One:\n\n{content}',
          usageCount: 0,
          createdAt: 1,
          builtIn: false,
          deleted: false,
          templateVersion: 1,
          quickAccessSlot: 1
        },
        {
          id: 'slot-2-prompt',
          title: 'Slot 2 Prompt',
          template: 'Slot Two:\n\n{content}',
          usageCount: 0,
          createdAt: 2,
          builtIn: false,
          deleted: false,
          templateVersion: 1,
          quickAccessSlot: 2
        },
        {
          id: 'slot-3-prompt',
          title: 'Slot 3 Prompt',
          template: 'Slot Three:\n\n{content}',
          usageCount: 0,
          createdAt: 3,
          builtIn: false,
          deleted: false,
          templateVersion: 1,
          quickAccessSlot: 3
        }
      ],
      isClipboardAccumulatorEnabled: false,
      chatServices: [],
      defaultAutoOpenChat: false,
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

    let popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);

    await expect(popup.locator('#quick-prompt-slot-1-title')).toHaveText('Slot 1 Prompt');
    await expect(popup.locator('#quick-prompt-slot-2-title')).toHaveText('Slot 2 Prompt');
    await expect(popup.locator('#quick-prompt-slot-3-title')).toHaveText('Slot 3 Prompt');

    await popup.locator('#convert-button').click();
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const growthStats = snapshot.local.copilot_growth_stats as { successfulCopyCount?: number };
        return growthStats?.successfulCopyCount ?? 0;
      })
      .toBe(1);

    await page.bringToFront();
    popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);
    await popup.locator('#quick-prompt-slot-1-button').click();
    await expect
      .poll(async () => {
        const settings = await getSettingsSnapshot(driverPage);
        const prompts = (settings.userPrompts as Array<{ id?: string; usageCount?: number }>) ?? [];
        return prompts.find((item) => item.id === 'slot-1-prompt')?.usageCount ?? 0;
      })
      .toBe(1);

    await page.bringToFront();
    popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);
    await popup.locator('#quick-prompt-slot-2-button').click();
    await expect
      .poll(async () => {
        const settings = await getSettingsSnapshot(driverPage);
        const prompts = (settings.userPrompts as Array<{ id?: string; usageCount?: number }>) ?? [];
        return prompts.find((item) => item.id === 'slot-2-prompt')?.usageCount ?? 0;
      })
      .toBe(1);

    await page.bringToFront();
    popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);
    await popup.locator('#quick-prompt-slot-3-button').click();
    await expect
      .poll(async () => {
        const settings = await getSettingsSnapshot(driverPage);
        const prompts = (settings.userPrompts as Array<{ id?: string; usageCount?: number }>) ?? [];
        return prompts.find((item) => item.id === 'slot-3-prompt')?.usageCount ?? 0;
      })
      .toBe(1);

    await expect
      .poll(async () => {
        const settings = await getSettingsSnapshot(driverPage);
        const prompts = (settings.userPrompts as Array<{ id?: string; usageCount?: number }>) ?? [];
        return prompts.reduce<Record<string, number>>((acc, item) => {
          if (item.id) {
            acc[item.id] = item.usageCount ?? 0;
          }
          return acc;
        }, {});
      })
      .toMatchObject({
        'slot-1-prompt': 1,
        'slot-2-prompt': 1,
        'slot-3-prompt': 1
      });
  } finally {
    await page.close();
  }
});

test('popup quick actions show setup copy for unassigned slots', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard(driverPage);
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1,
      userPrompts: []
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.bringToFront();

    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await completePopupOnboardingIfVisible(popup);

    await expect(popup.locator('#quick-prompt-slot-1-button')).toBeHidden();
    await expect(popup.locator('#quick-prompt-slot-2-button')).toBeHidden();
    await expect(popup.locator('#quick-prompt-slot-3-button')).toBeHidden();
  } finally {
    await page.close();
  }
});
