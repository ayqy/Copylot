import assert from 'node:assert/strict';

import { createChromeMock } from './test-helpers/chrome-mock.ts';
import { getRequiredElement, loadExtensionPage } from './test-helpers/extension-page-harness.ts';

const SETTINGS_KEY = 'copilot_settings';
const GROWTH_STATS_KEY = 'copilot_growth_stats';
const TELEMETRY_EVENTS_KEY = 'copilot_telemetry_events';

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
    const convertButton = getRequiredElement<HTMLButtonElement>(page.dom.window.document, '#convert-button');
    clickElement(convertButton);
    await page.waitForIdle();
    assert.equal(chromeMock.logs.queriedTabs.length, 1);
    assert.equal(chromeMock.logs.sentTabMessages.length, 1);

    const addPromptButton = getRequiredElement<HTMLButtonElement>(page.dom.window.document, '#add-prompt-button');
    clickElement(addPromptButton);
    await page.waitForIdle();
    assert.equal(chromeMock.logs.openedOptionsPageCount, 1);

    const feedbackLink = getRequiredElement<HTMLAnchorElement>(page.dom.window.document, '#feedback-link');
    clickElement(feedbackLink);
    await page.waitForIdle();
    assert.match(chromeMock.logs.createdTabs.at(-1)?.url ?? '', /^https:\/\/github\.com\/ayqy\/copy\/issues\/new\?/);

    const shareLink = getRequiredElement<HTMLAnchorElement>(page.dom.window.document, '#share-link');
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

    const popupProWaitlistButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#popup-pro-waitlist'
    );
    clickElement(popupProWaitlistButton);
    await page.waitForIdle();
    const waitlistUrl = chromeMock.logs.createdTabs.at(-1)?.url ?? '';
    assert.ok(waitlistUrl.includes('https://copy.useai.online/'));
    assert.ok(waitlistUrl.includes('#pro'));
    assert.ok(waitlistUrl.includes('utm_medium=popup'));
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
      [TELEMETRY_EVENTS_KEY]: [
        { name: 'pro_entry_opened', ts: Date.now() - 5_000, props: { source: 'options', campaign: 'twitter' } },
        { name: 'pro_waitlist_opened', ts: Date.now() - 4_000, props: { source: 'options', campaign: 'twitter' } },
        { name: 'pro_waitlist_copied', ts: Date.now() - 3_000, props: { source: 'options', campaign: 'twitter' } }
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
    const campaignInput = getRequiredElement<HTMLInputElement>(page.dom.window.document, '#pro-intent-campaign');
    assert.equal(campaignInput.closest('.form-group')?.hasAttribute('hidden'), true);
    campaignInput.value = 'twitter';
    campaignInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    campaignInput.dispatchEvent(new window.Event('change', { bubbles: true }));
    await page.waitForIdle();

    const proWaitlistButton = getRequiredElement<HTMLButtonElement>(page.dom.window.document, '#pro-waitlist-button');
    clickElement(proWaitlistButton);
    await page.waitForIdle();
    const waitlistUrl = chromeMock.logs.createdTabs.at(-1)?.url ?? '';
    assert.ok(waitlistUrl.includes('https://copy.useai.online/'));
    assert.ok(waitlistUrl.includes('#pro'));
    assert.ok(waitlistUrl.includes('utm_medium=options'));

    const proWaitlistCopyButton = getRequiredElement<HTMLButtonElement>(page.dom.window.document, '#pro-waitlist-copy');
    assert.equal(proWaitlistCopyButton.hidden, true);

    const proWaitlistUrlCopyButton = getRequiredElement<HTMLButtonElement>(
      page.dom.window.document,
      '#pro-waitlist-url-copy'
    );
    assert.equal(
      getRequiredElement<HTMLElement>(page.dom.window.document, '#pro-waitlist-distribution-toolkit').hidden,
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
    assert.ok((await page.clipboard.readText()).includes('twitter'));

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

    const womShareOpenButton = getRequiredElement<HTMLButtonElement>(page.dom.window.document, '#wom-share-open');
    clickElement(womShareOpenButton);
    await page.waitForIdle();
    assert.ok((chromeMock.logs.createdTabs.at(-1)?.url ?? '').includes('utm_medium=options'));

    const womShareCopyButton = getRequiredElement<HTMLButtonElement>(page.dom.window.document, '#wom-share-copy');
    clickElement(womShareCopyButton);
    await page.waitForIdle();
    assert.ok((await page.clipboard.readText()).includes('chromewebstore.google.com/detail/ai-copilot'));

    const womRateOpenButton = getRequiredElement<HTMLButtonElement>(page.dom.window.document, '#wom-rate-open');
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
    assert.match(chromeMock.logs.createdTabs.at(-1)?.url ?? '', /^https:\/\/github\.com\/ayqy\/copy\/issues\/new\?/);

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
    const jsonContainer = getRequiredElement<HTMLTextAreaElement>(sidebarPage.dom.window.document, '#json-container');
    assert.ok(jsonContainer.value.includes('"tagName": "div"'));
    assert.ok(chromeMock.logs.devtoolsEvalExpressions.length >= 1);
    assert.equal(chromeMock.logs.devtoolsSelectionChangedListenerCount, 1);

    const copyButton = getRequiredElement<HTMLButtonElement>(sidebarPage.dom.window.document, '#copy-button');
    clickElement(copyButton);
    await sidebarPage.waitForIdle();
    assert.ok((await sidebarPage.clipboard.readText()).includes('"tagName": "div"'));
  } finally {
    sidebarPage.restore();
  }
}

async function run(): Promise<void> {
  await runPopupAssertions();
  await runOptionsAssertions();
  await runDevtoolsAssertions();
  console.log('PASS ui-integration-tests');
}

void run();
