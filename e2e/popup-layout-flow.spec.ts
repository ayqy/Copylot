import type { Locator } from '@playwright/test';
import { test, expect } from './fixtures';
import { seedSyncStorage } from './helpers/extension-state';
import { openPopupForActiveTab } from './helpers/popup';

async function expectBoxSize(
  locator: Locator,
  expected: { width: number; height: number }
): Promise<void> {
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

test('popup keeps the primary copy action first and avoids horizontal overflow', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      userPrompts: [
        {
          id: 'layout-slot-1',
          title: 'Summarize article',
          template: 'Summary:\n\n{content}',
          usageCount: 0,
          createdAt: 1,
          builtIn: false,
          deleted: false,
          templateVersion: 1,
          quickAccessSlot: 1
        }
      ]
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.bringToFront();

    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await popup.setViewportSize({ width: 400, height: 600 });

    const order = await popup.locator('.popup-container > *').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).id || (node as HTMLElement).className)
    );
    expect(order.indexOf('copy-panel')).toBeLessThan(order.indexOf('quick-prompts-section'));
    expect(order.indexOf('quick-prompts-section')).toBeLessThan(order.indexOf('settings-form'));

    await expect(popup.locator('#convert-button')).toBeVisible();
    await expect(popup.locator('#quick-prompt-slot-1-button')).toBeVisible();

    const overflow = await popup.locator('body').evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth
    }));
    expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth);

    const primaryStyles = await popup.locator('#convert-button').evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        color: styles.color,
        background: styles.backgroundColor,
        minHeight: Number.parseFloat(styles.minHeight)
      };
    });
    expect(primaryStyles.color).not.toBe(primaryStyles.background);
    expect(primaryStyles.minHeight).toBeGreaterThanOrEqual(48);
  } finally {
    await page.close();
  }
});

test('popup and options retain readable surfaces in light and dark themes', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  const hostPage = await extensionContext.newPage();
  const options = await extensionContext.newPage();
  let popupPage = null as Awaited<ReturnType<typeof openPopupForActiveTab>> | null;
  try {
    await hostPage.goto(`${fixtureOrigin}/article.html`);
    await hostPage.bringToFront();
    popupPage = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await popupPage.emulateMedia({ colorScheme: 'light' });
    await options.emulateMedia({ colorScheme: 'dark' });
    await options.goto(`chrome-extension://${extensionId}/src/options/options.html#privacy`);

    const popupContrast = await popupPage.locator('.copy-panel').evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return { color: styles.color, background: styles.backgroundColor };
    });
    expect(popupContrast.color).not.toBe(popupContrast.background);

    const optionsContrast = await options.locator('.data-choice-panel').evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return { color: styles.color, background: styles.backgroundColor };
    });
    expect(optionsContrast.color).not.toBe(optionsContrast.background);
  } finally {
    await hostPage.close();
    if (popupPage) {
      await popupPage.close();
    }
    await options.close();
  }
});

test('popup switches keep fixed track geometry in flex layouts', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article.html`);
    await page.bringToFront();

    const popup = await openPopupForActiveTab(extensionContext, extensionId, driverPage);
    await popup.locator('#toggle-more-settings').click();
    await expect(popup.locator('#more-settings-panel')).toBeVisible();

    for (const selector of [
      '#enable-magic-copy-switch',
      '#enable-hover-magic-copy-switch',
      '#enable-clipboard-accumulator-switch'
    ]) {
      const switchLabel = popup
        .locator(selector)
        .locator('xpath=ancestor::label[contains(@class, "switch")]');
      const slider = popup.locator(`${selector} + .slider`);
      await expectBoxSize(switchLabel, { width: 36, height: 20 });
      await expectBoxSize(slider, { width: 36, height: 20 });
      await expectPseudoElementSize(slider, '::before', { width: 14, height: 14 });
    }
  } finally {
    await page.close();
  }
});
