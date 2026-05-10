import { test, expect } from './fixtures';

test('content script can render magic copy button on selected content', async ({ extensionContext, fixtureOrigin }) => {
  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/index.html`);

    await page.locator('#article-paragraph').selectText();
    await page.locator('#article-paragraph').click();

    await expect(page.locator('#ai-copilot-copy-btn')).toBeVisible();
  } finally {
    await page.close();
  }
});
