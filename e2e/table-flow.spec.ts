import { test, expect } from './fixtures';
import {
  clearClipboard,
  expectClipboardTextEventually,
  normalizeClipboardText
} from './helpers/clipboard';
import { seedSyncStorage } from './helpers/extension-state';

test('table copy can output RFC4180-style csv from a clicked cell', async ({
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
      outputFormat: 'plaintext',
      tableOutputFormat: 'csv',
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
    await page.goto(`${fixtureOrigin}/table.html`);
    await page.locator('#starter-plan').click();
    await expect(page.locator('#ai-copilot-copy-btn')).toBeVisible();
    await page.locator('#ai-copilot-copy-btn').click();

    const text = normalizeClipboardText(await expectClipboardTextEventually(/Plan,Requests,Price/, driverPage));
    expect(text).toContain('Starter,100,$5');
    expect(text).toContain('Growth,500,$19');
  } finally {
    await page.close();
  }
});

test('complex table copy preserves markdown structure and escapes nested content safely', async ({
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
    await page.goto(`${fixtureOrigin}/table-complex.html`);
    await page.locator('#complex-starter').click();
    await expect(page.locator('#ai-copilot-copy-btn')).toBeVisible();
    await page.locator('#ai-copilot-copy-btn').click();

    const text = normalizeClipboardText(await expectClipboardTextEventually(/\|/, driverPage));
    expect(text).toContain('Starter');
    expect(text).toContain('Line one<br>Line two with \\| pipe');
    expect(text).toContain('Region: US');
  } finally {
    await page.close();
  }
});
