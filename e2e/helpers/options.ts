import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function openOptionsTab(
  page: Page,
  tabName: 'prompts' | 'chat-services' | 'privacy' | 'pro'
): Promise<void> {
  await page.locator(`.tabs-nav .tab-btn[data-tab="${tabName}"]`).click();
  await expect(page.locator(`#${tabName}-tab`)).toHaveClass(/active/);
  await expect(page.locator(`#${tabName}-tab`)).toBeVisible();
}

async function setCheckboxState(page: Page, selector: string, checked: boolean): Promise<void> {
  const checkbox = page.locator(selector);
  await checkbox.evaluate((element, nextChecked) => {
    const input = element as HTMLInputElement;
    if (input.checked !== nextChecked) {
      input.click();
    }
  }, checked);
}

export async function setOptionsCheckboxState(page: Page, selector: string, checked: boolean): Promise<void> {
  await setCheckboxState(page, selector, checked);
}

export async function expandDetailsPanel(page: Page, selector: string): Promise<void> {
  const panel = page.locator(selector);
  await expect(panel).toBeVisible();
  if (!(await panel.evaluate((element) => (element as HTMLDetailsElement).open))) {
    await panel.locator('summary').click();
  }
  await expect(panel).toHaveJSProperty('open', true);
}

export async function createPromptViaModal(
  page: Page,
  params: {
    title: string;
    template: string;
    category?: string;
    targetChatId?: string;
    autoOpenChat?: boolean;
  }
): Promise<void> {
  await page.locator('#add-prompt-btn').click();
  await expect(page.locator('#prompt-editor-modal')).toBeVisible();
  await page.locator('#prompt-title').fill(params.title);
  if (params.category) {
    await page.locator('#prompt-category').selectOption(params.category);
  }
  if (params.targetChatId !== undefined) {
    await page.locator('#prompt-target-chat').selectOption(params.targetChatId);
  }
  await page.locator('#prompt-template').fill(params.template);
  if (params.autoOpenChat !== undefined) {
    await setCheckboxState(page, '#prompt-auto-open-chat', params.autoOpenChat);
  }
  await page.locator('#save-btn').click();
  await expect(page.locator('#prompt-editor-modal')).toBeHidden();
}

export async function editPromptViaCard(
  page: Page,
  promptId: string,
  params: {
    title?: string;
    template?: string;
    category?: string;
    targetChatId?: string;
    autoOpenChat?: boolean;
  }
): Promise<void> {
  await page.locator(`.prompt-card[data-id="${promptId}"] .edit-btn`).click();
  await expect(page.locator('#prompt-editor-modal')).toBeVisible();
  if (params.title !== undefined) {
    await page.locator('#prompt-title').fill(params.title);
  }
  if (params.category !== undefined) {
    await page.locator('#prompt-category').selectOption(params.category);
  }
  if (params.targetChatId !== undefined) {
    await page.locator('#prompt-target-chat').selectOption(params.targetChatId);
  }
  if (params.template !== undefined) {
    await page.locator('#prompt-template').fill(params.template);
  }
  if (params.autoOpenChat !== undefined) {
    await setCheckboxState(page, '#prompt-auto-open-chat', params.autoOpenChat);
  }
  await page.locator('#save-btn').click();
  await expect(page.locator('#prompt-editor-modal')).toBeHidden();
}

export async function deletePromptViaCard(page: Page, promptId: string): Promise<void> {
  page.once('dialog', (dialog) => {
    void dialog.accept();
  });
  await page.locator(`.prompt-card[data-id="${promptId}"] .delete-btn`).click();
  await expect(page.locator(`.prompt-card[data-id="${promptId}"]`)).toHaveCount(0);
}

export async function openImportExportModal(page: Page): Promise<void> {
  await page.locator('#import-export-btn').click();
  await expect(page.locator('#import-export-modal')).toBeVisible();
}

export async function addCustomChatServiceViaModal(
  page: Page,
  params: {
    name: string;
    url: string;
  }
): Promise<void> {
  await openOptionsTab(page, 'chat-services');
  await page.locator('#add-custom-chat-btn').click();
  await expect(page.locator('#chat-service-editor-modal')).toBeVisible();
  await page.locator('#chat-service-name').fill(params.name);
  await page.locator('#chat-service-url').fill(params.url);
  await page.locator('#save-chat-service-btn').click();
  await expect(page.locator('#chat-service-editor-modal')).toBeHidden();
}
