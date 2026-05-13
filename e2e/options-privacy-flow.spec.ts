import { test, expect } from './fixtures';
import { clearClipboard, expectClipboardTextEventually } from './helpers/clipboard';
import { openExtensionPage, seedLocalStorage, seedSyncStorage } from './helpers/extension-state';
import { expandDetailsPanel, openOptionsTab, setOptionsCheckboxState } from './helpers/options';

test.skip('anonymous usage toggle off clears telemetry data immediately', async ({ extensionContext, extensionId }) => {
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await openOptionsTab(page, 'privacy');
    await setOptionsCheckboxState(page, '#anonymous-usage-data-switch', true);
    await expandDetailsPanel(page, '#telemetry-events-panel');
    await page.locator('#telemetry-events-refresh').click();
    await setOptionsCheckboxState(page, '#anonymous-usage-data-switch', false);
    await expect(page.locator('#telemetry-events-view')).toHaveValue('[]');
  } finally {
    await page.close();
  }
});

test.skip('telemetry events panel refresh copy and clear work', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  await clearClipboard(driverPage);
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isAnonymousUsageDataEnabled: true
    }
  });
  await seedLocalStorage(driverPage, {
    copilot_telemetry_events: [
      { name: 'popup_opened', ts: 1715400000000 },
      { name: 'wom_share_copied', ts: 1715400001000, props: { source: 'popup' } }
    ]
  });

  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await openOptionsTab(page, 'privacy');
    await expandDetailsPanel(page, '#telemetry-events-panel');
    await page.locator('#telemetry-events-refresh').click();
    await expect(page.locator('#telemetry-events-view')).toHaveValue(/wom_share_copied/);
    await page.locator('#telemetry-events-copy').click();
    await expectClipboardTextEventually(/wom_share_copied/, driverPage);
    await page.locator('#telemetry-events-clear').click();
    await expect(page.locator('#telemetry-events-view')).toHaveValue('[]');
  } finally {
    await page.close();
  }
});

test.skip('wom summary growth funnel and growth stats panels refresh copy reset and evidence-pack actions work', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  await clearClipboard(driverPage);
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isAnonymousUsageDataEnabled: true
    }
  });
  await seedLocalStorage(driverPage, {
    copilot_telemetry_events: [
      { name: 'wom_share_opened', ts: 1715400000000, props: { source: 'popup' } },
      { name: 'wom_share_copied', ts: 1715400001000, props: { source: 'popup' } }
    ],
    copilot_growth_stats: {
      installedAt: 1715300000000,
      successfulCopyCount: 5,
      firstPopupOpenedAt: 1715300001000
    }
  });

  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await openOptionsTab(page, 'privacy');
    await expandDetailsPanel(page, '#wom-summary-panel');
    await page.locator('#wom-summary-refresh').click();
    await expect(page.locator('#wom-summary-view')).toHaveValue(/wom_share_opened/);
    await page.locator('#wom-summary-copy').click();
    await expectClipboardTextEventually(/wom_share_opened/, driverPage);
    await page.locator('#wom-summary-evidence-pack-copy').click();
    await expectClipboardTextEventually(/popup/, driverPage);

    await expandDetailsPanel(page, '#growth-funnel-panel');
    await page.locator('#growth-funnel-refresh').click();
    await page.locator('#growth-funnel-copy').click();
    await expectClipboardTextEventually(/successfulCopyCount/, driverPage);

    await expandDetailsPanel(page, '#growth-stats-panel');
    await page.locator('#growth-stats-refresh').click();
    await expect(page.locator('#growth-stats-view')).toHaveValue(/successfulCopyCount/);
    await page.locator('#growth-stats-copy').click();
    await expectClipboardTextEventually(/successfulCopyCount/, driverPage);
    await page.locator('#growth-stats-reset').click();
    await expect(page.locator('#growth-stats-view')).toHaveValue(/"successfulCopyCount": 0/);
  } finally {
    await page.close();
  }
});
