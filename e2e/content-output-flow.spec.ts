import { test, expect } from './fixtures';
import {
  clearClipboard,
  expectClipboardTextEventually,
  normalizeClipboardText
} from './helpers/clipboard';
import { getBadgeText, seedSyncStorage } from './helpers/extension-state';

test('markdown output includes title url and preserves inline links', async ({
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
      attachTitle: true,
      attachURL: true,
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
    const articleUrl = `${fixtureOrigin}/article.html`;
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.locator('#article-paragraph').selectText();
    await page.locator('#article-paragraph').click();
    await page.locator('#ai-copilot-copy-btn').click();

    const text = await expectClipboardTextEventually((value) => {
      return (
        value.includes('Fixture Article') &&
        value.includes(articleUrl) &&
        value.includes('[research notes](https://example.com/research)')
      );
    }, driverPage);

    expect(text).toContain('Copylot should capture this paragraph');
  } finally {
    await page.close();
  }
});

test('plaintext output strips markdown formatting and omits extras', async ({
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
      outputFormat: 'plaintext',
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
    const articleUrl = `${fixtureOrigin}/article.html`;
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.locator('#article-paragraph').selectText();
    await page.locator('#article-paragraph').click();
    await page.locator('#ai-copilot-copy-btn').click();

    const text = await expectClipboardTextEventually((value) => {
      return value.includes('research notes') && !value.includes('[research notes]');
    }, driverPage);

    expect(text).not.toContain('Fixture Article');
    expect(text).not.toContain(articleUrl);
    expect(text).not.toContain('[research notes]');
  } finally {
    await page.close();
  }
});

test('append mode merges two copies and updates action badge', async ({
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
      outputFormat: 'plaintext',
      tableOutputFormat: 'markdown',
      attachTitle: false,
      attachURL: false,
      language: 'en',
      interactionMode: 'click',
      userPrompts: [],
      isClipboardAccumulatorEnabled: true,
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

    const text = normalizeClipboardText(await expectClipboardTextEventually(/---/, driverPage));
    expect(text).toContain('Copylot should capture this paragraph');
    expect(text).toContain('A second paragraph exists');
    expect(text).toContain('---');
  } finally {
    await page.close();
  }
});
