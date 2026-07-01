// @ts-ignore: CSS import for build process
import './popup.css';
import { getActivePrompts, getSettings, saveSettings, type Settings, FORCE_UI_LANGUAGE } from '../shared/settings-manager';
import {
  getQuickCommandDefaultShortcut,
  QUICK_CONVERT_COMMAND,
  QUICK_PROMPT_SLOT_VALUES,
  getQuickPromptSlotCommandName,
  getQuickPromptBySlot,
  type QuickPromptSlot
} from '../shared/prompt-shortcuts';
import {
  buildChromeWebStoreDetailUrl,
  buildChromeWebStoreReviewsUrl,
  buildWomUtmParams,
  buildFeedbackIssueUrl,
  buildFeedbackSettingsSnapshot,
  buildShareCopyText,
  type I18nGetMessage
} from '../shared/word-of-mouth';
import {
  buildGrowthFunnelSummary,
  getGrowthStats,
  markFirstPopupOpened,
  type GrowthFunnelSummary
} from '../shared/growth-stats';
import { recordTelemetryEvent, sanitizeTelemetryEvents, TELEMETRY_EVENTS_KEY } from '../shared/telemetry';
import { buildProWaitlistUrl } from '../shared/external-links';
import { buildProIntentAttribution } from '../shared/pro-intent-attribution';

interface PopupElements {
  versionDisplay: HTMLElement;
  devBadge: HTMLElement;
  popupContent: HTMLElement;
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
  convertButton: HTMLButtonElement;
  openShortcutSettingsButton: HTMLButtonElement;
  shortcutSettingsFeedback: HTMLElement;
  addPromptButton: HTMLButtonElement;
  toggleMoreSettingsButton: HTMLButtonElement;
  toggleMoreSettingsLabel: HTMLElement;
  moreSettingsPanel: HTMLElement;
  feedbackLink: HTMLAnchorElement;
  shareLink: HTMLAnchorElement;
  copyShareButton: HTMLButtonElement;
  rateLink: HTMLAnchorElement;
  upgradeProEntry: HTMLButtonElement;
  popupProSurveyButton: HTMLButtonElement;
  popupProWaitlistButton: HTMLButtonElement;
  onboardingReopenButton: HTMLButtonElement;
  onboardingModal: HTMLElement;
  onboardingProgress: HTMLElement;
  onboardingSkipButton: HTMLButtonElement;
  onboardingPrevButton: HTMLButtonElement;
  onboardingNextButton: HTMLButtonElement;
  onboardingStep1: HTMLElement;
  onboardingStep2: HTMLElement;
  onboardingStep3: HTMLElement;
}

interface QuickActionElements {
  button: HTMLButtonElement;
  title: HTMLElement;
  shortcut: HTMLElement;
}

let elements: PopupElements;
let currentSettings: Settings;
let currentCommandShortcuts = new Map<string, string>();

const POPUP_ONBOARDING_TOTAL_STEPS = 3;
let onboardingCurrentStep = 1;
let isOnboardingOpen = false;
let onboardingSource: 'auto' | 'manual' = 'manual';
const isE2EBuild = process.env.BUILD_TARGET === 'e2e';

function getQuickActionElements(slot: QuickPromptSlot): QuickActionElements {
  return {
    button: document.getElementById(`quick-prompt-slot-${slot}-button`) as HTMLButtonElement,
    title: document.getElementById(`quick-prompt-slot-${slot}-title`) as HTMLElement,
    shortcut: document.getElementById(`quick-prompt-slot-${slot}-shortcut`) as HTMLElement
  };
}

function isMacPlatform(): boolean {
  return /mac/i.test(navigator.platform || '') || /mac/i.test(navigator.userAgent || '');
}

function getShortcutPlatform() {
  return isMacPlatform() ? 'mac' : 'default';
}

async function reportE2ECopiedText(text: string): Promise<void> {
  if (!isE2EBuild) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({
      type: 'e2e:report-copied-text',
      text
    });
  } catch (error) {
    console.warn('Failed to report popup copied text for E2E:', error);
  }
}

async function reportE2EOpenedUrl(url: string): Promise<void> {
  if (!isE2EBuild) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({
      type: 'e2e:report-opened-url',
      url
    });
  } catch (error) {
    console.warn('Failed to report popup opened url for E2E:', error);
  }
}

async function writeTextToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
  await reportE2ECopiedText(text);
}

function getResolvedPopupTabId(): number | null {
  const url = new URL(window.location.href);
  const raw = url.searchParams.get('tab');
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function resolveActiveTab(): Promise<chrome.tabs.Tab | null> {
  const resolvedTabId = getResolvedPopupTabId();
  if (resolvedTabId !== null) {
    try {
      return await chrome.tabs.get(resolvedTabId);
    } catch (error) {
      console.warn('Failed to resolve popup tab by query param:', error);
    }
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

function createI18nGetMessage(): I18nGetMessage {
  type MessageSubstitutions = Parameters<typeof chrome.i18n.getMessage>[1];
  return (key: string, substitutions?: string | string[]) => {
    return chrome.i18n.getMessage(key, substitutions as MessageSubstitutions);
  };
}

function getMessage(key: string, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(key, substitutions as Parameters<typeof chrome.i18n.getMessage>[1]) || key;
}

function getElements(): PopupElements {
  return {
    versionDisplay: document.getElementById('version-display') as HTMLElement,
    devBadge: document.getElementById('dev-badge') as HTMLElement,
    popupContent: document.getElementById('popup-content') as HTMLElement,
    enableMagicCopySwitch: document.getElementById('enable-magic-copy-switch') as HTMLInputElement,
    enableHoverMagicCopySwitch: document.getElementById('enable-hover-magic-copy-switch') as HTMLInputElement,
    enableClipboardAccumulatorSwitch: document.getElementById('enable-clipboard-accumulator-switch') as HTMLInputElement,
    interactionClick: document.getElementById('interaction-click') as HTMLInputElement,
    interactionDblClick: document.getElementById('interaction-dblclick') as HTMLInputElement,
    formatMarkdown: document.getElementById('format-markdown') as HTMLInputElement,
    formatPlaintext: document.getElementById('format-plaintext') as HTMLInputElement,
    tableFormatMarkdown: document.getElementById('table-format-markdown') as HTMLInputElement,
    tableFormatCsv: document.getElementById('table-format-csv') as HTMLInputElement,
    attachTitle: document.getElementById('attach-title') as HTMLInputElement,
    attachURL: document.getElementById('attach-url') as HTMLInputElement,
    convertButton: document.getElementById('convert-button') as HTMLButtonElement,
    openShortcutSettingsButton: document.getElementById('open-shortcut-settings-button') as HTMLButtonElement,
    shortcutSettingsFeedback: document.getElementById('shortcut-settings-feedback') as HTMLElement,
    addPromptButton: document.getElementById('add-prompt-button') as HTMLButtonElement,
    toggleMoreSettingsButton: document.getElementById('toggle-more-settings') as HTMLButtonElement,
    toggleMoreSettingsLabel: document.getElementById('toggle-more-settings-label') as HTMLElement,
    moreSettingsPanel: document.getElementById('more-settings-panel') as HTMLElement,
    feedbackLink: document.getElementById('feedback-link') as HTMLAnchorElement,
    shareLink: document.getElementById('share-link') as HTMLAnchorElement,
    copyShareButton: document.getElementById('copy-share-button') as HTMLButtonElement,
    rateLink: document.getElementById('rate-link') as HTMLAnchorElement,
    upgradeProEntry: document.getElementById('upgrade-pro-entry') as HTMLButtonElement,
    popupProSurveyButton: document.getElementById('popup-pro-survey') as HTMLButtonElement,
    popupProWaitlistButton: document.getElementById('popup-pro-waitlist') as HTMLButtonElement,
    onboardingReopenButton: document.getElementById('popup-onboarding-reopen') as HTMLButtonElement,
    onboardingModal: document.getElementById('popup-onboarding-modal') as HTMLElement,
    onboardingProgress: document.getElementById('popup-onboarding-progress') as HTMLElement,
    onboardingSkipButton: document.getElementById('popup-onboarding-skip') as HTMLButtonElement,
    onboardingPrevButton: document.getElementById('popup-onboarding-prev') as HTMLButtonElement,
    onboardingNextButton: document.getElementById('popup-onboarding-next') as HTMLButtonElement,
    onboardingStep1: document.getElementById('popup-onboarding-step-1') as HTMLElement,
    onboardingStep2: document.getElementById('popup-onboarding-step-2') as HTMLElement,
    onboardingStep3: document.getElementById('popup-onboarding-step-3') as HTMLElement
  };
}

function localizeUI() {
  if (FORCE_UI_LANGUAGE) {
    document.documentElement.lang = FORCE_UI_LANGUAGE;
  }

  const i18nElements = document.querySelectorAll('[data-i18n]');
  i18nElements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (!key) {
      return;
    }

    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  });

  document.title = chrome.i18n.getMessage('copylotSettings') || 'Copylot Settings';
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

async function saveCurrentSettings() {
  try {
    const newSettings = getSettingsFromUI();
    await saveSettings(newSettings);
    currentSettings = { ...currentSettings, ...newSettings };
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

function shouldAutoShowOnboarding(settings: Settings): boolean {
  return settings.popupOnboardingCompletedVersion < settings.popupOnboardingVersion;
}

function syncOnboardingEntryVisibility(settings: Settings) {
  elements.onboardingReopenButton.hidden = !shouldAutoShowOnboarding(settings);
}

function setMoreSettingsExpanded(expanded: boolean) {
  elements.toggleMoreSettingsButton.setAttribute('aria-expanded', String(expanded));
  elements.moreSettingsPanel.hidden = !expanded;
  elements.toggleMoreSettingsButton.classList.toggle('is-expanded', expanded);
  elements.toggleMoreSettingsLabel.textContent = expanded
    ? getMessage('collapseMoreSettings')
    : getMessage('expandMoreSettings');
}

function setOnboardingStep(step: number) {
  onboardingCurrentStep = Math.min(Math.max(step, 1), POPUP_ONBOARDING_TOTAL_STEPS);
  elements.onboardingStep1.hidden = onboardingCurrentStep !== 1;
  elements.onboardingStep2.hidden = onboardingCurrentStep !== 2;
  elements.onboardingStep3.hidden = onboardingCurrentStep !== 3;
  elements.onboardingProgress.textContent = `${onboardingCurrentStep}/${POPUP_ONBOARDING_TOTAL_STEPS}`;
  elements.onboardingPrevButton.disabled = onboardingCurrentStep === 1;
  elements.onboardingNextButton.textContent =
    onboardingCurrentStep >= POPUP_ONBOARDING_TOTAL_STEPS
      ? getMessage('popupOnboardingFinish')
      : getMessage('popupOnboardingNext');
}

function openOnboardingModal(source: 'auto' | 'manual') {
  onboardingSource = source;
  void recordTelemetryEvent('onboarding_shown', { source });
  isOnboardingOpen = true;
  setOnboardingStep(1);
  elements.onboardingModal.style.display = 'flex';
}

function closeOnboardingModal() {
  isOnboardingOpen = false;
  elements.onboardingModal.style.display = 'none';
}

async function completeOnboarding(action: 'finish' | 'skip') {
  try {
    await recordTelemetryEvent('onboarding_completed', { source: onboardingSource, action });
    const completedVersion = currentSettings.popupOnboardingVersion;
    const completedAt = Date.now();
    await saveSettings({
      popupOnboardingCompletedVersion: completedVersion,
      popupOnboardingCompletedAt: completedAt
    });
    currentSettings = {
      ...currentSettings,
      popupOnboardingCompletedVersion: completedVersion,
      popupOnboardingCompletedAt: completedAt
    };
    syncOnboardingEntryVisibility(currentSettings);
  } catch (error) {
    console.error('Error completing onboarding:', error);
  } finally {
    closeOnboardingModal();
  }
}

async function loadCommandShortcuts() {
  currentCommandShortcuts = new Map<string, string>();

  if (!chrome.commands?.getAll) {
    return;
  }

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

function getCommandShortcutLabel(command: string, fallback: string): string {
  const resolved = currentCommandShortcuts.get(command)?.trim();
  if (resolved) {
    return resolved;
  }

  if (!currentCommandShortcuts.has(command)) {
    return fallback || getMessage('shortcutNotSet');
  }

  return getMessage('shortcutNotSet');
}

function getAssignedCommandShortcut(command: string): string {
  return currentCommandShortcuts.get(command)?.trim() || '';
}

function getFallbackPromptShortcut(slot: QuickPromptSlot): string {
  return getQuickCommandDefaultShortcut(getQuickPromptSlotCommandName(slot), getShortcutPlatform());
}

function getFallbackConvertShortcut(): string {
  return getQuickCommandDefaultShortcut(QUICK_CONVERT_COMMAND, getShortcutPlatform());
}

function setShortcutSettingsFeedback(messageKey: string | null) {
  if (!messageKey) {
    elements.shortcutSettingsFeedback.hidden = true;
    elements.shortcutSettingsFeedback.textContent = '';
    return;
  }

  elements.shortcutSettingsFeedback.hidden = false;
  elements.shortcutSettingsFeedback.textContent = getMessage(messageKey);
}

async function openShortcutSettingsPage() {
  try {
    const optionsUrl = `${chrome.runtime.getURL('src/options/options.html')}#prompts`;
    await reportE2EOpenedUrl(optionsUrl);
    chrome.runtime.openOptionsPage();
    setShortcutSettingsFeedback(null);
  } catch (error) {
    console.warn('Failed to open options page from popup shortcut entry:', error);
    setShortcutSettingsFeedback('shortcutSettingsManualOpenHint');
  }
}

async function runQuickAction(command: string) {
  try {
    const tab = await resolveActiveTab();
    if (!tab?.id) {
      return;
    }

    if (command === QUICK_CONVERT_COMMAND) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'CONVERT_PAGE_WITH_SELECTION'
      });
    } else {
      await chrome.runtime.sendMessage({
        type: 'run-quick-action',
        command,
        tabId: tab.id
      });
    }

    window.close();
  } catch (error) {
    console.error('Failed to run quick action from popup:', error);
  }
}

function renderQuickPromptButtons(settings: Settings) {
  const activePrompts = getActivePrompts(settings.userPrompts).filter((prompt) => !prompt.builtIn);
  QUICK_PROMPT_SLOT_VALUES.forEach((slot) => {
    const prompt = getQuickPromptBySlot(activePrompts, slot);
    const quickAction = getQuickActionElements(slot);
    const commandName = getQuickPromptSlotCommandName(slot);
    const assignedShortcut = getAssignedCommandShortcut(commandName);
    const canUseFallbackShortcut = !currentCommandShortcuts.has(commandName);

    if (prompt && (assignedShortcut || canUseFallbackShortcut)) {
      quickAction.button.disabled = false;
      quickAction.button.hidden = false;
      quickAction.button.dataset.promptId = prompt.id;
      quickAction.title.textContent = prompt.title;
      quickAction.shortcut.textContent = getCommandShortcutLabel(commandName, getFallbackPromptShortcut(slot));
    } else {
      quickAction.button.hidden = true;
      quickAction.button.disabled = false;
      quickAction.button.dataset.promptId = '';
      quickAction.title.textContent = '';
      quickAction.shortcut.textContent = '';
    }
  });
}

function updateUIFromSettings(settings: Settings) {
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
  elements.convertButton.querySelector('.shortcut-hint')!.textContent = getCommandShortcutLabel(
    QUICK_CONVERT_COMMAND,
    getFallbackConvertShortcut()
  );
  renderQuickPromptButtons(settings);
}

async function loadSettingsAndCommands() {
  try {
    const [settings] = await Promise.all([getSettings(), loadCommandShortcuts()]);
    currentSettings = settings;
    updateUIFromSettings(currentSettings);
  } catch (error) {
    console.error('Error loading popup settings:', error);
  }
}

function setupQuickActionListeners() {
  elements.convertButton.addEventListener('click', () => {
    void runQuickAction(QUICK_CONVERT_COMMAND);
  });

  QUICK_PROMPT_SLOT_VALUES.forEach((slot) => {
    const quickAction = getQuickActionElements(slot);
    quickAction.button.addEventListener('click', () => {
      const prompt = getQuickPromptBySlot(
        getActivePrompts(currentSettings.userPrompts).filter((item) => !item.builtIn),
        slot
      );
      if (!prompt) {
        chrome.runtime.openOptionsPage();
        window.close();
        return;
      }
      void runQuickAction(getQuickPromptSlotCommandName(slot));
    });
  });
}

function setupSettingsListeners() {
  elements.interactionClick.addEventListener('change', saveCurrentSettings);
  elements.interactionDblClick.addEventListener('change', saveCurrentSettings);
  elements.formatMarkdown.addEventListener('change', saveCurrentSettings);
  elements.formatPlaintext.addEventListener('change', saveCurrentSettings);
  elements.tableFormatMarkdown.addEventListener('change', saveCurrentSettings);
  elements.tableFormatCsv.addEventListener('change', saveCurrentSettings);
  elements.attachTitle.addEventListener('change', saveCurrentSettings);
  elements.attachURL.addEventListener('change', saveCurrentSettings);
  elements.enableMagicCopySwitch.addEventListener('change', saveCurrentSettings);
  elements.enableHoverMagicCopySwitch.addEventListener('change', saveCurrentSettings);
  elements.enableClipboardAccumulatorSwitch.addEventListener('change', saveCurrentSettings);
  elements.toggleMoreSettingsButton.addEventListener('click', () => {
    const expanded = elements.toggleMoreSettingsButton.getAttribute('aria-expanded') === 'true';
    setMoreSettingsExpanded(!expanded);
  });
}

function setupEventListeners() {
  const i18nGetMessage = createI18nGetMessage();

  setupQuickActionListeners();
  setupSettingsListeners();

  elements.addPromptButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  elements.openShortcutSettingsButton.addEventListener('click', () => {
    void openShortcutSettingsPage();
  });

  elements.upgradeProEntry.addEventListener('click', async () => {
    const attrs = buildProIntentAttribution({
      source: 'popup',
      content: 'popup_upgrade_cta',
      campaign: currentSettings?.proIntentCampaign
    });
    const props = {
      source: attrs.source,
      medium: attrs.medium,
      content: attrs.content,
      ...(attrs.campaign ? { campaign: attrs.campaign } : {})
    };
    await recordTelemetryEvent('pro_entry_opened', props);
    const url = `${chrome.runtime.getURL('src/options/options.html')}#pro`;
    await reportE2EOpenedUrl(url);
    chrome.tabs.create({ url });
    window.close();
  });

  elements.popupProSurveyButton.addEventListener('click', async () => {
    const attrs = buildProIntentAttribution({
      source: 'popup',
      content: 'popup_survey_cta',
      campaign: currentSettings?.proIntentCampaign
    });
    const props = {
      source: attrs.source,
      medium: attrs.medium,
      content: attrs.content,
      ...(attrs.campaign ? { campaign: attrs.campaign } : {})
    };
    await recordTelemetryEvent('pro_entry_opened', props);
    await recordTelemetryEvent('pro_intent_form_start', props);
    const url = `${chrome.runtime.getURL('src/options/options.html')}?pro_survey_source=popup#pro-waitlist-survey`;
    await reportE2EOpenedUrl(url);
    chrome.tabs.create({ url });
    window.close();
  });

  elements.popupProWaitlistButton.addEventListener('click', async () => {
    const attrs = buildProIntentAttribution({
      source: 'popup',
      content: 'popup_waitlist_cta',
      campaign: currentSettings?.proIntentCampaign
    });
    const props = {
      source: attrs.source,
      medium: attrs.medium,
      content: attrs.content,
      ...(attrs.campaign ? { campaign: attrs.campaign } : {})
    };
    await recordTelemetryEvent('pro_entry_opened', props);
    await recordTelemetryEvent('pro_waitlist_opened', props);
    const waitlistUrl = buildProWaitlistUrl({
      medium: 'popup',
      campaign: currentSettings?.proIntentCampaign,
      content: 'popup_waitlist_cta',
      env: {
        extensionVersion: chrome.runtime.getManifest().version || '',
        extensionId: chrome.runtime.id,
        navigatorLanguage: navigator.language || '',
        uiLanguage: chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage() : ''
      }
    });
    await reportE2EOpenedUrl(waitlistUrl);
    chrome.tabs.create({ url: waitlistUrl });
    window.close();
  });

  elements.feedbackLink.addEventListener('click', (event) => {
    event.preventDefault();
    void (async () => {
      await recordTelemetryEvent('wom_feedback_opened', { source: 'popup' });
      const mergedSettings = { ...currentSettings, ...getSettingsFromUI() } as Settings;
      const settingsSnapshot = buildFeedbackSettingsSnapshot(mergedSettings);

      let growthStatsSnapshot: Awaited<ReturnType<typeof getGrowthStats>> | undefined;
      try {
        growthStatsSnapshot = await getGrowthStats();
      } catch (error) {
        console.warn('Failed to read growth stats for feedback template:', error);
      }

      let growthFunnelSummarySnapshot: GrowthFunnelSummary | undefined;
      try {
        if (growthStatsSnapshot) {
          growthFunnelSummarySnapshot = buildGrowthFunnelSummary(growthStatsSnapshot, Date.now());
        }
      } catch (error) {
        console.warn('Failed to build growth funnel summary for feedback template:', error);
      }

      let telemetryEventsSnapshot: ReturnType<typeof sanitizeTelemetryEvents> | undefined;
      try {
        if (settingsSnapshot.isAnonymousUsageDataEnabled && chrome.storage?.local) {
          const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
          telemetryEventsSnapshot = sanitizeTelemetryEvents(result[TELEMETRY_EVENTS_KEY]);
        }
      } catch (error) {
        console.warn('Failed to read telemetry events for feedback template:', error);
      }

      const feedbackUrl = buildFeedbackIssueUrl({
        env: {
          extensionVersion: chrome.runtime.getManifest().version || '',
          extensionId: chrome.runtime.id,
          userAgent: navigator.userAgent || '',
          navigatorLanguage: navigator.language || '',
          uiLanguage: chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage() : ''
        },
        settingsSnapshot,
        growthStatsSnapshot,
        growthFunnelSummarySnapshot,
        telemetryEventsSnapshot,
        getMessage: i18nGetMessage
      });
      await reportE2EOpenedUrl(feedbackUrl);
      chrome.tabs.create({ url: feedbackUrl });
      window.close();
    })();
  });

  elements.shareLink.addEventListener('click', (event) => {
    event.preventDefault();
    void (async () => {
      await recordTelemetryEvent('wom_share_opened', { source: 'popup' });
      const storeUrl = buildChromeWebStoreDetailUrl(chrome.runtime.id, buildWomUtmParams('popup'));
      await reportE2EOpenedUrl(storeUrl);
      chrome.tabs.create({ url: storeUrl });
      window.close();
    })();
  });

  elements.rateLink.addEventListener('click', (event) => {
    event.preventDefault();
    void (async () => {
      await recordTelemetryEvent('wom_rate_opened', { source: 'popup' });
      const reviewsUrl = buildChromeWebStoreReviewsUrl(chrome.runtime.id, buildWomUtmParams('popup'));
      await reportE2EOpenedUrl(reviewsUrl);
      chrome.tabs.create({ url: reviewsUrl });
      window.close();
    })();
  });

  elements.copyShareButton.addEventListener('click', async () => {
    const storeUrl = buildChromeWebStoreDetailUrl(chrome.runtime.id, buildWomUtmParams('popup'));
    const shareText = buildShareCopyText(i18nGetMessage, storeUrl);
    const originalText = elements.copyShareButton.textContent || '';

    try {
      await writeTextToClipboard(shareText);
      void recordTelemetryEvent('wom_share_copied', { source: 'popup' });
      elements.copyShareButton.textContent = chrome.i18n.getMessage('copied') || originalText;
      window.setTimeout(() => {
        elements.copyShareButton.textContent = chrome.i18n.getMessage('copyShareText') || originalText;
      }, 1200);
    } catch (error) {
      console.error('Error copying share text:', error);
      elements.copyShareButton.textContent = originalText;
    }
  });

  elements.onboardingReopenButton.addEventListener('click', () => {
    openOnboardingModal('manual');
  });

  elements.onboardingSkipButton.addEventListener('click', () => {
    void completeOnboarding('skip');
  });

  elements.onboardingPrevButton.addEventListener('click', () => {
    setOnboardingStep(onboardingCurrentStep - 1);
  });

  elements.onboardingNextButton.addEventListener('click', () => {
    if (onboardingCurrentStep >= POPUP_ONBOARDING_TOTAL_STEPS) {
      void completeOnboarding('finish');
      return;
    }
    setOnboardingStep(onboardingCurrentStep + 1);
  });

  elements.onboardingModal.addEventListener('click', (event) => {
    if (event.target === elements.onboardingModal) {
      void completeOnboarding('skip');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!isOnboardingOpen) {
      return;
    }
    if (event.key === 'Escape') {
      void completeOnboarding('skip');
    }
  });
}

function setupFormHandler() {
  const form = document.getElementById('settings-form') as HTMLFormElement;
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
  });
}

async function initialize() {
  try {
    elements = getElements();
    void recordTelemetryEvent('popup_opened');
    void markFirstPopupOpened().catch((error) => {
      console.warn('Failed to mark first popup opened:', error);
    });

    // @ts-ignore: injected at build time
    const isDevBuild = process.env.NODE_ENV !== 'production' || process.env.BUILD_TARGET !== 'production';
    if (isDevBuild) {
      elements.devBadge.hidden = false;
    }

    const manifest = chrome.runtime.getManifest();
    if (manifest.version) {
      elements.versionDisplay.textContent = `V${manifest.version}`;
    }

    // @ts-ignore: injected at build time
    if (process.env.NODE_ENV !== 'production' || process.env.BUILD_TARGET !== 'production') {
      let clickCount = 0;
      let clickTimer: number | null = null;
      elements.versionDisplay.addEventListener('click', () => {
        clickCount += 1;
        if (clickTimer) {
          clearTimeout(clickTimer);
        }
        clickTimer = window.setTimeout(() => {
          clickCount = 0;
        }, 1000);

        if (clickCount === 3) {
          clickCount = 0;
          clearTimeout(clickTimer!);
          chrome.tabs.create({ url: chrome.runtime.getURL('test/index.html') });
        }
      });
    }

    localizeUI();
    setMoreSettingsExpanded(false);
    await loadSettingsAndCommands();
    syncOnboardingEntryVisibility(currentSettings);
    setupEventListeners();
    setupFormHandler();

    const shouldForceShowOnboarding = window.location.hash === '#onboarding';
    if (shouldForceShowOnboarding) {
      openOnboardingModal('manual');
    } else if (shouldAutoShowOnboarding(currentSettings)) {
      openOnboardingModal('auto');
    }
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  void initialize();
}
