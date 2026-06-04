import { test, expect } from './fixtures';
import { clearClipboard, expectClipboardTextEventually } from './helpers/clipboard';
import { getActiveTabId, getStorageSnapshot, seedSyncStorage, triggerCommand } from './helpers/extension-state';

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
