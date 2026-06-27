import type { Locator } from '@playwright/test';
import { test, expect } from './fixtures';
import { clearClipboard, expectClipboardTextEventually } from './helpers/clipboard';
import {
  getStorageSnapshot,
  openExtensionPage,
  seedSyncStorage
} from './helpers/extension-state';
import {
  addCustomChatServiceViaModal,
  createPromptViaModal,
  openOptionsTab,
  setOptionsCheckboxState
} from './helpers/options';
import { invokeContextMenu } from './helpers/extension-state';

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

test('options can add edit delete custom chat service and set default', async ({
  extensionContext,
  extensionId
}) => {
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await addCustomChatServiceViaModal(page, {
      name: 'QA Chat Service',
      url: 'https://example.com/qa-chat'
    });

    await expect(page.locator('.chat-service-card').filter({ hasText: 'QA Chat Service' })).toHaveCount(1);
    await page.locator('#default-chat-service').selectOption({ label: 'QA Chat Service' });
    await setOptionsCheckboxState(page, '#default-auto-open-chat', true);
    await expect(page.locator('#default-chat-service')).toHaveValue(/.+/);

    const card = page.locator('.chat-service-card').filter({ hasText: 'QA Chat Service' });
    await card.locator('.edit-service-btn').click();
    await page.locator('#chat-service-name').fill('QA Chat Service Updated');
    await page.locator('#save-chat-service-btn').click();
    await expect(page.locator('.chat-service-card').filter({ hasText: 'QA Chat Service Updated' })).toHaveCount(1);

    page.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await page.locator('.chat-service-card').filter({ hasText: 'QA Chat Service Updated' }).locator('.delete-service-btn').click();
    await expect(page.locator('.chat-service-card').filter({ hasText: 'QA Chat Service Updated' })).toHaveCount(0);
  } finally {
    await page.close();
  }
});

test('prompt with target chat auto-opens configured chat service', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await clearClipboard(driverPage);
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await addCustomChatServiceViaModal(page, {
      name: 'Fixture Chat',
      url: `${fixtureOrigin}/chat.html?target=fixture`
    });
    const customServiceId = await page
      .locator('.chat-service-card')
      .filter({ hasText: 'Fixture Chat' })
      .getAttribute('data-id');
    expect(customServiceId).toBeTruthy();
    await openOptionsTab(page, 'prompts');
    await createPromptViaModal(page, {
      title: 'Prompt Chat Open',
      template: 'Send this:\n\n{content}',
      targetChatId: customServiceId || undefined,
      autoOpenChat: true
    });

    const promptId = await page.locator('.prompt-card').filter({ hasText: 'Prompt Chat Open' }).getAttribute('data-id');
    expect(promptId).toBeTruthy();

    const article = await extensionContext.newPage();
    try {
      await article.goto(`${fixtureOrigin}/article.html`);
      await article.locator('#article-paragraph').selectText();

      await invokeContextMenu(driverPage, {
        menuItemId: promptId!,
        selectionText: (await article.locator('#article-paragraph').textContent()) || '',
        pageUrl: article.url()
      });

      const chatPage = await extensionContext.waitForEvent('page', {
        predicate: (candidate) => candidate.url().startsWith(`${fixtureOrigin}/chat.html?target=fixture`)
      });
      await chatPage.waitForLoadState('domcontentloaded');
      await expect(chatPage.locator('#chat-heading')).toBeVisible();
      await expectClipboardTextEventually(/Send this:/, driverPage);
      await chatPage.close();
    } finally {
      await article.close();
    }
  } finally {
    await page.close();
  }
});

test('disabled target chat falls back to clipboard-only execution', async ({
  extensionContext,
  driverPage,
  fixtureOrigin
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
      userPrompts: [
        {
          id: 'disabled-chat-prompt',
          title: 'Disabled Chat Prompt',
          template: 'Disabled path:\n\n{content}',
          usageCount: 0,
          createdAt: 1,
          builtIn: false,
          deleted: false,
          templateVersion: 1,
          targetChatId: 'disabled-chat',
          autoOpenChat: true
        }
      ],
      isClipboardAccumulatorEnabled: false,
      chatServices: [
        {
          id: 'disabled-chat',
          name: 'Disabled Chat',
          url: `${fixtureOrigin}/chat.html?target=disabled`,
          enabled: false,
          builtIn: false
        }
      ],
      defaultAutoOpenChat: false,
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1
    }
  });

  const article = await extensionContext.newPage();
  try {
    await article.goto(`${fixtureOrigin}/article.html`);
    await article.locator('#article-paragraph').selectText();

    await invokeContextMenu(driverPage, {
      menuItemId: 'disabled-chat-prompt',
      selectionText: (await article.locator('#article-paragraph').textContent()) || '',
      pageUrl: article.url()
    });

    await expectClipboardTextEventually(/Disabled path:/, driverPage);
    const snapshot = await getStorageSnapshot(driverPage);
    const openedChat = extensionContext
      .pages()
      .some((candidate) => candidate.url().startsWith(`${fixtureOrigin}/chat.html?target=disabled`));
    expect(openedChat).toBe(false);
    expect((snapshot.local.copilot_growth_stats as { successfulCopyCount?: number })?.successfulCopyCount).toBe(1);
  } finally {
    await article.close();
  }
});

test('chat services switches and action buttons keep fixed geometry in flex layouts', async ({
  extensionContext,
  extensionId
}) => {
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await openOptionsTab(page, 'chat-services');
    await addCustomChatServiceViaModal(page, {
      name: 'Geometry Chat Service',
      url: 'https://example.com/geometry-chat'
    });

    const defaultSwitchLabel = page
      .locator('#default-auto-open-chat')
      .locator('xpath=parent::label');
    const defaultSlider = page.locator('#default-auto-open-chat + .slider');
    await expectBoxSize(defaultSwitchLabel, { width: 48, height: 24 });
    await expectBoxSize(defaultSlider, { width: 48, height: 24 });
    await expectPseudoElementSize(defaultSlider, '::before', { width: 18, height: 18 });

    const serviceCard = page.locator('.chat-service-card').filter({ hasText: 'Geometry Chat Service' });
    const serviceSwitchLabel = serviceCard
      .locator('.service-enabled-toggle')
      .locator('xpath=parent::label');
    const serviceSlider = serviceCard.locator('.service-enabled-toggle + .slider');
    await expectBoxSize(serviceSwitchLabel, { width: 48, height: 24 });
    await expectBoxSize(serviceSlider, { width: 48, height: 24 });
    await expectPseudoElementSize(serviceSlider, '::before', { width: 18, height: 18 });

    await expectBoxSize(serviceCard.locator('.open-service-btn'), { width: 32, height: 32 });
    await expectBoxSize(serviceCard.locator('.edit-service-btn'), { width: 32, height: 32 });
    await expectBoxSize(serviceCard.locator('.delete-service-btn'), { width: 32, height: 32 });
  } finally {
    await page.close();
  }
});
