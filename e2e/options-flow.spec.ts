import { test, expect } from './fixtures';
import { openExtensionPage, waitForPromptCardById, waitForPromptCardByTitle } from './helpers/extension-state';

test('options page supports built-in prompt display and custom prompt creation', async ({
  extensionContext,
  extensionId
}) => {
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await waitForPromptCardById(page, 'builtin-summary-article');

    await page.locator('#add-prompt-btn').click();
    await expect(page.locator('#prompt-editor-modal')).toBeVisible();
    await page.locator('#prompt-title').fill('E2E Prompt');
    await page.locator('#prompt-template').fill('Summarize this:\n\n{content}');
    await page.locator('#save-btn').click();

    await waitForPromptCardById(page, 'builtin-summary-article');
    await waitForPromptCardByTitle(page, 'E2E Prompt');
  } finally {
    await page.close();
  }
});
