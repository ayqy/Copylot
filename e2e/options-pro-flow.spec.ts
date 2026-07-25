import { test, expect } from './fixtures';
import {
  openExtensionPage,
  seedSyncStorage
} from './helpers/extension-state';
import { openOptionsTab } from './helpers/options';

test('Pro tab clearly presents an unavailable roadmap instead of development controls', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      language: 'en'
    }
  });

  const page = await openExtensionPage(
    extensionContext,
    extensionId,
    'src/options/options.html#pro'
  );
  try {
    await openOptionsTab(page, 'pro');

    await expect(page.locator('#pro-page-title')).toContainText('Copylot Pro');
    await expect(page.locator('.availability-badge')).toContainText(
      /尚未上线|Not available yet/i
    );
    await expect(page.locator('.pro-page-hero')).toContainText(
      /没有订阅、付费或候补名单|no subscription, payment, or waitlist/i
    );
    await expect(page.locator('.free-capabilities')).toBeVisible();
    await expect(page.locator('.capability-list li')).toHaveCount(4);
    await expect(page.locator('#pro-roadmap')).toBeVisible();
    await expect(page.locator('.roadmap-item')).toHaveCount(3);
    await expect(page.locator('.pro-boundary-note')).toContainText(
      /当前无需做任何决定|Nothing to decide right now/i
    );

    await expect(page.locator('#pro-intent-campaign')).toHaveCount(0);
    await expect(page.locator('#pro-waitlist-button')).toHaveCount(0);
    await expect(page.locator('[id*="validation"]')).toHaveCount(0);
    await expect(page.locator('[id*="audit"]')).toHaveCount(0);
    await expect(page.locator('[id*="evidence"]')).toHaveCount(0);
    await expect(page.locator('[id*="campaign"]')).toHaveCount(0);
  } finally {
    await page.close();
  }
});

test('Pro roadmap jump keeps the user on the planning content', async ({
  extensionContext,
  extensionId
}) => {
  const page = await openExtensionPage(
    extensionContext,
    extensionId,
    'src/options/options.html#pro'
  );
  try {
    await openOptionsTab(page, 'pro');
    await page.locator('.primary-link-button').click();
    await expect(page).toHaveURL(/#pro-roadmap$/);
    await expect(page.locator('#pro-roadmap-title')).toBeVisible();
  } finally {
    await page.close();
  }
});
