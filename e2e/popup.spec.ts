import { test, expect } from './fixtures';
import { openExtensionPage } from './helpers/extension-state';

test('popup page renders core controls', async ({ extensionContext, extensionId }) => {
  const page = await openExtensionPage(extensionContext, extensionId, 'src/popup/popup.html');

  await expect(page.locator('#convert-button')).toBeVisible();
  await expect(page.locator('#add-prompt-button')).toBeVisible();
  await expect(page.locator('#popup-pro-waitlist-copy')).toBeVisible();
});
