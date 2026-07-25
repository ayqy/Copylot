import assert from 'node:assert/strict';

import { createChromeMock } from './test-helpers/chrome-mock.ts';
import { getRequiredElement, loadExtensionPage } from './test-helpers/extension-page-harness.ts';

const SETTINGS_KEY = 'copilot_settings';
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
  quickAccessSlot?: number;
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
      [APPEND_SESSION_KEY]: {
        clipCount: 2,
        startedAt: Date.now() - 7_000,
        lastAppendedAt: Date.now() - 5_000,
        lastAction: 'append'
      }
    }
  });

  const page = await loadExtensionPage({
    htmlPath: 'src/popup/popup.html',
    builtScriptPath: 'dist/src/popup/popup.js',
    pageUrl: 'https://example.com/src/popup/popup.html',
    chrome: chromeMock
  });

  try {
    const document = page.dom.window.document;
    assert.equal(document.querySelector('#first-copy-title'), null);
    assert.equal(document.querySelector('#first-copy-status'), null);
    assert.equal(document.querySelector('#reuse-primary-card'), null);
    assert.equal(document.querySelector('#popup-onboarding-modal'), null);
    assert.equal(document.querySelector('#wom-status-hint'), null);

    const copyTitle = getRequiredElement<HTMLElement>(document, '#popup-copy-title');
    assert.match(copyTitle.textContent || '', /复制当前内容|Copy current content/i);

    const convertButton = getRequiredElement<HTMLButtonElement>(document, '#convert-button');
    assert.match(convertButton.textContent || '', /复制给 AI|Copy for AI/i);
    assert.equal(convertButton.disabled, false);
    assert.match(
      getRequiredElement<HTMLElement>(document, '#convert-shortcut').textContent || '',
      /Alt\+C/
    );

    const quickPromptsSection = getRequiredElement<HTMLElement>(
      document,
      '#quick-prompts-section'
    );
    assert.equal(quickPromptsSection.hidden, false);
    assert.equal(
      getRequiredElement<HTMLButtonElement>(document, '#quick-prompt-slot-1-button').hidden,
      false
    );
    assert.equal(
      getRequiredElement<HTMLButtonElement>(document, '#quick-prompt-slot-2-button').hidden,
      false
    );
    assert.equal(
      getRequiredElement<HTMLButtonElement>(document, '#quick-prompt-slot-3-button').hidden,
      true
    );
    assert.equal(
      getRequiredElement<HTMLElement>(document, '#quick-prompt-slot-2-title').textContent,
      'Custom Quick Slot 2'
    );

    const appendSessionCard = getRequiredElement<HTMLElement>(document, '#append-session-card');
    assert.equal(appendSessionCard.hidden, false);
    assert.match(
      getRequiredElement<HTMLElement>(document, '#append-session-title').textContent || '',
      /2/
    );

    const moreSettingsToggle = getRequiredElement<HTMLButtonElement>(
      document,
      '#toggle-more-settings'
    );
    assert.equal(moreSettingsToggle.getAttribute('aria-expanded'), 'false');
    assert.match(moreSettingsToggle.textContent || '', /更多复制设置|More copy settings/i);
    clickElement(moreSettingsToggle);
    await page.waitForIdle();
    assert.equal(getRequiredElement<HTMLElement>(document, '#more-settings-panel').hidden, false);
    assert.equal(moreSettingsToggle.getAttribute('aria-expanded'), 'true');

    clickElement(getRequiredElement<HTMLButtonElement>(document, '#add-prompt-button'));
    await page.waitForIdle();
    assert.ok(
      (chromeMock.logs.createdTabs.at(-1)?.url ?? '').includes(
        '/src/options/options.html#prompts'
      )
    );

    clickElement(
      getRequiredElement<HTMLButtonElement>(document, '#open-shortcut-settings-button')
    );
    await page.waitForIdle();
    assert.equal(chromeMock.logs.createdTabs.at(-1)?.url, 'chrome://extensions/shortcuts');

    const shareLink = getRequiredElement<HTMLAnchorElement>(document, '#share-link');
    const rateLink = getRequiredElement<HTMLAnchorElement>(document, '#rate-link');
    const copyShareButton = getRequiredElement<HTMLButtonElement>(document, '#copy-share-button');
    assert.notEqual(shareLink.getAttribute('aria-disabled'), 'true');
    assert.notEqual(rateLink.getAttribute('aria-disabled'), 'true');
    assert.equal(copyShareButton.disabled, false);

    clickElement(shareLink);
    await page.waitForIdle();
    assert.ok((chromeMock.logs.createdTabs.at(-1)?.url ?? '').includes('utm_medium=popup'));

    clickElement(rateLink);
    await page.waitForIdle();
    assert.ok((chromeMock.logs.createdTabs.at(-1)?.url ?? '').includes('/reviews?'));

    clickElement(getRequiredElement<HTMLButtonElement>(document, '#upgrade-pro-entry'));
    await page.waitForIdle();
    assert.ok(
      (chromeMock.logs.createdTabs.at(-1)?.url ?? '').includes('/src/options/options.html#pro')
    );

    clickElement(convertButton);
    await page.waitForIdle();
    assert.equal(chromeMock.logs.sentTabMessages.length, 1);
    assert.deepEqual(chromeMock.logs.sentTabMessages[0]?.message, {
      type: 'CONVERT_PAGE_WITH_SELECTION'
    });
    const status = getRequiredElement<HTMLElement>(document, '#copy-action-status');
    assert.equal(status.dataset.state, 'success');
    assert.match(status.textContent || '', /已复制|Copied/i);
  } finally {
    page.restore();
  }
}

async function runPopupFailureAssertions(): Promise<void> {
  const chromeMock = createChromeMock({
    extensionId: 'abcdefghijklmnopabcdefghijklmnop',
    syncData: {
      [SETTINGS_KEY]: buildStoredSettings()
    },
    tabMessageResponse: {
      success: false,
      code: 'NO_CONTENT',
      error: 'No copyable content was found. Select a section and try again.'
    }
  });

  const page = await loadExtensionPage({
    htmlPath: 'src/popup/popup.html',
    builtScriptPath: 'dist/src/popup/popup.js',
    pageUrl: 'https://example.com/src/popup/popup.html',
    chrome: chromeMock
  });

  try {
    const document = page.dom.window.document;
    const convertButton = getRequiredElement<HTMLButtonElement>(document, '#convert-button');
    clickElement(convertButton);
    await page.waitForIdle();

    const status = getRequiredElement<HTMLElement>(document, '#copy-action-status');
    assert.equal(status.hidden, false);
    assert.equal(status.dataset.state, 'error');
    assert.equal(status.getAttribute('role'), 'alert');
    assert.match(status.textContent || '', /Select a section and try again/i);
    assert.equal(convertButton.disabled, false);
    assert.match(convertButton.textContent || '', /Copy for AI/i);
  } finally {
    page.restore();
  }
}

async function runOptionsAssertions(): Promise<void> {
  const chromeMock = createChromeMock({
    extensionId: 'abcdefghijklmnopabcdefghijklmnop',
    syncData: {
      [SETTINGS_KEY]: buildStoredSettings({ isAnonymousUsageDataEnabled: true })
    },
    localData: {
      [TELEMETRY_EVENTS_KEY]: [
        {
          name: 'copy_success',
          ts: Date.now() - 3_000,
          props: { source: 'content' }
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
    const document = page.dom.window.document;
    assert.match(
      getRequiredElement<HTMLElement>(document, '.logo-section h1').textContent || '',
      /Copylot/
    );
    assert.equal(getRequiredElement<HTMLElement>(document, '#pro-tab').classList.contains('active'), true);

    const proText = getRequiredElement<HTMLElement>(document, '#pro-tab').textContent || '';
    assert.match(proText, /Copylot Pro/);
    assert.match(proText, /尚未上线|Not available yet/i);
    assert.match(proText, /没有订阅|no subscription/i);
    assert.match(proText, /免费|free/i);
    assert.equal(document.querySelectorAll('.roadmap-item').length, 3);
    assert.equal(document.querySelector('#pro-intent-campaign'), null);
    assert.equal(document.querySelector('#pro-validation-advanced-open'), null);
    assert.equal(document.querySelector('#pro-funnel-panel'), null);
    assert.equal(document.querySelector('#wom-actions-status'), null);
    assert.equal(document.querySelector('[id*="evidence"]'), null);
    assert.doesNotMatch(
      proText,
      /telemetry|funnel|campaign|validation lab|evidence pack|verdict|stay_validation|audit/i
    );

    const privacyTabButton = getRequiredElement<HTMLButtonElement>(
      document,
      '.tabs-nav .tab-btn[data-tab="privacy"]'
    );
    clickElement(privacyTabButton);
    await page.waitForIdle();
    assert.equal(
      getRequiredElement<HTMLElement>(document, '#privacy-tab').classList.contains('active'),
      true
    );

    const privacyText = getRequiredElement<HTMLElement>(document, '#privacy-tab').textContent || '';
    assert.match(privacyText, /本机处理|Processed locally/i);
    assert.match(privacyText, /Chrome Sync/i);
    assert.match(privacyText, /正文|webpage text/i);
    assert.match(privacyText, /URL/i);
    assert.equal(document.querySelector('#telemetry-events-panel'), null);
    assert.equal(document.querySelector('#growth-funnel-panel'), null);
    assert.equal(document.querySelector('#append-workflow-panel'), null);

    const usageSwitch = getRequiredElement<HTMLInputElement>(
      document,
      '#anonymous-usage-data-switch'
    );
    assert.equal(usageSwitch.checked, true);
    usageSwitch.checked = false;
    usageSwitch.dispatchEvent(new window.Event('change', { bubbles: true }));
    await page.waitForIdle();

    const storedSettings = chromeMock.storage.sync.snapshot()[SETTINGS_KEY] as Settings;
    assert.equal(storedSettings.isAnonymousUsageDataEnabled, false);
    const storedEvents = chromeMock.storage.local.snapshot()[TELEMETRY_EVENTS_KEY];
    assert.ok(storedEvents === undefined || (Array.isArray(storedEvents) && storedEvents.length === 0));
    const usageStatus = getRequiredElement<HTMLElement>(
      document,
      '#anonymous-usage-data-status'
    );
    assert.equal(usageStatus.dataset.state, 'disabled');
    assert.match(usageStatus.textContent || '', /已关闭|Off/i);

    const policyLink = getRequiredElement<HTMLAnchorElement>(
      document,
      '.privacy-policy-link'
    );
    assert.equal(policyLink.href, 'https://copy.useai.online/privacy');

    const optionsShortcutButton = getRequiredElement<HTMLButtonElement>(
      document,
      '#options-open-shortcut-settings'
    );
    clickElement(optionsShortcutButton);
    await page.waitForIdle();
    assert.equal(chromeMock.logs.createdTabs.at(-1)?.url, 'chrome://extensions/shortcuts');
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
  await runPopupFailureAssertions();
  await runOptionsAssertions();
  await runDevtoolsAssertions();
  console.log('PASS ui-integration-tests');
}

void run();
