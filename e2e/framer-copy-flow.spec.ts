import { test, expect } from './fixtures';
import {
  clearClipboard,
  expectClipboardTextEventually,
  normalizeClipboardText
} from './helpers/clipboard';
import {
  getActiveTabId,
  invokeContextMenu,
  seedSyncStorage,
  triggerCommand
} from './helpers/extension-state';
import { openPopupForActiveTab } from './helpers/popup';

const ARTICLE_TITLE = 'Designing, refining, and maintaining agent skills at Perplexity';
const ARTICLE_SENTENCE = 'Agent skills are reusable packages of instructions';

function expectFramerArticleMarkdown(text: string): void {
  const normalized = normalizeClipboardText(text);
  expect(normalized.length).toBeGreaterThan(500);
  expect(normalized).toContain(ARTICLE_TITLE);
  expect(normalized).toContain(ARTICLE_SENTENCE);
  expect(normalized).toContain('Design around real tasks');
  expect(normalized).toContain('Maintain quality over time');
  expect(normalized).not.toContain('Navigation link cluster');
}

test('Framer-style article copies non-empty Markdown from popup, shortcut, and page menu', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
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
      defaultAutoOpenChat: false
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/framer-header-article.html`);
    await page.bringToFront();
    const activeTabId = await getActiveTabId(driverPage);
    expect(activeTabId).not.toBeNull();

    await clearClipboard(driverPage);
    const popup = await openPopupForActiveTab(
      extensionContext,
      extensionId,
      driverPage
    );
    await popup.locator('#convert-button').click();
    expectFramerArticleMarkdown(
      await expectClipboardTextEventually(
        (text) => text.includes(ARTICLE_SENTENCE),
        driverPage
      )
    );

    await clearClipboard(driverPage);
    await page.bringToFront();
    await triggerCommand(driverPage, 'quick-convert', activeTabId!);
    expectFramerArticleMarkdown(
      await expectClipboardTextEventually(
        (text) => text.includes(ARTICLE_SENTENCE),
        driverPage
      )
    );

    await clearClipboard(driverPage);
    await page.bringToFront();
    await invokeContextMenu(driverPage, {
      tabId: activeTabId!,
      menuItemId: 'convert-page-to-ai-friendly-format',
      pageUrl: page.url()
    });
    expectFramerArticleMarkdown(
      await expectClipboardTextEventually(
        (text) => text.includes(ARTICLE_SENTENCE),
        driverPage
      )
    );
  } finally {
    await page.close();
  }
});
