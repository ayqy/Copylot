import { test, expect } from './fixtures';
import { clearClipboard, expectClipboardTextEventually } from './helpers/clipboard';
import {
  getBadgeText,
  getOpenedUrls,
  getStorageSnapshot,
  seedLocalStorage,
  seedSyncStorage
} from './helpers/extension-state';
import { openPopupForActiveTab } from './helpers/popup';

test('share and rating actions remain available without copy-count gates', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard(driverPage);
  await seedLocalStorage(driverPage, {
    copilot_growth_stats: {
      installedAt: Date.now(),
      successfulCopyCount: 0
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.bringToFront();

    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await expect(popup.locator('#copy-share-button')).toBeEnabled();
    await expect(popup.locator('#share-link')).not.toHaveAttribute('aria-disabled', 'true');
    await expect(popup.locator('#rate-link')).not.toHaveAttribute('aria-disabled', 'true');
    await expect(popup.locator('#wom-status-hint')).toHaveCount(0);
    await expect(popup.locator('#rating-prompt')).toHaveCount(0);
    await expect(popup.locator('#pro-waitlist-prompt')).toHaveCount(0);

    await popup.locator('#copy-share-button').click();
    await expectClipboardTextEventually(
      (text) =>
        text.includes('Copylot') &&
        !text.toLowerCase().includes('waitlist') &&
        !text.toLowerCase().includes('survey'),
      driverPage
    );
  } finally {
    await page.close();
  }
});

test('popup shows an active append collection and lets the user clear it', async ({
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
      outputFormat: 'plaintext',
      tableOutputFormat: 'markdown',
      attachTitle: false,
      attachURL: false,
      language: 'en',
      interactionMode: 'click',
      userPrompts: [],
      isClipboardAccumulatorEnabled: true,
      chatServices: [],
      defaultAutoOpenChat: false
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);

    const first = page.locator('#article-paragraph');
    await first.selectText();
    await first.click();
    await page.keyboard.down('Shift');
    await page.locator('#ai-copilot-copy-btn').click();
    await page.keyboard.up('Shift');

    const second = page.locator('#article-second-paragraph');
    await second.selectText();
    await second.click();
    await page.keyboard.down('Shift');
    await page.locator('#ai-copilot-copy-btn').click();
    await page.keyboard.up('Shift');

    await expect.poll(() => getBadgeText(driverPage)).toBe('2');

    await page.bringToFront();
    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await expect(popup.locator('#append-session-card')).toBeVisible();
    await expect(popup.locator('#append-session-title')).toContainText('2');

    await popup.locator('#append-session-reset-button').click();

    await expect.poll(() => getBadgeText(driverPage)).toBe('');
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const appendSession = snapshot.local.copilot_append_session as
          | { clipCount?: number }
          | undefined;
        return appendSession?.clipCount ?? 0;
      })
      .toBe(0);
    await expect(popup.locator('#append-session-card')).toBeHidden();
  } finally {
    await page.close();
  }
});

test('popup footer and Pro plan entries open their user-facing destinations', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.bringToFront();

    let popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    const proPagePromise = extensionContext.waitForEvent('page', {
      predicate: (candidate) => candidate.url().includes('/src/options/options.html#pro')
    });
    await popup.locator('#upgrade-pro-entry').click();
    const proPage = await proPagePromise;
    await proPage.waitForLoadState('domcontentloaded');
    await expect(proPage.locator('#pro-page-title')).toBeVisible();
    await proPage.close();

    await page.bringToFront();
    popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await popup.locator('#share-link').click();
    await expect
      .poll(async () => (await getOpenedUrls(driverPage)).at(-1) || '')
      .toContain('chromewebstore.google.com/detail/');

    await page.bringToFront();
    popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await popup.locator('#feedback-link').click();
    await expect
      .poll(async () => (await getOpenedUrls(driverPage)).at(-1) || '')
      .toContain('github.com/ayqy/copy/issues/new');

    await page.bringToFront();
    popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await popup.locator('#rate-link').click();
    await expect
      .poll(async () => (await getOpenedUrls(driverPage)).at(-1) || '')
      .toContain('/reviews');
  } finally {
    await page.close();
  }
});
