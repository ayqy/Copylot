import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import {
  clearClipboard,
  expectClipboardTextEventually,
  normalizeClipboardText
} from './helpers/clipboard';
import { invokeContextMenu, seedSyncStorage } from './helpers/extension-state';

async function moveMouseIntoLocator(
  page: Page,
  selector: string,
  offset: { x: number; y: number } = { x: 8, y: 8 }
): Promise<void> {
  const box = await page.locator(selector).boundingBox();
  if (!box) {
    throw new Error(`bounding box is unavailable for ${selector}`);
  }
  await page.mouse.move(box.x + offset.x, box.y + offset.y);
  await page.waitForTimeout(100);
}

test('hover copy on code blocks removes copy-label lines and recognizable line numbers', async ({
  extensionContext,
  fixtureOrigin,
  driverPage
}) => {
  await clearClipboard(driverPage);
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isMagicCopyEnabled: true,
      isHoverMagicCopyEnabled: true,
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
    await page.goto(`${fixtureOrigin}/code.html`);
    await moveMouseIntoLocator(page, '#code-block');
    await expect(page.locator('#ai-copilot-copy-btn')).toBeVisible();
    await page.locator('#ai-copilot-copy-btn').click();

    const text = normalizeClipboardText(await expectClipboardTextEventually(/function buildPrompt/, driverPage));
    expect(text).toContain('function buildPrompt() {');
    expect(text).toContain('const tag = "\\#summary";');
    expect(text).toContain('const docs = ["\\[intro\\]", "outline"];');
    expect(text).not.toContain('复制代码');
    expect(text).not.toContain('1Copy');
  } finally {
    await page.close();
  }
});

test('convert-page on a code-heavy page keeps surrounding context and fenced code in markdown mode', async ({
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
    await page.goto(`${fixtureOrigin}/code.html`);
    await page.bringToFront();
    await invokeContextMenu(driverPage, {
      menuItemId: 'convert-page-to-ai-friendly-format',
      pageUrl: page.url()
    });

    const text = normalizeClipboardText(await expectClipboardTextEventually(/```/, driverPage));
    expect(text).toContain('This snippet builds a prompt payload');
    expect(text).toContain('```');
    expect(text).toContain('function buildPrompt() {');
  } finally {
    await page.close();
  }
});
