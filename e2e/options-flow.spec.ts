import type { Locator } from '@playwright/test';
import { test, expect } from './fixtures';
import { openExtensionPage, waitForPromptCardById, waitForPromptCardByTitle } from './helpers/extension-state';

async function expectBoxSize(locator: Locator, expected: { width: number; height: number }): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeCloseTo(expected.width, 1);
  expect(box!.height).toBeCloseTo(expected.height, 1);
}

async function expectPseudoElementSize(
  locator: Locator,
  pseudo: string,
  expected: { width: number; height: number }
): Promise<void> {
  const size = await locator.evaluate(
    (element, value) => {
      const styles = window.getComputedStyle(element, value.pseudo);
      return {
        width: Number.parseFloat(styles.width),
        height: Number.parseFloat(styles.height)
      };
    },
    { pseudo }
  );
  expect(size.width).toBeCloseTo(expected.width, 1);
  expect(size.height).toBeCloseTo(expected.height, 1);
}

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

test('options prompt modal switch and prompt card action buttons keep fixed geometry', async ({
  extensionContext,
  extensionId
}) => {
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await waitForPromptCardById(page, 'builtin-summary-article');

    await page.locator('#add-prompt-btn').click();
    await expect(page.locator('#prompt-editor-modal')).toBeVisible();

    const switchLabel = page.locator('#prompt-auto-open-chat').locator('xpath=parent::label');
    const slider = page.locator('#prompt-auto-open-chat + .slider');
    await expectBoxSize(switchLabel, { width: 48, height: 24 });
    await expectBoxSize(slider, { width: 48, height: 24 });
    await expectPseudoElementSize(slider, '::before', { width: 18, height: 18 });

    const firstCard = page.locator('.prompt-card').first();
    await expectBoxSize(firstCard.locator('.edit-btn'), { width: 32, height: 32 });
    await expectBoxSize(firstCard.locator('.duplicate-btn'), { width: 32, height: 32 });
    await expectBoxSize(firstCard.locator('.delete-btn'), { width: 32, height: 32 });
  } finally {
    await page.close();
  }
});
