import { test, expect } from './fixtures';
import { clearClipboard, expectClipboardTextEventually } from './helpers/clipboard';
import {
  getOpenedUrls,
  getStorageSnapshot,
  openExtensionPage,
  seedLocalStorage,
  seedSyncStorage
} from './helpers/extension-state';
import { waitForDownloadAndReadJson } from './helpers/download';
import { openOptionsTab } from './helpers/options';

test('pro tab only shows roadmap and sharing toolkit', async ({
  extensionContext,
  extensionId,
  driverPage
}) => {
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isAnonymousUsageDataEnabled: true
    }
  });

  const page = await openExtensionPage(
    extensionContext,
    extensionId,
    'src/options/options.html#pro'
  );
  try {
    await openOptionsTab(page, 'pro');

    await expect(page.locator('#pro-intent-campaign')).toBeVisible();
    await expect(page.locator('#pro-waitlist-distribution-toolkit')).toBeVisible();
    await expect(page.locator('#pro-waitlist-button')).toBeVisible();
    await expect(page.locator('#pro-validation-advanced-cleaning')).toBeVisible();
    await expect(page.locator('#pro-validation-advanced-open')).toBeVisible();
    await expect(page.locator('#pro-validation-bulk-collection')).toBeVisible();
    await expect(page.locator('#pro-validation-bulk-open')).toBeVisible();
    await expect(page.locator('#pro-validation-structured-export')).toBeVisible();
    await expect(page.locator('#pro-validation-structured-open')).toBeVisible();
    await expect(page.locator('#pro-decision-gate-panel')).toBeVisible();
    await expect(page.locator('#copy-pro-intent-decision-summary')).toBeVisible();
    await expect(page.locator('#download-pro-intent-decision-summary-json')).toBeVisible();
    await expect(page.locator('#copy-pro-route-validation-comparison-summary')).toBeVisible();
    await expect(page.locator('#download-pro-route-validation-comparison-json')).toBeVisible();
    await expect(page.locator('#copy-pro-route-validation-writeback-summary')).toBeVisible();
    await expect(page.locator('#download-pro-route-validation-writeback-json')).toBeVisible();
    await expect(page.locator('#copy-pro-route-validation-stability-summary')).toBeVisible();
    await expect(page.locator('#download-pro-route-validation-stability-json')).toBeVisible();
    await expect(page.locator('#pro-route-verdict-panel')).toBeVisible();
    await expect(page.locator('#copy-pro-route-validation-verdict-summary')).toBeVisible();
    await expect(page.locator('#download-pro-route-validation-verdict-json')).toBeVisible();
    await expect(page.locator('#pro-payment-evaluation-audit-panel')).toBeVisible();
    await expect(page.locator('#copy-pro-payment-evaluation-audit-summary')).toBeVisible();
    await expect(page.locator('#download-pro-payment-evaluation-audit-json')).toBeVisible();
    await expect(page.locator('#pro-route-validation-campaign-review-panel')).toBeVisible();
    await expect(page.locator('#copy-pro-route-validation-campaign-review-summary')).toBeVisible();
    await expect(page.locator('#download-pro-route-validation-campaign-review-json')).toBeVisible();
    await expect(page.locator('#pro-stay-validation-messaging-guard-panel')).toBeVisible();
    await expect(page.locator('#copy-pro-stay-validation-messaging-guard-summary')).toBeVisible();
    await expect(page.locator('#download-pro-stay-validation-messaging-guard-json')).toBeVisible();

    await expect(page.locator('#pro-waitlist-copy')).toHaveCount(0);
    await expect(page.locator('#pro-waitlist-survey')).toHaveCount(0);
    await expect(page.locator('#pro-waitlist-survey-copy')).toHaveCount(0);
    await expect(page.locator('#pro-waitlist-survey-copy-open')).toHaveCount(0);
  } finally {
    await page.close();
  }
});

test('pro sharing toolkit copies install, privacy, roadmap assets, and opens official roadmap page', async ({
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
    'src/options/options.html#pro'
  );
  try {
    await openOptionsTab(page, 'pro');
    await page.locator('#pro-intent-campaign').fill('twitter');

    await page.locator('#pro-validation-advanced-route-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        text.includes('/pricing') && text.includes('utm_content=options_advanced_cleaning_cta'),
      driverPage
    );

    await page.locator('#pro-validation-advanced-brief-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('Advanced page cleaning') || text.includes('高级页面清洗')) &&
        text.includes('utm_content=options_advanced_cleaning_cta') &&
        text.includes('/privacy'),
      driverPage
    );

    await page.locator('#pro-validation-advanced-checklist-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('Validation Checklist') || text.includes('验证清单')) &&
        text.includes('utm_campaign=twitter') &&
        !text.toLowerCase().includes('copied page content'),
      driverPage
    );

    await page.locator('#pro-validation-advanced-open').click();
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('utm_content=options_advanced_cleaning_cta');

    await page.locator('#pro-validation-bulk-route-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        text.includes('/pricing') && text.includes('utm_content=options_bulk_collection_cta'),
      driverPage
    );

    await page.locator('#pro-validation-bulk-brief-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('Batch collection and organization') || text.includes('批量采集与整理')) &&
        text.includes('utm_content=options_bulk_collection_cta') &&
        text.includes('/privacy'),
      driverPage
    );

    await page.locator('#pro-validation-bulk-checklist-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('Validation Checklist') || text.includes('验证清单')) &&
        text.includes('utm_campaign=twitter') &&
        !text.toLowerCase().includes('copied page content'),
      driverPage
    );

    await page.locator('#pro-validation-bulk-open').click();
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('utm_content=options_bulk_collection_cta');

    await page.locator('#pro-validation-structured-route-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        text.includes('/pricing') && text.includes('utm_content=options_structured_export_cta'),
      driverPage
    );

    await page.locator('#pro-validation-structured-brief-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('Structured export and downstream workflow') ||
          text.includes('结构化导出与下游工作流')) &&
        text.includes('utm_content=options_structured_export_cta') &&
        text.includes('/privacy'),
      driverPage
    );

    await page.locator('#pro-validation-structured-checklist-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('Validation Checklist') || text.includes('验证清单')) &&
        text.includes('utm_campaign=twitter') &&
        !text.toLowerCase().includes('copied page content'),
      driverPage
    );

    await page.locator('#pro-validation-structured-open').click();
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('utm_content=options_structured_export_cta');

    await page.locator('#copy-pro-route-validation-comparison-summary').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('V4-8 三条路线样本比较摘要') ||
          text.includes('V4-8 Pro route sample comparison summary')) &&
        (text.includes('高级页面清洗验证') || text.includes('Advanced page cleaning validation')) &&
        text.includes('total_signals=4'),
      driverPage
    );

    await page.locator('#copy-pro-route-validation-writeback-summary').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('V4-9 领先路线回写包') ||
          text.includes('V4-9 Leading route writeback pack')) &&
        (text.includes('高级页面清洗验证') || text.includes('Advanced page cleaning validation')) &&
        text.includes('recent_7d total_signals=4'),
      driverPage
    );

    await page.locator('#copy-pro-route-validation-stability-summary').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('V4-10 领先路线稳定性摘要') ||
          text.includes('V4-10 Leading route stability summary')) &&
        (text.includes('高级页面清洗验证') || text.includes('Advanced page cleaning validation')) &&
        text.includes('supporting_campaigns=twitter'),
      driverPage
    );

    await page.locator('#copy-pro-intent-decision-summary').click();
    await expectClipboardTextEventually(
      (text) =>
        text.includes('V1-81 Pro 意向决策摘要') &&
        text.includes('code：`A`') &&
        text.includes('survey_intent'),
      driverPage
    );

    await page.locator('#copy-pro-route-validation-verdict-summary').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('V4-11 Pro 路线融合判断摘要') ||
          text.includes('V4-11 Pro route fusion verdict summary')) &&
        text.includes('route_leader_consistent=true') &&
        text.includes('route_stability_ready=false') &&
        text.includes('gate_allows_payment_evaluation=false'),
      driverPage
    );

    await page.locator('#copy-pro-payment-evaluation-audit-summary').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('V4-12 收费评估审计包') ||
          text.includes('V4-12 Payment evaluation audit pack')) &&
        text.includes('audit_status=hold_validation') &&
        text.includes('route_stability_ready=false'),
      driverPage
    );

    await page.locator('#copy-pro-route-validation-campaign-review-summary').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('V4-13 跨 campaign 领先路线复核包') ||
          text.includes('V4-13 Cross-campaign route review pack')) &&
        text.includes('messaging_boundary=stay_validation') &&
        text.includes('overall_leader_track_id=advanced_cleaning'),
      driverPage
    );

    await page.locator('#pro-waitlist-url-copy').click();
    await expectClipboardTextEventually(
      (text) => text.includes('/pricing') && text.includes('utm_campaign=twitter'),
      driverPage
    );

    await page.locator('#pro-store-url-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        text.includes('chromewebstore.google.com/detail/') && text.includes('utm_campaign=twitter'),
      driverPage
    );

    await page.locator('#pro-waitlist-recruit-copy').click();
    await expectClipboardTextEventually(
      (text) =>
        text.includes('Copylot') &&
        text.includes('chromewebstore.google.com/detail/') &&
        text.includes('/privacy'),
      driverPage
    );

    await page.locator('#pro-distribution-pack-copy').click();
    const distributionPack = await expectClipboardTextEventually(
      (text) =>
        text.includes('/pricing') &&
        text.includes('/privacy') &&
        text.includes('chromewebstore.google.com/detail/') &&
        !text.includes('问卷') &&
        !text.toLowerCase().includes('survey'),
      driverPage
    );
    expect(distributionPack).toContain('campaign=twitter');

    await page.locator('#pro-waitlist-button').click();
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(driverPage);
        return urls.at(-1) || '';
      })
      .toContain('/pricing');

    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        return (
          (snapshot.local.copilot_telemetry_events as
            | Array<{ name?: string; props?: Record<string, unknown> }>
            | undefined) || []
        );
      })
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'pro_waitlist_opened',
            props: expect.objectContaining({ campaign: 'twitter' })
          }),
          expect.objectContaining({
            name: 'pro_waitlist_opened',
            props: expect.objectContaining({
              campaign: 'twitter',
              content: 'options_advanced_cleaning_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_waitlist_opened',
            props: expect.objectContaining({
              campaign: 'twitter',
              content: 'options_bulk_collection_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_waitlist_opened',
            props: expect.objectContaining({
              campaign: 'twitter',
              content: 'options_structured_export_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({
              action: 'validation_route',
              campaign: 'twitter',
              content: 'options_advanced_cleaning_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({
              action: 'validation_brief',
              campaign: 'twitter',
              content: 'options_advanced_cleaning_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({
              action: 'validation_checklist',
              campaign: 'twitter',
              content: 'options_advanced_cleaning_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({
              action: 'validation_route',
              campaign: 'twitter',
              content: 'options_bulk_collection_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({
              action: 'validation_brief',
              campaign: 'twitter',
              content: 'options_bulk_collection_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({
              action: 'validation_checklist',
              campaign: 'twitter',
              content: 'options_bulk_collection_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({
              action: 'validation_route',
              campaign: 'twitter',
              content: 'options_structured_export_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({
              action: 'validation_brief',
              campaign: 'twitter',
              content: 'options_structured_export_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({
              action: 'validation_checklist',
              campaign: 'twitter',
              content: 'options_structured_export_cta'
            })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({ action: 'waitlist_url', campaign: 'twitter' })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({ action: 'store_url', campaign: 'twitter' })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({ action: 'recruit_copy', campaign: 'twitter' })
          }),
          expect.objectContaining({
            name: 'pro_distribution_asset_copied',
            props: expect.objectContaining({ action: 'distribution_pack', campaign: 'twitter' })
          })
        ])
      );
  } finally {
    await page.close();
  }
});

test('campaign review json differentiates conflicting and thin blockers while staying in validation', async ({
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
        name: 'pro_waitlist_opened',
        ts: now - 6 * 60 * 60 * 1000,
        props: { source: 'options', campaign: 'twitter', content: 'options_advanced_cleaning_cta' }
      },
      {
        name: 'pro_distribution_asset_copied',
        ts: now - 6 * 60 * 60 * 1000 + 1_000,
        props: {
          source: 'options',
          campaign: 'twitter',
          content: 'options_advanced_cleaning_cta',
          action: 'validation_route'
        }
      },
      {
        name: 'pro_distribution_asset_copied',
        ts: now - 6 * 60 * 60 * 1000 + 2_000,
        props: {
          source: 'options',
          campaign: 'twitter',
          content: 'options_advanced_cleaning_cta',
          action: 'validation_brief'
        }
      },
      {
        name: 'pro_distribution_asset_copied',
        ts: now - 6 * 60 * 60 * 1000 + 3_000,
        props: {
          source: 'options',
          campaign: 'twitter',
          content: 'options_advanced_cleaning_cta',
          action: 'validation_checklist'
        }
      },
      {
        name: 'pro_waitlist_opened',
        ts: now - 5 * 60 * 60 * 1000,
        props: { source: 'options', campaign: 'ph', content: 'options_advanced_cleaning_cta' }
      },
      {
        name: 'pro_distribution_asset_copied',
        ts: now - 5 * 60 * 60 * 1000 + 1_000,
        props: {
          source: 'options',
          campaign: 'ph',
          content: 'options_advanced_cleaning_cta',
          action: 'validation_route'
        }
      },
      {
        name: 'pro_waitlist_opened',
        ts: now - 4 * 60 * 60 * 1000,
        props: { source: 'options', campaign: 'reddit', content: 'options_bulk_collection_cta' }
      },
      {
        name: 'pro_distribution_asset_copied',
        ts: now - 4 * 60 * 60 * 1000 + 1_000,
        props: {
          source: 'options',
          campaign: 'reddit',
          content: 'options_bulk_collection_cta',
          action: 'validation_route'
        }
      },
      {
        name: 'pro_distribution_asset_copied',
        ts: now - 4 * 60 * 60 * 1000 + 2_000,
        props: {
          source: 'options',
          campaign: 'reddit',
          content: 'options_bulk_collection_cta',
          action: 'validation_brief'
        }
      },
      {
        name: 'pro_waitlist_opened',
        ts: now - 3 * 60 * 60 * 1000,
        props: { source: 'options', campaign: 'seo', content: 'options_structured_export_cta' }
      },
      {
        name: 'pro_distribution_asset_copied',
        ts: now - 3 * 60 * 60 * 1000 + 1_000,
        props: {
          source: 'options',
          campaign: 'seo',
          content: 'options_structured_export_cta',
          action: 'validation_route'
        }
      }
    ]
  });

  const page = await openExtensionPage(
    extensionContext,
    extensionId,
    'src/options/options.html#pro'
  );
  try {
    await openOptionsTab(page, 'pro');

    const { filename, json } = await waitForDownloadAndReadJson<{
      messagingBoundary: string;
      overallLeaderTrackId: string;
      supportingCampaigns: string[];
      conflictingCampaigns: string[];
      thinCampaigns: string[];
      prioritizedCampaigns: string[];
      blockers: Array<{ code: string; campaigns: string[] }>;
      campaigns: Array<{ campaign: string; reviewStatus: string }>;
      conclusion: string;
      nextStep: string;
      sources: Array<{ label: string; file?: string }>;
    }>(page, () => page.locator('#download-pro-route-validation-campaign-review-json').click());

    expect(filename).toBe('copylot-pro-route-validation-campaign-review-v4-13.json');
    expect(json.messagingBoundary).toBe('stay_validation');
    expect(json.overallLeaderTrackId).toBe('advanced_cleaning');
    expect(json.supportingCampaigns).toEqual(['ph', 'twitter']);
    expect(json.conflictingCampaigns).toEqual(['reddit', 'seo']);
    expect(json.thinCampaigns).toEqual(['ph']);
    expect(json.prioritizedCampaigns).toEqual(['ph', 'reddit', 'seo']);
    expect(json.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'acquisition_bias_unresolved',
          campaigns: ['reddit', 'seo']
        }),
        expect.objectContaining({
          code: 'sample_still_thin',
          campaigns: ['ph']
        })
      ])
    );
    expect(json.campaigns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ campaign: 'twitter', reviewStatus: 'supporting' }),
        expect.objectContaining({ campaign: 'ph', reviewStatus: 'thin' }),
        expect.objectContaining({ campaign: 'reddit', reviewStatus: 'conflicting' })
      ])
    );
    expect(json.conclusion).toMatch(/acquisition bias|acquisition 偏差/i);
    expect(json.nextStep).toMatch(/prioritize|优先补/i);
    expect(json.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'comparison' }),
        expect.objectContaining({ label: 'writeback' }),
        expect.objectContaining({ label: 'decision' })
      ])
    );
  } finally {
    await page.close();
  }
});

test('stay_validation messaging guard pack keeps external copy inside current-priority validation language', async ({
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
    'src/options/options.html#pro'
  );
  try {
    await openOptionsTab(page, 'pro');

    await page.locator('#copy-pro-stay-validation-messaging-guard-summary').click();
    await expectClipboardTextEventually(
      (text) =>
        (text.includes('V4-14 stay_validation 外部话术守门复核包') ||
          text.includes('V4-14 stay_validation messaging guard pack')) &&
        text.includes('guard_status=aligned') &&
        text.includes('route_headline: status=aligned'),
      driverPage
    );

    const { filename, json } = await waitForDownloadAndReadJson<{
      guardVersion: string;
      guardStatus: string;
      messagingBoundary: string;
      prioritizedCampaigns: string[];
    }>(page, () => page.locator('#download-pro-stay-validation-messaging-guard-json').click());

    expect(filename).toBe('copylot-pro-stay-validation-messaging-guard-v4-14.json');
    expect(json).toEqual(
      expect.objectContaining({
        guardVersion: 'v4-14',
        guardStatus: 'aligned',
        messagingBoundary: 'stay_validation'
      })
    );
    expect(json.prioritizedCampaigns).toEqual([]);
  } finally {
    await page.close();
  }
});
