import { test, expect } from './fixtures';
import { clearClipboard } from './helpers/clipboard';
import { getActiveTabId, getStorageSnapshot, invokeContextMenu, seedSyncStorage } from './helpers/extension-state';

test('context menu handler processes selection prompt via production background flow', async ({
  extensionContext,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard();

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
          id: 'builtin-summary-article',
          title: 'Summary',
          template: 'Summarize:\n\n{content}',
          usageCount: 0,
          createdAt: 1,
          builtIn: true,
          deleted: false,
          templateVersion: 1
        }
      ],
      isClipboardAccumulatorEnabled: false,
      chatServices: [
        {
          id: 'qa-chat',
          name: 'QA Chat',
          url: `${fixtureOrigin}/chat.html`,
          enabled: true,
          builtIn: false
        }
      ],
      defaultChatServiceId: 'qa-chat',
      defaultAutoOpenChat: true,
      editorExclusionClassNames: ['ProseMirror'],
      editorExclusionAttributeSelectors: ['[data-cangjie-content]', '[data-cangjie-editable]'],
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

    await invokeContextMenu(driverPage, {
      menuItemId: 'builtin-summary-article',
      parentMenuItemId: 'magic-copy-with-prompt',
      selectionText: await page.locator('#article-paragraph').textContent() || '',
      pageUrl: page.url()
    });

    const chatPage = await extensionContext.waitForEvent('page', {
      predicate: (candidate) => candidate.url().startsWith(`${fixtureOrigin}/chat.html`)
    });
    await chatPage.waitForLoadState('domcontentloaded');
    await expect(chatPage.locator('#chat-heading')).toBeVisible();

    const snapshot = await getStorageSnapshot(driverPage);
    const settings = snapshot.sync.copilot_settings as { userPrompts?: Array<{ id?: string; usageCount?: number }> };
    const prompt = settings.userPrompts?.find((item) => item.id === 'builtin-summary-article');
    expect(prompt?.usageCount).toBe(1);
    const growthStats = snapshot.local.copilot_growth_stats as { successfulCopyCount?: number; firstPromptUsedAt?: number };
    expect(growthStats?.successfulCopyCount).toBe(1);
    expect(typeof growthStats?.firstPromptUsedAt).toBe('number');
  } finally {
    await page.close();
  }
});
