import { test, expect } from './fixtures';
import { clearClipboard, expectClipboardTextEventually } from './helpers/clipboard';
import { getActiveTabId, getStorageSnapshot, seedSyncStorage, triggerCommand } from './helpers/extension-state';

test('quick convert command executes copy-to-ai directly', async ({
  extensionContext,
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
      userPrompts: [],
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

    const activeTabId = await getActiveTabId(driverPage);
    expect(activeTabId).not.toBeNull();

    await triggerCommand(driverPage, 'quick-convert', activeTabId!);
    const copiedText = await expectClipboardTextEventually((text) => text.length > 20, driverPage);
    expect(copiedText).toMatch(/article|heading|paragraph|alpha|beta|gamma/i);

    const snapshot = await getStorageSnapshot(driverPage);
    const growthStats = snapshot.local.copilot_growth_stats as { successfulCopyCount?: number };
    expect(growthStats?.successfulCopyCount).toBe(1);
  } finally {
    await page.close();
  }
});

test('quick command can execute bound prompt slot directly', async ({
  extensionContext,
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
          id: 'quick-slot-prompt',
          title: 'Quick Slot Prompt',
          template: 'Summarize this:\n\n{content}',
          usageCount: 0,
          createdAt: 1,
          builtIn: false,
          deleted: false,
          templateVersion: 1,
          quickAccessSlot: 1
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

    const activeTabId = await getActiveTabId(driverPage);
    expect(activeTabId).not.toBeNull();

    await triggerCommand(driverPage, 'quick-prompt-slot-1', activeTabId!);

    await expectClipboardTextEventually(/Summarize this:/, driverPage);
    const snapshot = await getStorageSnapshot(driverPage);
    const settings = snapshot.sync.copilot_settings as { userPrompts?: Array<{ id?: string; usageCount?: number }> };
    expect(settings.userPrompts?.find((item) => item.id === 'quick-slot-prompt')?.usageCount).toBe(1);
  } finally {
    await page.close();
  }
});

for (const slot of [2, 3] as const) {
  test(`quick command can execute bound prompt slot ${slot} directly`, async ({
    extensionContext,
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
            id: `quick-slot-prompt-${slot}`,
            title: `Quick Slot Prompt ${slot}`,
            template: `Prompt ${slot}:\n\n{content}`,
            usageCount: 0,
            createdAt: slot,
            builtIn: false,
            deleted: false,
            templateVersion: 1,
            quickAccessSlot: slot
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

      const activeTabId = await getActiveTabId(driverPage);
      expect(activeTabId).not.toBeNull();

      await triggerCommand(driverPage, `quick-prompt-slot-${slot}`, activeTabId!);

      await expectClipboardTextEventually(new RegExp(`Prompt ${slot}:`), driverPage);
      const snapshot = await getStorageSnapshot(driverPage);
      const settings = snapshot.sync.copilot_settings as { userPrompts?: Array<{ id?: string; usageCount?: number }> };
      expect(settings.userPrompts?.find((item) => item.id === `quick-slot-prompt-${slot}`)?.usageCount).toBe(1);
    } finally {
      await page.close();
    }
  });
}

test('unassigned quick prompt command does not execute another prompt', async ({
  extensionContext,
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
          id: 'only-slot-one',
          title: 'Only Slot One',
          template: 'Only 1:\n\n{content}',
          usageCount: 0,
          createdAt: 1,
          builtIn: false,
          deleted: false,
          templateVersion: 1,
          quickAccessSlot: 1
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

    const activeTabId = await getActiveTabId(driverPage);
    expect(activeTabId).not.toBeNull();

    await expect(triggerCommand(driverPage, 'quick-prompt-slot-2', activeTabId!)).rejects.toThrow(/Prompt not found|未找到Prompt/i);
    await expectClipboardTextEventually((text) => text === '', driverPage);

    const snapshot = await getStorageSnapshot(driverPage);
    const settings = snapshot.sync.copilot_settings as { userPrompts?: Array<{ id?: string; usageCount?: number }> };
    expect(settings.userPrompts?.find((item) => item.id === 'only-slot-one')?.usageCount).toBe(0);
  } finally {
    await page.close();
  }
});
