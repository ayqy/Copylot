import { test, expect } from './fixtures';
import { clearClipboard } from './helpers/clipboard';
import { getStorageSnapshot, seedSyncStorage } from './helpers/extension-state';

test('content script supports real selection copy flow', async ({
  extensionContext,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard();

  const page = await extensionContext.newPage();
  try {
    await seedSyncStorage(driverPage, {
      copilot_settings: {
        isMagicCopyEnabled: true,
        isHoverMagicCopyEnabled: false,
        isAnonymousUsageDataEnabled: false,
        outputFormat: 'markdown',
        tableOutputFormat: 'markdown',
        attachTitle: true,
        attachURL: true,
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
        defaultAutoOpenChat: false,
        editorExclusionClassNames: ['ProseMirror'],
        editorExclusionAttributeSelectors: ['[data-cangjie-content]', '[data-cangjie-editable]'],
        popupOnboardingVersion: 1,
        popupOnboardingCompletedVersion: 1,
        popupOnboardingCompletedAt: 1
      }
    });

    await page.goto(`${fixtureOrigin}/article.html`);
    await page.locator('#article-paragraph').selectText();
    await page.locator('#article-paragraph').click();

    const button = page.locator('#ai-copilot-copy-btn');
    await expect(button).toBeVisible();
    await button.click();
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const growthStats = snapshot.local.copilot_growth_stats as { successfulCopyCount?: number };
        return growthStats?.successfulCopyCount ?? 0;
      })
      .toBe(1);
  } finally {
    await page.close();
  }
});

test('content script respects editor exclusion zones', async ({ extensionContext, fixtureOrigin }) => {
  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/editor.html`);
    await page.locator('#editor-root').click();
    await page.locator('#editor-root').selectText();
    await expect(page.locator('#ai-copilot-copy-btn')).toBeHidden();
  } finally {
    await page.close();
  }
});
