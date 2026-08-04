import path from 'node:path';
import { test, expect } from './fixtures';
import {
  getContextMenuItems,
  getSettingsSnapshot,
  openExtensionPage,
  waitForPromptCardByTitle
} from './helpers/extension-state';
import {
  createPromptViaModal,
  deletePromptViaCard,
  editPromptViaCard,
  openImportExportModal
} from './helpers/options';
import { waitForDownloadAndReadJson } from './helpers/download';

test('English options dialogs localize placeholders, labels, tooltips, and sample content', async ({
  englishExtensionContext,
  englishExtensionId
}) => {
  const page = await openExtensionPage(
    englishExtensionContext,
    englishExtensionId,
    'src/options/options.html'
  );
  try {
    const languageEvidence = await page.evaluate(() => ({
      uiLanguage: chrome.i18n.getUILanguage(),
      navigatorLanguage: navigator.language,
      localizedPromptPlaceholder: chrome.i18n.getMessage('promptTitlePlaceholder')
    }));
    expect(languageEvidence).toEqual({
      uiLanguage: expect.stringMatching(/^en/i),
      navigatorLanguage: expect.stringMatching(/^en/i),
      localizedPromptPlaceholder: 'Name your prompt'
    });
    await page.locator('#add-prompt-btn').click();
    await expect(page.locator('#prompt-editor-modal')).toBeVisible();
    await expect(page.locator('#prompt-title')).toHaveAttribute('placeholder', 'Name your prompt');
    await expect(page.locator('#prompt-template')).toHaveAttribute(
      'placeholder',
      /Enter your prompt template/
    );
    await expect(page.locator('#insert-content-placeholder')).toHaveAttribute(
      'title',
      'Insert content placeholder'
    );
    await expect(page.locator('#preview-prompt')).toHaveAttribute('title', 'Preview');
    await expect(page.locator('#prompt-editor-modal')).not.toContainText(/[\u3400-\u9fff]/);

    await page.locator('#prompt-template').fill('Summarize:\n\n{content}');
    await page.locator('#preview-prompt').click();
    await expect(page.locator('#preview-modal')).toBeVisible();
    await expect(page.locator('#preview-sample')).toHaveAttribute(
      'placeholder',
      'Enter sample content to preview the result...'
    );
    await expect(page.locator('#preview-sample')).toHaveValue(
      'This is some sample text to demonstrate the effect of the prompt.'
    );
    await expect(page.locator('#preview-modal')).not.toContainText(/[\u3400-\u9fff]/);
  } finally {
    await page.close();
  }
});

test('prompt CRUD serializes context-menu rebuilds without duplicate IDs', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  const serviceWorker = extensionContext.serviceWorkers()[0] || (await extensionContext.waitForEvent('serviceworker'));
  const duplicateMenuErrors: string[] = [];
  serviceWorker.on('console', (message) => {
    if (/duplicate id|Unchecked runtime\.lastError/i.test(message.text())) {
      duplicateMenuErrors.push(message.text());
    }
  });

  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await createPromptViaModal(page, {
      title: 'CRUD Context Prompt',
      template: 'Create:\n\n{content}'
    });
    const promptId = await page
      .locator('.prompt-card')
      .filter({ hasText: 'CRUD Context Prompt' })
      .getAttribute('data-id');
    expect(promptId).toBeTruthy();

    await expect
      .poll(async () => (await getContextMenuItems(driverPage)).find((item) => item.id === promptId)?.title)
      .toBe('CRUD Context Prompt');

    await editPromptViaCard(page, promptId!, {
      title: 'CRUD Context Prompt Edited',
      template: 'Edit:\n\n{content}'
    });
    await expect
      .poll(async () => (await getContextMenuItems(driverPage)).find((item) => item.id === promptId)?.title)
      .toBe('CRUD Context Prompt Edited');

    await deletePromptViaCard(page, promptId!);
    await expect
      .poll(async () => (await getContextMenuItems(driverPage)).some((item) => item.id === promptId))
      .toBe(false);
    expect(duplicateMenuErrors).toEqual([]);
  } finally {
    await page.close();
  }
});

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
