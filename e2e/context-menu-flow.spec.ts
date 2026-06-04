import { test, expect } from './fixtures';
import { clearClipboard } from './helpers/clipboard';
import {
  getActiveTabId,
  getContextMenuItems,
  getStorageSnapshot,
  invokeContextMenu,
  seedSyncStorage
} from './helpers/extension-state';

test('context menu model flattens prompt actions without a third level', async ({ driverPage }) => {
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      userPrompts: [
        {
          id: 'prompt-slot-1',
          title: 'Prompt Slot 1',
          template: 'Prompt 1\n\n{content}',
          usageCount: 0,
          createdAt: 1,
          builtIn: false,
          deleted: false,
          templateVersion: 1,
          quickAccessSlot: 1
        },
        {
          id: 'prompt-slot-2',
          title: 'Prompt Slot 2',
          template: 'Prompt 2\n\n{content}',
          usageCount: 0,
          createdAt: 2,
          builtIn: false,
          deleted: false,
          templateVersion: 1,
          quickAccessSlot: 2
        }
      ]
    }
  });

  const items = await getContextMenuItems(driverPage);
  const convertItem = items.find((item) => item.id === 'convert-page-to-ai-friendly-format');
  if (convertItem) {
    expect(convertItem.parentId).toBeUndefined();
    expect(convertItem.contexts).toEqual(['page']);
  }

  const promptItems = items.filter((item) => item.id !== 'convert-page-to-ai-friendly-format');
  expect(promptItems.length).toBeGreaterThanOrEqual(2);
  expect(promptItems.map((item) => item.title)).toEqual(expect.arrayContaining(['Prompt Slot 1', 'Prompt Slot 2']));
  expect(promptItems.every((item) => !item.parentId)).toBe(true);
  expect(items.some((item) => /智能复制\+自定义提示|Magic Copy with Prompt/i.test(item.title))).toBe(false);
});

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
