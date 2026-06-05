import { test, expect } from './fixtures';
import { seedSyncStorage } from './helpers/extension-state';
import { completePopupOnboardingIfVisible, openPopupForActiveTab } from './helpers/popup';

test('real popup layout keeps settings before quick actions and fits without vertical scroll', async ({
  extensionContext,
  extensionId,
  driverPage,
  fixtureOrigin
}) => {
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1,
      userPrompts: [
        {
          id: 'layout-slot-1',
          title: 'Layout Slot 1',
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
    await completePopupOnboardingIfVisible(popup);

    const order = await popup.locator('.popup-container > *').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).id || (node as HTMLElement).className)
    );
    expect(order.indexOf('settings-form')).toBeGreaterThan(-1);
    expect(order.indexOf('quick-actions')).toBeGreaterThan(-1);
    expect(order.indexOf('settings-form')).toBeLessThan(order.indexOf('quick-actions'));

    await expect(popup.locator('#convert-button small')).toHaveCount(0);
    await expect(popup.locator('#quick-prompt-slot-1-button small')).toHaveCount(0);
    await expect(popup.locator('.shortcut-settings-hint')).toHaveCount(0);

    const hasVerticalScroll = await popup.locator('body').evaluate(() => {
      return document.documentElement.scrollHeight > window.innerHeight || document.body.scrollHeight > window.innerHeight;
    });
    expect(hasVerticalScroll).toBe(false);

    const rootColors = await popup.locator('#convert-button').evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        color: styles.color,
        background: styles.backgroundColor || styles.backgroundImage
      };
    });
    expect(rootColors.color).not.toBe(rootColors.background);
  } finally {
    await page.close();
  }
});

test('popup and options keep readable contrast in light and dark color schemes', async ({
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
    await completePopupOnboardingIfVisible(popupPage);
    await popupPage.emulateMedia({ colorScheme: 'light' });
    await options.emulateMedia({ colorScheme: 'dark' });
    await options.goto(`chrome-extension://${extensionId}/src/options/options.html`);

    const popupContrast = await popupPage.locator('.shortcut-settings-card').evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        color: styles.color,
        background: styles.backgroundColor
      };
    });
    expect(popupContrast.color).not.toBe(popupContrast.background);

    const optionsContrast = await options.locator('.shortcut-command-card').first().evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        color: styles.color,
        background: styles.backgroundColor
      };
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
