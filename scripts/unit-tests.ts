import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { execFileSync } from 'node:child_process';

import { getGlobalDispatcher, setGlobalDispatcher } from 'undici';

import {
  buildChromeWebStoreDetailUrl,
  buildChromeWebStoreReviewsUrl,
  buildWomUtmParams,
  buildFeedbackIssueUrl,
  buildFeedbackSettingsSnapshot,
  buildShareCopyText,
  type I18nGetMessage
} from '../src/shared/word-of-mouth.ts';
import {
  buildChromeWebStoreUrl,
  buildOfficialSiteUrl,
  buildProWaitlistUrl
} from '../src/shared/external-links.ts';
import {
  RATING_PROMPT_MIN_INSTALL_AGE_MS,
  RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT,
  PRO_PROMPT_MAX_SHOWN_COUNT,
  PRO_PROMPT_MIN_INSTALL_AGE_MS,
  PRO_PROMPT_MIN_SUCCESSFUL_COPY_COUNT,
  PRO_PROMPT_SNOOZE_MS,
  applySuccessfulCopyToGrowthStats,
  buildGrowthFunnelSummary,
  normalizeGrowthStatsValue,
  shouldShowProPrompt,
  shouldShowRatingPrompt,
  type GrowthStats
} from '../src/shared/growth-stats.ts';
import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvent,
  sanitizeTelemetryEvents,
  trimTelemetryEvents
} from '../src/shared/telemetry.ts';
import {
  consumeProWaitlistSurveySourceOnce,
  parseProWaitlistSurveySourceOnceFromUrl
} from '../src/shared/pro-waitlist-survey-source-once.ts';
import { sanitizeCampaign } from '../src/shared/campaign.ts';
import {
  buildProWaitlistRecruitCopyText,
  buildProDistributionPackMarkdown,
  computeProWaitlistDistributionState
} from '../src/shared/pro-waitlist-distribution.ts';
import { buildProFunnelEvidencePack, buildProFunnelSummary } from '../src/shared/pro-funnel.ts';
import {
  buildProIntentWeeklyDigestSummary,
  formatProIntentWeeklyDigestMarkdown
} from '../src/shared/pro-intent-weekly-digest.ts';
import {
  PRO_INTENT_EVENTS_CSV_COLUMNS,
  buildProIntentEventsCsv,
  formatProIntentEvents7dCsvFilename
} from '../src/shared/pro-intent-events-csv.ts';
import { buildProWaitlistSurveyIntentDistribution } from '../src/shared/pro-waitlist-survey-intent-distribution.ts';
import {
  PRO_INTENT_BY_CAMPAIGN_CSV_COLUMNS,
  buildProIntentByCampaignCsv,
  formatProIntentByCampaign7dCsvFilename
} from '../src/shared/pro-intent-by-campaign-csv.ts';
import {
  PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS,
  buildProDistributionByCampaignCsv,
  formatProDistributionByCampaign7dCsvFilename
} from '../src/shared/pro-distribution-by-campaign-csv.ts';
import {
  PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_CSV_COLUMNS,
  buildProAcquisitionEfficiencyByCampaignCsv,
  formatProAcquisitionEfficiencyByCampaign7dCsvFilename
} from '../src/shared/pro-acquisition-efficiency-by-campaign-csv.ts';
import {
  buildProAcquisitionEfficiencyByCampaignWeeklyReportSummary,
  formatProAcquisitionEfficiencyByCampaignWeeklyReportMarkdown
} from '../src/shared/pro-acquisition-efficiency-by-campaign-weekly-report.ts';
import {
  buildProAcquisitionEfficiencyByCampaignEvidencePack,
  formatProAcquisitionEfficiencyByCampaignEvidencePackAsJson
} from '../src/shared/pro-acquisition-efficiency-by-campaign-evidence-pack.ts';
import { formatProAcquisitionEfficiencyByCampaignEvidencePackJsonFilename } from '../src/shared/pro-acquisition-efficiency-by-campaign-evidence-pack-filename.ts';
import {
  buildProWeeklyChannelOpsEvidencePack,
  formatProWeeklyChannelOpsEvidencePackAsJson
} from '../src/shared/pro-weekly-channel-ops-evidence-pack.ts';
import { formatProWeeklyChannelOpsEvidencePackJsonFilename } from '../src/shared/pro-weekly-channel-ops-evidence-pack-filename.ts';
import {
  buildProIntentByCampaignWeeklyReportSummary,
  formatProIntentByCampaignWeeklyReportMarkdown
} from '../src/shared/pro-intent-by-campaign-weekly-report.ts';
import { buildWomEvidencePack, buildWomSummary } from '../src/shared/wom-summary.ts';
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
import { buildCwsPreflightFixHints, classifyCwsPreflightError, runCwsPreflight } from './cws-preflight.ts';
import {
  buildCwsPublishEvidencePack,
  buildCwsPublishEvidenceZip,
  computeFileSha256,
  formatCwsPublishEvidencePackFilename
} from './cws-publish-evidence-pack.ts';
import {
  DEFAULT_PRO_INTENT_DECISION_THRESHOLDS,
  buildProIntentDecisionPackSummary,
  formatProIntentDecisionPackMarkdown
} from './build-pro-intent-decision-pack.ts';
import { buildWeeklyChannelOpsTrend } from './build-weekly-channel-ops-trend.ts';
import {
  CWS_LISTING_EVIDENCE_PACK_VERSION,
  DEFAULT_CWS_LISTING_EVIDENCE_DIR,
  buildCwsListingEvidencePackFromRepo,
  formatCwsListingEvidencePackFilename
} from './build-cws-listing-evidence-pack.ts';
import {
  CWS_LISTING_DIFF_EVIDENCE_PACK_VERSION,
  buildCwsListingDiffEvidencePackFromRepo,
  computeCwsListingDiffRedlines,
  formatCwsListingDiffEvidencePackFilename,
  parseCwsListingEvidencePackFileNameFromIndexMarkdown,
  resolveBaselineListingEvidencePackPathFromIndexFile
} from './build-cws-listing-diff-evidence-pack.ts';
import {
  DEFAULT_CWS_LISTING_REDLINES_POLICY_PATH,
  parseCwsListingRedlinesPolicyFromMarkdown,
  scanCwsListingRedlinesFromText
} from './scan-cws-listing-redlines.ts';

const getMessage: I18nGetMessage = (key, substitutions) => {
  const subs = Array.isArray(substitutions) ? substitutions : substitutions ? [substitutions] : [];

  if (key === 'feedbackIssueTitleTemplate') return 'title';
  if (key === 'feedbackIssueBodyTemplate') {
    return `v=${subs[0]} id=${subs[1]} ua=${subs[2]} nav=${subs[3]} ui=${subs[4]} copilot_settings=${subs[5]} copilot_growth_stats=${subs[6]} copilot_growth_funnel_summary=${subs[7]} copilot_telemetry_events=${subs[8]} lastN=${subs[9]}`;
  }
  if (key === 'proWaitlistIssueTitleTemplate') return 'pro title';
  if (key === 'proWaitlistIssueBodyTemplate') {
    return `v=${subs[0]} id=${subs[1]} nav=${subs[2]} ui=${subs[3]}${subs[4] || ''}`;
  }
  if (key === 'proWaitlistRecruitCopyTemplate') {
    return `recruit url=${subs[0]} campaign=${subs[1]}`;
  }
  if (key === 'proDistributionPackTemplate') {
    return `- campaign: ${subs[0]}\n${subs[1]}\n${subs[2]}\n${subs[3]}\n${subs[4]}`;
  }
  if (key === 'shareCopyTextTemplate') {
    return `share ${subs[0]}`;
  }
  if (key === 'proIntentByCampWeeklyMdTelemetryOffNotice') {
    return '匿名使用数据关闭（无可用事件）。本摘要仅包含环境信息，不读取/不推断任何历史事件。';
  }
  if (key === 'proAcqEffByCampaignWeeklyReportMdTelemetryOffNotice') {
    return '匿名使用数据关闭（不读取/不推断事件）。本摘要仅包含环境信息，用于可审计。';
  }
  if (key === 'proAcqEffByCampaignEvidencePackTelemetryOffNotice') {
    return '匿名使用数据关闭（不读取/不推断事件）。本证据包仅包含环境信息与空资产占位，用于可审计。';
  }
  if (key === 'proWeeklyChannelOpsEvidencePackTelemetryOffNotice') {
    return '匿名使用数据关闭（不读取/不推断事件）。本周度渠道复盘证据包仅包含环境信息与空资产占位，用于可审计。';
  }
  if (key === 'proWeeklyChannelOpsEvidencePackVerifyMarkdown') {
    return (
      '# 周度渠道复盘证据包互证说明（v1-63）\n\n' +
      '互证要点：复算 leadsPerDistCopy；并核对 leads/distCopies 与两份 CSV 的计数一致。\n'
    );
  }
  if (key === 'proAcqEffByCampaignWeeklyReportMdInsightTop1') {
    return `Top1 campaign（按 leadsPerDistCopy）：${subs[0]}`;
  }
  if (key === 'proAcqEffByCampaignWeeklyReportMdInsightTop1Metrics') {
    return `Top1 指标：leads=${subs[0]} distCopies=${subs[1]} leadsPerDistCopy=${subs[2]}`;
  }
  if (key === 'proAcqEffByCampaignWeeklyReportMdInsightEmptyShare') {
    return `空 campaign leads 占比：${subs[0]}（空=${subs[1]} 总=${subs[2]}）`;
  }
  return key;
};

async function run() {
  const extensionId = 'abcdefghijklmnopabcdefghijklmnop';
  const publishedExtensionId = 'ehfglnbhoefcdedpkcdnainiifpflbic';

  const storeUrl = buildChromeWebStoreDetailUrl(extensionId);
  const storeParsed = new URL(storeUrl);
  assert.equal(storeParsed.hostname, 'chromewebstore.google.com');
  assert.ok(storeParsed.pathname.endsWith(`/${publishedExtensionId}`));
  assert.equal(storeParsed.searchParams.get('utm_source'), 'copylot-ext');
  assert.equal(storeParsed.searchParams.get('utm_medium'), 'popup');
  assert.equal(storeParsed.searchParams.get('utm_campaign'), 'v1-44');

  const storeUrlOptions = buildChromeWebStoreDetailUrl(extensionId, buildWomUtmParams('options'));
  const storeOptionsParsed = new URL(storeUrlOptions);
  assert.equal(storeOptionsParsed.hostname, 'chromewebstore.google.com');
  assert.equal(storeOptionsParsed.searchParams.get('utm_source'), 'copylot-ext');
  assert.equal(storeOptionsParsed.searchParams.get('utm_medium'), 'options');
  assert.equal(storeOptionsParsed.searchParams.get('utm_campaign'), 'v1-44');

  const storeUrlRatingPrompt = buildChromeWebStoreDetailUrl(extensionId, buildWomUtmParams('rating_prompt'));
  const storeRatingPromptParsed = new URL(storeUrlRatingPrompt);
  assert.equal(storeRatingPromptParsed.hostname, 'chromewebstore.google.com');
  assert.equal(storeRatingPromptParsed.searchParams.get('utm_medium'), 'rating_prompt');
  assert.equal(storeRatingPromptParsed.searchParams.get('utm_campaign'), 'v1-44');

  const reviewsUrl = buildChromeWebStoreReviewsUrl(extensionId, buildWomUtmParams('popup'));
  const reviewsParsed = new URL(reviewsUrl);
  assert.equal(reviewsParsed.hostname, 'chrome.google.com');
  assert.ok(reviewsParsed.pathname.endsWith(`/webstore/detail/${extensionId}/reviews`));
  assert.equal(reviewsParsed.searchParams.get('utm_source'), 'copylot-ext');
  assert.equal(reviewsParsed.searchParams.get('utm_medium'), 'popup');
  assert.equal(reviewsParsed.searchParams.get('utm_campaign'), 'v1-44');

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
  const eligibleStatsBase: GrowthStats = {
    installedAt: now - RATING_PROMPT_MIN_INSTALL_AGE_MS,
    successfulCopyCount: RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT
  };

  // Prompt users: eligible earlier (but still gated by min install age + min successful copies).
  const eligiblePromptUserStats: GrowthStats = { ...eligibleStatsBase, firstPromptUsedAt: now - 1000 };
  assert.equal(shouldShowRatingPrompt(eligiblePromptUserStats, now), true);

  // Non-prompt users: require heavier copy usage to avoid "just installed -> annoying" prompt.
  assert.equal(shouldShowRatingPrompt(eligibleStatsBase, now), false);
  assert.equal(shouldShowRatingPrompt({ ...eligibleStatsBase, successfulCopyCount: 19 }, now), false);
  assert.equal(shouldShowRatingPrompt({ ...eligibleStatsBase, successfulCopyCount: 20 }, now), true);

  assert.equal(
    shouldShowRatingPrompt(
      { ...eligiblePromptUserStats, installedAt: now - RATING_PROMPT_MIN_INSTALL_AGE_MS + 1 },
      now
    ),
    false
  );
  assert.equal(
    shouldShowRatingPrompt(
      { ...eligiblePromptUserStats, successfulCopyCount: RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT - 1 },
      now
    ),
    false
  );
  assert.equal(
    shouldShowRatingPrompt({ ...eligiblePromptUserStats, ratingPromptShownAt: now - 1000 }, now),
    false
  );

  // Pro waitlist prompt: higher-intent gating + snooze + max shown count.
  const eligibleProBase: GrowthStats = {
    installedAt: now - PRO_PROMPT_MIN_INSTALL_AGE_MS,
    successfulCopyCount: PRO_PROMPT_MIN_SUCCESSFUL_COPY_COUNT,
    firstPromptUsedAt: now - 1000
  };
  assert.equal(shouldShowProPrompt(eligibleProBase, now), true);

  const eligibleProNonPromptBase: GrowthStats = {
    installedAt: now - PRO_PROMPT_MIN_INSTALL_AGE_MS,
    successfulCopyCount: PRO_PROMPT_MIN_SUCCESSFUL_COPY_COUNT
  };
  assert.equal(shouldShowProPrompt(eligibleProNonPromptBase, now), false);
  assert.equal(shouldShowProPrompt({ ...eligibleProNonPromptBase, successfulCopyCount: 39 }, now), false);
  assert.equal(shouldShowProPrompt({ ...eligibleProNonPromptBase, successfulCopyCount: 40 }, now), true);

  assert.equal(
    shouldShowProPrompt({ ...eligibleProBase, installedAt: now - PRO_PROMPT_MIN_INSTALL_AGE_MS + 1 }, now),
    false
  );
  assert.equal(
    shouldShowProPrompt(
      { ...eligibleProBase, successfulCopyCount: PRO_PROMPT_MIN_SUCCESSFUL_COPY_COUNT - 1 },
      now
    ),
    false
  );
  assert.equal(shouldShowProPrompt({ ...eligibleProBase, proPromptAction: 'never' }, now), false);
  assert.equal(shouldShowProPrompt({ ...eligibleProBase, proPromptAction: 'join' }, now), false);

  // If already shown once and user didn't click "later", do not show again.
  assert.equal(shouldShowProPrompt({ ...eligibleProBase, proPromptShownCount: 1 }, now), false);

  // Snooze: only re-prompt after snooze passed (and within max shown count).
  const snoozedProStats: GrowthStats = {
    ...eligibleProBase,
    proPromptShownCount: 1,
    proPromptAction: 'later',
    proPromptSnoozedUntil: now + PRO_PROMPT_SNOOZE_MS
  };
  assert.equal(shouldShowProPrompt(snoozedProStats, now), false);
  assert.equal(shouldShowProPrompt({ ...snoozedProStats, proPromptSnoozedUntil: now - 1 }, now), true);

  assert.equal(
    shouldShowProPrompt(
      {
        ...eligibleProBase,
        proPromptShownCount: PRO_PROMPT_MAX_SHOWN_COUNT,
        proPromptAction: 'later',
        proPromptSnoozedUntil: now - 1
      },
      now
    ),
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

  // campaign.ts (pure functions)
  assert.equal(sanitizeCampaign('twitter'), 'twitter');
  assert.equal(sanitizeCampaign('  twitter  '), 'twitter');
  assert.equal(sanitizeCampaign(''), null);
  assert.equal(sanitizeCampaign('   '), null);
  assert.equal(sanitizeCampaign('a'.repeat(33)), null);
  assert.equal(sanitizeCampaign('http://x.com'), null);
  assert.equal(sanitizeCampaign('a b'), null);
  assert.equal(sanitizeCampaign('_abc'), null);
  assert.equal(sanitizeCampaign('小红书'), null);

  // external-links.ts (pure functions)
  const officialSiteUrl = buildOfficialSiteUrl({ medium: 'popup' });
  const officialSiteParsed = new URL(officialSiteUrl);
  assert.equal(officialSiteParsed.origin, 'https://copy.useai.online');
  assert.equal(officialSiteParsed.pathname, '/');
  assert.equal(officialSiteParsed.hash, '');
  assert.equal(officialSiteParsed.searchParams.get('utm_source'), 'copylot-ext');
  assert.equal(officialSiteParsed.searchParams.get('utm_medium'), 'popup');
  assert.equal(officialSiteParsed.searchParams.get('utm_campaign'), null);

  const officialSiteUrlWithCampaign = buildOfficialSiteUrl({ medium: 'options', campaign: 'twitter' });
  const officialSiteCampaignParsed = new URL(officialSiteUrlWithCampaign);
  assert.equal(officialSiteCampaignParsed.searchParams.get('utm_campaign'), 'twitter');

  const proWaitlistUrl = buildProWaitlistUrl({
    medium: 'popup',
    campaign: 'twitter',
    env: {
      extensionVersion: '1.1.0',
      extensionId,
      navigatorLanguage: 'en-US',
      uiLanguage: 'en',
      pageUrl: 'https://evil.example.com',
      title: 'secret-title',
      copiedText: 'secret-copy'
    }
  });
  const proWaitlistParsed = new URL(proWaitlistUrl);
  assert.equal(proWaitlistParsed.origin, 'https://copy.useai.online');
  assert.equal(proWaitlistParsed.hash, '#pro');
  assert.equal(proWaitlistParsed.searchParams.get('utm_source'), 'copylot-ext');
  assert.equal(proWaitlistParsed.searchParams.get('utm_medium'), 'popup');
  assert.equal(proWaitlistParsed.searchParams.get('utm_campaign'), 'twitter');
  assert.equal(proWaitlistParsed.searchParams.get('ext_version'), '1.1.0');
  assert.equal(proWaitlistParsed.searchParams.get('ext_id'), extensionId);
  assert.equal(proWaitlistParsed.searchParams.get('nav_lang'), 'en-US');
  assert.equal(proWaitlistParsed.searchParams.get('ui_lang'), 'en');
  assert.equal(proWaitlistParsed.searchParams.get('pageUrl'), null);
  assert.equal(proWaitlistParsed.searchParams.get('title'), null);
  assert.equal(proWaitlistParsed.searchParams.get('copiedText'), null);
  assert.ok(!proWaitlistUrl.includes('evil.example.com'));
  assert.ok(!proWaitlistUrl.includes('secret-title'));
  assert.ok(!proWaitlistUrl.includes('secret-copy'));

  const chromeWebStoreUrl = buildChromeWebStoreUrl({ medium: 'distribution_toolkit', campaign: 'twitter' });
  const chromeWebStoreParsed = new URL(chromeWebStoreUrl);
  assert.equal(chromeWebStoreParsed.hostname, 'chromewebstore.google.com');
  assert.ok(chromeWebStoreParsed.pathname.endsWith(`/${publishedExtensionId}`));
  assert.equal(chromeWebStoreParsed.searchParams.get('utm_source'), 'copylot-ext');
  assert.equal(chromeWebStoreParsed.searchParams.get('utm_medium'), 'distribution_toolkit');
  assert.equal(chromeWebStoreParsed.searchParams.get('utm_campaign'), 'twitter');

  // pro-waitlist-distribution.ts (pure functions)
  assert.deepEqual(computeProWaitlistDistributionState(''), { enabled: false, campaign: null });
  assert.deepEqual(computeProWaitlistDistributionState('http://x.com'), { enabled: false, campaign: null });
  assert.deepEqual(computeProWaitlistDistributionState('twitter'), { enabled: true, campaign: 'twitter' });

  const recruitCopyText = buildProWaitlistRecruitCopyText({
    getMessage,
    waitlistUrl: 'https://example.com/waitlist',
    campaign: 'twitter'
  });
  assert.ok(recruitCopyText.includes('https://example.com/waitlist'));
  assert.ok(recruitCopyText.includes('twitter'));

  const distributionPack = buildProDistributionPackMarkdown({
    getMessage,
    campaign: 'twitter',
    officialSiteUrl: 'https://example.com',
    storeUrl: chromeWebStoreUrl,
    waitlistUrl: 'https://example.com/waitlist',
    recruitCopy: recruitCopyText
  });
  assert.ok(distributionPack.includes('- campaign: twitter'));
  assert.ok(distributionPack.includes(chromeWebStoreUrl));
  assert.ok(distributionPack.includes('https://example.com/waitlist'));
  assert.ok(distributionPack.includes(recruitCopyText));

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
      props: { source: 'options', campaign: 'twitter', extra: 'x' }
    }),
    { name: 'pro_entry_opened', ts: now, props: { source: 'options', campaign: 'twitter' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_entry_opened',
      ts: now,
      props: { source: 'options', campaign: 'http://x.com' }
    }),
    { name: 'pro_entry_opened', ts: now, props: { source: 'options' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_entry_opened',
      ts: now,
      props: { source: 'unknown', campaign: 'twitter' }
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
      name: 'rating_prompt_shown',
      ts: now,
      props: { source: 'rating_prompt' }
    }),
    { name: 'rating_prompt_shown', ts: now, props: { source: 'rating_prompt' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'rating_prompt_shown',
      ts: now,
      props: { source: 'popup' }
    }),
    { name: 'rating_prompt_shown', ts: now }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'rating_prompt_action',
      ts: now,
      props: { source: 'rating_prompt', action: 'rate' }
    }),
    { name: 'rating_prompt_action', ts: now, props: { source: 'rating_prompt', action: 'rate' } }
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

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_prompt_action',
      ts: now,
      props: { source: 'popup', action: 'join', extra: 'x' }
    }),
    { name: 'pro_prompt_action', ts: now, props: { source: 'popup', action: 'join' } }
  );

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_prompt_action',
      ts: now,
      props: { source: 'popup', action: 'invalid' }
    }),
    { name: 'pro_prompt_action', ts: now, props: { source: 'popup' } }
  );

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_prompt_shown',
      ts: now,
      props: { source: 'popup', extra: 'x' }
    }),
    { name: 'pro_prompt_shown', ts: now, props: { source: 'popup' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_prompt_shown',
      ts: now,
      props: { source: 'rating_prompt' }
    }),
    { name: 'pro_prompt_shown', ts: now }
  );

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_waitlist_survey_copied',
      ts: now,
      props: { source: 'options', extra: 'x' }
    }),
    { name: 'pro_waitlist_survey_copied', ts: now, props: { source: 'options' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_waitlist_survey_copied',
      ts: now,
      props: { source: 'popup', extra: 'x' }
    }),
    { name: 'pro_waitlist_survey_copied', ts: now, props: { source: 'popup' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_waitlist_survey_copied',
      ts: now,
      props: {
        source: 'options',
        campaign: 'twitter',
        pay_willing: 'yes',
        pay_monthly: '10_20',
        pay_annual: '100_200',
        cap_advanced_cleaning: true,
        cap_batch_collection: false,
        cap_prompt_pack: true,
        cap_note_export: false,
        has_other_capability: true,
        has_contact: false,
        // Privacy redlines: must never be stored.
        useCase: 'use case text',
        contact: 'email@example.com',
        otherCapabilities: 'other capability text',
        url: 'https://example.com',
        title: 'Example Title',
        clipboardText: 'copied text',
        extra: 'x'
      }
    }),
    {
      name: 'pro_waitlist_survey_copied',
      ts: now,
      props: {
        source: 'options',
        campaign: 'twitter',
        pay_willing: 'yes',
        pay_monthly: '10_20',
        pay_annual: '100_200',
        cap_advanced_cleaning: true,
        cap_batch_collection: false,
        cap_prompt_pack: true,
        cap_note_export: false,
        has_other_capability: true,
        has_contact: false
      }
    }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_waitlist_survey_copied',
      ts: now,
      props: {
        source: 'options',
        pay_willing: 'invalid',
        pay_monthly: 'invalid',
        pay_annual: 'invalid',
        cap_advanced_cleaning: 'true',
        has_contact: 1
      }
    }),
    { name: 'pro_waitlist_survey_copied', ts: now, props: { source: 'options' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_waitlist_survey_copied',
      ts: now,
      props: { source: 'rating_prompt' }
    }),
    { name: 'pro_waitlist_survey_copied', ts: now }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_waitlist_survey_copied',
      ts: now,
      props: { source: 'unknown', campaign: 'twitter' }
    }),
    { name: 'pro_waitlist_survey_copied', ts: now }
  );

  const parsedProSurveySourceA = parseProWaitlistSurveySourceOnceFromUrl(
    'https://example.com/src/options/options.html?pro_survey_source=popup#pro-waitlist-survey'
  );
  assert.equal(parsedProSurveySourceA.onceSource, 'popup');
  assert.equal(parsedProSurveySourceA.hadSourceParam, true);
  assert.equal(
    parsedProSurveySourceA.cleanedUrl,
    'https://example.com/src/options/options.html#pro-waitlist-survey'
  );

  const parsedProSurveySourceB = parseProWaitlistSurveySourceOnceFromUrl(
    'https://example.com/src/options/options.html?pro_survey_source=invalid&x=1#pro-waitlist-survey'
  );
  assert.equal(parsedProSurveySourceB.onceSource, null);
  assert.equal(parsedProSurveySourceB.hadSourceParam, true);
  assert.equal(
    parsedProSurveySourceB.cleanedUrl,
    'https://example.com/src/options/options.html?x=1#pro-waitlist-survey'
  );

  const proSurveySourceOnce1 = consumeProWaitlistSurveySourceOnce('popup');
  assert.equal(proSurveySourceOnce1.source, 'popup');
  const proSurveySourceOnce2 = consumeProWaitlistSurveySourceOnce(proSurveySourceOnce1.nextOnceSource);
  assert.equal(proSurveySourceOnce2.source, 'options');

  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_distribution_asset_copied',
      ts: now,
      props: { source: 'options', campaign: 'twitter', action: 'waitlist_url', extra: 'x' }
    }),
    {
      name: 'pro_distribution_asset_copied',
      ts: now,
      props: { source: 'options', campaign: 'twitter', action: 'waitlist_url' }
    }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_distribution_asset_copied',
      ts: now,
      props: { source: 'options', campaign: 'http://x.com', action: 'waitlist_url' }
    }),
    { name: 'pro_distribution_asset_copied', ts: now, props: { source: 'options', action: 'waitlist_url' } }
  );
  assert.deepEqual(
    sanitizeTelemetryEvent({
      name: 'pro_distribution_asset_copied',
      ts: now,
      props: { source: 'options', campaign: 'twitter', action: 'invalid' }
    }),
    { name: 'pro_distribution_asset_copied', ts: now, props: { source: 'options', campaign: 'twitter' } }
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

  // pro-waitlist-survey-intent-distribution.ts (pure functions)
  const distNow = 1_000_000_000;
  const dist = buildProWaitlistSurveyIntentDistribution({
    enabled: true,
    telemetryEvents: [
      {
        name: 'pro_waitlist_survey_copied',
        ts: distNow - 1000,
        props: {
          source: 'options',
          pay_willing: 'yes',
          pay_monthly: '10_20',
          pay_annual: '100_200',
          cap_advanced_cleaning: true,
          cap_batch_collection: true,
          cap_prompt_pack: false,
          cap_note_export: false
        }
      },
      {
        name: 'pro_waitlist_survey_copied',
        ts: distNow - 2000,
        props: {
          source: 'options',
          pay_willing: 'no',
          pay_monthly: 'unknown',
          pay_annual: 'unknown',
          cap_prompt_pack: true
        }
      },
      {
        name: 'pro_waitlist_survey_copied',
        ts: distNow - 999_999_999,
        props: { source: 'options', pay_willing: 'maybe' }
      },
      { name: 'pro_waitlist_opened', ts: distNow - 1000, props: { source: 'options' } },
      {
        name: 'pro_waitlist_survey_copied',
        ts: distNow - 3000,
        props: {
          source: 'options',
          pay_willing: 'yes',
          pay_monthly: '5_10',
          pay_annual: '50_100',
          cap_note_export: true,
          contact: 'email@example.com',
          useCase: 'secret',
          otherCapabilities: 'secret',
          url: 'https://example.com',
          title: 'Example Title',
          clipboardText: 'copied text'
        }
      }
    ],
    now: distNow,
    extensionVersion: '1.2.3',
    lookbackDays: 7
  });
  assert.equal(dist.enabled, true);
  assert.equal(dist.lookbackDays, 7);
  assert.equal(dist.survey_intent, 3);

  assert.equal(dist.pay_willing_yes, 2);
  assert.equal(dist.pay_willing_maybe, 0);
  assert.equal(dist.pay_willing_no, 1);
  assert.equal(dist.pay_willing_unknown, 0);

  assert.equal(dist.price_monthly_10_20, 1);
  assert.equal(dist.price_monthly_5_10, 1);
  assert.equal(dist.price_monthly_unknown, 1);

  assert.equal(dist.price_annual_100_200, 1);
  assert.equal(dist.price_annual_50_100, 1);
  assert.equal(dist.price_annual_unknown, 1);

  assert.equal(dist.capability_advanced_cleaning, 1);
  assert.equal(dist.capability_batch_collection, 1);
  assert.equal(dist.capability_prompt_pack, 1);
  assert.equal(dist.capability_note_export, 1);

  const distText = JSON.stringify(dist);
  assert.ok(!distText.includes('email@example.com'));
  assert.ok(!distText.includes('secret'));
  assert.ok(!distText.includes('https://example.com'));

  // build-pro-intent-decision-pack.ts (pure functions)
  const decisionSummaryA = buildProIntentDecisionPackSummary({
    rawDistribution: {
      ...dist,
      contact: 'email@example.com',
      useCase: 'secret',
      otherCapabilities: 'secret',
      url: 'https://evil.example.com',
      title: 'secret-title',
      clipboardText: 'copied text'
    },
    distributionFile: 'docs/evidence/v1-81/copylot-pro-waitlist-survey-intent-distribution-7d-2026-03-23.json',
    distributionSha256: 'sha256-test'
  });
  assert.equal(decisionSummaryA.thresholds.version, DEFAULT_PRO_INTENT_DECISION_THRESHOLDS.version);
  assert.equal(decisionSummaryA.metrics.survey_intent, 3);
  assert.equal(decisionSummaryA.metrics.high_intent_rate, 0.6667);
  assert.equal(decisionSummaryA.decision.code, 'A');
  assert.ok(decisionSummaryA.decision.reasons.includes('survey_intent_insufficient'));

  const decisionSummaryAText = JSON.stringify(decisionSummaryA);
  assert.ok(!decisionSummaryAText.includes('email@example.com'));
  assert.ok(!decisionSummaryAText.includes('secret'));
  assert.ok(!decisionSummaryAText.includes('https://evil.example.com'));

  const decisionSummaryAMd = formatProIntentDecisionPackMarkdown(decisionSummaryA);
  assert.ok(decisionSummaryAMd.includes('code：`A`'));
  assert.ok(!decisionSummaryAMd.includes('email@example.com'));
  assert.ok(!decisionSummaryAMd.includes('secret'));
  assert.ok(!decisionSummaryAMd.includes('https://evil.example.com'));

  const decisionSummaryB = buildProIntentDecisionPackSummary({
    rawDistribution: {
      enabled: true,
      exportedAt: 1000,
      extensionVersion: '1.2.3',
      windowFrom: 1,
      windowTo: 1000,
      lookbackDays: 7,
      maxEvents: 100,
      survey_intent: 30,
      pay_willing_yes: 10,
      pay_willing_maybe: 5,
      pay_willing_no: 15,
      pay_willing_unknown: 0,
      price_monthly_lt_5: 0,
      price_monthly_5_10: 0,
      price_monthly_10_20: 10,
      price_monthly_20_50: 10,
      price_monthly_50_plus: 10,
      price_monthly_unknown: 0,
      price_annual_lt_50: 0,
      price_annual_50_100: 10,
      price_annual_100_200: 10,
      price_annual_200_500: 10,
      price_annual_500_plus: 0,
      price_annual_unknown: 0,
      capability_advanced_cleaning: 10,
      capability_batch_collection: 10,
      capability_prompt_pack: 10,
      capability_note_export: 10
    },
    distributionFile: 'x.json',
    distributionSha256: 'sha256-test'
  });
  assert.equal(decisionSummaryB.decision.code, 'B');
  assert.ok(decisionSummaryB.decision.reasons.includes('high_intent_rate_insufficient'));

  const decisionSummaryC = buildProIntentDecisionPackSummary({
    rawDistribution: {
      enabled: true,
      exportedAt: 1000,
      extensionVersion: '1.2.3',
      windowFrom: 1,
      windowTo: 1000,
      lookbackDays: 7,
      maxEvents: 100,
      survey_intent: 30,
      pay_willing_yes: 12,
      pay_willing_maybe: 6,
      pay_willing_no: 12,
      pay_willing_unknown: 0,
      price_monthly_lt_5: 0,
      price_monthly_5_10: 0,
      price_monthly_10_20: 12,
      price_monthly_20_50: 10,
      price_monthly_50_plus: 8,
      price_monthly_unknown: 0,
      price_annual_lt_50: 0,
      price_annual_50_100: 12,
      price_annual_100_200: 10,
      price_annual_200_500: 8,
      price_annual_500_plus: 0,
      price_annual_unknown: 0,
      capability_advanced_cleaning: 18,
      capability_batch_collection: 12,
      capability_prompt_pack: 10,
      capability_note_export: 8
    },
    distributionFile: 'x.json',
    distributionSha256: 'sha256-test'
  });
  assert.equal(decisionSummaryC.decision.code, 'C');
  assert.ok(decisionSummaryC.decision.reasons.includes('go_for_subscription_mvp'));

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
      { name: 'pro_prompt_shown', ts: 5, props: { source: 'popup' } },
      { name: 'pro_prompt_action', ts: 6, props: { source: 'popup', action: 'join' } },
      { name: 'pro_entry_opened', ts: 10, props: { source: 'popup' } },
      { name: 'pro_entry_opened', ts: 20, props: { source: 'popup' } },
      { name: 'pro_waitlist_opened', ts: 30, props: { source: 'popup' } },
      { name: 'pro_waitlist_survey_copied', ts: 35, props: { source: 'popup' } },
      { name: 'pro_waitlist_copied', ts: 40, props: { source: 'popup' } },
      { name: 'pro_prompt_shown', ts: 45, props: { source: 'options' } },
      { name: 'pro_prompt_action', ts: 46, props: { source: 'options', action: 'later' } },
      { name: 'pro_waitlist_opened', ts: 50, props: { source: 'options' } },
      { name: 'pro_waitlist_survey_copied', ts: 55, props: { source: 'options' } },
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
    pro_prompt_shown: 1,
    pro_prompt_action: 1,
    pro_entry_opened: 2,
    pro_waitlist_opened: 1,
    pro_waitlist_copied: 1,
    pro_waitlist_survey_copied: 1
  });
  assert.deepEqual(proSummary.bySource.popup.lastTs, {
    pro_prompt_shown: 5,
    pro_prompt_action: 6,
    pro_entry_opened: 20,
    pro_waitlist_opened: 30,
    pro_waitlist_copied: 40,
    pro_waitlist_survey_copied: 35
  });
  assert.deepEqual(proSummary.bySource.options.counts, {
    pro_prompt_shown: 1,
    pro_prompt_action: 1,
    pro_entry_opened: 1,
    pro_waitlist_opened: 1,
    pro_waitlist_copied: 1,
    pro_waitlist_survey_copied: 1
  });
  assert.deepEqual(proSummary.overall.counts, {
    pro_prompt_shown: 2,
    pro_prompt_action: 2,
    pro_entry_opened: 3,
    pro_waitlist_opened: 2,
    pro_waitlist_copied: 2,
    pro_waitlist_survey_copied: 2
  });
  assert.equal(proSummary.bySource.popup.rates.waitlist_opened_per_entry_opened, 0.5);
  assert.equal(proSummary.bySource.popup.rates.waitlist_copied_per_waitlist_opened, 1);
  assert.equal(proSummary.bySource.popup.rates.entry_opened_per_prompt_shown, 2);
  assert.equal(proSummary.bySource.popup.rates.waitlist_opened_per_prompt_shown, 1);
  assert.equal(proSummary.bySource.options.rates.waitlist_opened_per_entry_opened, 1);
  assert.equal(proSummary.bySource.options.rates.waitlist_copied_per_waitlist_opened, 1);
  assert.equal(proSummary.overall.rates.waitlist_opened_per_entry_opened, 0.6667);
  assert.equal(proSummary.overall.rates.waitlist_copied_per_waitlist_opened, 1);
  assert.equal(proSummary.overall.rates.entry_opened_per_prompt_shown, 1.5);
  assert.equal(proSummary.overall.rates.waitlist_opened_per_prompt_shown, 1);

  const proPack = buildProFunnelEvidencePack({
    exportedAt: 123,
    extensionVersion: '1.1.19',
    settings: { ...settings, isAnonymousUsageDataEnabled: true },
    telemetryEvents: [
      { name: 'pro_prompt_shown', ts: now - 1, props: { source: 'popup', extra: 'x' } },
      { name: 'pro_prompt_action', ts: now, props: { source: 'popup', action: 'join', foo: 'bar' } },
      { name: 'pro_entry_opened', ts: now, props: { source: 'popup', url: 'https://example.com' } },
      { name: 'pro_waitlist_opened', ts: now + 1, props: { source: 'options', title: 'x' } },
      { name: 'pro_waitlist_survey_copied', ts: now + 2, props: { source: 'options', useCase: 'x' } },
      { name: 'pro_waitlist_copied', ts: now + 3, props: { source: 'options', campaign: 'twitter', extra: 'x' } },
      { name: 'popup_opened', ts: now + 2 },
      { name: 'unknown', ts: now + 4 }
    ]
  });
  assert.deepEqual(Object.keys(proPack).sort(), ['events', 'meta', 'proFunnel', 'settings']);
  assert.deepEqual(Object.keys(proPack.meta).sort(), ['exportedAt', 'extensionVersion', 'source']);
  assert.deepEqual(Object.keys(proPack.settings).sort(), ['isAnonymousUsageDataEnabled']);
  assert.equal(proPack.settings.isAnonymousUsageDataEnabled, true);
  assert.equal(proPack.events.length, 6);
  assert.deepEqual(
    proPack.events.map((e) => e.name),
    [
      'pro_prompt_shown',
      'pro_prompt_action',
      'pro_entry_opened',
      'pro_waitlist_opened',
      'pro_waitlist_survey_copied',
      'pro_waitlist_copied'
    ]
  );
  assert.deepEqual(Object.keys(proPack.events[0]?.props || {}).sort(), ['source']);
  const waitlistCopiedEvent = proPack.events.find((e) => e.name === 'pro_waitlist_copied');
  assert.deepEqual(Object.keys(waitlistCopiedEvent?.props || {}).sort(), ['campaign', 'source']);
  assert.equal(waitlistCopiedEvent?.props?.campaign, 'twitter');

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

  // pro-intent-weekly-digest.ts (pure functions + markdown formatter)
  const proWeeklyDigestDisabled = buildProIntentWeeklyDigestSummary({
    enabled: false,
    telemetryEvents: [{ name: 'pro_entry_opened', ts: now, props: { source: 'popup' } }],
    now
  });
  assert.equal(proWeeklyDigestDisabled.enabled, false);
  assert.equal(proWeeklyDigestDisabled.disabledReason, 'anonymous_usage_data_disabled');
  assert.equal(proWeeklyDigestDisabled.overall.pro_entry_opened, 0);
  assert.equal(proWeeklyDigestDisabled.rates.waitlist_opened_per_entry_opened, null);

  const proWeeklyDigestEmpty = buildProIntentWeeklyDigestSummary({
    enabled: true,
    telemetryEvents: [],
    now
  });
  assert.equal(proWeeklyDigestEmpty.enabled, true);
  assert.equal(proWeeklyDigestEmpty.overall.pro_entry_opened, 0);
  assert.equal(proWeeklyDigestEmpty.overall.pro_waitlist_opened, 0);
  assert.equal(proWeeklyDigestEmpty.rates.waitlist_opened_per_entry_opened, null);
  assert.equal(proWeeklyDigestEmpty.window.to, now);
  assert.equal(proWeeklyDigestEmpty.window.from, now - 7 * 24 * 60 * 60 * 1000);

  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const proWeeklyDigest = buildProIntentWeeklyDigestSummary({
    enabled: true,
    telemetryEvents: [
      { name: 'pro_entry_opened', ts: sevenDaysAgo, props: { source: 'popup' } }, // included (boundary)
      { name: 'pro_waitlist_opened', ts: sevenDaysAgo + 1, props: { source: 'popup' } },
      { name: 'pro_waitlist_survey_copied', ts: now - 1000, props: { source: 'options' } },
      { name: 'pro_waitlist_copied', ts: now, props: { source: 'options' } }, // included (boundary)
      { name: 'pro_entry_opened', ts: sevenDaysAgo - 1, props: { source: 'options' } }, // excluded
      { name: 'pro_waitlist_opened', ts: now + 1, props: { source: 'options' } }, // excluded
      { name: 'popup_opened', ts: now }
    ],
    now
  });
  assert.equal(proWeeklyDigest.overall.pro_entry_opened, 1);
  assert.equal(proWeeklyDigest.overall.pro_waitlist_opened, 1);
  assert.equal(proWeeklyDigest.overall.pro_waitlist_survey_copied, 1);
  assert.equal(proWeeklyDigest.overall.pro_waitlist_copied, 1);
  assert.equal(proWeeklyDigest.bySource.popup.pro_entry_opened, 1);
  assert.equal(proWeeklyDigest.bySource.options.pro_entry_opened, 0);
  assert.equal(proWeeklyDigest.rates.waitlist_opened_per_entry_opened, 1);
  assert.equal(proWeeklyDigest.rates.waitlist_copied_per_waitlist_opened, 1);
  assert.equal(proWeeklyDigest.rates.survey_copied_per_entry_opened, 1);
  assert.deepEqual(proWeeklyDigest.byCampaign, {
    '%%NO_CAMPAIGN%%': { pro_waitlist_copied: 1, pro_waitlist_survey_copied: 1 }
  });

  const proWeeklyDigestCampaign = buildProIntentWeeklyDigestSummary({
    enabled: true,
    telemetryEvents: [
      { name: 'pro_waitlist_copied', ts: now - 10, props: { source: 'options', campaign: 'twitter' } },
      { name: 'pro_waitlist_copied', ts: now - 9, props: { source: 'options' } },
      { name: 'pro_waitlist_survey_copied', ts: now - 8, props: { source: 'options', campaign: 'twitter' } },
      { name: 'pro_waitlist_survey_copied', ts: now - 7, props: { source: 'options', campaign: 'ph' } },
      { name: 'pro_waitlist_opened', ts: now - 6, props: { source: 'options', campaign: 'twitter' } }
    ],
    now
  });
  assert.deepEqual(proWeeklyDigestCampaign.byCampaign, {
    twitter: { pro_waitlist_copied: 1, pro_waitlist_survey_copied: 1 },
    '%%NO_CAMPAIGN%%': { pro_waitlist_copied: 1, pro_waitlist_survey_copied: 0 },
    ph: { pro_waitlist_copied: 0, pro_waitlist_survey_copied: 1 }
  });

  const digestGetMessage = (key: string, substitutions?: string | string[]) => {
    const subs = Array.isArray(substitutions) ? substitutions : substitutions ? [substitutions] : [];
    if (key === 'proIntentWeeklyDigestMdTitle') return `Pro 意向证据摘要（过去 ${subs[0] || ''} 天）`;
    if (key === 'proIntentWeeklyDigestMdTelemetryOffNotice') return '匿名使用数据关闭（无可用事件）';
    if (key === 'proIntentWeeklyDigestMdSectionWindow') return '时间窗（本地时间）';
    if (key === 'proIntentWeeklyDigestMdSectionCountsOverall') return '关键事件计数（overall）';
    if (key === 'proIntentWeeklyDigestMdSectionCountsBySource') return '关键事件计数（bySource）';
    if (key === 'proIntentWeeklyDigestMdSectionRatesOverall') return '关键转化率（overall）';
    if (key === 'proIntentWeeklyDigestMdSectionCampaignBreakdown') return '按 campaign 拆分（留资动作）';
    if (key === 'proIntentWeeklyDigestMdCampaignNone') return '(none)';
    if (key === 'proIntentWeeklyDigestMdSectionEnv') return '环境信息';
    if (key === 'proIntentWeeklyDigestMdSectionPrivacy') return '隐私声明';
    if (key === 'proIntentWeeklyDigestMdPrivacyStatement') return '不包含网页内容';
    return key;
  };

  const proWeeklyDigestMarkdown = formatProIntentWeeklyDigestMarkdown({
    summary: proWeeklyDigest,
    env: {
      extensionVersion: '1.1.23',
      exportedAt: now,
      isAnonymousUsageDataEnabled: true
    },
    getMessage: digestGetMessage
  });
  assert.ok(proWeeklyDigestMarkdown.includes('pro_entry_opened'));
  assert.ok(proWeeklyDigestMarkdown.includes('waitlist_opened_per_entry_opened'));
  assert.ok(proWeeklyDigestMarkdown.includes('不包含网页内容'));
  assert.ok(proWeeklyDigestMarkdown.includes('| (none) |'));

  // pro-intent-events-csv.ts (pure functions + 7d window -> CSV)
  const proIntentCsvDisabled = buildProIntentEventsCsv({
    enabled: false,
    telemetryEvents: [{ name: 'pro_entry_opened', ts: now, props: { source: 'popup' } }],
    now,
    extensionVersion: '1.1.23',
    lookbackDays: 7
  });
  assert.equal(proIntentCsvDisabled.enabled, false);
  assert.equal(proIntentCsvDisabled.disabledReason, 'anonymous_usage_data_disabled');
  assert.equal(proIntentCsvDisabled.rows.length, 0);
  assert.ok(!proIntentCsvDisabled.csv.startsWith('\uFEFF'));
  assert.equal(proIntentCsvDisabled.csv.trimEnd(), PRO_INTENT_EVENTS_CSV_COLUMNS.join(','));

  const proIntentCsv = buildProIntentEventsCsv({
    enabled: true,
    telemetryEvents: [
      { name: 'pro_entry_opened', ts: sevenDaysAgo, props: { source: 'popup' } }, // included (boundary)
      { name: 'pro_waitlist_opened', ts: sevenDaysAgo + 1, props: { source: 'popup' } },
      { name: 'pro_waitlist_survey_copied', ts: now - 1000, props: { source: 'options' } },
      { name: 'pro_waitlist_copied', ts: now, props: { source: 'options' } }, // included (boundary)
      { name: 'pro_entry_opened', ts: sevenDaysAgo - 1, props: { source: 'options' } }, // excluded (<from)
      { name: 'pro_waitlist_opened', ts: now + 1, props: { source: 'options' } }, // excluded (>to)
      { name: 'popup_opened', ts: now }
    ],
    now,
    extensionVersion: '1.1.23',
    lookbackDays: 7
  });
  assert.equal(proIntentCsv.enabled, true);
  assert.equal(proIntentCsv.windowFrom, sevenDaysAgo);
  assert.equal(proIntentCsv.windowTo, now);
  assert.equal(proIntentCsv.rows.length, 4);
  assert.equal(proIntentCsv.csv.split('\n')[0], PRO_INTENT_EVENTS_CSV_COLUMNS.join(','));
  assert.equal(proIntentCsv.csv.trim().split('\n').length, 1 + proIntentCsv.rows.length);
  assert.ok(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(proIntentCsv.rows[0]?.eventLocalTime || ''));

  const proIntentCsvCounts = proIntentCsv.rows.reduce(
    (acc, row) => {
      acc.overall[row.eventName] += 1;
      acc.bySource[row.source][row.eventName] += 1;
      return acc;
    },
    {
      overall: {
        pro_entry_opened: 0,
        pro_waitlist_opened: 0,
        pro_waitlist_copied: 0,
        pro_waitlist_survey_copied: 0
      },
      bySource: {
        popup: {
          pro_entry_opened: 0,
          pro_waitlist_opened: 0,
          pro_waitlist_copied: 0,
          pro_waitlist_survey_copied: 0
        },
        options: {
          pro_entry_opened: 0,
          pro_waitlist_opened: 0,
          pro_waitlist_copied: 0,
          pro_waitlist_survey_copied: 0
        }
      }
    }
  );

  assert.deepEqual(proIntentCsvCounts.overall, proWeeklyDigest.overall);
  assert.deepEqual(proIntentCsvCounts.bySource.popup, proWeeklyDigest.bySource.popup);
  assert.deepEqual(proIntentCsvCounts.bySource.options, proWeeklyDigest.bySource.options);

  const proIntentCsvTrim = buildProIntentEventsCsv({
    enabled: true,
    telemetryEvents: [
      { name: 'pro_entry_opened', ts: sevenDaysAgo + 10, props: { source: 'popup' } },
      { name: 'pro_entry_opened', ts: sevenDaysAgo + 20, props: { source: 'popup' } },
      { name: 'pro_waitlist_opened', ts: sevenDaysAgo + 30, props: { source: 'popup' } }
    ],
    now,
    extensionVersion: '1.1.23',
    lookbackDays: 7,
    maxEvents: 2
  });
  assert.equal(proIntentCsvTrim.rows.length, 2);
  assert.deepEqual(
    proIntentCsvTrim.rows.map((r) => r.eventName),
    ['pro_entry_opened', 'pro_waitlist_opened']
  );

  const proWeeklyDigestTrim = buildProIntentWeeklyDigestSummary({
    enabled: true,
    telemetryEvents: [
      { name: 'pro_entry_opened', ts: sevenDaysAgo + 10, props: { source: 'popup' } },
      { name: 'pro_entry_opened', ts: sevenDaysAgo + 20, props: { source: 'popup' } },
      { name: 'pro_waitlist_opened', ts: sevenDaysAgo + 30, props: { source: 'popup' } }
    ],
    now,
    lookbackDays: 7,
    maxEvents: 2
  });
  assert.equal(proWeeklyDigestTrim.overall.pro_entry_opened, 1);
  assert.equal(proWeeklyDigestTrim.overall.pro_waitlist_opened, 1);

  const proIntentCsvFilename = formatProIntentEvents7dCsvFilename(now);
  assert.ok(/^copylot-pro-intent-events-7d-\d{4}-\d{2}-\d{2}\.csv$/.test(proIntentCsvFilename));

  // pro-intent-by-campaign-csv.ts (pure functions + 7d window -> by campaign aggregation -> CSV)
  const proIntentByCampaignWindowA = buildProIntentEventsCsv({
    enabled: true,
    telemetryEvents: [],
    now,
    extensionVersion: '1.1.23',
    lookbackDays: 7
  });
  const proIntentByCampaignWindowB = buildProIntentByCampaignCsv({
    enabled: true,
    telemetryEvents: [],
    now,
    extensionVersion: '1.1.23',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(
    proIntentByCampaignWindowA.windowFrom,
    proIntentByCampaignWindowB.windowFrom,
    '7d windowFrom should match v1-51 pro intent events CSV export'
  );
  assert.equal(
    proIntentByCampaignWindowA.windowTo,
    proIntentByCampaignWindowB.windowTo,
    '7d windowTo should match v1-51 pro intent events CSV export'
  );

  const proDistributionByCampaignWindow = buildProDistributionByCampaignCsv({
    enabled: true,
    telemetryEvents: [],
    now,
    extensionVersion: '1.1.23',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(
    proIntentByCampaignWindowA.windowFrom,
    proDistributionByCampaignWindow.windowFrom,
    '7d windowFrom should match v1-51 pro intent events CSV export'
  );
  assert.equal(
    proIntentByCampaignWindowA.windowTo,
    proDistributionByCampaignWindow.windowTo,
    '7d windowTo should match v1-51 pro intent events CSV export'
  );

  const proIntentByCampaignDisabled = buildProIntentByCampaignCsv({
    enabled: false,
    telemetryEvents: [{ name: 'pro_entry_opened', ts: now, props: { source: 'popup', campaign: 'twitter' } }],
    now,
    extensionVersion: '1.1.23',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(proIntentByCampaignDisabled.enabled, false);
  assert.equal(proIntentByCampaignDisabled.disabledReason, 'anonymous_usage_data_disabled');
  assert.equal(proIntentByCampaignDisabled.rows.length, 0);
  assert.ok(!proIntentByCampaignDisabled.csv.startsWith('\uFEFF'));
  assert.equal(proIntentByCampaignDisabled.csv.trimEnd(), PRO_INTENT_BY_CAMPAIGN_CSV_COLUMNS.join(','));

  const proIntentByCampaign = buildProIntentByCampaignCsv({
    enabled: true,
    telemetryEvents: [
      { name: 'pro_entry_opened', ts: sevenDaysAgo, props: { source: 'popup', campaign: 'twitter' } }, // included (=from)
      { name: 'pro_waitlist_opened', ts: sevenDaysAgo + 1, props: { source: 'popup', campaign: 'twitter' } },
      { name: 'pro_waitlist_survey_copied', ts: now - 1000, props: { source: 'options', campaign: 'ph' } },
      { name: 'pro_waitlist_copied', ts: now, props: { source: 'options', campaign: 'ph' } }, // included (=to)
      { name: 'pro_waitlist_copied', ts: now - 500, props: { source: 'options' } }, // empty campaign bucket
      { name: 'pro_entry_opened', ts: sevenDaysAgo - 1, props: { source: 'options', campaign: 'twitter' } }, // excluded (<from)
      { name: 'pro_waitlist_opened', ts: now + 1, props: { source: 'options', campaign: 'twitter' } }, // excluded (>to)
      { name: 'popup_opened', ts: now },
      { name: 'pro_entry_opened', ts: now, props: { source: 'invalid', campaign: 'twitter' } } // excluded (bad source)
    ],
    now,
    extensionVersion: '1.1.23',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(proIntentByCampaign.enabled, true);
  assert.equal(proIntentByCampaign.windowFrom, sevenDaysAgo);
  assert.equal(proIntentByCampaign.windowTo, now);
  assert.equal(proIntentByCampaign.rows.length, 3);

  assert.equal(proIntentByCampaign.rows[0]?.campaign, 'ph');
  assert.equal(proIntentByCampaign.rows[0]?.proEntryOpened, 0);
  assert.equal(proIntentByCampaign.rows[0]?.proWaitlistOpened, 0);
  assert.equal(proIntentByCampaign.rows[0]?.proWaitlistCopied, 1);
  assert.equal(proIntentByCampaign.rows[0]?.proWaitlistSurveyCopied, 1);
  assert.equal(proIntentByCampaign.rows[0]?.leads, 2);

  assert.equal(proIntentByCampaign.rows[1]?.campaign, '空 campaign');
  assert.equal(proIntentByCampaign.rows[1]?.proWaitlistCopied, 1);
  assert.equal(proIntentByCampaign.rows[1]?.proWaitlistSurveyCopied, 0);
  assert.equal(proIntentByCampaign.rows[1]?.leads, 1);

  assert.equal(proIntentByCampaign.rows[2]?.campaign, 'twitter');
  assert.equal(proIntentByCampaign.rows[2]?.proEntryOpened, 1);
  assert.equal(proIntentByCampaign.rows[2]?.proWaitlistOpened, 1);
  assert.equal(proIntentByCampaign.rows[2]?.proWaitlistCopied, 0);
  assert.equal(proIntentByCampaign.rows[2]?.proWaitlistSurveyCopied, 0);
  assert.equal(proIntentByCampaign.rows[2]?.leads, 0);

  assert.ok(proIntentByCampaign.rows.every((row) => Number.isInteger(row.proEntryOpened)));
  assert.ok(proIntentByCampaign.rows.every((row) => Number.isInteger(row.leads)));
  assert.ok(!proIntentByCampaign.csv.startsWith('\uFEFF'));
  assert.equal(proIntentByCampaign.csv.split('\n')[0], PRO_INTENT_BY_CAMPAIGN_CSV_COLUMNS.join(','));
  assert.equal(proIntentByCampaign.csv.trim().split('\n').length, 1 + proIntentByCampaign.rows.length);

  const proIntentByCampaignCsvFilename = formatProIntentByCampaign7dCsvFilename(now);
  assert.ok(/^copylot-pro-intent-by-campaign-7d-\d{4}-\d{2}-\d{2}\.csv$/.test(proIntentByCampaignCsvFilename));

  // pro-distribution-by-campaign-csv.ts (pure functions + 7d window -> by campaign aggregation -> CSV)
  const proDistributionByCampaignDisabled = buildProDistributionByCampaignCsv({
    enabled: false,
    telemetryEvents: [
      { name: 'pro_distribution_asset_copied', ts: now, props: { source: 'options', campaign: 'twitter', action: 'waitlist_url' } }
    ],
    now,
    extensionVersion: '1.1.23',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(proDistributionByCampaignDisabled.enabled, false);
  assert.equal(proDistributionByCampaignDisabled.disabledReason, 'anonymous_usage_data_disabled');
  assert.equal(proDistributionByCampaignDisabled.rows.length, 0);
  assert.ok(!proDistributionByCampaignDisabled.csv.startsWith('\uFEFF'));
  assert.equal(proDistributionByCampaignDisabled.csv.trimEnd(), PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS.join(','));

  const proDistributionByCampaign = buildProDistributionByCampaignCsv({
    enabled: true,
    telemetryEvents: [
      { name: 'pro_distribution_asset_copied', ts: sevenDaysAgo, props: { source: 'options', campaign: 'twitter', action: 'waitlist_url' } }, // included (=from)
      { name: 'pro_distribution_asset_copied', ts: now - 1000, props: { source: 'options', campaign: 'ph', action: 'distribution_pack' } },
      { name: 'pro_distribution_asset_copied', ts: now, props: { source: 'options', campaign: 'twitter', action: 'store_url' } }, // included (=to)
      { name: 'pro_distribution_asset_copied', ts: now - 500, props: { source: 'options', action: 'recruit_copy' } }, // empty campaign bucket
      { name: 'pro_distribution_asset_copied', ts: sevenDaysAgo - 1, props: { source: 'options', campaign: 'twitter', action: 'waitlist_url' } }, // excluded (<from)
      { name: 'pro_distribution_asset_copied', ts: now + 1, props: { source: 'options', campaign: 'twitter', action: 'recruit_copy' } }, // excluded (>to)
      { name: 'pro_distribution_asset_copied', ts: now, props: { source: 'popup', campaign: 'twitter', action: 'waitlist_url' } }, // excluded (bad source)
      { name: 'popup_opened', ts: now }
    ],
    now,
    extensionVersion: '1.1.23',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(proDistributionByCampaign.enabled, true);
  assert.equal(proDistributionByCampaign.windowFrom, sevenDaysAgo);
  assert.equal(proDistributionByCampaign.windowTo, now);
  assert.equal(proDistributionByCampaign.rows.length, 3);

  assert.equal(proDistributionByCampaign.rows[0]?.campaign, 'twitter');
  assert.equal(proDistributionByCampaign.rows[0]?.waitlistUrlCopied, 1);
  assert.equal(proDistributionByCampaign.rows[0]?.recruitCopyCopied, 0);
  assert.equal(proDistributionByCampaign.rows[0]?.storeUrlCopied, 1);
  assert.equal(proDistributionByCampaign.rows[0]?.distributionPackCopied, 0);
  assert.equal(proDistributionByCampaign.rows[0]?.distCopies, 2);

  assert.equal(proDistributionByCampaign.rows[1]?.campaign, 'ph');
  assert.equal(proDistributionByCampaign.rows[1]?.waitlistUrlCopied, 0);
  assert.equal(proDistributionByCampaign.rows[1]?.recruitCopyCopied, 0);
  assert.equal(proDistributionByCampaign.rows[1]?.storeUrlCopied, 0);
  assert.equal(proDistributionByCampaign.rows[1]?.distributionPackCopied, 1);
  assert.equal(proDistributionByCampaign.rows[1]?.distCopies, 1);

  assert.equal(proDistributionByCampaign.rows[2]?.campaign, '空 campaign');
  assert.equal(proDistributionByCampaign.rows[2]?.waitlistUrlCopied, 0);
  assert.equal(proDistributionByCampaign.rows[2]?.recruitCopyCopied, 1);
  assert.equal(proDistributionByCampaign.rows[2]?.storeUrlCopied, 0);
  assert.equal(proDistributionByCampaign.rows[2]?.distributionPackCopied, 0);
  assert.equal(proDistributionByCampaign.rows[2]?.distCopies, 1);

  assert.ok(proDistributionByCampaign.rows.every((row) => Number.isInteger(row.distCopies)));
  assert.ok(!proDistributionByCampaign.csv.startsWith('\uFEFF'));
  assert.equal(proDistributionByCampaign.csv.split('\n')[0], PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS.join(','));
  assert.equal(proDistributionByCampaign.csv.trim().split('\n').length, 1 + proDistributionByCampaign.rows.length);

  const proDistributionByCampaignCsvFilename = formatProDistributionByCampaign7dCsvFilename(now);
  assert.ok(/^copylot-pro-distribution-by-campaign-7d-\d{4}-\d{2}-\d{2}\.csv$/.test(proDistributionByCampaignCsvFilename));

  // pro-acquisition-efficiency-by-campaign-csv.ts (pure functions + 7d window -> merge leads + distCopies by campaign -> CSV)
  const proAcqEfficiencyWindow = buildProAcquisitionEfficiencyByCampaignCsv({
    enabled: true,
    telemetryEvents: [],
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(
    proIntentByCampaignWindowA.windowFrom,
    proAcqEfficiencyWindow.windowFrom,
    '7d windowFrom should match v1-51/v1-54/v1-57 exports'
  );
  assert.equal(
    proIntentByCampaignWindowA.windowTo,
    proAcqEfficiencyWindow.windowTo,
    '7d windowTo should match v1-51/v1-54/v1-57 exports'
  );

  const proAcqEfficiencyDisabled = buildProAcquisitionEfficiencyByCampaignCsv({
    enabled: false,
    telemetryEvents: [
      { name: 'pro_waitlist_copied', ts: now, props: { source: 'options', campaign: 'twitter' } },
      { name: 'pro_distribution_asset_copied', ts: now, props: { source: 'options', campaign: 'twitter', action: 'waitlist_url' } }
    ],
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(proAcqEfficiencyDisabled.enabled, false);
  assert.equal(proAcqEfficiencyDisabled.disabledReason, 'anonymous_usage_data_disabled');
  assert.equal(proAcqEfficiencyDisabled.rows.length, 0);
  assert.ok(!proAcqEfficiencyDisabled.csv.startsWith('\uFEFF'));
  assert.equal(proAcqEfficiencyDisabled.csv.trimEnd(), PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_CSV_COLUMNS.join(','));

  const mergedEvents: unknown[] = [
    // leads: twitter=2, ph=1, empty=1
    { name: 'pro_waitlist_copied', ts: sevenDaysAgo, props: { source: 'options', campaign: 'twitter' } }, // included (=from)
    { name: 'pro_waitlist_survey_copied', ts: sevenDaysAgo + 1, props: { source: 'popup', campaign: 'twitter' } },
    { name: 'pro_waitlist_copied', ts: now - 1000, props: { source: 'options', campaign: 'ph' } },
    { name: 'pro_waitlist_copied', ts: now - 500, props: { source: 'options' } }, // empty campaign bucket
    // distCopies: twitter=4, ph=0, empty=2
    { name: 'pro_distribution_asset_copied', ts: sevenDaysAgo, props: { source: 'options', campaign: 'twitter', action: 'waitlist_url' } },
    { name: 'pro_distribution_asset_copied', ts: now - 900, props: { source: 'options', campaign: 'twitter', action: 'store_url' } },
    { name: 'pro_distribution_asset_copied', ts: now - 800, props: { source: 'options', campaign: 'twitter', action: 'recruit_copy' } },
    { name: 'pro_distribution_asset_copied', ts: now, props: { source: 'options', campaign: 'twitter', action: 'distribution_pack' } }, // included (=to)
    { name: 'pro_distribution_asset_copied', ts: now - 700, props: { source: 'options', action: 'distribution_pack' } }, // empty campaign bucket
    { name: 'pro_distribution_asset_copied', ts: now - 600, props: { source: 'options', action: 'waitlist_url' } }, // empty campaign bucket
    // excluded
    { name: 'pro_waitlist_copied', ts: sevenDaysAgo - 1, props: { source: 'options', campaign: 'twitter' } }, // <from
    { name: 'pro_distribution_asset_copied', ts: now + 1, props: { source: 'options', campaign: 'twitter', action: 'waitlist_url' } }, // >to
    { name: 'pro_distribution_asset_copied', ts: now, props: { source: 'popup', campaign: 'twitter', action: 'waitlist_url' } }, // bad source
    { name: 'popup_opened', ts: now }
  ];

  const proAcqEfficiency = buildProAcquisitionEfficiencyByCampaignCsv({
    enabled: true,
    telemetryEvents: mergedEvents,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(proAcqEfficiency.enabled, true);
  assert.equal(proAcqEfficiency.windowFrom, sevenDaysAgo);
  assert.equal(proAcqEfficiency.windowTo, now);
  assert.equal(proAcqEfficiency.rows.length, 3);

  const twitterMerged = proAcqEfficiency.rows.find((r) => r.campaign === 'twitter');
  const phMerged = proAcqEfficiency.rows.find((r) => r.campaign === 'ph');
  const emptyMerged = proAcqEfficiency.rows.find((r) => r.campaign === '空 campaign');
  assert.ok(twitterMerged, 'expected twitter row in merged acquisition efficiency export');
  assert.ok(phMerged, 'expected ph row in merged acquisition efficiency export');
  assert.ok(emptyMerged, 'expected empty campaign bucket row in merged acquisition efficiency export');

  assert.equal(twitterMerged?.leads, 2);
  assert.equal(twitterMerged?.distCopies, 4);
  assert.equal(twitterMerged?.leadsPerDistCopy, '0.5000');

  assert.equal(phMerged?.leads, 1);
  assert.equal(phMerged?.distCopies, 0);
  assert.equal(phMerged?.leadsPerDistCopy, 'N/A');

  assert.equal(emptyMerged?.leads, 1);
  assert.equal(emptyMerged?.distCopies, 2);
  assert.equal(emptyMerged?.leadsPerDistCopy, '0.5000');

  // Alignment proof: leads/distCopies should match v1-54 + v1-57 exports for the same window/events.
  const intentAligned = buildProIntentByCampaignCsv({
    enabled: true,
    telemetryEvents: mergedEvents,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  const distAligned = buildProDistributionByCampaignCsv({
    enabled: true,
    telemetryEvents: mergedEvents,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });

  for (const row of proAcqEfficiency.rows) {
    const intentRow = intentAligned.rows.find((r) => r.campaign === row.campaign);
    const distRow = distAligned.rows.find((r) => r.campaign === row.campaign);
    assert.equal(
      row.leads,
      intentRow?.leads ?? 0,
      `merged leads should match v1-54 pro-intent-by-campaign for campaign=${row.campaign}`
    );
    assert.equal(
      row.distCopies,
      distRow?.distCopies ?? 0,
      `merged distCopies should match v1-57 pro-distribution-by-campaign for campaign=${row.campaign}`
    );
  }

  assert.ok(proAcqEfficiency.rows.every((row) => Number.isInteger(row.leads)));
  assert.ok(proAcqEfficiency.rows.every((row) => Number.isInteger(row.distCopies)));
  assert.ok(!proAcqEfficiency.csv.startsWith('\uFEFF'));
  assert.equal(proAcqEfficiency.csv.split('\n')[0], PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_CSV_COLUMNS.join(','));
  assert.equal(proAcqEfficiency.csv.trim().split('\n').length, 1 + proAcqEfficiency.rows.length);

  const proAcqEfficiencyCsvFilename = formatProAcquisitionEfficiencyByCampaign7dCsvFilename(now);
  assert.ok(
    /^copylot-pro-acquisition-efficiency-by-campaign-7d-\d{4}-\d{2}-\d{2}\.csv$/.test(proAcqEfficiencyCsvFilename)
  );

  // pro-acquisition-efficiency-by-campaign-evidence-pack-filename.ts (pure functions, stable download filename)
  const d = new Date(now);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const expectedDate = `${yyyy}-${mm}-${dd}`;

  const evidenceFilenameOff = formatProAcquisitionEfficiencyByCampaignEvidencePackJsonFilename(now, false);
  assert.equal(
    evidenceFilenameOff,
    `copylot-pro-acq-eff-by-campaign-evidence-pack-${expectedDate}.off.json`
  );
  assert.ok(
    /^copylot-pro-acq-eff-by-campaign-evidence-pack-\d{4}-\d{2}-\d{2}\.off\.json$/.test(evidenceFilenameOff)
  );

  const evidenceFilenameOn = formatProAcquisitionEfficiencyByCampaignEvidencePackJsonFilename(now, true);
  assert.equal(
    evidenceFilenameOn,
    `copylot-pro-acq-eff-by-campaign-evidence-pack-${expectedDate}.on.json`
  );
  assert.ok(
    /^copylot-pro-acq-eff-by-campaign-evidence-pack-\d{4}-\d{2}-\d{2}\.on\.json$/.test(evidenceFilenameOn)
  );
  assert.ok(!evidenceFilenameOn.includes('twitter'));

  // pro-weekly-channel-ops-evidence-pack-filename.ts (pure functions, stable download filename)
  const weeklyOpsFilenameOff = formatProWeeklyChannelOpsEvidencePackJsonFilename(now, false);
  assert.equal(
    weeklyOpsFilenameOff,
    `copylot-pro-weekly-channel-ops-evidence-pack-${expectedDate}.off.json`
  );
  assert.ok(
    /^copylot-pro-weekly-channel-ops-evidence-pack-\d{4}-\d{2}-\d{2}\.off\.json$/.test(weeklyOpsFilenameOff)
  );

  const weeklyOpsFilenameOn = formatProWeeklyChannelOpsEvidencePackJsonFilename(now, true);
  assert.equal(
    weeklyOpsFilenameOn,
    `copylot-pro-weekly-channel-ops-evidence-pack-${expectedDate}.on.json`
  );
  assert.ok(
    /^copylot-pro-weekly-channel-ops-evidence-pack-\d{4}-\d{2}-\d{2}\.on\.json$/.test(weeklyOpsFilenameOn)
  );
  assert.ok(!weeklyOpsFilenameOn.includes('twitter'));

  // pro-acquisition-efficiency-by-campaign-weekly-report.ts (pure functions + markdown formatter)
  const proAcqEffWeeklyReportDisabled = buildProAcquisitionEfficiencyByCampaignWeeklyReportSummary({
    enabled: false,
    telemetryEvents: mergedEvents,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(proAcqEffWeeklyReportDisabled.enabled, false);
  assert.equal(proAcqEffWeeklyReportDisabled.disabledReason, 'anonymous_usage_data_disabled');
  assert.equal(proAcqEffWeeklyReportDisabled.rows.length, 0);

  const proAcqEffWeeklyReportDisabledMd = formatProAcquisitionEfficiencyByCampaignWeeklyReportMarkdown({
    summary: proAcqEffWeeklyReportDisabled,
    env: {
      extensionVersion: '1.1.28',
      exportedAt: now,
      isAnonymousUsageDataEnabled: false
    },
    getMessage
  });
  assert.ok(proAcqEffWeeklyReportDisabledMd.includes('匿名使用数据关闭'));
  assert.ok(!proAcqEffWeeklyReportDisabledMd.includes('| campaign |'));

  const proAcqEffWeeklyReport = buildProAcquisitionEfficiencyByCampaignWeeklyReportSummary({
    enabled: true,
    telemetryEvents: mergedEvents,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(proAcqEffWeeklyReport.enabled, true);
  assert.equal(proAcqEffWeeklyReport.windowFrom, proAcqEfficiency.windowFrom);
  assert.equal(proAcqEffWeeklyReport.windowTo, proAcqEfficiency.windowTo);
  assert.equal(proAcqEffWeeklyReport.rows.length, proAcqEfficiency.rows.length);

  for (const row of proAcqEffWeeklyReport.rows) {
    const csvRow = proAcqEfficiency.rows.find((r) => r.campaign === row.campaign);
    assert.ok(csvRow, `expected campaign row in weekly report summary: ${row.campaign}`);
    assert.equal(row.leads, csvRow?.leads ?? 0);
    assert.equal(row.distCopies, csvRow?.distCopies ?? 0);
    assert.equal(row.leadsPerDistCopy, csvRow?.leadsPerDistCopy ?? 'N/A');
  }

  const proAcqEffWeeklyReportMd = formatProAcquisitionEfficiencyByCampaignWeeklyReportMarkdown({
    summary: proAcqEffWeeklyReport,
    env: {
      extensionVersion: '1.1.28',
      exportedAt: now,
      isAnonymousUsageDataEnabled: true
    },
    getMessage
  });
  assert.ok(
    proAcqEffWeeklyReportMd.includes('| campaign | leads | distCopies | leadsPerDistCopy |'),
    'weekly acquisition efficiency report markdown table header should be stable'
  );
  assert.ok(proAcqEffWeeklyReportMd.includes('| twitter | 2 | 4 | 0.5000 |'));
  assert.ok(proAcqEffWeeklyReportMd.includes('| 空 campaign | 1 | 2 | 0.5000 |'));
  assert.ok(proAcqEffWeeklyReportMd.includes('| ph | 1 | 0 | N/A |'));
  assert.ok(proAcqEffWeeklyReportMd.indexOf('| twitter |') < proAcqEffWeeklyReportMd.indexOf('| 空 campaign |'));
  assert.ok(proAcqEffWeeklyReportMd.indexOf('| 空 campaign |') < proAcqEffWeeklyReportMd.indexOf('| ph |'));
  assert.ok(proAcqEffWeeklyReportMd.includes('Top1 campaign（按 leadsPerDistCopy）：twitter'));
  assert.ok(proAcqEffWeeklyReportMd.includes('Top1 指标：leads=2 distCopies=4 leadsPerDistCopy=0.5000'));
  assert.ok(proAcqEffWeeklyReportMd.includes('空 campaign leads 占比：25.00%'));

  // pro-acquisition-efficiency-by-campaign-evidence-pack.ts (pure functions + stable JSON formatter)
  const telemetryAccessTrap = new Proxy([], {
    get() {
      throw new Error('telemetryEvents should not be accessed when anonymous usage data is OFF');
    }
  });
  const proAcqEffEvidenceOff = buildProAcquisitionEfficiencyByCampaignEvidencePack({
    enabled: false,
    telemetryEvents: telemetryAccessTrap,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7,
    getMessage
  });
  assert.equal(proAcqEffEvidenceOff.enabled, false);
  assert.equal(proAcqEffEvidenceOff.disabledReason, 'anonymous_usage_data_disabled');
  assert.ok(proAcqEffEvidenceOff.telemetryOffNotice?.includes('匿名使用数据关闭'));
  assert.equal(proAcqEffEvidenceOff.env.windowFrom, sevenDaysAgo);
  assert.equal(proAcqEffEvidenceOff.env.windowTo, now);
  assert.equal(proAcqEffEvidenceOff.env.isAnonymousUsageDataEnabled, false);
  assert.equal(proAcqEffEvidenceOff.rows.length, 0);
  assert.equal(proAcqEffEvidenceOff.csv.trimEnd(), PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_CSV_COLUMNS.join(','));
  assert.ok(proAcqEffEvidenceOff.weeklyReportMarkdown.includes('匿名使用数据关闭'));
  assert.ok(!proAcqEffEvidenceOff.weeklyReportMarkdown.includes('| campaign |'));

  const proAcqEffEvidenceOffJson = formatProAcquisitionEfficiencyByCampaignEvidencePackAsJson(proAcqEffEvidenceOff);
  assert.ok(proAcqEffEvidenceOffJson.endsWith('\n'));
  const proAcqEffEvidenceOffParsed = JSON.parse(proAcqEffEvidenceOffJson) as Record<string, unknown>;
  assert.deepEqual(Object.keys(proAcqEffEvidenceOffParsed), [
    'enabled',
    'disabledReason',
    'telemetryOffNotice',
    'env',
    'rows',
    'csv',
    'weeklyReportMarkdown'
  ]);

  const proAcqEffEvidenceOn = buildProAcquisitionEfficiencyByCampaignEvidencePack({
    enabled: true,
    telemetryEvents: mergedEvents,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7,
    getMessage
  });
  assert.equal(proAcqEffEvidenceOn.enabled, true);
  assert.equal(proAcqEffEvidenceOn.disabledReason, null);
  assert.equal(proAcqEffEvidenceOn.telemetryOffNotice, null);
  assert.equal(proAcqEffEvidenceOn.env.windowFrom, proAcqEfficiency.windowFrom);
  assert.equal(proAcqEffEvidenceOn.env.windowTo, proAcqEfficiency.windowTo);
  assert.equal(proAcqEffEvidenceOn.env.isAnonymousUsageDataEnabled, true);
  assert.equal(proAcqEffEvidenceOn.rows.length, proAcqEfficiency.rows.length);
  assert.equal(proAcqEffEvidenceOn.rows[0]?.campaign, 'twitter');
  assert.equal(proAcqEffEvidenceOn.rows[1]?.campaign, '空 campaign');
  assert.equal(proAcqEffEvidenceOn.rows[2]?.campaign, 'ph');
  assert.equal(proAcqEffEvidenceOn.rows[0]?.leadsPerDistCopy, '0.5000');
  assert.equal(proAcqEffEvidenceOn.rows[2]?.leadsPerDistCopy, 'N/A');

  // mutual verification: evidence rows <-> v1-58 CSV rows
  for (const row of proAcqEffEvidenceOn.rows) {
    const csvRow = proAcqEfficiency.rows.find((r) => r.campaign === row.campaign);
    assert.ok(csvRow, `expected campaign row in v1-58 CSV rows: ${row.campaign}`);
    assert.equal(row.leads, csvRow?.leads ?? 0);
    assert.equal(row.distCopies, csvRow?.distCopies ?? 0);
    assert.equal(row.leadsPerDistCopy, csvRow?.leadsPerDistCopy ?? 'N/A');
  }

  // mutual verification: evidence rows <-> CSV string
  const evidenceCsvLines = proAcqEffEvidenceOn.csv.trim().split('\n');
  assert.equal(evidenceCsvLines[0], PRO_ACQUISITION_EFFICIENCY_BY_CAMPAIGN_CSV_COLUMNS.join(','));
  assert.equal(evidenceCsvLines.length - 1, proAcqEffEvidenceOn.rows.length);
  for (const line of evidenceCsvLines.slice(1)) {
    const [exportedAtStr, extV, fromStr, toStr, lookbackStr, campaign, leadsStr, distCopiesStr, leadsPerDistCopy] =
      line.split(',');
    assert.equal(Number(exportedAtStr), proAcqEffEvidenceOn.env.exportedAt);
    assert.equal(extV, proAcqEffEvidenceOn.env.extensionVersion);
    assert.equal(Number(fromStr), proAcqEffEvidenceOn.env.windowFrom);
    assert.equal(Number(toStr), proAcqEffEvidenceOn.env.windowTo);
    assert.equal(Number(lookbackStr), proAcqEffEvidenceOn.env.lookbackDays);
    const row = proAcqEffEvidenceOn.rows.find((r) => r.campaign === campaign);
    assert.ok(row, `expected campaign row in evidence pack rows: ${campaign}`);
    assert.equal(Number(leadsStr), row?.leads ?? 0);
    assert.equal(Number(distCopiesStr), row?.distCopies ?? 0);
    assert.equal(leadsPerDistCopy, row?.leadsPerDistCopy ?? 'N/A');
  }

  // mutual verification: evidence rows <-> weeklyReportMarkdown table
  const mdTableLines = proAcqEffEvidenceOn.weeklyReportMarkdown
    .split('\n')
    .filter((line) => line.startsWith('| ') && !line.includes('---') && !line.startsWith('| campaign |'));
  assert.equal(mdTableLines.length, proAcqEffEvidenceOn.rows.length);
  for (const line of mdTableLines) {
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    const [campaign, leadsStr, distCopiesStr, leadsPerDistCopy] = cells;
    const row = proAcqEffEvidenceOn.rows.find((r) => r.campaign === campaign);
    assert.ok(row, `expected campaign row in evidence pack rows: ${campaign}`);
    assert.equal(Number(leadsStr), row?.leads ?? 0);
    assert.equal(Number(distCopiesStr), row?.distCopies ?? 0);
    assert.equal(leadsPerDistCopy, row?.leadsPerDistCopy ?? 'N/A');
  }

  const proAcqEffEvidenceOnJson = formatProAcquisitionEfficiencyByCampaignEvidencePackAsJson(proAcqEffEvidenceOn);
  const proAcqEffEvidenceOnParsed = JSON.parse(proAcqEffEvidenceOnJson) as Record<string, unknown>;
  assert.deepEqual(Object.keys(proAcqEffEvidenceOnParsed), [
    'enabled',
    'disabledReason',
    'telemetryOffNotice',
    'env',
    'rows',
    'csv',
    'weeklyReportMarkdown'
  ]);
  assert.ok(
    String(proAcqEffEvidenceOnParsed.weeklyReportMarkdown || '').includes('| campaign | leads | distCopies | leadsPerDistCopy |'),
    'evidence pack should embed weekly report markdown for audit and mutual verification'
  );

  // pro-weekly-channel-ops-evidence-pack.ts (pure functions + stable JSON formatter)
  const proWeeklyOpsOff = buildProWeeklyChannelOpsEvidencePack({
    enabled: false,
    telemetryEvents: telemetryAccessTrap,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7,
    getMessage
  });
  assert.equal(proWeeklyOpsOff.packVersion, 'v1-63');
  assert.equal(proWeeklyOpsOff.enabled, false);
  assert.equal(proWeeklyOpsOff.disabledReason, 'anonymous_usage_data_disabled');
  assert.ok(proWeeklyOpsOff.telemetryOffNotice?.includes('匿名使用数据关闭'));
  assert.equal(proWeeklyOpsOff.env.windowFrom, sevenDaysAgo);
  assert.equal(proWeeklyOpsOff.env.windowTo, now);
  assert.equal(proWeeklyOpsOff.env.isAnonymousUsageDataEnabled, false);
  assert.equal(proWeeklyOpsOff.assets.acquisitionEfficiencyEvidencePack.enabled, false);
  assert.equal(proWeeklyOpsOff.assets.acquisitionEfficiencyEvidencePack.rows.length, 0);
  assert.equal(
    proWeeklyOpsOff.assets.proDistributionByCampaign7dCsv.trimEnd(),
    PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS.join(',')
  );
  assert.equal(proWeeklyOpsOff.assets.proIntentEvents7dCsv.trimEnd(), PRO_INTENT_EVENTS_CSV_COLUMNS.join(','));
  assert.ok(proWeeklyOpsOff.assets.verifyMarkdown.includes('互证'));

  const proWeeklyOpsOffJson = formatProWeeklyChannelOpsEvidencePackAsJson(proWeeklyOpsOff);
  assert.ok(proWeeklyOpsOffJson.endsWith('\n'));
  const proWeeklyOpsOffParsed = JSON.parse(proWeeklyOpsOffJson) as Record<string, unknown>;
  assert.deepEqual(Object.keys(proWeeklyOpsOffParsed), [
    'packVersion',
    'enabled',
    'disabledReason',
    'telemetryOffNotice',
    'env',
    'assets'
  ]);
  const proWeeklyOpsOffAssetsParsed = proWeeklyOpsOffParsed.assets as Record<string, unknown>;
  assert.deepEqual(Object.keys(proWeeklyOpsOffAssetsParsed), [
    'acquisitionEfficiencyEvidencePack',
    'proDistributionByCampaign7dCsv',
    'proIntentEvents7dCsv',
    'verifyMarkdown'
  ]);

  const proWeeklyOpsOn = buildProWeeklyChannelOpsEvidencePack({
    enabled: true,
    telemetryEvents: mergedEvents,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7,
    getMessage
  });
  assert.equal(proWeeklyOpsOn.packVersion, 'v1-63');
  assert.equal(proWeeklyOpsOn.enabled, true);
  assert.equal(proWeeklyOpsOn.disabledReason, null);
  assert.equal(proWeeklyOpsOn.telemetryOffNotice, null);
  assert.equal(proWeeklyOpsOn.env.windowFrom, sevenDaysAgo);
  assert.equal(proWeeklyOpsOn.env.windowTo, now);
  assert.equal(proWeeklyOpsOn.env.isAnonymousUsageDataEnabled, true);

  const proWeeklyOpsOnAcqAligned = buildProAcquisitionEfficiencyByCampaignEvidencePack({
    enabled: true,
    telemetryEvents: mergedEvents,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7,
    getMessage
  });
  assert.deepEqual(proWeeklyOpsOn.assets.acquisitionEfficiencyEvidencePack.rows, proWeeklyOpsOnAcqAligned.rows);
  assert.equal(proWeeklyOpsOn.assets.acquisitionEfficiencyEvidencePack.csv, proWeeklyOpsOnAcqAligned.csv);
  assert.equal(
    proWeeklyOpsOn.assets.acquisitionEfficiencyEvidencePack.weeklyReportMarkdown,
    proWeeklyOpsOnAcqAligned.weeklyReportMarkdown
  );

  const proWeeklyOpsOnDistAligned = buildProDistributionByCampaignCsv({
    enabled: true,
    telemetryEvents: mergedEvents,
    now,
    extensionVersion: '1.1.28',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(proWeeklyOpsOn.assets.proDistributionByCampaign7dCsv, proWeeklyOpsOnDistAligned.csv);

  const proWeeklyOpsOnIntentEventsAligned = buildProIntentEventsCsv({
    enabled: true,
    telemetryEvents: mergedEvents,
    now,
    extensionVersion: '1.1.28',
    lookbackDays: 7
  });
  assert.equal(proWeeklyOpsOn.assets.proIntentEvents7dCsv, proWeeklyOpsOnIntentEventsAligned.csv);

  // mutual verification: leadsPerDistCopy can be recomputed from rows
  for (const row of proWeeklyOpsOn.assets.acquisitionEfficiencyEvidencePack.rows) {
    const expected = row.distCopies <= 0 ? 'N/A' : (row.leads / row.distCopies).toFixed(4);
    assert.equal(row.leadsPerDistCopy, expected);
  }

  // mutual verification: distCopies totals should match v1-57 CSV (sum of distCopies column)
  const distLines = proWeeklyOpsOn.assets.proDistributionByCampaign7dCsv.trim().split('\n');
  assert.equal(distLines[0], PRO_DISTRIBUTION_BY_CAMPAIGN_CSV_COLUMNS.join(','));
  let distCopiesSum = 0;
  const distByCampaign: Record<string, number> = {};
  for (const line of distLines.slice(1)) {
    const cells = line.split(',');
    const campaign = cells[5] || '';
    const distCopies = Number(cells[10] || 0);
    distCopiesSum += distCopies;
    distByCampaign[campaign] = distCopies;
  }
  const rowsDistCopiesSum = proWeeklyOpsOn.assets.acquisitionEfficiencyEvidencePack.rows.reduce(
    (acc, row) => acc + row.distCopies,
    0
  );
  assert.equal(rowsDistCopiesSum, distCopiesSum);
  for (const row of proWeeklyOpsOn.assets.acquisitionEfficiencyEvidencePack.rows) {
    assert.equal(row.distCopies, distByCampaign[row.campaign] ?? 0);
  }

  // mutual verification: leads totals should match v1-51 event CSV (count lead events)
  const intentLines = proWeeklyOpsOn.assets.proIntentEvents7dCsv.trim().split('\n');
  assert.equal(intentLines[0], PRO_INTENT_EVENTS_CSV_COLUMNS.join(','));
  let leadsFromEvents = 0;
  for (const line of intentLines.slice(1)) {
    const cells = line.split(',');
    const eventName = cells[7] || '';
    if (eventName === 'pro_waitlist_copied' || eventName === 'pro_waitlist_survey_copied') leadsFromEvents += 1;
  }
  const rowsLeadsSum = proWeeklyOpsOn.assets.acquisitionEfficiencyEvidencePack.rows.reduce((acc, row) => acc + row.leads, 0);
  assert.equal(rowsLeadsSum, leadsFromEvents);

  const proWeeklyOpsOnJson = formatProWeeklyChannelOpsEvidencePackAsJson(proWeeklyOpsOn);
  const proWeeklyOpsOnParsed = JSON.parse(proWeeklyOpsOnJson) as Record<string, unknown>;
  assert.deepEqual(Object.keys(proWeeklyOpsOnParsed), [
    'packVersion',
    'enabled',
    'disabledReason',
    'telemetryOffNotice',
    'env',
    'assets'
  ]);
  assert.ok(
    String((proWeeklyOpsOnParsed.assets as Record<string, unknown>)?.verifyMarkdown || '').includes('leadsPerDistCopy'),
    'weekly channel ops evidence pack should embed minimal mutual-verification markdown'
  );

  // build-weekly-channel-ops-trend.ts（fixture -> 可重复生成的 index.md + trend.csv）
  const weeklyOpsTrendTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copylot-weekly-ops-trend-'));
  const weeklyOpsTrendFixture = path.join(
    process.cwd(),
    'docs/evidence/v1-64/copylot-pro-weekly-channel-ops-evidence-pack-2026-03-21.on.json'
  );
  const weeklyOpsTrendFixtureName = path.basename(weeklyOpsTrendFixture);
  await fs.copyFile(weeklyOpsTrendFixture, path.join(weeklyOpsTrendTmpDir, weeklyOpsTrendFixtureName));

  const { indexMarkdown: weeklyOpsIndex1, trendCsv: weeklyOpsCsv1 } = await buildWeeklyChannelOpsTrend(weeklyOpsTrendTmpDir);
  const weeklyOpsIndexFile1 = await fs.readFile(path.join(weeklyOpsTrendTmpDir, 'index.md'), 'utf8');
  const weeklyOpsCsvFile1 = await fs.readFile(path.join(weeklyOpsTrendTmpDir, 'trend.csv'), 'utf8');
  assert.equal(weeklyOpsIndexFile1, weeklyOpsIndex1);
  assert.equal(weeklyOpsCsvFile1, weeklyOpsCsv1);
  assert.ok(
    weeklyOpsCsvFile1.includes('weekEndDate,distCopies,leads,leadsPerDistCopy,campaignsCount,nonEmptyCampaignsCount\n'),
    'trend.csv header should be stable'
  );
  assert.ok(
    weeklyOpsCsvFile1.includes('2026-03-21,4,4,1.0000,4,3\n'),
    'trend.csv should compute weekly totals and fixed 4-decimal leadsPerDistCopy'
  );
  assert.ok(
    weeklyOpsIndexFile1.includes('| cpc_control | 0 | 1 | N/A |'),
    'distCopies=0 should render as N/A in baseline table'
  );
  assert.ok(
    weeklyOpsIndexFile1.includes('| cpc_test_a | 2 | 1 | 0.5000 |'),
    'leadsPerDistCopy should keep 4 decimals in baseline table'
  );

  const { indexMarkdown: weeklyOpsIndex2, trendCsv: weeklyOpsCsv2 } = await buildWeeklyChannelOpsTrend(weeklyOpsTrendTmpDir);
  assert.equal(weeklyOpsIndex2, weeklyOpsIndex1);
  assert.equal(weeklyOpsCsv2, weeklyOpsCsv1);
  assert.equal(await fs.readFile(path.join(weeklyOpsTrendTmpDir, 'index.md'), 'utf8'), weeklyOpsIndex1);
  assert.equal(await fs.readFile(path.join(weeklyOpsTrendTmpDir, 'trend.csv'), 'utf8'), weeklyOpsCsv1);

  // pro-intent-by-campaign-weekly-report.ts (pure functions + markdown formatter)
  const proIntentByCampaignWeeklyReportDisabled = buildProIntentByCampaignWeeklyReportSummary({
    enabled: false,
    telemetryEvents: [{ name: 'pro_entry_opened', ts: now, props: { source: 'popup', campaign: 'twitter' } }],
    now,
    extensionVersion: '1.1.23',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  const proIntentByCampaignWeeklyReportDisabledMd = formatProIntentByCampaignWeeklyReportMarkdown({
    summary: proIntentByCampaignWeeklyReportDisabled,
    env: {
      extensionVersion: '1.1.23',
      exportedAt: now,
      isAnonymousUsageDataEnabled: false
    },
    getMessage
  });
  assert.ok(proIntentByCampaignWeeklyReportDisabledMd.includes('匿名使用数据关闭（无可用事件）'));
  assert.ok(!proIntentByCampaignWeeklyReportDisabledMd.includes('| campaign |'));
  assert.ok(!proIntentByCampaignWeeklyReportDisabledMd.includes('pro_entry_opened |'));

  const proIntentByCampaignWeeklyReportEmpty = buildProIntentByCampaignWeeklyReportSummary({
    enabled: true,
    telemetryEvents: [],
    now,
    extensionVersion: '1.1.23',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });
  assert.equal(proIntentByCampaignWeeklyReportEmpty.enabled, true);
  assert.equal(proIntentByCampaignWeeklyReportEmpty.rows.length, 1);
  assert.equal(proIntentByCampaignWeeklyReportEmpty.rows[0]?.campaign, '空 campaign');

  const proIntentByCampaignWeeklyReport = buildProIntentByCampaignWeeklyReportSummary({
    enabled: true,
    telemetryEvents: [
      // twitter
      { name: 'pro_entry_opened', ts: now - 1000, props: { source: 'options', campaign: 'twitter' } },
      { name: 'pro_entry_opened', ts: now - 999, props: { source: 'options', campaign: 'twitter' } },
      { name: 'pro_waitlist_opened', ts: now - 998, props: { source: 'options', campaign: 'twitter' } },
      { name: 'pro_waitlist_copied', ts: now - 997, props: { source: 'options', campaign: 'twitter' } },
      // xhs
      { name: 'pro_entry_opened', ts: now - 900, props: { source: 'options', campaign: 'xhs' } },
      { name: 'pro_waitlist_opened', ts: now - 899, props: { source: 'options', campaign: 'xhs' } },
      { name: 'pro_waitlist_survey_copied', ts: now - 898, props: { source: 'options', campaign: 'xhs' } },
      // ads (denominator=0 -> N/A)
      { name: 'pro_waitlist_copied', ts: now - 800, props: { source: 'options', campaign: 'ads' } },
      // empty campaign bucket (missing/empty string)
      { name: 'pro_entry_opened', ts: now - 700, props: { source: 'options', campaign: '' } }
    ],
    now,
    extensionVersion: '1.1.23',
    emptyCampaignBucketLabel: '空 campaign',
    lookbackDays: 7
  });

  const twitterRow = proIntentByCampaignWeeklyReport.rows.find((r) => r.campaign === 'twitter');
  assert.ok(twitterRow, 'expected twitter row in weekly report summary');
  assert.equal(
    twitterRow?.leads,
    (twitterRow?.pro_waitlist_copied || 0) + (twitterRow?.pro_waitlist_survey_copied || 0),
    'leads should equal pro_waitlist_copied + pro_waitlist_survey_copied'
  );
  assert.equal(twitterRow?.leads_per_entry_opened, 0.5);

  const adsRow = proIntentByCampaignWeeklyReport.rows.find((r) => r.campaign === 'ads');
  assert.ok(adsRow, 'expected ads row in weekly report summary');
  assert.equal(adsRow?.leads_per_entry_opened, null, 'leads_per_entry_opened should be N/A when denominator=0');

  const emptyRow = proIntentByCampaignWeeklyReport.rows.find((r) => r.campaign === '空 campaign');
  assert.ok(emptyRow, 'expected empty campaign bucket row in weekly report summary');
  assert.equal(emptyRow?.pro_entry_opened, 1);

  const proIntentByCampaignWeeklyReportMd = formatProIntentByCampaignWeeklyReportMarkdown({
    summary: proIntentByCampaignWeeklyReport,
    env: {
      extensionVersion: '1.1.23',
      exportedAt: now,
      isAnonymousUsageDataEnabled: true
    },
    getMessage
  });
  assert.ok(
    proIntentByCampaignWeeklyReportMd.includes(
      '| campaign | pro_entry_opened | pro_waitlist_opened | pro_waitlist_copied | pro_waitlist_survey_copied | leads | leads_per_entry_opened |'
    ),
    'weekly report markdown table header should be stable'
  );
  assert.ok(proIntentByCampaignWeeklyReportMd.includes('| twitter | 2 | 1 | 1 | 0 | 1 | 0.5 |'));
  assert.ok(proIntentByCampaignWeeklyReportMd.includes('| xhs | 1 | 1 | 0 | 1 | 1 | 1 |'));
  assert.ok(proIntentByCampaignWeeklyReportMd.includes('| ads | 0 | 0 | 1 | 0 | 1 | N/A |'));
  assert.ok(proIntentByCampaignWeeklyReportMd.includes('| 空 campaign | 1 | 0 | 0 | 0 | 0 | 0 |'));

  // wom-summary.ts (pure functions)
  const womSummaryDisabled = buildWomSummary({
    enabled: false,
    telemetryEvents: [{ name: 'wom_share_opened', ts: now, props: { source: 'popup' } }]
  });
  assert.equal(womSummaryDisabled.enabled, false);
  assert.equal(womSummaryDisabled.disabledReason, 'anonymous_usage_data_disabled');
  assert.equal(womSummaryDisabled.bySource.popup.counts.wom_share_opened, 0);
  assert.equal(womSummaryDisabled.bySource.rating_prompt.counts.rating_prompt_shown, 0);

  const womSummary = buildWomSummary({
    enabled: true,
    telemetryEvents: [
      { name: 'wom_share_opened', ts: 10, props: { source: 'popup' } },
      { name: 'wom_share_copied', ts: 20, props: { source: 'popup' } },
      { name: 'wom_rate_opened', ts: 90, props: { source: 'popup' } },
      { name: 'wom_share_opened', ts: 30, props: { source: 'options' } },
      { name: 'wom_share_copied', ts: 40, props: { source: 'options' } },
      { name: 'rating_prompt_shown', ts: 50, props: { source: 'rating_prompt' } },
      { name: 'rating_prompt_action', ts: 60, props: { source: 'rating_prompt', action: 'rate' } },
      { name: 'rating_prompt_action', ts: 70, props: { source: 'rating_prompt', action: 'later' } },
      { name: 'popup_opened', ts: 80 },
      { name: 'wom_share_opened', ts: 100, props: { source: 'unknown' } }
    ]
  });
  assert.equal(womSummary.enabled, true);
  assert.equal(womSummary.window.maxEvents, TELEMETRY_MAX_EVENTS);
  assert.equal(womSummary.bySource.popup.counts.wom_share_opened, 1);
  assert.equal(womSummary.bySource.popup.counts.wom_share_copied, 1);
  assert.equal(womSummary.bySource.popup.counts.wom_rate_opened, 1);
  assert.equal(womSummary.bySource.popup.lastTs.wom_rate_opened, 90);
  assert.equal(womSummary.bySource.popup.rates.share_copied_per_share_opened, 1);
  assert.equal(womSummary.bySource.popup.rates.rating_prompt_rate_clicked_per_prompt_shown, null);
  assert.equal(womSummary.bySource.options.rates.share_copied_per_share_opened, 1);
  assert.equal(womSummary.bySource.rating_prompt.counts.rating_prompt_shown, 1);
  assert.equal(womSummary.bySource.rating_prompt.counts.rating_prompt_action, 2);
  assert.equal(womSummary.bySource.rating_prompt.rates.rating_prompt_rate_clicked_per_prompt_shown, 1);

  const womPack = buildWomEvidencePack({
    exportedAt: 123,
    extensionVersion: '1.1.20',
    settings: { ...settings, isAnonymousUsageDataEnabled: true },
    telemetryEvents: [
      { name: 'wom_share_opened', ts: now, props: { source: 'popup', url: 'https://example.com' } },
      { name: 'rating_prompt_shown', ts: now + 1, props: { source: 'rating_prompt', extra: 'x' } },
      {
        name: 'rating_prompt_action',
        ts: now + 2,
        props: { source: 'rating_prompt', action: 'rate', foo: 'bar' }
      },
      { name: 'popup_opened', ts: now + 3 },
      { name: 'unknown', ts: now + 4 }
    ]
  });
  assert.deepEqual(Object.keys(womPack).sort(), ['events', 'meta', 'settings', 'womSummary']);
  assert.deepEqual(Object.keys(womPack.meta).sort(), ['exportedAt', 'extensionVersion', 'source']);
  assert.deepEqual(Object.keys(womPack.settings).sort(), ['isAnonymousUsageDataEnabled']);
  assert.equal(womPack.settings.isAnonymousUsageDataEnabled, true);
  assert.equal(womPack.events.length, 3);
  assert.deepEqual(
    womPack.events.map((e) => e.name),
    ['wom_share_opened', 'rating_prompt_shown', 'rating_prompt_action']
  );
  assert.deepEqual(Object.keys(womPack.events[0]?.props || {}).sort(), ['source']);
  assert.deepEqual(Object.keys(womPack.events[1]?.props || {}).sort(), ['source']);
  assert.deepEqual(Object.keys(womPack.events[2]?.props || {}).sort(), ['action', 'source']);

  const womPackTelemetryOff = buildWomEvidencePack({
    exportedAt: 1,
    extensionVersion: '1.1.20',
    settings: { ...settings, isAnonymousUsageDataEnabled: false },
    telemetryEvents: [{ name: 'wom_share_opened', ts: now, props: { source: 'popup' } }]
  });
  assert.equal(womPackTelemetryOff.settings.isAnonymousUsageDataEnabled, false);
  assert.equal(womPackTelemetryOff.events.length, 0);
  assert.equal(womPackTelemetryOff.womSummary.enabled, false);
  assert.equal(womPackTelemetryOff.womSummary.bySource.popup.counts.wom_share_opened, 0);

  // v1-42 zip 安装回归（离线可审计）：校验最新 plugin-*.zip 中关键入口与隐私导出面板存在
  const rootDir = process.cwd();
  const rootManifest = JSON.parse(await fs.readFile(path.join(rootDir, 'manifest.json'), 'utf8')) as { version?: string };

  const rootEntries = await fs.readdir(rootDir);
  const pluginZips = rootEntries.filter((name) => /^plugin-\d+\.\d+\.\d+\.zip$/.test(name));
  assert.ok(pluginZips.length > 0, 'expected at least one plugin-*.zip artifact in repo root');

  function parseVersionFromPluginZipFilename(name: string): [number, number, number] {
    const match = /^plugin-(\d+)\.(\d+)\.(\d+)\.zip$/.exec(name);
    if (!match) return [0, 0, 0];
    return [Number(match[1] || 0), Number(match[2] || 0), Number(match[3] || 0)];
  }

  function compareSemverTuple(a: [number, number, number], b: [number, number, number]): number {
    if (a[0] !== b[0]) return a[0] - b[0];
    if (a[1] !== b[1]) return a[1] - b[1];
    return a[2] - b[2];
  }

  const latestPluginZip = pluginZips
    .slice()
    .sort((a, b) => compareSemverTuple(parseVersionFromPluginZipFilename(a), parseVersionFromPluginZipFilename(b)))
    .at(-1) as string;
  assert.ok(latestPluginZip, 'latest plugin zip should be resolved');

  const zipManifest = JSON.parse(
    execFileSync('unzip', ['-p', latestPluginZip, 'manifest.json'], { encoding: 'utf8' })
  ) as { version?: string };
  assert.equal(zipManifest.version, rootManifest.version, 'plugin zip manifest version should match repo manifest.json');

  const popupHtml = execFileSync('unzip', ['-p', latestPluginZip, 'src/popup/popup.html'], { encoding: 'utf8' });
  assert.ok(popupHtml.includes('id="upgrade-pro-entry"'), 'popup.html should include upgrade-pro-entry');
  assert.ok(popupHtml.includes('id="popup-pro-waitlist"'), 'popup.html should include popup-pro-waitlist');
  assert.ok(popupHtml.includes('id="popup-pro-waitlist-copy"'), 'popup.html should include popup-pro-waitlist-copy');
  assert.ok(popupHtml.includes('id="pro-waitlist-prompt"'), 'popup.html should include pro-waitlist-prompt');
  assert.ok(
    popupHtml.includes('id="pro-waitlist-prompt-join"'),
    'popup.html should include pro-waitlist-prompt-join'
  );
  assert.ok(
    popupHtml.includes('id="pro-waitlist-prompt-later"'),
    'popup.html should include pro-waitlist-prompt-later'
  );
  assert.ok(
    popupHtml.includes('id="pro-waitlist-prompt-never"'),
    'popup.html should include pro-waitlist-prompt-never'
  );

  const optionsHtml = execFileSync('unzip', ['-p', latestPluginZip, 'src/options/options.html'], { encoding: 'utf8' });
  assert.ok(optionsHtml.includes('data-tab="pro"'), 'options.html should include pro tab');
  assert.ok(optionsHtml.includes('id="pro-intent-campaign"'), 'options.html should include pro-intent-campaign');
  assert.ok(optionsHtml.includes('id="pro-waitlist-button"'), 'options.html should include pro-waitlist-button');
  assert.ok(optionsHtml.includes('id="pro-waitlist-copy"'), 'options.html should include pro-waitlist-copy');
  assert.ok(optionsHtml.includes('id="pro-waitlist-url-copy"'), 'options.html should include pro-waitlist-url-copy');
  assert.ok(
    optionsHtml.includes('id="pro-waitlist-recruit-copy"'),
    'options.html should include pro-waitlist-recruit-copy'
  );
  assert.ok(optionsHtml.includes('id="pro-scope-learn-more"'), 'options.html should include pro-scope-learn-more');
  assert.ok(optionsHtml.includes('id="anonymous-usage-data-switch"'), 'options.html should include anonymous usage data switch');
  assert.ok(optionsHtml.includes('id="pro-funnel-panel"'), 'options.html should include pro-funnel-panel');
  assert.ok(
    optionsHtml.includes('id="export-pro-intent-events-7d-csv"'),
    'options.html should include export-pro-intent-events-7d-csv'
  );
  assert.ok(
    optionsHtml.includes('id="export-pro-intent-by-campaign-7d-csv"'),
    'options.html should include export-pro-intent-by-campaign-7d-csv'
  );
  assert.ok(
    optionsHtml.includes('id="copy-pro-intent-weekly-digest"'),
    'options.html should include copy-pro-intent-weekly-digest'
  );
  assert.ok(
    optionsHtml.includes('id="copy-pro-intent-by-campaign-weekly-report"'),
    'options.html should include copy-pro-intent-by-campaign-weekly-report'
  );
  assert.ok(
    optionsHtml.includes('id="pro-funnel-evidence-pack-copy"'),
    'options.html should include pro-funnel-evidence-pack-copy'
  );
  assert.ok(
    optionsHtml.includes('id="copy-pro-intent-weekly-digest"'),
    'options.html should include copy-pro-intent-weekly-digest'
  );

  const popupJs = execFileSync('unzip', ['-p', latestPluginZip, 'src/popup/popup.js'], { encoding: 'utf8' });
  assert.ok(popupJs.includes('pro_entry_opened'), 'popup.js should contain pro_entry_opened');
  assert.ok(popupJs.includes('pro_waitlist_opened'), 'popup.js should contain pro_waitlist_opened');
  assert.ok(popupJs.includes('pro_waitlist_copied'), 'popup.js should contain pro_waitlist_copied');
  assert.ok(popupJs.includes('pro_prompt_shown'), 'popup.js should contain pro_prompt_shown');
  assert.ok(popupJs.includes('pro_prompt_action'), 'popup.js should contain pro_prompt_action');
  assert.ok(popupJs.includes('navigator.clipboard.writeText'), 'popup.js should write to clipboard for waitlist copy');

  const optionsJs = execFileSync('unzip', ['-p', latestPluginZip, 'src/options/options.js'], { encoding: 'utf8' });
  assert.ok(optionsJs.includes('pro_entry_opened'), 'options.js should contain pro_entry_opened');
  assert.ok(optionsJs.includes('pro_waitlist_opened'), 'options.js should contain pro_waitlist_opened');
  assert.ok(optionsJs.includes('pro_waitlist_copied'), 'options.js should contain pro_waitlist_copied');
  assert.ok(optionsJs.includes('navigator.clipboard.writeText'), 'options.js should write to clipboard for waitlist copy');
  assert.ok(optionsJs.includes('isAnonymousUsageDataEnabled'), 'options.js should reference anonymous usage data setting');

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
  assert.equal(maskProxyUrl(new URL('socks5://user:pass@127.0.0.1:1080')), 'socks5://127.0.0.1:1080');
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

  // socks5:// proxy dispatcher should be undici.Agent
  {
    const resolved = resolveCwsProxyEnv({
      HTTPS_PROXY: 'socks5://127.0.0.1:1080'
    } as NodeJS.ProcessEnv);
    const dispatcher = createUndiciProxyDispatcher(resolved);
    assert.ok(dispatcher);
    assert.equal(dispatcher.constructor.name, 'Agent');
  }

  // scripts/cws-preflight.ts (v1-47: 预检错误分类 + 离线可测)
  {
    const err = new Error('fetch failed') as Error & { cause?: unknown };
    err.cause = { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND www.googleapis.com' };
    const classified = classifyCwsPreflightError(err);
    assert.equal(classified.failureType, 'dns');
    assert.equal(classified.errorCode, 'ENOTFOUND');
  }

  {
    const err = new Error('This operation was aborted');
    (err as unknown as { name: string }).name = 'AbortError';
    const classified = classifyCwsPreflightError(err);
    assert.equal(classified.failureType, 'timeout');
  }

  {
    const fakeFetch: typeof fetch = (async (url: string) => {
      if (url.includes('pass.test')) return new Response('', { status: 404 });
      if (url.includes('fail.test')) return new Response('', { status: 503 });
      const err = new Error('fetch failed') as Error & { cause?: unknown };
      err.cause = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:1' };
      throw err;
    }) as unknown as typeof fetch;

    const report = await runCwsPreflight(
      [
        { id: 'pass', url: 'https://pass.test/' },
        { id: 'fail', url: 'https://fail.test/' },
        { id: 'throw', url: 'https://throw.test/' }
      ],
      {
        fetchFn: fakeFetch,
        timeoutMs: 10,
        now: (() => {
          let t = 1000;
          return () => (t += 5);
        })(),
        date: () => new Date('2026-03-20T00:00:00.000Z')
      }
    );
    assert.equal(report.reportVersion, 'v1-47');
    assert.equal(report.summary.total, 3);
    assert.equal(report.summary.pass, 1);
    assert.equal(report.summary.fail, 2);
    assert.equal(report.checks[0].ok, true);
    assert.equal(report.checks[1].failureType, 'http_status');
    assert.equal(report.checks[2].failureType, 'connection_refused');
  }

  // scripts/cws-publish-evidence-pack.ts (v1-62: publish:cws 诊断证据包（JSON）一键落盘)
  {
    const exportedAt = new Date('2026-03-21T01:02:03.000Z');
    const filename = formatCwsPublishEvidencePackFilename({
      extensionVersion: '1.1.28',
      exportedAt,
      dryRun: true
    });
    assert.equal(filename, 'copylot-cws-publish-diagnostic-pack-1.1.28-2026-03-21-010203.dry-run.json');
    assert.ok(!filename.includes('127.0.0.1'));
    assert.ok(!filename.includes('http'));
    assert.ok(!filename.includes('user'));
    assert.ok(!filename.includes('pass'));
  }

  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copylot-unit-tests-v1-62-'));
    const tmpFilePath = path.join(tmpDir, 'plugin.zip');
    await fs.writeFile(tmpFilePath, 'hello', 'utf-8');

    const sha256 = await computeFileSha256(tmpFilePath);
    assert.equal(sha256, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');

    const zip = await buildCwsPublishEvidenceZip(tmpFilePath, { cwd: tmpDir });
    assert.equal(zip.fileName, 'plugin.zip');
    assert.equal(zip.filePath, 'plugin.zip');
    assert.equal(zip.bytes, 5);
    assert.equal(zip.sha256, sha256);
  }

  {
    const fakeFetch: typeof fetch = (async () => {
      const err = new Error('fetch failed') as Error & { cause?: unknown };
      err.cause = { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND www.googleapis.com' };
      throw err;
    }) as unknown as typeof fetch;

    const preflightReport = await runCwsPreflight([{ id: 'googleapis', url: 'https://throw.test/' }], {
      fetchFn: fakeFetch,
      timeoutMs: 10,
      now: (() => {
        let t = 1000;
        return () => (t += 5);
      })(),
      date: () => new Date('2026-03-21T00:00:00.000Z')
    });

    const fixHints = buildCwsPreflightFixHints(preflightReport, {
      enabled: false,
      envKey: null,
      urlMasked: null,
      protocol: null
    });
    assert.ok(fixHints.length > 0);
    assert.ok(fixHints.join('\n').includes('HTTPS_PROXY') || fixHints.join('\n').includes('CWS_PROXY'));

    const proxyDiagnostic = {
      diagnosticVersion: 'v1-47' as const,
      proxy: {
        enabled: false,
        envKey: null,
        urlMasked: null,
        noProxy: { envKey: null, value: 'localhost,127.0.0.1,::1' },
        precedence: ['CWS_PROXY', 'HTTPS_PROXY', 'HTTP_PROXY', 'ALL_PROXY'] as string[],
        schemeRequired: true as const
      },
      runtime: { node: 'v20.0.0' },
      script: {
        entry: 'scripts/chrome-webstore.ts',
        gitCommit: 'deadbee',
        packageVersion: '1.1.0',
        extensionVersion: '1.1.28'
      },
      fetch: { globalFetch: true, dispatcher: 'undici.default' }
    };

    const pack = buildCwsPublishEvidencePack({
      exportedAt: '2026-03-21T00:00:00.000Z',
      dryRun: true,
      extensionVersion: '1.1.28',
      zip: {
        fileName: 'plugin-1.1.28.zip',
        filePath: 'plugin-1.1.28.zip',
        bytes: 123,
        sha256: 'deadbeef'
      },
      proxyDiagnostic,
      preflightReport,
      preflightFixHints: fixHints,
      credentials: { extensionId: false, clientId: false, clientSecret: false, refreshToken: false },
      publishAttempt: {
        uploaded: false,
        published: false,
        channel: 'default',
        errorCode: 'skipped',
        errorMessage: 'dry-run: upload/publish skipped'
      }
    });

    assert.equal(pack.packVersion, 'v1-62');
    assert.deepEqual(Object.keys(pack), [
      'packVersion',
      'exportedAt',
      'dryRun',
      'extensionVersion',
      'zip',
      'proxyDiagnostic',
      'preflightReport',
      'preflightFixHints',
      'credentials',
      'publishAttempt'
    ]);
    assert.deepEqual(Object.keys(pack.zip), ['fileName', 'filePath', 'bytes', 'sha256']);
    assert.deepEqual(Object.keys(pack.credentials), ['extensionId', 'clientId', 'clientSecret', 'refreshToken']);

    for (const v of Object.values(pack.credentials)) assert.equal(typeof v, 'boolean');

    const json = JSON.stringify(pack);
    assert.ok(!json.includes('CWS_CLIENT_SECRET'));
    assert.ok(!json.includes('CWS_REFRESH_TOKEN'));
  }

  {
    const exportedAt = new Date('2026-03-21T01:02:03.000Z');
    const filename = formatCwsListingEvidencePackFilename({ extensionVersion: '1.1.28', exportedAt });
    assert.equal(filename, 'cws-listing-evidence-pack-1.1.28-2026-03-21-010203.json');
    assert.ok(filename.startsWith('cws-listing-evidence-pack-'));
    assert.ok(filename.endsWith('.json'));
  }

  {
    const envKey = 'COPYLOT_UNIT_TEST_SECRET';
    const envValue = 'copylot-unit-test-secret-should-not-leak';
    process.env[envKey] = envValue;

    try {
      const exportedAt = new Date('2026-03-21T00:00:00.000Z');
      const built1 = await buildCwsListingEvidencePackFromRepo({
        exportedAt,
        evidenceDir: DEFAULT_CWS_LISTING_EVIDENCE_DIR,
        requireDistManifest: false
      });

      assert.equal(built1.evidenceDir, DEFAULT_CWS_LISTING_EVIDENCE_DIR);
      assert.ok(built1.packFileName.startsWith('cws-listing-evidence-pack-'));
      assert.ok(built1.packFileName.endsWith('.json'));

      const pack = built1.pack;
      assert.equal(pack.packVersion, CWS_LISTING_EVIDENCE_PACK_VERSION);
      assert.equal(pack.exportedAt, exportedAt.toISOString());
      assert.ok(pack.extensionVersion.length > 0);
      assert.ok(pack.inputs.length >= 5);

      assert.deepEqual(Object.keys(pack), ['packVersion', 'exportedAt', 'extensionVersion', 'inputs', 'listing', 'assertions']);
      assert.deepEqual(Object.keys(pack.listing), [
        'descriptions',
        'keywords',
        'screenshotPlan',
        'releaseNotesTemplateSha256'
      ]);
      assert.deepEqual(Object.keys(pack.listing.descriptions), ['en', 'zh']);
      assert.deepEqual(Object.keys(pack.listing.keywords), ['en', 'zh']);
      assert.deepEqual(Object.keys(pack.assertions), [
        'hasProWaitlistCta',
        'hasTutorialLinks',
        'hasPrivacyClaims',
        'noOverclaimKeywords'
      ]);

      assert.equal(pack.assertions.hasProWaitlistCta, true);
      assert.equal(pack.assertions.hasTutorialLinks, true);
      assert.equal(pack.assertions.hasPrivacyClaims, true);
      assert.equal(pack.assertions.noOverclaimKeywords, true);
      assert.equal(built1.assertionFailures.length, 0);

      const json = JSON.stringify(pack);
      assert.ok(!json.includes(envKey));
      assert.ok(!json.includes(envValue));
      assert.ok(!json.includes('CWS_CLIENT_SECRET'));
      assert.ok(!json.includes('CWS_REFRESH_TOKEN'));

      const built2 = await buildCwsListingEvidencePackFromRepo({
        exportedAt,
        evidenceDir: DEFAULT_CWS_LISTING_EVIDENCE_DIR,
        requireDistManifest: false
      });
      assert.equal(JSON.stringify(built2.pack), JSON.stringify(pack));
      assert.equal(built2.indexMarkdown, built1.indexMarkdown);
    } finally {
      delete process.env[envKey];
    }
  }

  {
    const policyMd = await fs.readFile(path.resolve(process.cwd(), DEFAULT_CWS_LISTING_REDLINES_POLICY_PATH), 'utf-8');
    const policy = parseCwsListingRedlinesPolicyFromMarkdown(policyMd);

    const keywordsMd = [
      '# keywords',
      '',
      '## EN Keywords (Groups)',
      '- copy to markdown',
      '',
      '## ZH 关键词组（建议）',
      '- 智能复制',
      ''
    ].join('\n');

    const scan = scanCwsListingRedlinesFromText({
      policy,
      descriptionEnMarkdown: 'Note: there is no payment/subscription promise on the store page.',
      descriptionZhMarkdown: '提醒：商店页不提供任何付费/订阅承诺。',
      keywordsMarkdown: keywordsMd
    });

    assert.equal(scan.summary.result, 'PASS');
    assert.equal(scan.summary.blocked, 0);
    assert.ok(scan.hits.some((h) => h.term === 'payment' && h.result === 'allowed'));
    assert.ok(scan.hits.some((h) => h.term === 'subscription' && h.result === 'allowed'));
    assert.ok(scan.hits.some((h) => h.term === '付费' && h.result === 'allowed'));
    assert.ok(scan.hits.some((h) => h.term === '订阅' && h.result === 'allowed'));
  }

  {
    const policyMd = await fs.readFile(path.resolve(process.cwd(), DEFAULT_CWS_LISTING_REDLINES_POLICY_PATH), 'utf-8');
    const policy = parseCwsListingRedlinesPolicyFromMarkdown(policyMd);

    const keywordsMd = [
      '# keywords',
      '',
      '## EN Keywords (Groups)',
      '- copy to markdown',
      '',
      '## ZH 关键词组（建议）',
      '- 智能复制',
      ''
    ].join('\n');

    const scan = scanCwsListingRedlinesFromText({
      policy,
      descriptionEnMarkdown: 'Subscribe now, and upgrade to pro.',
      descriptionZhMarkdown: 'Pro 已上线，立即订阅，马上付费。',
      keywordsMarkdown: keywordsMd
    });

    assert.equal(scan.summary.result, 'BLOCKED');
    assert.ok(scan.summary.blocked > 0);
    assert.ok(scan.hits.some((h) => h.result === 'blocked'));
  }

  {
    const policyMd = await fs.readFile(path.resolve(process.cwd(), DEFAULT_CWS_LISTING_REDLINES_POLICY_PATH), 'utf-8');
    const policy = parseCwsListingRedlinesPolicyFromMarkdown(policyMd);

    const keywordsMd = [
      '# keywords',
      '',
      '## EN Keywords (Groups)',
      '- subscription',
      '',
      '## ZH 关键词组（建议）',
      '- 智能复制',
      ''
    ].join('\n');

    const scan = scanCwsListingRedlinesFromText({
      policy,
      descriptionEnMarkdown: '',
      descriptionZhMarkdown: '',
      keywordsMarkdown: keywordsMd
    });

    assert.equal(scan.summary.result, 'BLOCKED');
    assert.ok(scan.hits.some((h) => h.file === 'docs/aso/keywords.md' && h.result === 'blocked'));
  }

  {
    const exportedAt = new Date('2026-03-21T01:02:03.000Z');
    const filename = formatCwsListingDiffEvidencePackFilename({ extensionVersion: '1.1.28', exportedAt });
    assert.equal(filename, 'cws-listing-diff-evidence-pack-1.1.28-2026-03-21-010203.json');
    assert.ok(filename.startsWith('cws-listing-diff-evidence-pack-'));
    assert.ok(filename.endsWith('.json'));
  }

  {
    const redlines1 = computeCwsListingDiffRedlines({
      hasProWaitlistCta: false,
      hasTutorialLinks: true,
      hasPrivacyClaims: true,
      noOverclaimKeywords: true
    });
    assert.deepEqual(redlines1, ['lostProWaitlistCta']);

    const redlines2 = computeCwsListingDiffRedlines({
      hasProWaitlistCta: true,
      hasTutorialLinks: true,
      hasPrivacyClaims: false,
      noOverclaimKeywords: true
    });
    assert.deepEqual(redlines2, ['lostPrivacyClaims']);

    const redlines3 = computeCwsListingDiffRedlines({
      hasProWaitlistCta: true,
      hasTutorialLinks: true,
      hasPrivacyClaims: true,
      noOverclaimKeywords: false
    });
    assert.deepEqual(redlines3, ['overclaimDetected']);

    const redlines4 = computeCwsListingDiffRedlines({
      hasProWaitlistCta: true,
      hasTutorialLinks: true,
      hasPrivacyClaims: true,
      noOverclaimKeywords: true
    });
    assert.deepEqual(redlines4, []);
  }

  {
    const indexMd = await fs.readFile(path.resolve(process.cwd(), 'docs/evidence/v1-66/index.md'), 'utf-8');
    const fileName = parseCwsListingEvidencePackFileNameFromIndexMarkdown(indexMd);
    assert.ok(fileName.startsWith('cws-listing-evidence-pack-'));
    assert.ok(fileName.endsWith('.json'));

    const baselinePackPath = await resolveBaselineListingEvidencePackPathFromIndexFile('docs/evidence/v1-66/index.md');
    assert.equal(baselinePackPath, `docs/evidence/v1-66/${fileName}`);
  }

  {
    const exportedAt = new Date('2026-03-21T00:00:00.000Z');
    const baselinePackPath = await resolveBaselineListingEvidencePackPathFromIndexFile('docs/evidence/v1-66/index.md');

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copylot-unit-test-v1-67-'));
    const built1 = await buildCwsListingDiffEvidencePackFromRepo({
      exportedAt,
      baselinePackPath,
      evidenceDir: tmpDir,
      requireDistManifest: false
    });

    const pack = built1.diff.pack;
    assert.equal(pack.packVersion, CWS_LISTING_DIFF_EVIDENCE_PACK_VERSION);
    assert.equal(pack.exportedAt, exportedAt.toISOString());
    assert.ok(pack.extensionVersion.length > 0);

    assert.deepEqual(Object.keys(pack), ['packVersion', 'exportedAt', 'extensionVersion', 'baseline', 'current', 'diff', 'redlines']);
    assert.deepEqual(Object.keys(pack.baseline), ['packPath', 'sha256', 'extensionVersion', 'exportedAt', 'assertions']);
    assert.deepEqual(Object.keys(pack.current), ['packPath', 'sha256', 'extensionVersion', 'exportedAt', 'assertions']);
    assert.deepEqual(Object.keys(pack.diff), ['keywords', 'descriptions', 'screenshotPlan', 'assertions']);
    assert.deepEqual(Object.keys(pack.diff.keywords), ['enAdded', 'enRemoved', 'zhAdded', 'zhRemoved']);
    assert.deepEqual(Object.keys(pack.diff.descriptions), ['enSha256From', 'enSha256To', 'zhSha256From', 'zhSha256To']);
    assert.deepEqual(Object.keys(pack.diff.screenshotPlan), ['changedIds']);
    assert.deepEqual(Object.keys(pack.diff.assertions), ['changedKeys']);

    assert.equal(typeof pack.baseline.sha256, 'string');
    assert.equal(pack.baseline.sha256.length, 64);
    assert.equal(typeof pack.current.sha256, 'string');
    assert.equal(pack.current.sha256.length, 64);

    // 当前仓库素材下，红线应为 PASS（与 v1-66 断言保持一致）
    assert.deepEqual(pack.redlines, []);

    const built2 = await buildCwsListingDiffEvidencePackFromRepo({
      exportedAt,
      baselinePackPath,
      evidenceDir: tmpDir,
      requireDistManifest: false
    });
    assert.equal(built2.diff.json, built1.diff.json);
    assert.equal(built2.current.json, built1.current.json);
    assert.equal(built2.indexMarkdown, built1.indexMarkdown);
  }
}

try {
  await run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
