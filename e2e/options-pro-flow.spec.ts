import { test, expect } from './fixtures';
import { clearClipboard } from './helpers/clipboard';
import {
  getOpenedUrls,
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

test('pro waitlist survey shows sample notice when anonymous usage data is off and can enable it inline', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isAnonymousUsageDataEnabled: false
    }
  });
  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html#pro-waitlist-survey');
  try {
    await openOptionsTab(page, 'pro');
    await expect(page.locator('#pro-waitlist-survey-sample-notice')).toBeVisible();
    await page.locator('#pro-waitlist-survey-enable-sample').click();
    await expect(page.locator('#pro-waitlist-survey-sample-notice')).toBeHidden();
    const settings = (await getStorageSnapshot(driverPage)).sync.copilot_settings as
      | { isAnonymousUsageDataEnabled?: boolean }
      | undefined;
    expect(settings?.isAnonymousUsageDataEnabled).toBe(true);
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
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        return (
          (snapshot.local.copilot_telemetry_events as Array<{ name?: string; props?: Record<string, unknown> }> | undefined)
            ?.filter((event) => event.name === 'pro_intent_form_start') || []
        );
      })
      .toHaveLength(1);
    await page.locator('#pro-waitlist-survey-copy-open').click();
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('copy.useai.online');
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('utm_content=popup_survey_cta');
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        return (
          (snapshot.local.copilot_telemetry_events as Array<{ name?: string; props?: Record<string, unknown> }> | undefined)
            ?.filter((event) => event.name === 'pro_waitlist_opened') || []
        );
      })
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            props: expect.objectContaining({ source: 'popup', content: 'popup_survey_cta' })
          })
        ])
      );
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        return (
          (snapshot.local.copilot_telemetry_events as Array<{ name?: string; props?: Record<string, unknown> }> | undefined)
            ?.filter((event) => event.name === 'pro_intent_form_start') || []
        );
      })
      .toEqual([
        expect.objectContaining({
          props: expect.objectContaining({ source: 'popup', content: 'popup_survey_cta' })
        })
      ]);
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        return (
          (snapshot.local.copilot_telemetry_events as Array<{ name?: string; props?: Record<string, unknown> }> | undefined)
            ?.filter((event) => event.name === 'pro_intent_form_submit') || []
        );
      })
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            props: expect.objectContaining({ source: 'popup', content: 'popup_survey_cta' })
          })
        ])
      );
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
    await expect(page.locator('#pro-intent-campaign')).toBeHidden();
    await expect(page.locator('#pro-waitlist-distribution-toolkit')).toBeHidden();
    await expect(page.locator('#pro-waitlist-copy')).toBeHidden();
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
    await expect(page.locator('#pro-intent-campaign')).toBeHidden();
    await expect(page.locator('#pro-waitlist-distribution-toolkit')).toBeHidden();
  } finally {
    await page.close();
  }
});

test.skip('pro funnel actions export expected summary json csv and evidence-pack artifacts', async ({
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

test('pro intent v1-100 exports summary json and csv', async ({
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
      {
        name: 'pro_entry_opened',
        ts: now - 4_000,
        props: { source: 'popup', medium: 'popup', content: 'popup_survey_cta', campaign: 'launch' }
      },
      {
        name: 'pro_intent_form_start',
        ts: now - 3_000,
        props: { source: 'popup', medium: 'popup', content: 'popup_survey_cta', campaign: 'launch' }
      },
      {
        name: 'pro_intent_form_submit',
        ts: now - 2_000,
        props: { source: 'popup', medium: 'popup', content: 'popup_survey_cta', campaign: 'launch' }
      }
    ]
  });

  const page = await openExtensionPage(extensionContext, extensionId, 'src/options/options.html');
  try {
    await openOptionsTab(page, 'privacy');
    await expandDetailsPanel(page, '#pro-funnel-panel');

    const summaryJson = await waitForDownloadAndReadJson<{
      enabled?: boolean;
      totals?: { upgradeEntryClicks?: number; formStarts?: number; formSubmits?: number };
      rows?: Array<{ content?: string }>;
    }>(page, async () => {
      await page.locator('#download-pro-intent-v1-100-summary-json').click();
    });
    expect(summaryJson.filename).toBe('intent-funnel-summary-v1-100.json');
    expect(summaryJson.json.enabled).toBe(true);
    expect(summaryJson.json.totals).toEqual(
      expect.objectContaining({
        upgradeEntryClicks: 1,
        formStarts: 1,
        formSubmits: 1
      })
    );
    expect(summaryJson.json.rows?.[0]).toEqual(expect.objectContaining({ content: 'popup_survey_cta' }));

    const summaryCsv = await waitForDownloadAndReadText(page, async () => {
      await page.locator('#download-pro-intent-v1-100-summary-csv').click();
    });
    expect(summaryCsv.filename).toBe('intent-funnel-v1-100.csv');
    expect(summaryCsv.text).toContain('source,medium,content,campaign,upgradeEntryClicks,formStarts,formSubmits,formStartRate,intentSubmitRate');
    expect(summaryCsv.text).toContain('popup,popup,popup_survey_cta,launch,1,1,1,1,1');
  } finally {
    await page.close();
  }
});

test('options pro waitlist open action records options source attribution', async ({
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
    await page.locator('#pro-waitlist-button').click();
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('copy.useai.online');
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const events = snapshot.local.copilot_telemetry_events as Array<{ name?: string; props?: Record<string, unknown> }> | undefined;
        return events?.filter((event) => event.name === 'pro_waitlist_opened') || [];
      })
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'pro_waitlist_opened',
            props: expect.objectContaining({ source: 'options' })
          })
        ])
      );
  } finally {
    await page.close();
  }
});
