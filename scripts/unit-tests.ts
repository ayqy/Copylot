import assert from 'node:assert/strict';

import { getGlobalDispatcher, setGlobalDispatcher } from 'undici';

import {
  buildChromeWebStoreDetailUrl,
  buildChromeWebStoreReviewsUrl,
  buildFeedbackIssueUrl,
  buildFeedbackSettingsSnapshot,
  buildShareCopyText,
  type I18nGetMessage
} from '../src/shared/word-of-mouth.ts';
import {
  RATING_PROMPT_MIN_INSTALL_AGE_MS,
  RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT,
  applySuccessfulCopyToGrowthStats,
  buildGrowthFunnelSummary,
  normalizeGrowthStatsValue,
  shouldShowRatingPrompt,
  type GrowthStats
} from '../src/shared/growth-stats.ts';
import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvent,
  sanitizeTelemetryEvents,
  trimTelemetryEvents
} from '../src/shared/telemetry.ts';
import { buildProFunnelEvidencePack, buildProFunnelSummary } from '../src/shared/pro-funnel.ts';
import { cleanCodeBlockText } from '../src/shared/code-block-cleaner.ts';
import { parsePromptSortMode, sortPrompts } from '../src/shared/prompt-sort.ts';
import {
  CwsProxyConfigError,
  createUndiciProxyDispatcher,
  maskProxyUrl,
  mergeNoProxyValue,
  parseAndValidateProxyUrl,
  resolveCwsProxyEnv
} from './cws-proxy.ts';

const getMessage: I18nGetMessage = (key, substitutions) => {
  const subs = Array.isArray(substitutions) ? substitutions : substitutions ? [substitutions] : [];

  if (key === 'feedbackIssueTitleTemplate') return 'title';
  if (key === 'feedbackIssueBodyTemplate') {
    return `v=${subs[0]} id=${subs[1]} ua=${subs[2]} nav=${subs[3]} ui=${subs[4]} copilot_settings=${subs[5]} copilot_growth_stats=${subs[6]} copilot_growth_funnel_summary=${subs[7]} copilot_telemetry_events=${subs[8]} lastN=${subs[9]}`;
  }
  if (key === 'shareCopyTextTemplate') {
    return `share ${subs[0]}`;
  }
  return key;
};

async function run() {
  const extensionId = 'abcdefghijklmnopabcdefghijklmnop';

  const storeUrl = buildChromeWebStoreDetailUrl(extensionId);
  const storeParsed = new URL(storeUrl);
  assert.equal(storeParsed.hostname, 'chrome.google.com');
  assert.ok(storeParsed.pathname.endsWith(`/webstore/detail/${extensionId}`));
  assert.equal(storeParsed.searchParams.get('utm_source'), 'copylot-ext');
  assert.equal(storeParsed.searchParams.get('utm_medium'), 'popup-entry');
  assert.equal(storeParsed.searchParams.get('utm_campaign'), 'v1-21');

  const storeUrlOptions = buildChromeWebStoreDetailUrl(extensionId, {
    utm_source: 'copylot-ext',
    utm_medium: 'options-entry',
    utm_campaign: 'v1-21'
  });
  const storeOptionsParsed = new URL(storeUrlOptions);
  assert.equal(storeOptionsParsed.searchParams.get('utm_source'), 'copylot-ext');
  assert.equal(storeOptionsParsed.searchParams.get('utm_medium'), 'options-entry');
  assert.equal(storeOptionsParsed.searchParams.get('utm_campaign'), 'v1-21');

  const reviewsUrl = buildChromeWebStoreReviewsUrl(extensionId);
  assert.equal(reviewsUrl, `https://chrome.google.com/webstore/detail/${extensionId}/reviews`);

  const settings: Parameters<typeof buildFeedbackSettingsSnapshot>[0] = {
    isMagicCopyEnabled: false,
    isHoverMagicCopyEnabled: true,
    isAnonymousUsageDataEnabled: true,
    outputFormat: 'plaintext',
    tableOutputFormat: 'csv',
    attachTitle: true,
    attachURL: true,
    language: 'en',
    interactionMode: 'dblclick',
    userPrompts: [],
    isClipboardAccumulatorEnabled: true,
    chatServices: [],
    defaultAutoOpenChat: false,
    editorExclusionClassNames: [],
    editorExclusionAttributeSelectors: [],
    popupOnboardingVersion: 1,
    popupOnboardingCompletedVersion: 0,
    popupOnboardingCompletedAt: undefined
  };
  const snapshot = buildFeedbackSettingsSnapshot(settings);
  assert.deepEqual(Object.keys(snapshot).sort(), [
    'attachTitle',
    'attachURL',
    'defaultAutoOpenChat',
    'defaultChatServiceId',
    'interactionMode',
    'isAnonymousUsageDataEnabled',
    'isClipboardAccumulatorEnabled',
    'isHoverMagicCopyEnabled',
    'isMagicCopyEnabled',
    'language',
    'outputFormat',
    'popupOnboardingCompletedVersion',
    'popupOnboardingVersion',
    'tableOutputFormat'
  ]);
  assert.equal(snapshot.isMagicCopyEnabled, false);
  assert.equal(snapshot.isHoverMagicCopyEnabled, true);
  assert.equal(snapshot.isClipboardAccumulatorEnabled, true);
  assert.equal(snapshot.isAnonymousUsageDataEnabled, true);
  assert.equal(snapshot.interactionMode, 'dblclick');
  assert.equal(snapshot.outputFormat, 'plaintext');
  assert.equal(snapshot.tableOutputFormat, 'csv');
  assert.equal(snapshot.attachTitle, true);
  assert.equal(snapshot.attachURL, true);
  assert.equal(snapshot.popupOnboardingVersion, 1);
  assert.equal(snapshot.popupOnboardingCompletedVersion, 0);
  assert.equal(snapshot.defaultAutoOpenChat, false);
  assert.equal(snapshot.language, 'en');

  const growthStatsForFeedback: GrowthStats = {
    installedAt: 1_700_000_000_000,
    successfulCopyCount: 123,
    firstPopupOpenedAt: 1_700_000_100_000,
    firstSuccessfulCopyAt: 1_700_000_101_000
  };
  const growthFunnelSummaryForFeedback = buildGrowthFunnelSummary(growthStatsForFeedback, 1_700_000_200_000);

  const issueUrl = buildFeedbackIssueUrl({
    env: {
      extensionVersion: '1.1.0',
      extensionId,
      userAgent: 'UA',
      navigatorLanguage: 'en-US',
      uiLanguage: 'en'
    },
    settingsSnapshot: snapshot,
    growthStatsSnapshot: growthStatsForFeedback,
    growthFunnelSummarySnapshot: growthFunnelSummaryForFeedback,
    telemetryEventsSnapshot: [
      { name: 'popup_opened', ts: 1 },
      { name: 'copy_success', ts: 2 }
    ],
    getMessage
  });
  const issueParsed = new URL(issueUrl);
  assert.equal(issueParsed.hostname, 'github.com');
  assert.ok(issueParsed.pathname.endsWith('/issues/new'));

  const title = issueParsed.searchParams.get('title');
  const body = issueParsed.searchParams.get('body');
  assert.equal(title, 'title');
  assert.ok(body);
  assert.ok(body?.includes('1.1.0'));
  assert.ok(body?.includes(extensionId));
  assert.ok(body?.includes('UA'));
  assert.ok(body?.includes('"isMagicCopyEnabled"'));
  assert.ok(!body?.includes('userPrompts'));
  assert.ok(!body?.includes('"template"'));
  assert.ok(!body?.includes('"title"'));
  assert.ok(body?.includes('copilot_growth_stats'));
  assert.ok(body?.includes('"successfulCopyCount"'));
  assert.ok(body?.includes('copilot_growth_funnel_summary'));
  assert.ok(body?.includes('activatedWithin3MinutesFromFirstPopup'));
  assert.ok(body?.includes('timeFromFirstPopupToFirstCopyMs'));
  assert.ok(body?.includes('copilot_telemetry_events'));
  assert.ok(body?.includes('"name": "copy_success"'));
  assert.ok(body?.indexOf('"ts": 2') < body?.indexOf('"ts": 1'));
  assert.ok(body?.includes('lastN=20'));

  // Anonymous usage data disabled -> telemetry events should not appear even if passed in.
  const snapshotTelemetryDisabled = { ...snapshot, isAnonymousUsageDataEnabled: false };
  const issueUrlTelemetryDisabled = buildFeedbackIssueUrl({
    env: {
      extensionVersion: '1.1.0',
      extensionId,
      userAgent: 'UA',
      navigatorLanguage: 'en-US',
      uiLanguage: 'en'
    },
    settingsSnapshot: snapshotTelemetryDisabled,
    telemetryEventsSnapshot: [{ name: 'popup_opened', ts: 1 }],
    getMessage
  });
  const telemetryDisabledBody = new URL(issueUrlTelemetryDisabled).searchParams.get('body') || '';
  assert.ok(telemetryDisabledBody.includes('copilot_telemetry_events=[]'));

  const shareText = buildShareCopyText(getMessage, storeUrl);
  assert.ok(shareText.includes(storeUrl));

  const now = 1_700_000_000_000;
  const eligibleStats: GrowthStats = {
    installedAt: now - RATING_PROMPT_MIN_INSTALL_AGE_MS,
    successfulCopyCount: RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT
  };
  assert.equal(shouldShowRatingPrompt(eligibleStats, now), true);
  assert.equal(
    shouldShowRatingPrompt(
      { ...eligibleStats, installedAt: now - RATING_PROMPT_MIN_INSTALL_AGE_MS + 1 },
      now
    ),
    false
  );
  assert.equal(
    shouldShowRatingPrompt(
      { ...eligibleStats, successfulCopyCount: RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT - 1 },
      now
    ),
    false
  );
  assert.equal(
    shouldShowRatingPrompt({ ...eligibleStats, ratingPromptShownAt: now - 1000 }, now),
    false
  );

  // growth-stats.ts (pure functions)
  const baseGrowthStats: GrowthStats = { installedAt: now, successfulCopyCount: 0 };
  const t1 = now + 1000;
  const t2 = now + 2000;
  const t3 = now + 3000;

  const afterFirstCopy = applySuccessfulCopyToGrowthStats(baseGrowthStats, { now: t1 });
  assert.equal(afterFirstCopy.successfulCopyCount, 1);
  assert.equal(afterFirstCopy.firstSuccessfulCopyAt, t1);
  assert.equal(afterFirstCopy.lastSuccessfulCopyAt, t1);
  assert.equal(afterFirstCopy.firstPromptUsedAt, undefined);
  assert.equal(afterFirstCopy.reusedWithin7DaysAt, undefined);

  const afterSecondCopy = applySuccessfulCopyToGrowthStats(afterFirstCopy, { now: t2 });
  assert.equal(afterSecondCopy.successfulCopyCount, 2);
  assert.equal(afterSecondCopy.firstSuccessfulCopyAt, t1, 'firstSuccessfulCopyAt: only write once');
  assert.equal(afterSecondCopy.lastSuccessfulCopyAt, t2, 'lastSuccessfulCopyAt: update every time');
  assert.equal(afterSecondCopy.firstPromptUsedAt, undefined);
  assert.equal(afterSecondCopy.reusedWithin7DaysAt, t2, 'reusedWithin7DaysAt: write on second copy within 7d');

  const afterThirdCopy = applySuccessfulCopyToGrowthStats(afterSecondCopy, { now: t3 });
  assert.equal(afterThirdCopy.successfulCopyCount, 3);
  assert.equal(afterThirdCopy.firstSuccessfulCopyAt, t1);
  assert.equal(afterThirdCopy.lastSuccessfulCopyAt, t3);
  assert.equal(afterThirdCopy.reusedWithin7DaysAt, t2, 'reusedWithin7DaysAt: only write once');

  const tPrompt = now + 4000;
  const tPrompt2 = now + 5000;
  const afterPromptCopy = applySuccessfulCopyToGrowthStats(baseGrowthStats, { now: tPrompt, isPromptUsed: true });
  assert.equal(afterPromptCopy.successfulCopyCount, 1);
  assert.equal(afterPromptCopy.firstPromptUsedAt, tPrompt, 'firstPromptUsedAt: write when prompt used and copy success');

  const afterPromptCopyAgain = applySuccessfulCopyToGrowthStats(afterPromptCopy, {
    now: tPrompt2,
    isPromptUsed: true
  });
  assert.equal(afterPromptCopyAgain.successfulCopyCount, 2);
  assert.equal(afterPromptCopyAgain.firstPromptUsedAt, tPrompt, 'firstPromptUsedAt: only write once');

  const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
  const tFirst = now + 10_000;
  const afterLateSecondCopy = applySuccessfulCopyToGrowthStats(
    applySuccessfulCopyToGrowthStats(baseGrowthStats, { now: tFirst }),
    { now: tFirst + eightDaysMs }
  );
  assert.equal(afterLateSecondCopy.successfulCopyCount, 2);
  assert.equal(afterLateSecondCopy.reusedWithin7DaysAt, undefined, 'reusedWithin7DaysAt: should not write when >7d');

  const normalized = normalizeGrowthStatsValue(
    {
      installedAt: now,
      successfulCopyCount: 1,
      firstPopupOpenedAt: 'x',
      firstSuccessfulCopyAt: 0,
      lastSuccessfulCopyAt: Number.NaN,
      firstPromptUsedAt: -1,
      reusedWithin7DaysAt: Number.POSITIVE_INFINITY
    },
    now
  );
  assert.equal(normalized.firstPopupOpenedAt, undefined);
  assert.equal(normalized.firstSuccessfulCopyAt, undefined);
  assert.equal(normalized.lastSuccessfulCopyAt, undefined);
  assert.equal(normalized.firstPromptUsedAt, undefined);
  assert.equal(normalized.reusedWithin7DaysAt, undefined);

  // growth-stats.ts (buildGrowthFunnelSummary)
  const summaryMissing = buildGrowthFunnelSummary({ installedAt: now, successfulCopyCount: 0 }, now);
  assert.equal(summaryMissing.timeFromFirstPopupToFirstCopyMs, undefined);
  assert.equal(summaryMissing.activatedWithin3MinutesFromFirstPopup, undefined);
  assert.equal(summaryMissing.isPopupOpened, false);
  assert.equal(summaryMissing.isActivated, false);
  assert.equal(summaryMissing.isPromptUsed, false);
  assert.equal(summaryMissing.isReusedWithin7Days, false);

  const popupOpenedAt = now + 10_000;
  const within3MinCopyAt = popupOpenedAt + 3 * 60 * 1000;
  const summaryWithin3Min = buildGrowthFunnelSummary(
    {
      installedAt: now,
      successfulCopyCount: 1,
      firstPopupOpenedAt: popupOpenedAt,
      firstSuccessfulCopyAt: within3MinCopyAt
    },
    now
  );
  assert.equal(summaryWithin3Min.timeFromFirstPopupToFirstCopyMs, 3 * 60 * 1000);
  assert.equal(summaryWithin3Min.activatedWithin3MinutesFromFirstPopup, true);

  const over3MinCopyAt = popupOpenedAt + 3 * 60 * 1000 + 1;
  const summaryOver3Min = buildGrowthFunnelSummary(
    {
      installedAt: now,
      successfulCopyCount: 1,
      firstPopupOpenedAt: popupOpenedAt,
      firstSuccessfulCopyAt: over3MinCopyAt
    },
    now
  );
  assert.equal(summaryOver3Min.activatedWithin3MinutesFromFirstPopup, false);

  const summaryBooleans = buildGrowthFunnelSummary(
    {
      installedAt: now,
      successfulCopyCount: 2,
      firstPopupOpenedAt: popupOpenedAt,
      firstSuccessfulCopyAt: over3MinCopyAt,
      firstPromptUsedAt: now + 123,
      reusedWithin7DaysAt: now + 456
    },
    now
  );
  assert.equal(summaryBooleans.isPopupOpened, true);
  assert.equal(summaryBooleans.isActivated, true);
  assert.equal(summaryBooleans.isPromptUsed, true);
  assert.equal(summaryBooleans.isReusedWithin7Days, true);
  assert.equal(summaryBooleans.firstPopupOpenedAt, popupOpenedAt);
  assert.equal(summaryBooleans.firstSuccessfulCopyAt, over3MinCopyAt);

  const summaryActivatedByCount = buildGrowthFunnelSummary(
    { installedAt: now, successfulCopyCount: 2, firstPopupOpenedAt: popupOpenedAt },
    now
  );
  assert.equal(summaryActivatedByCount.isActivated, true);
  assert.equal(summaryActivatedByCount.timeFromFirstPopupToFirstCopyMs, undefined);
  assert.equal(summaryActivatedByCount.activatedWithin3MinutesFromFirstPopup, undefined);

  // telemetry.ts (pure functions)
  assert.equal(sanitizeTelemetryEvent({ name: 'unknown', ts: now }), null);
  assert.equal(sanitizeTelemetryEvent({ name: 'popup_opened', ts: -1 }), null);
  assert.equal(sanitizeTelemetryEvent({ name: 'popup_opened', ts: Number.NaN }), null);
  assert.equal(sanitizeTelemetryEvent({ name: 'popup_opened', ts: 'x' }), null);

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'onboarding_shown',
      ts: now,
      props: { source: 'auto', extra: 'x', action: 'skip' }
    }),
    { name: 'onboarding_shown', ts: now, props: { source: 'auto' } }
  );

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_entry_opened',
      ts: now,
      props: { source: 'popup', extra: 'x' }
    }),
    { name: 'pro_entry_opened', ts: now, props: { source: 'popup' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_entry_opened',
      ts: now,
      props: { source: 'unknown' }
    }),
    { name: 'pro_entry_opened', ts: now }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_waitlist_opened',
      ts: now,
      props: { source: 'options', extra: 'x' }
    }),
    { name: 'pro_waitlist_opened', ts: now, props: { source: 'options' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_waitlist_copied',
      ts: now,
      props: { source: 'options' }
    }),
    { name: 'pro_waitlist_copied', ts: now, props: { source: 'options' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_waitlist_copied',
      ts: now,
      props: { source: 'popup' }
    }),
    { name: 'pro_waitlist_copied', ts: now, props: { source: 'popup' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_waitlist_copied',
      ts: now,
      props: { source: { not: 'primitive' } }
    }),
    { name: 'pro_waitlist_copied', ts: now }
  );

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'wom_share_opened',
      ts: now,
      props: { source: 'popup' }
    }),
    { name: 'wom_share_opened', ts: now, props: { source: 'popup' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'wom_share_opened',
      ts: now,
      props: { source: 'popup', foo: 'bar' }
    }),
    { name: 'wom_share_opened', ts: now, props: { source: 'popup' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'wom_share_opened',
      ts: now,
      props: { source: 'unknown' }
    }),
    { name: 'wom_share_opened', ts: now }
  );

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'onboarding_shown',
      ts: now,
      props: { source: 'popup' }
    }),
    { name: 'onboarding_shown', ts: now }
  );

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'onboarding_completed',
      ts: now,
      props: { action: 'finish' }
    }),
    { name: 'onboarding_completed', ts: now, props: { action: 'finish' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'onboarding_completed',
      ts: now,
      props: { action: 'unknown' }
    }),
    { name: 'onboarding_completed', ts: now }
  );

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'rating_prompt_action',
      ts: now,
      props: { action: 'rate' }
    }),
    { name: 'rating_prompt_action', ts: now, props: { action: 'rate' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'rating_prompt_action',
      ts: now,
      props: { action: 'xxx' }
    }),
    { name: 'rating_prompt_action', ts: now }
  );

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'onboarding_shown',
      ts: now,
      props: { source: { not: 'primitive' } }
    }),
    { name: 'onboarding_shown', ts: now }
  );

  assert.deepEqual(sanitizeTelemetryEvents({ not: 'an array' }), []);
  assert.deepEqual(
    sanitizeTelemetryEvents([
      { name: 'popup_opened', ts: now },
      { name: 'unknown', ts: now },
      { name: 'pro_entry_opened', ts: now, props: { source: 'popup', extra: 'x' } }
    ]),
    [
      { name: 'popup_opened', ts: now },
      { name: 'pro_entry_opened', ts: now, props: { source: 'popup' } }
    ]
  );

  const manyEvents = Array.from({ length: TELEMETRY_MAX_EVENTS + 1 }, (_, i) => ({
    name: 'popup_opened' as const,
    ts: i + 1
  }));
  const trimmedDefault = trimTelemetryEvents(manyEvents);
  assert.equal(trimmedDefault.length, TELEMETRY_MAX_EVENTS);
  assert.equal(trimmedDefault[0]?.ts, 2);
  assert.equal(trimmedDefault[TELEMETRY_MAX_EVENTS - 1]?.ts, TELEMETRY_MAX_EVENTS + 1);

  // pro-funnel.ts (pure functions)
  const proSummaryDisabled = buildProFunnelSummary({
    enabled: false,
    telemetryEvents: [{ name: 'pro_entry_opened', ts: now, props: { source: 'popup' } }]
  });
  assert.equal(proSummaryDisabled.enabled, false);
  assert.equal(proSummaryDisabled.disabledReason, 'anonymous_usage_data_disabled');
  assert.equal(proSummaryDisabled.bySource.popup.counts.pro_entry_opened, 0);
  assert.equal(proSummaryDisabled.bySource.options.counts.pro_waitlist_opened, 0);

  const proSummary = buildProFunnelSummary({
    enabled: true,
    telemetryEvents: [
      { name: 'pro_entry_opened', ts: 10, props: { source: 'popup' } },
      { name: 'pro_entry_opened', ts: 20, props: { source: 'popup' } },
      { name: 'pro_waitlist_opened', ts: 30, props: { source: 'popup' } },
      { name: 'pro_waitlist_copied', ts: 40, props: { source: 'popup' } },
      { name: 'pro_waitlist_opened', ts: 50, props: { source: 'options' } },
      { name: 'pro_waitlist_copied', ts: 60, props: { source: 'options' } },
      { name: 'pro_entry_opened', ts: 70, props: { source: 'options' } },
      { name: 'popup_opened', ts: 80 },
      { name: 'pro_entry_opened', ts: 90, props: { source: 'unknown' } },
      { name: 'pro_waitlist_opened', ts: -1, props: { source: 'popup' } }
    ]
  });
  assert.equal(proSummary.enabled, true);
  assert.equal(proSummary.window.maxEvents, TELEMETRY_MAX_EVENTS);
  assert.deepEqual(proSummary.bySource.popup.counts, {
    pro_entry_opened: 2,
    pro_waitlist_opened: 1,
    pro_waitlist_copied: 1
  });
  assert.deepEqual(proSummary.bySource.popup.lastTs, {
    pro_entry_opened: 20,
    pro_waitlist_opened: 30,
    pro_waitlist_copied: 40
  });
  assert.deepEqual(proSummary.bySource.options.counts, {
    pro_entry_opened: 1,
    pro_waitlist_opened: 1,
    pro_waitlist_copied: 1
  });
  assert.equal(proSummary.bySource.popup.rates.waitlist_opened_per_entry_opened, 0.5);
  assert.equal(proSummary.bySource.popup.rates.waitlist_copied_per_waitlist_opened, 1);
  assert.equal(proSummary.bySource.options.rates.waitlist_opened_per_entry_opened, 1);
  assert.equal(proSummary.bySource.options.rates.waitlist_copied_per_waitlist_opened, 1);

  const proPack = buildProFunnelEvidencePack({
    exportedAt: 123,
    extensionVersion: '1.1.19',
    settings: { ...settings, isAnonymousUsageDataEnabled: true },
    telemetryEvents: [
      { name: 'pro_entry_opened', ts: now, props: { source: 'popup', url: 'https://example.com' } },
      { name: 'pro_waitlist_opened', ts: now + 1, props: { source: 'options', title: 'x' } },
      { name: 'popup_opened', ts: now + 2 },
      { name: 'unknown', ts: now + 3 }
    ]
  });
  assert.deepEqual(Object.keys(proPack).sort(), ['events', 'meta', 'proFunnel', 'settings']);
  assert.deepEqual(Object.keys(proPack.meta).sort(), ['exportedAt', 'extensionVersion', 'source']);
  assert.deepEqual(Object.keys(proPack.settings).sort(), ['isAnonymousUsageDataEnabled']);
  assert.equal(proPack.settings.isAnonymousUsageDataEnabled, true);
  assert.equal(proPack.events.length, 2);
  assert.deepEqual(
    proPack.events.map((e) => e.name),
    ['pro_entry_opened', 'pro_waitlist_opened']
  );
  assert.deepEqual(Object.keys(proPack.events[0]?.props || {}).sort(), ['source']);

  const proPackTelemetryOff = buildProFunnelEvidencePack({
    exportedAt: 1,
    extensionVersion: '1.1.19',
    settings: { ...settings, isAnonymousUsageDataEnabled: false },
    telemetryEvents: [{ name: 'pro_entry_opened', ts: now, props: { source: 'popup' } }]
  });
  assert.equal(proPackTelemetryOff.settings.isAnonymousUsageDataEnabled, false);
  assert.equal(proPackTelemetryOff.events.length, 0);
  assert.equal(proPackTelemetryOff.proFunnel.enabled, false);
  assert.equal(proPackTelemetryOff.proFunnel.bySource.popup.counts.pro_entry_opened, 0);

  // prompt-sort.ts (pure functions)
  assert.equal(parsePromptSortMode('most_used'), 'most_used');
  assert.equal(parsePromptSortMode('recent_used'), 'recent_used');
  assert.equal(parsePromptSortMode('default'), 'default');
  assert.equal(parsePromptSortMode('invalid'), 'default');
  assert.equal(parsePromptSortMode(null), 'default');

  const samplePromptsMostUsed = [
    { id: '1', title: 'Banana', usageCount: 2 },
    { id: '2', title: 'zebra', usageCount: 5 },
    { id: '3', title: 'apple', usageCount: 2 },
    { id: '4', title: 'carrot' }
  ];
  const mostUsedSorted = sortPrompts(samplePromptsMostUsed, 'most_used');
  assert.deepEqual(
    mostUsedSorted.map((p) => p.id),
    ['2', '3', '1', '4'],
    'most_used: usageCount desc, then title asc (case-insensitive), undefined usageCount treated as 0'
  );
  assert.deepEqual(
    samplePromptsMostUsed.map((p) => p.id),
    ['1', '2', '3', '4'],
    'most_used: should not mutate input array'
  );

  const samplePromptsRecentUsed = [
    { id: 'a', title: 'beta', usageCount: 2, lastUsedAt: 2000 },
    { id: 'b', title: 'Alpha', usageCount: 5, lastUsedAt: 2000 },
    { id: 'c', title: 'charlie', usageCount: 1, lastUsedAt: 1500 },
    { id: 'd', title: 'delta', usageCount: 10 },
    { id: 'e', title: 'echo', usageCount: 0 }
  ];
  const recentUsedSorted = sortPrompts(samplePromptsRecentUsed, 'recent_used');
  assert.deepEqual(
    recentUsedSorted.map((p) => p.id),
    ['b', 'a', 'c', 'd', 'e'],
    'recent_used: lastUsedAt desc, then usageCount desc, then title asc; no lastUsedAt should be at the end'
  );

  const samplePromptsDefault = [
    { id: 'x', title: 'X', usageCount: 1 },
    { id: 'y', title: 'Y', usageCount: 2 }
  ];
  const defaultSorted = sortPrompts(samplePromptsDefault, 'default');
  assert.deepEqual(defaultSorted.map((p) => p.id), ['x', 'y'], 'default: keep input order');

  // code-block-cleaner.ts (pure function)
  assert.equal(cleanCodeBlockText('const Copy = 1;\nconsole.log(Copy);'), 'const Copy = 1;\nconsole.log(Copy);');
  assert.equal(
    cleanCodeBlockText('console.log("Copy");\nconsole.log("Clone");'),
    'console.log("Copy");\nconsole.log("Clone");'
  );
  assert.equal(
    cleanCodeBlockText('// Copy this file\n// Clone repo'),
    '// Copy this file\n// Clone repo'
  );

  assert.equal(cleanCodeBlockText('Copy\nconst a = 1;'), 'const a = 1;');
  assert.equal(cleanCodeBlockText('const a = 1;\n复制代码'), 'const a = 1;');

  assert.equal(
    cleanCodeBlockText('const a = 1;\nCopy\nconst b = 2;'),
    'const a = 1;\nCopy\nconst b = 2;'
  );

  // scripts/cws-proxy.ts (v1-39 publish:cws 代理链路确定性)
  {
    const resolvedDefault = resolveCwsProxyEnv({} as NodeJS.ProcessEnv);
    assert.equal(resolvedDefault.proxyEnabled, false);
    assert.ok(resolvedDefault.noProxyValue.includes('localhost'));
    assert.ok(resolvedDefault.noProxyValue.includes('127.0.0.1'));
  }

  {
    const resolvedPriority = resolveCwsProxyEnv({
      CWS_PROXY: 'http://127.0.0.1:1111',
      HTTPS_PROXY: 'http://127.0.0.1:2222',
      ALL_PROXY: 'http://127.0.0.1:3333'
    } as NodeJS.ProcessEnv);
    assert.equal(resolvedPriority.proxyEnabled, true);
    assert.equal(resolvedPriority.proxyEnvKey, 'CWS_PROXY');
    assert.equal(resolvedPriority.proxyUrlMasked, 'http://127.0.0.1:1111');
  }

  assert.throws(
    () => parseAndValidateProxyUrl('127.0.0.1:7890', 'HTTPS_PROXY'),
    (error) => error instanceof CwsProxyConfigError && error.message.includes('缺少 scheme')
  );

  assert.equal(maskProxyUrl(new URL('http://user:pass@127.0.0.1:7890')), 'http://127.0.0.1:7890');
  assert.equal(mergeNoProxyValue('example.com'), 'example.com');
  assert.equal(mergeNoProxyValue(undefined), 'localhost,127.0.0.1,::1');

  {
    const originalDispatcher = getGlobalDispatcher();
    try {
      const resolved = resolveCwsProxyEnv({
        HTTPS_PROXY: 'http://127.0.0.1:7890',
        NO_PROXY: 'example.com'
      } as NodeJS.ProcessEnv);
      const dispatcher = createUndiciProxyDispatcher(resolved);
      assert.ok(dispatcher);
      assert.equal(dispatcher.constructor.name, 'EnvHttpProxyAgent');
      setGlobalDispatcher(dispatcher);
      assert.equal(getGlobalDispatcher().constructor.name, 'EnvHttpProxyAgent');
    } finally {
      setGlobalDispatcher(originalDispatcher);
    }
  }
}

try {
  await run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
