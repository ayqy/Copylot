import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { clearClipboard } from './helpers/clipboard';
import { seedSyncStorage } from './helpers/extension-state';

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

test('double-click mode requires a second click before showing the copy button', async ({
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
      interactionMode: 'dblclick',
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
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.locator('#article-paragraph').selectText();
    await page.locator('#article-paragraph').click();
    await expect(page.locator('#ai-copilot-copy-btn')).toBeHidden();
    await page.locator('#article-paragraph').click();
    await expect(page.locator('#ai-copilot-copy-btn')).toBeVisible();
  } finally {
    await page.close();
  }
});

test('hover mode exposes copy button on code blocks only', async ({
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
    await moveMouseIntoLocator(page, '#code-article .intro', { x: 16, y: 16 });
    await expect(page.locator('#ai-copilot-copy-btn')).toBeHidden();
    await moveMouseIntoLocator(page, '#code-block');
    await expect(page.locator('#ai-copilot-copy-btn')).toBeVisible();
  } finally {
    await page.close();
  }
});
