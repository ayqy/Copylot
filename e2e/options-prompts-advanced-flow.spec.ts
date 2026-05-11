import path from 'node:path';
import { test, expect } from './fixtures';
import {
  getSettingsSnapshot,
  openExtensionPage,
  waitForPromptCardByTitle
} from './helpers/extension-state';
import {
  createPromptViaModal,
  editPromptViaCard,
  openImportExportModal
} from './helpers/options';
import { waitForDownloadAndReadJson } from './helpers/download';

test('options can edit prompt title template category target chat and auto-open', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await createPromptViaModal(page, {
      title: 'Plan Prompt',
      template: 'Plan:\n\n{content}',
      category: 'summary'
    });
    const promptId = await page.locator('.prompt-card').filter({ hasText: 'Plan Prompt' }).getAttribute('data-id');
    expect(promptId).toBeTruthy();

    await editPromptViaCard(page, promptId!, {
      title: 'Edited Prompt',
      template: 'Edited:\n\n{content}',
      category: 'writing',
      targetChatId: 'chatgpt',
      autoOpenChat: true
    });

    await waitForPromptCardByTitle(page, 'Edited Prompt');
    const settings = await getSettingsSnapshot(driverPage);
    const prompts = (settings.userPrompts as Array<Record<string, unknown>>) || [];
    const edited = prompts.find((item) => item.id === promptId);
    expect(edited?.title).toBe('Edited Prompt');
    expect(edited?.targetChatId).toBe('chatgpt');
    expect(edited?.autoOpenChat).toBe(true);
  } finally {
    await page.close();
  }
});

test('options search filter sort and preview prompt output', async ({ extensionContext, extensionId }) => {
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await createPromptViaModal(page, {
      title: 'Alpha Prompt',
      template: 'Alpha:\n\n{content}',
      category: 'writing'
    });
    await createPromptViaModal(page, {
      title: 'Beta Prompt',
      template: 'Beta:\n\n{content}',
      category: 'summary'
    });

    await page.locator('#search-input').fill('Alpha');
    await expect(page.locator('.prompt-card')).toHaveCount(1);
    await expect(page.locator('.prompt-card-title')).toContainText('Alpha Prompt');

    await page.locator('#search-input').fill('');
    await page.locator('#category-filter').selectOption('summary');
    await expect(page.locator('.prompt-card')).toHaveCount(2);
    await expect(page.locator('.prompt-card-title').filter({ hasText: 'Beta Prompt' })).toHaveCount(1);

    await page.locator('#category-filter').selectOption('all');
    await page.locator('#prompt-sort-select').selectOption('most_used');

    await page.locator('.prompt-card').filter({ hasText: 'Alpha Prompt' }).locator('.edit-btn').click();
    await page.locator('#preview-prompt').click();
    await expect(page.locator('#preview-modal')).toBeVisible();
    await expect(page.locator('#preview-result')).toContainText('Alpha:');
    await page.locator('#close-preview-btn').click();
    await expect(page.locator('#preview-modal')).toBeHidden();
    await page.locator('#cancel-btn').click();
  } finally {
    await page.close();
  }
});

test('options batch delete and import export prompt library', async ({ extensionContext, extensionId }) => {
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await createPromptViaModal(page, {
      title: 'Delete One',
      template: 'Delete 1:\n\n{content}'
    });
    await createPromptViaModal(page, {
      title: 'Delete Two',
      template: 'Delete 2:\n\n{content}'
    });

    await page.locator('.prompt-card').filter({ hasText: 'Delete One' }).locator('.prompt-card-checkbox').check();
    await page.locator('.prompt-card').filter({ hasText: 'Delete Two' }).locator('.prompt-card-checkbox').check();
    await page.locator('#batch-action-btn').click();
    page.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await page.locator('.batch-menu-item[data-action="delete-selected"]').click();
    await expect(page.locator('.prompt-card').filter({ hasText: 'Delete One' })).toHaveCount(0);
    await expect(page.locator('.prompt-card').filter({ hasText: 'Delete Two' })).toHaveCount(0);

    await openImportExportModal(page);
    const exportResult = await waitForDownloadAndReadJson<{ prompts: Array<{ title: string }> }>(page, async () => {
      await page.locator('#export-btn').click();
    });
    expect(exportResult.filename).toMatch(/magic-copy-prompts-/);
    expect(Array.isArray(exportResult.json.prompts)).toBe(true);
    await expect(page.locator('#import-export-modal')).toBeHidden();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await openImportExportModal(page);
    await page.locator('.import-export-tabs .tab-btn[data-tab="import"]').click();
    await expect(page.locator('#import-tab')).toHaveClass(/active/);
    await page.locator('#import-btn').click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles(path.resolve(process.cwd(), 'e2e/fixtures/import-prompts-advanced.json'));
    await expect(page.locator('.prompt-card').filter({ hasText: 'Imported Summary Prompt' })).toHaveCount(1);
    await expect(page.locator('.prompt-card').filter({ hasText: 'Imported Writing Prompt' })).toHaveCount(1);
  } finally {
    await page.close();
  }
});
