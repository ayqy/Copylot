import assert from 'node:assert/strict';

import { createChromeMock } from './test-helpers/chrome-mock.ts';
import { getRequiredElement, loadExtensionPage } from './test-helpers/extension-page-harness.ts';

const SETTINGS_KEY = 'copilot_settings';
const GROWTH_STATS_KEY = 'copilot_growth_stats';
const TELEMETRY_EVENTS_KEY = 'copilot_telemetry_events';
const APPEND_SESSION_KEY = 'copilot_append_session';

interface TestChatService {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  builtIn: boolean;
  description?: string;
}

interface TestPrompt {
  id: string;
  title: string;
  template: string;
  category?: string;
  usageCount?: number;
  createdAt?: number;
  lastUsedAt?: number;
  targetChatId?: string;
  autoOpenChat?: boolean;
  builtIn?: boolean;
  deleted?: boolean;
  templateVersion?: number;
}

interface Settings {
  isMagicCopyEnabled: boolean;
  isHoverMagicCopyEnabled: boolean;
  isAnonymousUsageDataEnabled: boolean;
  proIntentCampaign?: string;
  outputFormat: 'markdown' | 'plaintext';
  tableOutputFormat: 'markdown' | 'csv';
  attachTitle: boolean;
  attachURL: boolean;
  language: 'system' | 'en' | 'zh';
  interactionMode: 'click' | 'dblclick';
  userPrompts: TestPrompt[];
  isClipboardAccumulatorEnabled: boolean;
  chatServices: TestChatService[];
  defaultChatServiceId?: string;
  defaultAutoOpenChat: boolean;
  editorExclusionClassNames: string[];
  editorExclusionAttributeSelectors: string[];
  popupOnboardingVersion: number;
  popupOnboardingCompletedVersion: number;
  popupOnboardingCompletedAt?: number;
}

function createDefaultSettings(): Settings {
  return {
    isMagicCopyEnabled: true,
    isHoverMagicCopyEnabled: false,
    isAnonymousUsageDataEnabled: false,
    proIntentCampaign: undefined,
    outputFormat: 'markdown',
    tableOutputFormat: 'markdown',
    attachTitle: false,
    attachURL: false,
    language: 'en',
    interactionMode: 'click',
    userPrompts: [
      {
        id: 'builtin-summary-article',
        title: 'Summary',
        template: 'Summarize:\n\n{content}',
        usageCount: 0,
        createdAt: 1,
        builtIn: true,
        deleted: false,
        templateVersion: 1
      },
      {
        id: 'custom-quick-slot-2',
        title: 'Custom Quick Slot 2',
        template: 'Custom slot 2:\n\n{content}',
        usageCount: 0,
        createdAt: 2,
        quickAccessSlot: 2,
        builtIn: false,
        deleted: false,
        templateVersion: 1
      }
    ],
    isClipboardAccumulatorEnabled: false,
    chatServices: [
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        enabled: true,
        builtIn: true
      }
    ],
    defaultChatServiceId: undefined,
    defaultAutoOpenChat: false,
    editorExclusionClassNames: ['ProseMirror'],
    editorExclusionAttributeSelectors: ['[data-cangjie-content]', '[data-cangjie-editable]'],
    popupOnboardingVersion: 1,
    popupOnboardingCompletedVersion: 0,
    popupOnboardingCompletedAt: undefined
  };
}

function buildStoredSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    ...createDefaultSettings(),
    popupOnboardingCompletedVersion: 1,
    popupOnboardingCompletedAt: 1,
    isAnonymousUsageDataEnabled: true,
    proIntentCampaign: 'twitter',
    ...overrides
  };
}

function clickElement(element: HTMLElement): void {
  element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

async function runPopupAssertions(): Promise<void> {
  const chromeMock = createChromeMock({
    extensionId: 'abcdefghijklmnopabcdefghijklmnop',
    syncData: {
      [SETTINGS_KEY]: buildStoredSettings()
    },
    localData: {
      [GROWTH_STATS_KEY]: {
        installedAt: Date.now() - 10_000,
        successfulCopyCount: 25,
        popupOnboardingCompletedVersion: 1
      },
      [APPEND_SESSION_KEY]: {
        clipCount: 2,
        startedAt: Date.now() - 7_000,
        lastAppendedAt: Date.now() - 5_000,
        lastAction: 'append'
      },
      [TELEMETRY_EVENTS_KEY]: []
    }
  });

  const page = await loadExtensionPage({
    htmlPath: 'src/popup/popup.html',
    builtScriptPath: 'dist/src/popup/popup.js',
    pageUrl: 'https://example.com/src/popup/popup.html',
    chrome: chromeMock
  });

  try {
    const firstCopyTitle = getRequiredElement<HTMLElement>(
      page.dom.window.document,
      '#first-copy-title'
    );
    assert.match(firstCopyTitle.textContent || '', /第一次干净复制|first clean copy/i);
    const firstCopyStatus = getRequiredElement<HTMLElement>(
      page.dom.window.document,
      '#first-copy-status'
    );
    assert.match(firstCopyStatus.textContent || '', /已完成|completed/i);
    assert.equal(firstCopyStatus.dataset.state, 'done');
    assert.equal(page.dom.window.document.querySelectorAll('.first-copy-selling-point').length, 3);

    const convertButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#convert-button'
    );
    assert.match(convertButton.textContent || '', /复制给AI|Copy to AI/);
    clickElement(convertButton);
    await page.waitForIdle();
    assert.equal(chromeMock.logs.queriedTabs.length, 1);
    assert.equal(chromeMock.logs.sentTabMessages.length, 1);

    const convertShortcut = getRequiredElement<HTMLElement>(
      page.dom.window.document,
      '#convert-shortcut'
    );
    assert.match(convertShortcut.textContent || '', /Alt\+C/);

    const shortcutSettingsButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#open-shortcut-settings-button'
    );
    assert.match(shortcutSettingsButton.textContent || '', /去设置|Go to settings/);
    clickElement(shortcutSettingsButton);
    await page.waitForIdle();
    assert.equal(chromeMock.logs.openedOptionsPageCount, 1);

    const moreSettingsToggle = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#toggle-more-settings'
    );
    assert.equal(moreSettingsToggle.getAttribute('aria-expanded'), 'false');
    assert.match(moreSettingsToggle.textContent || '', /展开更多设置|Expand more settings/);
    clickElement(moreSettingsToggle);
    await page.waitForIdle();
    assert.equal(
      getRequiredElement<HTMLElement>(page.dom.window.document, '#more-settings-panel').hidden,
      false
    );
    assert.equal(moreSettingsToggle.getAttribute('aria-expanded'), 'true');

    assert.equal(
      getRequiredElement<HTMLButtonElement>(page.dom.window.document, '#quick-prompt-slot-1-button')
        .hidden,
      false
    );
    assert.equal(
      getRequiredElement<HTMLButtonElement>(page.dom.window.document, '#quick-prompt-slot-2-button')
        .hidden,
      false
    );
    assert.equal(
      getRequiredElement<HTMLButtonElement>(page.dom.window.document, '#quick-prompt-slot-3-button')
        .hidden,
      true
    );
    const quickPromptSlot2Title = getRequiredElement<HTMLElement>(
      page.dom.window.document,
      '#quick-prompt-slot-2-title'
    );
    assert.equal(quickPromptSlot2Title.textContent, 'Custom Quick Slot 2');
    const quickPromptSlot1Title = getRequiredElement<HTMLElement>(
      page.dom.window.document,
      '#quick-prompt-slot-1-title'
    );
    assert.equal(quickPromptSlot1Title.textContent, 'Summary');
    const reusePrimaryCard = getRequiredElement<HTMLElement>(
      page.dom.window.document,
      '#reuse-primary-card'
    );
    assert.equal(reusePrimaryCard.hidden, false);
    const reusePrimaryButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#reuse-primary-button'
    );
    assert.match(reusePrimaryButton.textContent || '', /Summary/i);
    const appendSessionCard = getRequiredElement<HTMLElement>(
      page.dom.window.document,
      '#append-session-card'
    );
    assert.equal(appendSessionCard.hidden, false);
    const appendSessionTitle = getRequiredElement<HTMLElement>(
      page.dom.window.document,
      '#append-session-title'
    );
    assert.match(appendSessionTitle.textContent || '', /2/);

    const addPromptButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#add-prompt-button'
    );
    clickElement(addPromptButton);
    await page.waitForIdle();
    assert.equal(chromeMock.logs.openedOptionsPageCount, 2);

    const feedbackLink = getRequiredElement<HTMLAnchorElement>(
      page.dom.window.document,
      '#feedback-link'
    );
    clickElement(feedbackLink);
    await page.waitForIdle();
    assert.match(
      chromeMock.logs.createdTabs.at(-1)?.url ?? '',
      /^https:\/\/github\.com\/ayqy\/copy\/issues\/new\?/
    );

    const shareLink = getRequiredElement<HTMLAnchorElement>(
      page.dom.window.document,
      '#share-link'
    );
    clickElement(shareLink);
    await page.waitForIdle();
    const shareUrl = chromeMock.logs.createdTabs.at(-1)?.url ?? '';
    assert.ok(shareUrl.includes('chromewebstore.google.com/detail/ai-copilot'));
    assert.ok(shareUrl.includes('utm_medium=popup'));

    const rateLink = getRequiredElement<HTMLAnchorElement>(page.dom.window.document, '#rate-link');
    clickElement(rateLink);
    await page.waitForIdle();
    const rateUrl = chromeMock.logs.createdTabs.at(-1)?.url ?? '';
    assert.ok(rateUrl.includes('chromewebstore.google.com/detail/ai-copilot'));
    assert.ok(rateUrl.includes('/reviews?'));
    assert.ok(rateUrl.includes('utm_medium=popup'));

    assert.equal(page.dom.window.document.querySelector('#rating-prompt'), null);
    assert.equal(page.dom.window.document.querySelector('#popup-pro-waitlist-survey'), null);
    assert.equal(page.dom.window.document.querySelector('#popup-pro-waitlist-copy'), null);

    const popupProEntryButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#upgrade-pro-entry'
    );
    clickElement(popupProEntryButton);
    await page.waitForIdle();
    const proRouteUrl = chromeMock.logs.createdTabs.at(-1)?.url ?? '';
    assert.ok(proRouteUrl.includes('/src/options/options.html#pro'));
  } finally {
    page.restore();
  }
}

async function runPopupLockedWomAssertions(): Promise<void> {
  const chromeMock = createChromeMock({
    extensionId: 'abcdefghijklmnopabcdefghijklmnop',
    syncData: {
      [SETTINGS_KEY]: buildStoredSettings()
    },
    localData: {
      [GROWTH_STATS_KEY]: {
        installedAt: Date.now() - 10_000,
        successfulCopyCount: 1,
        firstSuccessfulCopyAt: Date.now() - 9_000,
        popupOnboardingCompletedVersion: 1
      },
      [TELEMETRY_EVENTS_KEY]: []
    }
  });

  const page = await loadExtensionPage({
    htmlPath: 'src/popup/popup.html',
    builtScriptPath: 'dist/src/popup/popup.js',
    pageUrl: 'https://example.com/src/popup/popup.html',
    chrome: chromeMock
  });

  try {
    const shareLink = getRequiredElement<HTMLAnchorElement>(page.dom.window.document, '#share-link');
    const rateLink = getRequiredElement<HTMLAnchorElement>(page.dom.window.document, '#rate-link');
    const copyShareButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#copy-share-button'
    );
    const womStatusHint = getRequiredElement<HTMLElement>(page.dom.window.document, '#wom-status-hint');

    assert.equal(shareLink.getAttribute('aria-disabled'), 'true');
    assert.equal(rateLink.getAttribute('aria-disabled'), 'true');
    assert.equal(copyShareButton.disabled, true);
    assert.equal(womStatusHint.hidden, false);
    assert.match(womStatusHint.textContent || '', /1/);

    clickElement(shareLink);
    clickElement(rateLink);
    await page.waitForIdle();
    assert.equal(chromeMock.logs.createdTabs.length, 0);
  } finally {
    page.restore();
  }
}

async function runOptionsAssertions(): Promise<void> {
  const chromeMock = createChromeMock({
    extensionId: 'abcdefghijklmnopabcdefghijklmnop',
    syncData: {
      [SETTINGS_KEY]: buildStoredSettings()
    },
    localData: {
      [GROWTH_STATS_KEY]: {
        installedAt: Date.now() - 10_000,
        successfulCopyCount: 30,
        firstPopupOpenedAt: Date.now() - 9_000,
        firstSuccessfulCopyAt: Date.now() - 8_000
      },
      [APPEND_SESSION_KEY]: {
        clipCount: 2,
        startedAt: Date.now() - 6_000,
        lastAppendedAt: Date.now() - 3_000,
        lastAction: 'append'
      },
      [TELEMETRY_EVENTS_KEY]: [
        {
          name: 'pro_entry_opened',
          ts: Date.now() - 5_000,
          props: { source: 'options', campaign: 'twitter' }
        },
        {
          name: 'pro_waitlist_opened',
          ts: Date.now() - 4_000,
          props: { source: 'options', campaign: 'twitter' }
        },
        {
          name: 'pro_waitlist_copied',
          ts: Date.now() - 3_000,
          props: { source: 'options', campaign: 'twitter' }
        }
      ]
    }
  });

  const page = await loadExtensionPage({
    htmlPath: 'src/options/options.html',
    builtScriptPath: 'dist/src/options/options.js',
    pageUrl: 'https://example.com/src/options/options.html#pro',
    chrome: chromeMock
  });

  try {
    const shortcutCurrentConvert = getRequiredElement<HTMLElement>(
      page.dom.window.document,
      '#options-shortcut-current-convert'
    );
    assert.match(shortcutCurrentConvert.textContent || '', /Alt\+C/);

    const optionsShortcutButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#options-open-shortcut-settings'
    );
    assert.match(optionsShortcutButton.textContent || '', /去设置|Go to settings/);
    clickElement(optionsShortcutButton);
    await page.waitForIdle();
    assert.equal(chromeMock.logs.createdTabs.at(-1)?.url, 'chrome://extensions/shortcuts');
    assert.equal(
      getRequiredElement<HTMLElement>(
        page.dom.window.document,
        '#options-shortcut-slot-1-prompt-name'
      ).textContent,
      'Summary'
    );
    clickElement(
      getRequiredElement<HTMLElement>(
        page.dom.window.document,
        '[data-shortcut-command-card="slot-1"]'
      )
    );
    await page.waitForIdle();
    assert.equal(chromeMock.logs.createdTabs.at(-1)?.url, 'chrome://extensions/shortcuts');

    const campaignInput = getRequiredElement<HTMLInputElement>(
      page.dom.window.document,
      '#pro-intent-campaign'
    );
    assert.equal(campaignInput.closest('.form-group')?.hasAttribute('hidden'), true);
    campaignInput.value = 'twitter';
    campaignInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    campaignInput.dispatchEvent(new window.Event('change', { bubbles: true }));
    await page.waitForIdle();

    const advancedCleaningOpenButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-advanced-open'
    );
    clickElement(advancedCleaningOpenButton);
    await page.waitForIdle();
    const advancedCleaningOpenUrl = chromeMock.logs.createdTabs.at(-1)?.url ?? '';
    assert.ok(advancedCleaningOpenUrl.includes('/pricing'));
    assert.ok(advancedCleaningOpenUrl.includes('utm_medium=options'));
    assert.ok(advancedCleaningOpenUrl.includes('utm_content=options_advanced_cleaning_cta'));

    const advancedCleaningRouteCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-advanced-route-copy'
    );
    clickElement(advancedCleaningRouteCopyButton);
    await page.waitForIdle();
    const advancedCleaningRouteUrl = await page.clipboard.readText();
    assert.ok(advancedCleaningRouteUrl.includes('utm_medium=distribution_toolkit'));
    assert.ok(advancedCleaningRouteUrl.includes('utm_campaign=twitter'));
    assert.ok(advancedCleaningRouteUrl.includes('utm_content=options_advanced_cleaning_cta'));

    const advancedCleaningBriefCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-advanced-brief-copy'
    );
    clickElement(advancedCleaningBriefCopyButton);
    await page.waitForIdle();
    const advancedCleaningBrief = await page.clipboard.readText();
    assert.ok(advancedCleaningBrief.includes('Advanced page cleaning') || advancedCleaningBrief.includes('高级页面清洗'));
    assert.ok(advancedCleaningBrief.includes('utm_content=options_advanced_cleaning_cta'));

    const advancedCleaningChecklistCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-advanced-checklist-copy'
    );
    clickElement(advancedCleaningChecklistCopyButton);
    await page.waitForIdle();
    const advancedCleaningChecklist = await page.clipboard.readText();
    assert.ok(advancedCleaningChecklist.includes('Validation Checklist') || advancedCleaningChecklist.includes('验证清单'));
    assert.ok(advancedCleaningChecklist.includes('twitter'));

    const bulkCollectionOpenButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-bulk-open'
    );
    clickElement(bulkCollectionOpenButton);
    await page.waitForIdle();
    const bulkCollectionOpenUrl = chromeMock.logs.createdTabs.at(-1)?.url ?? '';
    assert.ok(bulkCollectionOpenUrl.includes('/pricing'));
    assert.ok(bulkCollectionOpenUrl.includes('utm_content=options_bulk_collection_cta'));

    const bulkCollectionRouteCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-bulk-route-copy'
    );
    clickElement(bulkCollectionRouteCopyButton);
    await page.waitForIdle();
    const bulkCollectionRouteUrl = await page.clipboard.readText();
    assert.ok(bulkCollectionRouteUrl.includes('utm_campaign=twitter'));
    assert.ok(bulkCollectionRouteUrl.includes('utm_content=options_bulk_collection_cta'));

    const bulkCollectionBriefCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-bulk-brief-copy'
    );
    clickElement(bulkCollectionBriefCopyButton);
    await page.waitForIdle();
    const bulkCollectionBrief = await page.clipboard.readText();
    assert.ok(
      bulkCollectionBrief.includes('Batch collection and organization') ||
        bulkCollectionBrief.includes('批量采集与整理')
    );
    assert.ok(bulkCollectionBrief.includes('utm_content=options_bulk_collection_cta'));

    const bulkCollectionChecklistCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-bulk-checklist-copy'
    );
    clickElement(bulkCollectionChecklistCopyButton);
    await page.waitForIdle();
    const bulkCollectionChecklist = await page.clipboard.readText();
    assert.ok(
      bulkCollectionChecklist.includes('Validation Checklist') ||
        bulkCollectionChecklist.includes('验证清单')
    );
    assert.ok(bulkCollectionChecklist.includes('twitter'));

    const structuredExportOpenButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-structured-open'
    );
    clickElement(structuredExportOpenButton);
    await page.waitForIdle();
    const structuredExportOpenUrl = chromeMock.logs.createdTabs.at(-1)?.url ?? '';
    assert.ok(structuredExportOpenUrl.includes('/pricing'));
    assert.ok(structuredExportOpenUrl.includes('utm_content=options_structured_export_cta'));

    const structuredExportRouteCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-structured-route-copy'
    );
    clickElement(structuredExportRouteCopyButton);
    await page.waitForIdle();
    const structuredExportRouteUrl = await page.clipboard.readText();
    assert.ok(structuredExportRouteUrl.includes('utm_campaign=twitter'));
    assert.ok(structuredExportRouteUrl.includes('utm_content=options_structured_export_cta'));

    const structuredExportBriefCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-structured-brief-copy'
    );
    clickElement(structuredExportBriefCopyButton);
    await page.waitForIdle();
    const structuredExportBrief = await page.clipboard.readText();
    assert.ok(
      structuredExportBrief.includes('Structured export and downstream workflow') ||
        structuredExportBrief.includes('结构化导出与下游工作流')
    );
    assert.ok(structuredExportBrief.includes('utm_content=options_structured_export_cta'));

    const structuredExportChecklistCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-validation-structured-checklist-copy'
    );
    clickElement(structuredExportChecklistCopyButton);
    await page.waitForIdle();
    const structuredExportChecklist = await page.clipboard.readText();
    assert.ok(
      structuredExportChecklist.includes('Validation Checklist') ||
        structuredExportChecklist.includes('验证清单')
    );
    assert.ok(structuredExportChecklist.includes('twitter'));

    const proWaitlistButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-waitlist-button'
    );
    clickElement(proWaitlistButton);
    await page.waitForIdle();
    const waitlistUrl = chromeMock.logs.createdTabs.at(-1)?.url ?? '';
    assert.ok(waitlistUrl.includes('https://copy.useai.online/'));
    assert.ok(waitlistUrl.includes('#pro'));
    assert.ok(waitlistUrl.includes('utm_medium=options'));

    const proWaitlistCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-waitlist-copy'
    );
    assert.equal(proWaitlistCopyButton.hidden, true);

    const proWaitlistUrlCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-waitlist-url-copy'
    );
    assert.equal(
      getRequiredElement<HTMLElement>(
        page.dom.window.document,
        '#pro-waitlist-distribution-toolkit'
      ).hidden,
      true
    );
    clickElement(proWaitlistUrlCopyButton);
    await page.waitForIdle();
    const waitlistCopyUrl = await page.clipboard.readText();
    assert.ok(waitlistCopyUrl.includes('utm_medium=distribution_toolkit'));
    assert.ok(waitlistCopyUrl.includes('utm_campaign=twitter'));

    const proWaitlistRecruitCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-waitlist-recruit-copy'
    );
    clickElement(proWaitlistRecruitCopyButton);
    await page.waitForIdle();
    const recruitCopy = await page.clipboard.readText();
    assert.ok(recruitCopy.includes('twitter'));
    assert.ok(recruitCopy.includes('/privacy'));
    assert.ok(recruitCopy.includes('chromewebstore.google.com/detail/ai-copilot'));

    const proStoreUrlCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-store-url-copy'
    );
    clickElement(proStoreUrlCopyButton);
    await page.waitForIdle();
    const storeCopyUrl = await page.clipboard.readText();
    assert.ok(storeCopyUrl.includes('chromewebstore.google.com/detail/ai-copilot'));
    assert.ok(storeCopyUrl.includes('utm_campaign=twitter'));

    const proDistributionPackCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-distribution-pack-copy'
    );
    clickElement(proDistributionPackCopyButton);
    await page.waitForIdle();
    const distributionPack = await page.clipboard.readText();
    assert.ok(distributionPack.includes('https://copy.useai.online/'));
    assert.ok(distributionPack.includes('chromewebstore.google.com/detail/ai-copilot'));
    assert.ok(distributionPack.includes('/privacy'));

    const appendWorkflowRefreshButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#append-workflow-refresh'
    );
    clickElement(appendWorkflowRefreshButton);
    await page.waitForIdle();
    const appendWorkflowView = getRequiredElement<HTMLTextAreaElement>(
      page.dom.window.document,
      '#append-workflow-view'
    );
    assert.ok(appendWorkflowView.value.includes('"clipCount": 2'));
    assert.ok(appendWorkflowView.value.includes('"sessionsCompleted": 1'));
    assert.equal(appendWorkflowView.value.includes('example.com'), false);

    const appendWorkflowCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#append-workflow-copy'
    );
    clickElement(appendWorkflowCopyButton);
    await page.waitForIdle();
    assert.ok((await page.clipboard.readText()).includes('"workflowState": "collecting"'));

    const appendWorkflowClearButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#append-workflow-clear'
    );
    clickElement(appendWorkflowClearButton);
    await page.waitForIdle();
    assert.ok(
      getRequiredElement<HTMLTextAreaElement>(page.dom.window.document, '#append-workflow-view').value.includes(
        '"clipCount": 0'
      )
    );

    const womShareOpenButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#wom-share-open'
    );
    clickElement(womShareOpenButton);
    await page.waitForIdle();
    assert.ok((chromeMock.logs.createdTabs.at(-1)?.url ?? '').includes('utm_medium=options'));

    const womShareCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#wom-share-copy'
    );
    clickElement(womShareCopyButton);
    await page.waitForIdle();
    const womShareCopy = await page.clipboard.readText();
    assert.ok(womShareCopy.includes('chromewebstore.google.com/detail/ai-copilot'));
    assert.equal(womShareCopy.toLowerCase().includes('waitlist'), false);
    assert.equal(womShareCopy.toLowerCase().includes('survey'), false);

    const womRateOpenButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#wom-rate-open'
    );
    clickElement(womRateOpenButton);
    await page.waitForIdle();
    const womRateUrl = chromeMock.logs.createdTabs.at(-1)?.url ?? '';
    assert.ok(womRateUrl.includes('/reviews?'));
    assert.ok(womRateUrl.includes('utm_medium=options'));

    const womFeedbackOpenButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#wom-feedback-open'
    );
    clickElement(womFeedbackOpenButton);
    await page.waitForIdle();
    assert.match(
      chromeMock.logs.createdTabs.at(-1)?.url ?? '',
      /^https:\/\/github\.com\/ayqy\/copy\/issues\/new\?/
    );

    const growthFunnelView = getRequiredElement<HTMLTextAreaElement>(
      page.dom.window.document,
      '#growth-funnel-view'
    );
    assert.ok(growthFunnelView.value.includes('"appendWorkflowAudit"'));
    assert.ok(growthFunnelView.value.includes('"clipCount": 2'));

    const womEvidencePackCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#wom-summary-evidence-pack-copy'
    );
    clickElement(womEvidencePackCopyButton);
    await page.waitForIdle();
    const womEvidencePack = await page.clipboard.readText();
    assert.ok(womEvidencePack.includes('"womQualificationAudit"'));
    assert.ok(womEvidencePack.includes('"isEligibleForWomActions": true'));
    assert.ok(womEvidencePack.includes('"successfulCopyCount": 30'));

    const downloadEvidenceButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#download-pro-intent-run-evidence-pack'
    );
    clickElement(downloadEvidenceButton);
    await page.waitForIdle();
    const download = page.downloads.at(-1);
    assert.ok(download);
    assert.ok((download?.download ?? '').includes('copylot-pro-intent-run-evidence-pack-v1-90-'));
  } finally {
    page.restore();
  }
}

async function runOptionsLockedWomAssertions(): Promise<void> {
  const chromeMock = createChromeMock({
    extensionId: 'abcdefghijklmnopabcdefghijklmnop',
    syncData: {
      [SETTINGS_KEY]: buildStoredSettings()
    },
    localData: {
      [GROWTH_STATS_KEY]: {
        installedAt: Date.now() - 10_000,
        successfulCopyCount: 1,
        firstSuccessfulCopyAt: Date.now() - 8_000
      },
      [TELEMETRY_EVENTS_KEY]: []
    }
  });

  const page = await loadExtensionPage({
    htmlPath: 'src/options/options.html',
    builtScriptPath: 'dist/src/options/options.js',
    pageUrl: 'https://example.com/src/options/options.html#pro',
    chrome: chromeMock
  });

  try {
    const womShareOpenButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#wom-share-open'
    );
    const womShareCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#wom-share-copy'
    );
    const womRateOpenButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#wom-rate-open'
    );
    const womFeedbackOpenButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#wom-feedback-open'
    );
    const womActionsStatus = getRequiredElement<HTMLElement>(
      page.dom.window.document,
      '#wom-actions-status'
    );

    assert.equal(womShareOpenButton.disabled, true);
    assert.equal(womShareCopyButton.disabled, true);
    assert.equal(womRateOpenButton.disabled, true);
    assert.equal(womFeedbackOpenButton.disabled, false);
    assert.equal(womActionsStatus.hidden, false);
    assert.match(womActionsStatus.textContent || '', /1/);

    clickElement(womFeedbackOpenButton);
    await page.waitForIdle();
    assert.match(
      chromeMock.logs.createdTabs.at(-1)?.url ?? '',
      /^https:\/\/github\.com\/ayqy\/copy\/issues\/new\?/
    );
  } finally {
    page.restore();
  }
}

async function runDevtoolsAssertions(): Promise<void> {
  const chromeMock = createChromeMock({
    extensionId: 'abcdefghijklmnopabcdefghijklmnop'
  });

  const devtoolsPage = await loadExtensionPage({
    htmlPath: 'src/devtools/devtools.html',
    builtScriptPath: 'dist/src/devtools/devtools.js',
    pageUrl: 'https://example.com/src/devtools/devtools.html',
    chrome: chromeMock
  });

  try {
    assert.deepEqual(chromeMock.logs.devtoolsSidebarPages, ['src/devtools/sidebar.html']);
  } finally {
    devtoolsPage.restore();
  }

  const sidebarPage = await loadExtensionPage({
    htmlPath: 'src/devtools/sidebar.html',
    builtScriptPath: 'dist/src/devtools/sidebar.js',
    pageUrl: 'https://example.com/src/devtools/sidebar.html',
    chrome: chromeMock
  });

  try {
    await sidebarPage.waitForIdle();
    const jsonContainer = getRequiredElement<HTMLTextAreaElement>(
      sidebarPage.dom.window.document,
      '#json-container'
    );
    assert.ok(jsonContainer.value.includes('"tagName": "div"'));
    assert.ok(chromeMock.logs.devtoolsEvalExpressions.length >= 1);
    assert.equal(chromeMock.logs.devtoolsSelectionChangedListenerCount, 1);

    const copyButton = getRequiredElement<HTMLButtonElement>(
      sidebarPage.dom.window.document,
      '#copy-button'
    );
    clickElement(copyButton);
    await sidebarPage.waitForIdle();
    assert.ok((await sidebarPage.clipboard.readText()).includes('"tagName": "div"'));
  } finally {
    sidebarPage.restore();
  }
}

async function run(): Promise<void> {
  await runPopupAssertions();
  await runPopupLockedWomAssertions();
  await runOptionsAssertions();
  await runOptionsLockedWomAssertions();
  await runDevtoolsAssertions();
  console.log('PASS ui-integration-tests');
}

void run();
