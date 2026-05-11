import { test, expect } from './fixtures';
import { clearClipboard } from './helpers/clipboard';
import {
  getLastCopiedText,
  getStorageSnapshot,
  openExtensionPage,
  seedLocalStorage,
  seedSyncStorage
} from './helpers/extension-state';
import { waitForDownloadAndReadJson, waitForDownloadAndReadText } from './helpers/download';
import { expandDetailsPanel, openOptionsTab } from './helpers/options';

test('pro waitlist survey copy writes sanitized survey payload with env info only', async ({
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
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await openOptionsTab(page, 'pro');
    await page.locator('#pro-waitlist-survey-use-case').fill('Summarize competitive research');
    await page.locator('#pro-waitlist-survey-capability-advanced-cleaning').check();
    await page.locator('#pro-waitlist-survey-pay-willing').selectOption('yes');
    await page.locator('#pro-waitlist-survey-copy').click();
    await expect(page.locator('#pro-waitlist-survey-copy')).toContainText(/copied|已复制/i);
    const snapshot = await getStorageSnapshot(driverPage);
    const surveyEvents = (snapshot.local.copilot_telemetry_events as Array<{ name?: string; props?: Record<string, unknown> }> | undefined)
      ?.filter((event) => event.name === 'pro_waitlist_survey_copied') || [];
    expect(surveyEvents.length).toBeGreaterThan(0);
  } finally {
    await page.close();
  }
});

test('pro waitlist survey copy-open opens waitlist url and records source-attributed survey event', async ({
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

  const page = await openExtensionPage(
    extensionContext,
    extensionId,
    'src/options/options.html?pro_survey_source=popup#pro-waitlist-survey'
  );
  try {
    await openOptionsTab(page, 'pro');
    await page.locator('#pro-waitlist-survey-use-case').fill('Popup attributed survey');
    const waitlistPromise = extensionContext.waitForEvent('page');
    await page.locator('#pro-waitlist-survey-copy-open').click();
    const waitlistPage = await waitlistPromise;
    await waitlistPage.waitForLoadState('domcontentloaded');
    expect(waitlistPage.url()).toContain('copy.useai.online');
    const snapshot = await getStorageSnapshot(driverPage);
    const openEvents = (snapshot.local.copilot_telemetry_events as Array<{ name?: string; props?: Record<string, unknown> }> | undefined)
      ?.filter((event) => event.name === 'pro_waitlist_opened') || [];
    expect(openEvents.length).toBeGreaterThan(0);
  } finally {
    await page.close();
  }
});

test('distribution toolkit requires valid campaign before copy actions', async ({
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
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await openOptionsTab(page, 'pro');
    await expect(page.locator('#pro-waitlist-url-copy')).toBeDisabled();
    await page.locator('#pro-intent-campaign').fill('launch_2026');
    await expect(page.locator('#pro-waitlist-url-copy')).toBeEnabled();
    await page.locator('#pro-waitlist-url-copy').click();
    await expect(page.locator('#pro-waitlist-url-copy')).toContainText(/copied|已复制/i);
    await expect.poll(() => getLastCopiedText(driverPage)).toContain('launch_2026');
    const snapshot = await getStorageSnapshot(driverPage);
    const distributionEvents = (snapshot.local.copilot_telemetry_events as Array<{ name?: string; props?: Record<string, unknown> }> | undefined)
      ?.filter((event) => event.name === 'pro_distribution_asset_copied') || [];
    expect(distributionEvents.length).toBeGreaterThan(0);
  } finally {
    await page.close();
  }
});

test('distribution toolkit exports campaign-tagged assets and markdown pack', async ({
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
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await openOptionsTab(page, 'pro');
    await page.locator('#pro-intent-campaign').fill('ph_launch');
    await page.locator('#pro-waitlist-recruit-copy').click();
    await expect(page.locator('#pro-waitlist-recruit-copy')).toContainText(/copied|已复制/i);
    await expect.poll(() => getLastCopiedText(driverPage)).toContain('ph_launch');
    await page.locator('#pro-store-url-copy').click();
    await expect(page.locator('#pro-store-url-copy')).toContainText(/copied|已复制/i);
    await expect.poll(() => getLastCopiedText(driverPage)).toContain('utm_campaign=ph_launch');
    await page.locator('#pro-distribution-pack-copy').click();
    await expect(page.locator('#pro-distribution-pack-copy')).toContainText(/copied|已复制/i);
    await expect.poll(() => getLastCopiedText(driverPage)).toContain('# Copylot');
    const snapshot = await getStorageSnapshot(driverPage);
    const distributionEvents = (snapshot.local.copilot_telemetry_events as Array<{ name?: string; props?: Record<string, unknown> }> | undefined)
      ?.filter((event) => event.name === 'pro_distribution_asset_copied') || [];
    expect(distributionEvents.length).toBeGreaterThanOrEqual(3);
  } finally {
    await page.close();
  }
});

test('pro funnel actions export expected summary json csv and evidence-pack artifacts', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  const now = Date.now();
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isAnonymousUsageDataEnabled: true
    }
  });
  await seedLocalStorage(driverPage, {
    copilot_telemetry_events: [
      { name: 'pro_waitlist_opened', ts: now - 2_000, props: { source: 'options', campaign: 'launch' } },
      { name: 'pro_waitlist_copied', ts: now - 1_000, props: { source: 'options', campaign: 'launch' } },
      { name: 'pro_waitlist_survey_copied', ts: now - 500, props: { source: 'options', campaign: 'launch' } }
    ]
  });

  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await openOptionsTab(page, 'privacy');
    await expandDetailsPanel(page, '#pro-funnel-panel');

    const runPack = await waitForDownloadAndReadJson<{ env?: { exportedAt?: number } }>(page, async () => {
      await page.locator('#download-pro-intent-run-evidence-pack').click();
    });
    expect(runPack.filename).toMatch(/pro-intent-run-evidence-pack/i);
    expect(runPack.json.env?.exportedAt).toBeTruthy();

    const distribution = await waitForDownloadAndReadJson<{ survey_intent?: number }>(page, async () => {
      await page.locator('#export-pro-waitlist-survey-intent-distribution-7d-json').click();
    });
    expect(typeof distribution.json.survey_intent).toBe('number');

    const eventsCsv = await waitForDownloadAndReadText(page, async () => {
      await page.locator('#export-pro-intent-events-7d-csv').click();
    });
    expect(eventsCsv.filename).toMatch(/pro-intent-events/i);
    expect(eventsCsv.text).toContain('options');

    const byCampaignCsv = await waitForDownloadAndReadText(page, async () => {
      await page.locator('#export-pro-intent-by-campaign-7d-csv').click();
    });
    expect(byCampaignCsv.text).toContain('launch');
  } finally {
    await page.close();
  }
});

test('options pro waitlist open and copy actions record options source attribution', async ({
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

  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await openOptionsTab(page, 'pro');
    const waitlistPromise = extensionContext.waitForEvent('page');
    await page.locator('#pro-waitlist-button').click();
    const waitlistPage = await waitlistPromise;
    await waitlistPage.waitForLoadState('domcontentloaded');
    expect(waitlistPage.url()).toContain('copy.useai.online');

    await page.locator('#pro-waitlist-copy').click();
    await expect(page.locator('#pro-waitlist-copy')).toContainText(/copied|已复制/i);
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const events = snapshot.local.copilot_telemetry_events as Array<{ name?: string; props?: Record<string, unknown> }> | undefined;
        return events?.filter((event) =>
          event.name === 'pro_waitlist_opened' || event.name === 'pro_waitlist_copied'
        ) || [];
      })
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'pro_waitlist_opened',
            props: expect.objectContaining({ source: 'options' })
          }),
          expect.objectContaining({
            name: 'pro_waitlist_copied',
            props: expect.objectContaining({ source: 'options' })
          })
        ])
      );
  } finally {
    await page.close();
  }
});
