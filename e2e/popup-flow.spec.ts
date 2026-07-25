import { test, expect } from './fixtures';
import { clearClipboard, expectClipboardTextEventually } from './helpers/clipboard';
import {
  getStorageSnapshot,
  seedSyncStorage
} from './helpers/extension-state';
import { openPopupForActiveTab } from './helpers/popup';

test('popup presents copy as the primary job and copies the current selection', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard(driverPage);
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      outputFormat: 'markdown',
      attachTitle: false,
      attachURL: false,
      language: 'en',
      userPrompts: []
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.locator('#article-paragraph').selectText();
    await page.bringToFront();

    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);

    await expect(popup.locator('#popup-copy-title')).toContainText(
      /复制当前内容|Copy current content/i
    );
    await expect(popup.locator('#convert-button')).toBeVisible();
    await expect(popup.locator('#convert-button')).toContainText(/复制给\s*AI|Copy to AI/i);
    await expect(popup.locator('#convert-shortcut')).toContainText(/Alt\+C|Option\+C|⌥C/i);
    await expect(popup.locator('#toggle-more-settings')).toContainText(
      /更多复制设置|More copy settings/i
    );

    await expect(popup.locator('#popup-onboarding-modal')).toHaveCount(0);
    await expect(popup.locator('#first-copy-title')).toHaveCount(0);
    await expect(popup.locator('#reuse-primary-card')).toHaveCount(0);

    const order = await popup.locator('.popup-container > *').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).id || (node as HTMLElement).className)
    );
    expect(order.indexOf('copy-panel')).toBeGreaterThan(-1);
    expect(order.indexOf('settings-form')).toBeGreaterThan(-1);
    expect(order.indexOf('copy-panel')).toBeLessThan(order.indexOf('settings-form'));

    await popup.locator('#convert-button').click();
    const copiedText = await expectClipboardTextEventually(
      (text) => /article|paragraph|alpha|beta|gamma/i.test(text),
      driverPage
    );
    expect(copiedText.length).toBeGreaterThan(20);

    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const growthStats = snapshot.local.copilot_growth_stats as
          | { successfulCopyCount?: number }
          | undefined;
        return growthStats?.successfulCopyCount ?? 0;
      })
      .toBe(1);
  } finally {
    await page.close();
  }
});

test('popup keeps a recoverable error visible when the current page cannot be copied', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  const page = await extensionContext.newPage();
  try {
    await page.goto('chrome://version/');
    await page.bringToFront();

    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await popup.locator('#convert-button').click();

    await expect(popup.locator('#copy-action-status')).toBeVisible();
    await expect(popup.locator('#copy-action-status')).toHaveAttribute('data-state', 'error');
    await expect(popup.locator('#copy-action-status')).toContainText(
      /暂不支持复制|cannot be copied|普通网页|regular webpage/i
    );
    await expect(popup.locator('#convert-button')).toBeEnabled();
    await expect(popup.locator('#convert-button')).toBeFocused();
    expect(popup.isClosed()).toBe(false);
  } finally {
    await page.close();
  }
});

test('popup utility entries open user-facing settings and the Pro plan', async ({
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
    const promptsPagePromise = extensionContext.waitForEvent('page', {
      predicate: (candidate) => candidate.url().includes('/src/options/options.html#prompts')
    });
    await popup.locator('#add-prompt-button').click();
    const promptsPage = await promptsPagePromise;
    await promptsPage.waitForLoadState('domcontentloaded');
    await expect(promptsPage.locator('#add-prompt-btn')).toBeVisible();
    await promptsPage.close();

    await page.bringToFront();
    popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    const proPagePromise = extensionContext.waitForEvent('page', {
      predicate: (candidate) => candidate.url().includes('/src/options/options.html#pro')
    });
    await popup.locator('#upgrade-pro-entry').click();
    const proPage = await proPagePromise;
    await proPage.waitForLoadState('domcontentloaded');
    await expect(proPage.locator('#pro-tab')).toBeVisible();
    await expect(proPage.locator('#pro-page-title')).toContainText(/Copylot Pro/i);
    await expect(proPage.locator('.availability-badge')).toContainText(
      /尚未上线|Not available yet/i
    );
    await proPage.close();
  } finally {
    await page.close();
  }
});
