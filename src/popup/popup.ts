// @ts-ignore: CSS import for build process
import './popup.css';
import {
  FORCE_UI_LANGUAGE,
  getActivePrompts,
  getCachedSettings,
  getDefaultSettingsSnapshot,
  getSettings,
  saveSettings,
  type Settings
} from '../shared/settings-manager';
import {
  getQuickCommandDefaultShortcut,
  getQuickPromptBySlot,
  getQuickPromptSlotCommandName,
  QUICK_CONVERT_COMMAND,
  QUICK_PROMPT_SLOT_VALUES,
  type QuickCommandName,
  type QuickPromptSlot
} from '../shared/prompt-shortcuts';
import {
  buildChromeWebStoreDetailUrl,
  buildChromeWebStoreReviewsUrl,
  buildFeedbackIssueUrl,
  buildFeedbackSettingsSnapshot,
  buildShareCopyText,
  buildWomUtmParams,
  type I18nGetMessage
} from '../shared/word-of-mouth';
import {
  buildAppendSessionAudit,
  getAppendSessionState,
  type AppendSessionAudit
} from '../shared/append-session';
import { recordTelemetryEvent } from '../shared/telemetry';
import {
  createCopyActionFailure,
  isCopyActionResult,
  type CopyActionResult
} from '../shared/copy-action-result';

interface PopupElements {
  versionDisplay: HTMLElement;
  devBadge: HTMLElement;
  convertButton: HTMLButtonElement;
  convertButtonLabel: HTMLElement;
  convertShortcut: HTMLElement;
  copyActionStatus: HTMLElement;
  quickPromptsSection: HTMLElement;
  appendSessionCard: HTMLElement;
  appendSessionTitle: HTMLElement;
  appendSessionDescription: HTMLElement;
  appendSessionResetButton: HTMLButtonElement;
  enableMagicCopySwitch: HTMLInputElement;
  enableHoverMagicCopySwitch: HTMLInputElement;
  enableClipboardAccumulatorSwitch: HTMLInputElement;
  interactionClick: HTMLInputElement;
  interactionDblClick: HTMLInputElement;
  formatMarkdown: HTMLInputElement;
  formatPlaintext: HTMLInputElement;
  tableFormatMarkdown: HTMLInputElement;
  tableFormatCsv: HTMLInputElement;
  attachTitle: HTMLInputElement;
  attachURL: HTMLInputElement;
  toggleMoreSettingsButton: HTMLButtonElement;
  toggleMoreSettingsLabel: HTMLElement;
  moreSettingsPanel: HTMLElement;
  openShortcutSettingsButton: HTMLButtonElement;
  shortcutSettingsFeedback: HTMLElement;
  addPromptButton: HTMLButtonElement;
  upgradeProEntry: HTMLButtonElement;
  feedbackLink: HTMLAnchorElement;
  shareLink: HTMLAnchorElement;
  copyShareButton: HTMLButtonElement;
  rateLink: HTMLAnchorElement;
}

interface QuickActionElements {
  button: HTMLButtonElement;
  title: HTMLElement;
  shortcut: HTMLElement;
}

let elements: PopupElements;
let currentSettings: Settings;
let currentCommandShortcuts = new Map<string, string>();
let settingsInteractionRevision = 0;
const isE2EBuild = process.env.BUILD_TARGET === 'e2e';

function getMessage(key: string, substitutions?: string | string[]): string {
  return (
    chrome.i18n.getMessage(
      key,
      substitutions as Parameters<typeof chrome.i18n.getMessage>[1]
    ) || key
  );
}

async function persistSettingsPatch(settings: Partial<Settings>): Promise<void> {
  let response: { handled?: boolean; success?: boolean; error?: string } | undefined;
  try {
    response = await chrome.runtime.sendMessage({
      type: 'save-settings-patch',
      settings
    });
  } catch (error) {
    console.warn('Background settings transaction unavailable; using direct storage:', error);
  }

  if (response?.handled) {
    if (!response.success) {
      throw new Error(response.error || getMessage('savingFailed'));
    }
    return;
  }

  await saveSettings(settings);
}

function getElements(): PopupElements {
  return {
    versionDisplay: document.getElementById('version-display') as HTMLElement,
    devBadge: document.getElementById('dev-badge') as HTMLElement,
    convertButton: document.getElementById('convert-button') as HTMLButtonElement,
    convertButtonLabel: document.getElementById('convert-button-label') as HTMLElement,
    convertShortcut: document.getElementById('convert-shortcut') as HTMLElement,
    copyActionStatus: document.getElementById('copy-action-status') as HTMLElement,
    quickPromptsSection: document.getElementById('quick-prompts-section') as HTMLElement,
    appendSessionCard: document.getElementById('append-session-card') as HTMLElement,
    appendSessionTitle: document.getElementById('append-session-title') as HTMLElement,
    appendSessionDescription: document.getElementById('append-session-description') as HTMLElement,
    appendSessionResetButton: document.getElementById(
      'append-session-reset-button'
    ) as HTMLButtonElement,
    enableMagicCopySwitch: document.getElementById(
      'enable-magic-copy-switch'
    ) as HTMLInputElement,
    enableHoverMagicCopySwitch: document.getElementById(
      'enable-hover-magic-copy-switch'
    ) as HTMLInputElement,
    enableClipboardAccumulatorSwitch: document.getElementById(
      'enable-clipboard-accumulator-switch'
    ) as HTMLInputElement,
    interactionClick: document.getElementById('interaction-click') as HTMLInputElement,
    interactionDblClick: document.getElementById('interaction-dblclick') as HTMLInputElement,
    formatMarkdown: document.getElementById('format-markdown') as HTMLInputElement,
    formatPlaintext: document.getElementById('format-plaintext') as HTMLInputElement,
    tableFormatMarkdown: document.getElementById(
      'table-format-markdown'
    ) as HTMLInputElement,
    tableFormatCsv: document.getElementById('table-format-csv') as HTMLInputElement,
    attachTitle: document.getElementById('attach-title') as HTMLInputElement,
    attachURL: document.getElementById('attach-url') as HTMLInputElement,
    toggleMoreSettingsButton: document.getElementById(
      'toggle-more-settings'
    ) as HTMLButtonElement,
    toggleMoreSettingsLabel: document.getElementById(
      'toggle-more-settings-label'
    ) as HTMLElement,
    moreSettingsPanel: document.getElementById('more-settings-panel') as HTMLElement,
    openShortcutSettingsButton: document.getElementById(
      'open-shortcut-settings-button'
    ) as HTMLButtonElement,
    shortcutSettingsFeedback: document.getElementById(
      'shortcut-settings-feedback'
    ) as HTMLElement,
    addPromptButton: document.getElementById('add-prompt-button') as HTMLButtonElement,
    upgradeProEntry: document.getElementById('upgrade-pro-entry') as HTMLButtonElement,
    feedbackLink: document.getElementById('feedback-link') as HTMLAnchorElement,
    shareLink: document.getElementById('share-link') as HTMLAnchorElement,
    copyShareButton: document.getElementById('copy-share-button') as HTMLButtonElement,
    rateLink: document.getElementById('rate-link') as HTMLAnchorElement
  };
}

function getQuickActionElements(slot: QuickPromptSlot): QuickActionElements {
  return {
    button: document.getElementById(`quick-prompt-slot-${slot}-button`) as HTMLButtonElement,
    title: document.getElementById(`quick-prompt-slot-${slot}-title`) as HTMLElement,
    shortcut: document.getElementById(`quick-prompt-slot-${slot}-shortcut`) as HTMLElement
  };
}

function localizeUI(): void {
  if (FORCE_UI_LANGUAGE) {
    document.documentElement.lang = FORCE_UI_LANGUAGE;
  } else {
    document.documentElement.lang = chrome.i18n.getUILanguage?.() || 'en';
  }

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (!key) return;
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  });

  document.title = getMessage('appName');
}

function isMacPlatform(): boolean {
  return /mac/i.test(navigator.platform || '') || /mac/i.test(navigator.userAgent || '');
}

function getShortcutPlatform() {
  return isMacPlatform() ? 'mac' : 'default';
}

function getResolvedPopupTabId(): number | null {
  const rawTabId = new URL(window.location.href).searchParams.get('tab');
  if (!rawTabId) return null;
  const tabId = Number.parseInt(rawTabId, 10);
  return Number.isFinite(tabId) ? tabId : null;
}

async function resolveActiveTab(): Promise<chrome.tabs.Tab | null> {
  const resolvedTabId = getResolvedPopupTabId();
  if (resolvedTabId !== null) {
    try {
      return await chrome.tabs.get(resolvedTabId);
    } catch (error) {
      console.warn('Failed to resolve popup tab by query parameter:', error);
    }
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function reportE2ECopiedText(text: string): Promise<void> {
  if (!isE2EBuild) return;
  try {
    await chrome.runtime.sendMessage({ type: 'e2e:report-copied-text', text });
  } catch (error) {
    console.warn('Failed to report popup copied text for E2E:', error);
  }
}

async function reportE2EOpenedUrl(url: string): Promise<void> {
  if (!isE2EBuild) return;
  try {
    await chrome.runtime.sendMessage({ type: 'e2e:report-opened-url', url });
  } catch (error) {
    console.warn('Failed to report popup opened URL for E2E:', error);
  }
}

async function writeTextToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
  await reportE2ECopiedText(text);
}

async function loadCommandShortcuts(): Promise<void> {
  currentCommandShortcuts = new Map<string, string>();
  if (!chrome.commands?.getAll) return;

  try {
    const commands = await chrome.commands.getAll();
    commands.forEach((command) => {
      if (command.name) {
        currentCommandShortcuts.set(command.name, command.shortcut || '');
      }
    });
  } catch (error) {
    console.warn('Failed to load command shortcuts:', error);
  }
}

function getCommandShortcutLabel(command: QuickCommandName): string {
  const assigned = currentCommandShortcuts.get(command)?.trim();
  if (assigned) return assigned;
  if (currentCommandShortcuts.has(command)) return getMessage('shortcutNotSet');
  return getQuickCommandDefaultShortcut(command, getShortcutPlatform());
}

function setMoreSettingsExpanded(expanded: boolean): void {
  elements.toggleMoreSettingsButton.setAttribute('aria-expanded', String(expanded));
  elements.toggleMoreSettingsButton.classList.toggle('is-expanded', expanded);
  elements.moreSettingsPanel.hidden = !expanded;
  elements.toggleMoreSettingsLabel.textContent = getMessage(
    expanded ? 'collapseMoreSettings' : 'expandMoreSettings'
  );
}

function setQuickActionsDisabled(disabled: boolean): void {
  elements.convertButton.disabled = disabled;
  QUICK_PROMPT_SLOT_VALUES.forEach((slot) => {
    const action = getQuickActionElements(slot);
    if (!action.button.hidden) {
      action.button.disabled = disabled;
    }
  });
}

function setCopyActionStatus(
  state: 'idle' | 'working' | 'success' | 'error',
  message = ''
): void {
  if (state === 'idle') {
    elements.copyActionStatus.hidden = true;
    elements.copyActionStatus.textContent = '';
    delete elements.copyActionStatus.dataset.state;
    elements.copyActionStatus.setAttribute('role', 'status');
    elements.copyActionStatus.setAttribute('aria-live', 'polite');
    return;
  }

  elements.copyActionStatus.hidden = false;
  elements.copyActionStatus.dataset.state = state;
  elements.copyActionStatus.textContent = message;
  elements.copyActionStatus.setAttribute('role', state === 'error' ? 'alert' : 'status');
  elements.copyActionStatus.setAttribute('aria-live', state === 'error' ? 'assertive' : 'polite');
}

function getPopupFailure(code: 'NO_ACTIVE_TAB' | 'CONTENT_SCRIPT_UNAVAILABLE' | 'UNKNOWN'): CopyActionResult {
  const messageKey =
    code === 'NO_ACTIVE_TAB'
      ? 'copyErrorNoActiveTab'
      : code === 'CONTENT_SCRIPT_UNAVAILABLE'
        ? 'copyErrorPageUnavailable'
        : 'copyErrorUnknown';
  return createCopyActionFailure(code, getMessage(messageKey));
}

async function runQuickAction(command: string): Promise<void> {
  setQuickActionsDisabled(true);
  elements.convertButtonLabel.textContent = getMessage('popupCopyWorkingButton');
  setCopyActionStatus('working', getMessage('popupCopyWorking'));

  let result: CopyActionResult;
  try {
    const tab = await resolveActiveTab();
    if (!tab?.id) {
      result = getPopupFailure('NO_ACTIVE_TAB');
    } else if (command === QUICK_CONVERT_COMMAND) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'CONVERT_PAGE_WITH_SELECTION'
        });
        result = isCopyActionResult(response) ? response : getPopupFailure('UNKNOWN');
      } catch (error) {
        console.warn('Failed to reach content script from popup:', error);
        result = getPopupFailure('CONTENT_SCRIPT_UNAVAILABLE');
      }
    } else {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'run-quick-action',
          command,
          tabId: tab.id,
          source: 'popup'
        });
        result = isCopyActionResult(response) ? response : getPopupFailure('UNKNOWN');
      } catch (error) {
        console.error('Failed to run prompt quick action from popup:', error);
        result = getPopupFailure('UNKNOWN');
      }
    }
  } catch (error) {
    console.error('Failed to resolve popup copy action:', error);
    result = getPopupFailure('UNKNOWN');
  }

  if (result.success) {
    setCopyActionStatus('success', getMessage('popupCopySuccess'));
    window.setTimeout(() => window.close(), 320);
    return;
  }

  elements.convertButtonLabel.textContent = getMessage('convertButton');
  setQuickActionsDisabled(false);
  setCopyActionStatus('error', result.error);
  elements.convertButton.focus();
}

function renderQuickPromptButtons(settings: Settings): void {
  const activePrompts = getActivePrompts(settings.userPrompts);
  let visibleCount = 0;

  QUICK_PROMPT_SLOT_VALUES.forEach((slot) => {
    const action = getQuickActionElements(slot);
    const prompt = getQuickPromptBySlot(activePrompts, slot);
    if (!prompt) {
      action.button.hidden = true;
      action.button.dataset.promptId = '';
      action.title.textContent = '';
      action.shortcut.textContent = '';
      return;
    }

    visibleCount += 1;
    action.button.hidden = false;
    action.button.disabled = false;
    action.button.dataset.promptId = prompt.id;
    action.title.textContent = prompt.title;
    action.shortcut.textContent = getCommandShortcutLabel(
      getQuickPromptSlotCommandName(slot)
    );
  });

  elements.quickPromptsSection.hidden = visibleCount === 0;
}

function renderAppendSession(audit: AppendSessionAudit): void {
  const clipCount = audit.clipCount || 0;
  elements.appendSessionCard.hidden = clipCount === 0;
  elements.appendSessionResetButton.disabled = clipCount === 0;
  if (clipCount === 0) {
    elements.appendSessionTitle.textContent = '';
    elements.appendSessionDescription.textContent = '';
    return;
  }

  elements.appendSessionTitle.textContent = getMessage('popupAppendSessionTitle', [
    String(clipCount)
  ]);
  elements.appendSessionDescription.textContent =
    clipCount > 1
      ? getMessage('popupAppendSessionHintReady', [String(clipCount)])
      : getMessage('popupAppendSessionHintSingle');
}

async function loadAppendSession(): Promise<void> {
  try {
    renderAppendSession(buildAppendSessionAudit(await getAppendSessionState()));
  } catch (error) {
    console.warn('Failed to load append session:', error);
    renderAppendSession(buildAppendSessionAudit({ clipCount: 0 }));
  }
}

function updateUIFromSettings(settings: Settings): void {
  elements.enableMagicCopySwitch.checked = settings.isMagicCopyEnabled;
  elements.enableHoverMagicCopySwitch.checked = settings.isHoverMagicCopyEnabled;
  elements.enableClipboardAccumulatorSwitch.checked = settings.isClipboardAccumulatorEnabled;
  elements.interactionClick.checked = settings.interactionMode === 'click';
  elements.interactionDblClick.checked = settings.interactionMode !== 'click';
  elements.formatMarkdown.checked = settings.outputFormat === 'markdown';
  elements.formatPlaintext.checked = settings.outputFormat !== 'markdown';
  elements.tableFormatMarkdown.checked = settings.tableOutputFormat === 'markdown';
  elements.tableFormatCsv.checked = settings.tableOutputFormat !== 'markdown';
  elements.attachTitle.checked = settings.attachTitle;
  elements.attachURL.checked = settings.attachURL;
  elements.convertShortcut.textContent = getCommandShortcutLabel(QUICK_CONVERT_COMMAND);
  renderQuickPromptButtons(settings);
}

function getSettingsFromUI(): Partial<Settings> {
  return {
    isMagicCopyEnabled: elements.enableMagicCopySwitch.checked,
    isHoverMagicCopyEnabled: elements.enableHoverMagicCopySwitch.checked,
    isClipboardAccumulatorEnabled: elements.enableClipboardAccumulatorSwitch.checked,
    interactionMode: elements.interactionClick.checked ? 'click' : 'dblclick',
    outputFormat: elements.formatMarkdown.checked ? 'markdown' : 'plaintext',
    tableOutputFormat: elements.tableFormatMarkdown.checked ? 'markdown' : 'csv',
    attachTitle: elements.attachTitle.checked,
    attachURL: elements.attachURL.checked
  };
}

function applyHydratedSettings(settings: Settings): void {
  const pendingUiChanges = settingsInteractionRevision > 0 ? getSettingsFromUI() : {};
  currentSettings = { ...settings, ...pendingUiChanges };
  updateUIFromSettings(currentSettings);
}

async function hydrateSettingsFromCacheThenSync(): Promise<void> {
  const cachedSettings = await getCachedSettings();
  if (cachedSettings) {
    applyHydratedSettings(cachedSettings);
  }

  const syncedSettings = await getSettings();
  applyHydratedSettings(syncedSettings);
}

async function saveCurrentSettings(): Promise<void> {
  const revision = settingsInteractionRevision;
  const changes = getSettingsFromUI();
  currentSettings = { ...currentSettings, ...changes };
  try {
    await persistSettingsPatch(changes);
  } catch (error) {
    console.error('Failed to save popup settings:', error);
    if (settingsInteractionRevision === revision) {
      currentSettings = await getSettings();
      settingsInteractionRevision = 0;
      updateUIFromSettings(currentSettings);
    }
    setCopyActionStatus('error', getMessage('savingFailed'));
  }
}

async function clearAppendSession(): Promise<void> {
  elements.appendSessionResetButton.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'clear-append-session',
      clearedAt: Date.now()
    });
    if (!response?.success) {
      throw new Error(response?.error || getMessage('appendWorkflowClearFailed'));
    }
    await loadAppendSession();
  } catch (error) {
    console.warn('Failed to clear append session:', error);
    elements.appendSessionResetButton.disabled = false;
  }
}

function setShortcutSettingsFeedback(messageKey: string | null): void {
  elements.shortcutSettingsFeedback.hidden = !messageKey;
  elements.shortcutSettingsFeedback.textContent = messageKey ? getMessage(messageKey) : '';
}

async function openShortcutSettings(): Promise<void> {
  try {
    const url = 'chrome://extensions/shortcuts';
    await reportE2EOpenedUrl(url);
    await chrome.tabs.create({ url });
    setShortcutSettingsFeedback(null);
    window.close();
  } catch (error) {
    console.warn('Failed to open shortcut settings:', error);
    setShortcutSettingsFeedback('shortcutSettingsManualOpenHint');
  }
}

async function openOptionsSection(section: 'prompts' | 'pro'): Promise<void> {
  const url = `${chrome.runtime.getURL('src/options/options.html')}#${section}`;
  await reportE2EOpenedUrl(url);
  await chrome.tabs.create({ url });
  window.close();
}

function createI18nGetMessage(): I18nGetMessage {
  return (key, substitutions) =>
    chrome.i18n.getMessage(
      key,
      substitutions as Parameters<typeof chrome.i18n.getMessage>[1]
    );
}

function setupSettingsListeners(): void {
  [
    elements.interactionClick,
    elements.interactionDblClick,
    elements.formatMarkdown,
    elements.formatPlaintext,
    elements.tableFormatMarkdown,
    elements.tableFormatCsv,
    elements.attachTitle,
    elements.attachURL,
    elements.enableMagicCopySwitch,
    elements.enableHoverMagicCopySwitch,
    elements.enableClipboardAccumulatorSwitch
  ].forEach((control) => {
    control.addEventListener('change', () => {
      settingsInteractionRevision += 1;
      void saveCurrentSettings();
    });
  });

  elements.toggleMoreSettingsButton.addEventListener('click', () => {
    setMoreSettingsExpanded(
      elements.toggleMoreSettingsButton.getAttribute('aria-expanded') !== 'true'
    );
  });
  elements.appendSessionResetButton.addEventListener('click', () => {
    void clearAppendSession();
  });
}

function setupActionListeners(): void {
  elements.convertButton.addEventListener('click', () => {
    void runQuickAction(QUICK_CONVERT_COMMAND);
  });

  QUICK_PROMPT_SLOT_VALUES.forEach((slot) => {
    const action = getQuickActionElements(slot);
    action.button.addEventListener('click', () => {
      void runQuickAction(getQuickPromptSlotCommandName(slot));
    });
  });

  elements.openShortcutSettingsButton.addEventListener('click', () => {
    void openShortcutSettings();
  });
  elements.addPromptButton.addEventListener('click', () => {
    void openOptionsSection('prompts');
  });
  elements.upgradeProEntry.addEventListener('click', () => {
    void recordTelemetryEvent('pro_entry_opened', { source: 'popup' });
    void openOptionsSection('pro');
  });

  elements.feedbackLink.addEventListener('click', (event) => {
    event.preventDefault();
    void (async () => {
      const url = buildFeedbackIssueUrl({
        env: {
          extensionVersion: chrome.runtime.getManifest().version || '',
          extensionId: chrome.runtime.id,
          userAgent: navigator.userAgent || '',
          navigatorLanguage: navigator.language || '',
          uiLanguage: chrome.i18n.getUILanguage?.() || ''
        },
        settingsSnapshot: buildFeedbackSettingsSnapshot({
          ...currentSettings,
          ...getSettingsFromUI()
        }),
        getMessage: createI18nGetMessage()
      });
      await reportE2EOpenedUrl(url);
      await chrome.tabs.create({ url });
      window.close();
    })();
  });

  elements.shareLink.addEventListener('click', (event) => {
    event.preventDefault();
    void (async () => {
      const url = buildChromeWebStoreDetailUrl(
        chrome.runtime.id,
        buildWomUtmParams('popup')
      );
      await reportE2EOpenedUrl(url);
      await chrome.tabs.create({ url });
      window.close();
    })();
  });

  elements.rateLink.addEventListener('click', (event) => {
    event.preventDefault();
    void (async () => {
      const url = buildChromeWebStoreReviewsUrl(
        chrome.runtime.id,
        buildWomUtmParams('popup')
      );
      await reportE2EOpenedUrl(url);
      await chrome.tabs.create({ url });
      window.close();
    })();
  });

  elements.copyShareButton.addEventListener('click', async () => {
    const originalText = elements.copyShareButton.textContent || '';
    const storeUrl = buildChromeWebStoreDetailUrl(
      chrome.runtime.id,
      buildWomUtmParams('popup')
    );
    try {
      await writeTextToClipboard(buildShareCopyText(createI18nGetMessage(), storeUrl));
      elements.copyShareButton.textContent = getMessage('copied');
      window.setTimeout(() => {
        elements.copyShareButton.textContent = getMessage('copyShareText') || originalText;
      }, 1200);
    } catch (error) {
      console.error('Failed to copy share text:', error);
      setCopyActionStatus('error', getMessage('copyErrorClipboard'));
    }
  });
}

function setupDevelopmentEntry(): void {
  // @ts-ignore: injected at build time
  const isDevBuild =
    process.env.NODE_ENV !== 'production' || process.env.BUILD_TARGET !== 'production';
  elements.devBadge.hidden = !isDevBuild;
  if (!isDevBuild) return;

  let clickCount = 0;
  let clickTimer: number | null = null;
  elements.versionDisplay.addEventListener('click', () => {
    clickCount += 1;
    if (clickTimer) window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(() => {
      clickCount = 0;
    }, 1000);
    if (clickCount === 3) {
      clickCount = 0;
      if (clickTimer) window.clearTimeout(clickTimer);
      void chrome.tabs.create({ url: chrome.runtime.getURL('test/index.html') });
    }
  });
}

function initialize(): void {
  try {
    elements = getElements();
    localizeUI();
    setMoreSettingsExpanded(false);
    setCopyActionStatus('idle');

    const manifest = chrome.runtime.getManifest();
    elements.versionDisplay.textContent = manifest.version ? `V${manifest.version}` : '';
    setupDevelopmentEntry();

    currentSettings = getDefaultSettingsSnapshot();
    updateUIFromSettings(currentSettings);
    setupSettingsListeners();
    setupActionListeners();

    void hydrateSettingsFromCacheThenSync();
    void loadCommandShortcuts().then(() => updateUIFromSettings(currentSettings));
    void loadAppendSession();
    void recordTelemetryEvent('popup_opened');
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    if (elements?.copyActionStatus) {
      setCopyActionStatus('error', getMessage('copyErrorUnknown'));
    }
  }
}

document.getElementById('settings-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialize();
  });
} else {
  initialize();
}
