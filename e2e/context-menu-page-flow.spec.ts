import { test, expect } from './fixtures';
import {
  clearClipboard,
  expectClipboardTextEventually,
  normalizeClipboardText
} from './helpers/clipboard';
import {
  getActiveTabId,
  getStorageSnapshot,
  invokeContextMenu,
  seedSyncStorage
} from './helpers/extension-state';

test('convert-page context menu falls back to full article extraction and filters page noise', async ({
  extensionContext,
  fixtureOrigin,
  driverPage
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
    await page.goto(`${fixtureOrigin}/article-noise.html`);
    await page.bringToFront();
    const activeTabId = await getActiveTabId(driverPage);
    expect(activeTabId).not.toBeNull();
    await invokeContextMenu(driverPage, {
      tabId: activeTabId!,
      menuItemId: 'convert-page-to-ai-friendly-format',
      pageUrl: page.url()
    });

    const text = normalizeClipboardText(
      await expectClipboardTextEventually(/Primary Article For Full-Page Conversion/, driverPage)
    );
    expect(text).toContain('The real article body starts here');
    expect(text).toContain('A follow-up paragraph provides enough density');
    expect(text).not.toContain('Header promo');
    expect(text).not.toContain('Navigation link cluster');
    expect(text).not.toContain('Footer copyright');

    const snapshot = await getStorageSnapshot(driverPage);
    const growthStats = snapshot.local.copilot_growth_stats as { successfulCopyCount?: number };
    expect(growthStats?.successfulCopyCount).toBe(1);
  } finally {
    await page.close();
  }
});
