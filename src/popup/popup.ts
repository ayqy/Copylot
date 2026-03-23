// @ts-ignore: CSS import for build process
import './popup.css';
import {
  getSettings,
  saveSettings,
  type Settings,
  FORCE_UI_LANGUAGE
} from '../shared/settings-manager';
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
  markProPromptShown,
  markRatingPromptShown,
  setProPromptAction,
  setRatingPromptAction,
  shouldShowProPrompt,
  shouldShowRatingPrompt,
  type ProPromptAction,
  type GrowthFunnelSummary
} from '../shared/growth-stats';
import { recordTelemetryEvent, sanitizeTelemetryEvents, TELEMETRY_EVENTS_KEY } from '../shared/telemetry';
import { buildProWaitlistUrl } from '../shared/external-links';
import { buildProWaitlistCopyText } from '../shared/monetization';

// DOM Elements
interface PopupElements {
  versionDisplay: HTMLElement;
  devBadge: HTMLElement;
  ratingPrompt: HTMLElement;
  ratingPromptRateButton: HTMLButtonElement;
  ratingPromptLaterButton: HTMLButtonElement;
  ratingPromptNeverButton: HTMLButtonElement;
  enableMagicCopySwitch: HTMLInputElement;
  enableHoverMagicCopySwitch: HTMLInputElement;
  enableClipboardAccumulatorSwitch: HTMLInputElement;
  interactionClick: HTMLInputElement;
  interactionDblClick: HTMLInputElement;
  formatMarkdown: HTMLInputElement;
  formatPlaintext: HTMLInputElement;
  tableFormatMarkdown: HTMLInputElement; // Added for table format
  tableFormatCsv: HTMLInputElement; // Added for table format
  attachTitle: HTMLInputElement;
  attachURL: HTMLInputElement;
  convertButton: HTMLButtonElement;
  addPromptButton: HTMLButtonElement;
  promptModal: HTMLElement;
  promptForm: HTMLFormElement;
  modalTitle: HTMLElement;
  promptId: HTMLInputElement;
  promptTitle: HTMLInputElement;
  promptTemplate: HTMLTextAreaElement;
  savePromptButton: HTMLButtonElement;
  cancelPromptButton: HTMLButtonElement;
  closeModalButton: HTMLElement;
  popupContent: HTMLElement;
  feedbackLink: HTMLAnchorElement;
  shareLink: HTMLAnchorElement;
  copyShareButton: HTMLButtonElement;
  rateLink: HTMLAnchorElement;

  // Pro waitlist prompt (low-disturb)
  proWaitlistPrompt: HTMLDetailsElement;
  proWaitlistPromptJoinButton: HTMLButtonElement;
  proWaitlistPromptLaterButton: HTMLButtonElement;
  proWaitlistPromptNeverButton: HTMLButtonElement;

  // Pro entry
  upgradeProEntry: HTMLButtonElement;
  popupProWaitlistButton: HTMLButtonElement;
  popupProWaitlistCopyButton: HTMLButtonElement;

  // Popup onboarding
  onboardingReopenButton: HTMLButtonElement;
  onboardingModal: HTMLElement;
  onboardingProgress: HTMLElement;
  onboardingCloseButton: HTMLButtonElement;
  onboardingSkipButton: HTMLButtonElement;
  onboardingPrevButton: HTMLButtonElement;
  onboardingNextButton: HTMLButtonElement;
  onboardingFinishButton: HTMLButtonElement;
  onboardingApplyRecommendedButton: HTMLButtonElement;
  onboardingOpenOptionsButton: HTMLButtonElement;
  onboardingStep1: HTMLElement;
  onboardingStep2: HTMLElement;
  onboardingStep3: HTMLElement;
}

let elements: PopupElements;
let currentSettings: Settings;

const POPUP_ONBOARDING_TOTAL_STEPS = 3;
const POPUP_ONBOARDING_RECOMMENDED_SETTINGS: Partial<Settings> = {
  interactionMode: 'click',
  isHoverMagicCopyEnabled: false,
  outputFormat: 'markdown',
  tableOutputFormat: 'markdown',
  attachTitle: false,
  attachURL: false
};

let onboardingCurrentStep = 1;
let isOnboardingOpen = false;
let onboardingSource: 'auto' | 'manual' = 'manual';

/**
 * Get all required DOM elements
 */
function getElements(): PopupElements {
  return {
    versionDisplay: document.getElementById('version-display') as HTMLElement,
    devBadge: document.getElementById('dev-badge') as HTMLElement,
    ratingPrompt: document.getElementById('rating-prompt') as HTMLElement,
    ratingPromptRateButton: document.getElementById('rating-prompt-rate') as HTMLButtonElement,
    ratingPromptLaterButton: document.getElementById('rating-prompt-later') as HTMLButtonElement,
    ratingPromptNeverButton: document.getElementById('rating-prompt-never') as HTMLButtonElement,
    enableMagicCopySwitch: document.getElementById('enable-magic-copy-switch') as HTMLInputElement,
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
    tableFormatMarkdown: document.getElementById('table-format-markdown') as HTMLInputElement, // Added
    tableFormatCsv: document.getElementById('table-format-csv') as HTMLInputElement, // Added
    attachTitle: document.getElementById('attach-title') as HTMLInputElement,
    attachURL: document.getElementById('attach-url') as HTMLInputElement,
    convertButton: document.getElementById('convert-button') as HTMLButtonElement,
    addPromptButton: document.getElementById('add-prompt-button') as HTMLButtonElement,
    promptModal: document.getElementById('prompt-modal') as HTMLElement,
    promptForm: document.getElementById('prompt-form') as HTMLFormElement,
    modalTitle: document.getElementById('modal-title') as HTMLElement,
    promptId: document.getElementById('prompt-id') as HTMLInputElement,
    promptTitle: document.getElementById('prompt-title') as HTMLInputElement,
    promptTemplate: document.getElementById('prompt-template') as HTMLTextAreaElement,
    savePromptButton: document.getElementById('save-prompt-button') as HTMLButtonElement,
    cancelPromptButton: document.getElementById('cancel-prompt-button') as HTMLButtonElement,
    closeModalButton: document.querySelector('.close-button') as HTMLElement,
    popupContent: document.getElementById('popup-content') as HTMLElement,
    feedbackLink: document.getElementById('feedback-link') as HTMLAnchorElement,
    shareLink: document.getElementById('share-link') as HTMLAnchorElement,
    copyShareButton: document.getElementById('copy-share-button') as HTMLButtonElement,
    rateLink: document.getElementById('rate-link') as HTMLAnchorElement,

    proWaitlistPrompt: document.getElementById('pro-waitlist-prompt') as HTMLDetailsElement,
    proWaitlistPromptJoinButton: document.getElementById(
      'pro-waitlist-prompt-join'
    ) as HTMLButtonElement,
    proWaitlistPromptLaterButton: document.getElementById(
      'pro-waitlist-prompt-later'
    ) as HTMLButtonElement,
    proWaitlistPromptNeverButton: document.getElementById(
      'pro-waitlist-prompt-never'
    ) as HTMLButtonElement,

    upgradeProEntry: document.getElementById('upgrade-pro-entry') as HTMLButtonElement,
    popupProWaitlistButton: document.getElementById('popup-pro-waitlist') as HTMLButtonElement,
    popupProWaitlistCopyButton: document.getElementById('popup-pro-waitlist-copy') as HTMLButtonElement,

    onboardingReopenButton: document.getElementById('popup-onboarding-reopen') as HTMLButtonElement,
    onboardingModal: document.getElementById('popup-onboarding-modal') as HTMLElement,
    onboardingProgress: document.getElementById('popup-onboarding-progress') as HTMLElement,
    onboardingCloseButton: document.getElementById('popup-onboarding-close') as HTMLButtonElement,
    onboardingSkipButton: document.getElementById('popup-onboarding-skip') as HTMLButtonElement,
    onboardingPrevButton: document.getElementById('popup-onboarding-prev') as HTMLButtonElement,
    onboardingNextButton: document.getElementById('popup-onboarding-next') as HTMLButtonElement,
    onboardingFinishButton: document.getElementById('popup-onboarding-finish') as HTMLButtonElement,
    onboardingApplyRecommendedButton: document.getElementById(
      'popup-onboarding-apply-recommended'
    ) as HTMLButtonElement,
    onboardingOpenOptionsButton: document.getElementById(
      'popup-onboarding-open-options'
    ) as HTMLButtonElement,
    onboardingStep1: document.getElementById('popup-onboarding-step-1') as HTMLElement,
    onboardingStep2: document.getElementById('popup-onboarding-step-2') as HTMLElement,
    onboardingStep3: document.getElementById('popup-onboarding-step-3') as HTMLElement
  };
}

function createI18nGetMessage(): I18nGetMessage {
  type MessageSubstitutions = Parameters<typeof chrome.i18n.getMessage>[1];
  return (key: string, substitutions?: string | string[]) => {
    return chrome.i18n.getMessage(key, substitutions as MessageSubstitutions);
  };
}

/**
 * Localize the UI based on current locale
 */
function localizeUI() {
  if (FORCE_UI_LANGUAGE) {
    document.documentElement.lang = FORCE_UI_LANGUAGE;
  }

  // Find all elements with data-i18n attribute
  const i18nElements = document.querySelectorAll('[data-i18n]');

  i18nElements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      const message = chrome.i18n.getMessage(key);
      if (message) {
        if (element.tagName === 'INPUT' && element.getAttribute('type') === 'button') {
          (element as HTMLInputElement).value = message;
        } else {
          element.textContent = message;
        }
      }
    }
  });

  // Set page title
  document.title = chrome.i18n.getMessage('copylotSettings') || 'Copylot Settings';
}

/**
 * Load current settings and update UI
 */
async function loadSettings() {
  try {
    currentSettings = await getSettings();
    updateUIFromSettings(currentSettings);
    console.debug('Settings loaded:', currentSettings);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Update UI elements based on settings
 */
function updateUIFromSettings(settings: Settings) {
  // Enable/Disable Magic Copy
  elements.enableMagicCopySwitch.checked = settings.isMagicCopyEnabled;
  elements.enableHoverMagicCopySwitch.checked = settings.isHoverMagicCopyEnabled;
  elements.enableClipboardAccumulatorSwitch.checked = settings.isClipboardAccumulatorEnabled;

  // Interaction mode
  if (settings.interactionMode === 'click') {
    elements.interactionClick.checked = true;
  } else {
    elements.interactionDblClick.checked = true;
  }

  // Output format
  if (settings.outputFormat === 'markdown') {
    elements.formatMarkdown.checked = true;
  } else {
    elements.formatPlaintext.checked = true;
  }

  // Table output format
  if (settings.tableOutputFormat === 'markdown') {
    elements.tableFormatMarkdown.checked = true;
  } else {
    elements.tableFormatCsv.checked = true;
  }

  // Additional info
  elements.attachTitle.checked = settings.attachTitle;
  elements.attachURL.checked = settings.attachURL;

  // language field removed from UI; keep default stored value
}

/**
 * Get settings from UI
 */
function getSettingsFromUI(): Partial<Settings> {
  return {
    isMagicCopyEnabled: elements.enableMagicCopySwitch.checked,
    isHoverMagicCopyEnabled: elements.enableHoverMagicCopySwitch.checked,
    isClipboardAccumulatorEnabled: elements.enableClipboardAccumulatorSwitch.checked,
    interactionMode: elements.interactionClick.checked ? 'click' : 'dblclick',
    outputFormat: elements.formatMarkdown.checked ? 'markdown' : 'plaintext',
    tableOutputFormat: elements.tableFormatMarkdown.checked ? 'markdown' : 'csv', // Added
    attachTitle: elements.attachTitle.checked,
    attachURL: elements.attachURL.checked
    // language field removed from UI; keep default stored value
  };
}

/**
 * Save settings from UI
 */
async function saveCurrentSettings() {
  try {
    const newSettings = getSettingsFromUI();
    await saveSettings(newSettings);

    // Update current settings
    currentSettings = { ...currentSettings, ...newSettings };

    console.debug('Settings saved:', newSettings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

function shouldAutoShowOnboarding(settings: Settings): boolean {
  return settings.popupOnboardingCompletedVersion < settings.popupOnboardingVersion;
}

function setOnboardingStep(step: number) {
  onboardingCurrentStep = Math.min(Math.max(step, 1), POPUP_ONBOARDING_TOTAL_STEPS);

  elements.onboardingStep1.hidden = onboardingCurrentStep !== 1;
  elements.onboardingStep2.hidden = onboardingCurrentStep !== 2;
  elements.onboardingStep3.hidden = onboardingCurrentStep !== 3;

  elements.onboardingProgress.textContent = `${onboardingCurrentStep}/${POPUP_ONBOARDING_TOTAL_STEPS}`;

  elements.onboardingPrevButton.disabled = onboardingCurrentStep === 1;

  const isLast = onboardingCurrentStep === POPUP_ONBOARDING_TOTAL_STEPS;
  elements.onboardingNextButton.hidden = isLast;
  elements.onboardingFinishButton.hidden = !isLast;
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
  void recordTelemetryEvent('onboarding_completed', { source: onboardingSource, action });
  try {
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

    closeOnboardingModal();
  } catch (error) {
    console.error('Error completing onboarding:', error);
    closeOnboardingModal();
  }
}

async function applyRecommendedSettings() {
  try {
    await saveSettings(POPUP_ONBOARDING_RECOMMENDED_SETTINGS);
    currentSettings = { ...currentSettings, ...POPUP_ONBOARDING_RECOMMENDED_SETTINGS };
    updateUIFromSettings(currentSettings);
  } catch (error) {
    console.error('Error applying recommended settings:', error);
  }
}

function hideRatingPrompt() {
  elements.ratingPrompt.hidden = true;
}

function hideProWaitlistPrompt() {
  if (!elements?.proWaitlistPrompt) return;
  elements.proWaitlistPrompt.hidden = true;
}

async function maybeShowRatingPrompt() {
  try {
    const now = Date.now();
    const stats = await getGrowthStats(now);

    if (shouldShowRatingPrompt(stats, now)) {
      // Important: once the prompt becomes visible, persist `ratingPromptShownAt` immediately.
      await markRatingPromptShown(now);
      elements.ratingPrompt.hidden = false;
      void recordTelemetryEvent('rating_prompt_shown', { source: 'rating_prompt' });
      return;
    }
  } catch (error) {
    console.error('Error evaluating rating prompt:', error);
  }

  hideRatingPrompt();
}

async function maybeShowProWaitlistPrompt() {
  try {
    // Avoid stacking prompts in the same popup session.
    if (!elements.ratingPrompt.hidden) {
      hideProWaitlistPrompt();
      return;
    }

    const now = Date.now();
    const stats = await getGrowthStats(now);

    if (shouldShowProPrompt(stats, now)) {
      await markProPromptShown(now);
      elements.proWaitlistPrompt.hidden = false;
      elements.proWaitlistPrompt.open = true;
      void recordTelemetryEvent('pro_prompt_shown', { source: 'popup' });
      return;
    }
  } catch (error) {
    console.error('Error evaluating pro waitlist prompt:', error);
  }

  hideProWaitlistPrompt();
}

/**
 * Setup event listeners for form elements
 */
function setupEventListeners() {
  const getMessage = createI18nGetMessage();

  const handleProWaitlistPromptAction = (action: ProPromptAction) => {
    void recordTelemetryEvent('pro_prompt_action', { source: 'popup', action });

    void (async () => {
      try {
        await setProPromptAction(action, Date.now());
      } catch (error) {
        console.warn('Failed to persist pro waitlist prompt action:', error);
      }
    })();

    hideProWaitlistPrompt();

    if (action === 'join') {
      const url = `${chrome.runtime.getURL('src/options/options.html')}#pro`;
      chrome.tabs.create({ url });
      window.close();
    }
  };

  // Pro waitlist prompt (low-disturb)
  elements.proWaitlistPromptJoinButton.addEventListener('click', () => {
    handleProWaitlistPromptAction('join');
  });
  elements.proWaitlistPromptLaterButton.addEventListener('click', () => {
    handleProWaitlistPromptAction('later');
  });
  elements.proWaitlistPromptNeverButton.addEventListener('click', () => {
    handleProWaitlistPromptAction('never');
  });

  // Pro entry
  elements.upgradeProEntry.addEventListener('click', () => {
    const props: Record<string, string> = { source: 'popup' };
    if (currentSettings?.proIntentCampaign) props.campaign = currentSettings.proIntentCampaign;
    void recordTelemetryEvent('pro_entry_opened', props);
    const url = `${chrome.runtime.getURL('src/options/options.html')}#pro`;
    chrome.tabs.create({ url });
    window.close();
  });

  elements.popupProWaitlistButton.addEventListener('click', () => {
    const props: Record<string, string> = { source: 'popup' };
    if (currentSettings?.proIntentCampaign) props.campaign = currentSettings.proIntentCampaign;
    void recordTelemetryEvent('pro_waitlist_opened', props);
    const waitlistUrl = buildProWaitlistUrl({
      medium: 'popup',
      campaign: currentSettings?.proIntentCampaign,
      env: {
        extensionVersion: chrome.runtime.getManifest().version || '',
        extensionId: chrome.runtime.id,
        navigatorLanguage: navigator.language || '',
        uiLanguage: chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage() : ''
      }
    });
    chrome.tabs.create({ url: waitlistUrl });
    window.close();
  });

  elements.popupProWaitlistCopyButton.addEventListener('click', async () => {
    const originalText = elements.popupProWaitlistCopyButton.textContent || '';
    try {
      const body = buildProWaitlistCopyText({
        env: {
          extensionVersion: chrome.runtime.getManifest().version || '',
          extensionId: chrome.runtime.id,
          navigatorLanguage: navigator.language || '',
          uiLanguage: chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage() : ''
        },
        campaign: currentSettings?.proIntentCampaign,
        getMessage
      });
      await navigator.clipboard.writeText(body);
      const props: Record<string, string> = { source: 'popup' };
      if (currentSettings?.proIntentCampaign) props.campaign = currentSettings.proIntentCampaign;
      void recordTelemetryEvent('pro_waitlist_copied', props);
      elements.popupProWaitlistCopyButton.textContent = getMessage('copied') || originalText;
      window.setTimeout(() => {
        elements.popupProWaitlistCopyButton.textContent =
          getMessage('popupProWaitlistCopy') || originalText;
      }, 1200);
    } catch (error) {
      console.error('Failed to copy waitlist copy:', error);
      elements.popupProWaitlistCopyButton.textContent = originalText;
    }
  });

  // Interaction mode radio buttons
  elements.interactionClick.addEventListener('change', saveCurrentSettings);
  elements.interactionDblClick.addEventListener('change', saveCurrentSettings);

  // Output format radio buttons
  elements.formatMarkdown.addEventListener('change', saveCurrentSettings);
  elements.formatPlaintext.addEventListener('change', saveCurrentSettings);

  // Table output format radio buttons
  elements.tableFormatMarkdown.addEventListener('change', saveCurrentSettings);
  elements.tableFormatCsv.addEventListener('change', saveCurrentSettings);

  // Additional info checkboxes
  elements.attachTitle.addEventListener('change', saveCurrentSettings);
  elements.attachURL.addEventListener('change', saveCurrentSettings);

  // Enable/Disable Magic Copy switch
  elements.enableMagicCopySwitch.addEventListener('change', saveCurrentSettings);
  elements.enableHoverMagicCopySwitch.addEventListener('change', saveCurrentSettings);
  elements.enableClipboardAccumulatorSwitch.addEventListener('change', saveCurrentSettings);

  // Conversion button
  elements.convertButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'CONVERT_PAGE_WITH_SELECTION' // 使用新的消息类型
        });
        window.close(); // Close popup after clicking
      }
    });
  });

  // Prompt manager event listeners - now opens options page
  elements.addPromptButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  elements.feedbackLink.addEventListener('click', (event) => {
    event.preventDefault();
    void recordTelemetryEvent('wom_feedback_opened', { source: 'popup' });
    void (async () => {
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
        getMessage
      });
      chrome.tabs.create({ url: feedbackUrl });
      window.close();
    })();
  });

  elements.shareLink.addEventListener('click', (event) => {
    event.preventDefault();
    void recordTelemetryEvent('wom_share_opened', { source: 'popup' });
    const storeUrl = buildChromeWebStoreDetailUrl(chrome.runtime.id, buildWomUtmParams('popup'));
    chrome.tabs.create({ url: storeUrl });
    window.close();
  });

  elements.rateLink.addEventListener('click', (event) => {
    event.preventDefault();
    void recordTelemetryEvent('wom_rate_opened', { source: 'popup' });
    const reviewsUrl = buildChromeWebStoreReviewsUrl(chrome.runtime.id, buildWomUtmParams('popup'));
    chrome.tabs.create({ url: reviewsUrl });
    window.close();
  });

  elements.ratingPromptRateButton.addEventListener('click', async () => {
    try {
      await setRatingPromptAction('rate');
    } catch (error) {
      console.error('Error saving rating prompt action:', error);
    }
    void recordTelemetryEvent('rating_prompt_action', { source: 'rating_prompt', action: 'rate' });

    const reviewsUrl = buildChromeWebStoreReviewsUrl(chrome.runtime.id, buildWomUtmParams('rating_prompt'));
    chrome.tabs.create({ url: reviewsUrl });
    window.close();
  });

  elements.ratingPromptLaterButton.addEventListener('click', async () => {
    try {
      await setRatingPromptAction('later');
    } catch (error) {
      console.error('Error saving rating prompt action:', error);
    }
    void recordTelemetryEvent('rating_prompt_action', { source: 'rating_prompt', action: 'later' });
    hideRatingPrompt();
  });

  elements.ratingPromptNeverButton.addEventListener('click', async () => {
    try {
      await setRatingPromptAction('never');
    } catch (error) {
      console.error('Error saving rating prompt action:', error);
    }
    void recordTelemetryEvent('rating_prompt_action', { source: 'rating_prompt', action: 'never' });
    hideRatingPrompt();
  });

  elements.copyShareButton.addEventListener('click', async () => {
    const storeUrl = buildChromeWebStoreDetailUrl(chrome.runtime.id, buildWomUtmParams('popup'));
    const shareText = buildShareCopyText(getMessage, storeUrl);
    const originalText = elements.copyShareButton.textContent || '';

    try {
      await navigator.clipboard.writeText(shareText);
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
  // Remove old modal handlers as we're redirecting to options page
  // elements.promptForm.addEventListener('submit', handleSavePrompt);
  // elements.cancelPromptButton.addEventListener('click', closeModal);
  // elements.closeModalButton.addEventListener('click', closeModal);
  // window.addEventListener('click', (event) => {
  //   if (event.target == elements.promptModal) {
  //     closeModal();
  //   }
  // });

  // Onboarding entry
  elements.onboardingReopenButton.addEventListener('click', () => {
    openOnboardingModal('manual');
  });

  // Onboarding modal controls
  elements.onboardingCloseButton.addEventListener('click', () => {
    completeOnboarding('skip');
  });
  elements.onboardingSkipButton.addEventListener('click', () => {
    completeOnboarding('skip');
  });
  elements.onboardingPrevButton.addEventListener('click', () => {
    setOnboardingStep(onboardingCurrentStep - 1);
  });
  elements.onboardingNextButton.addEventListener('click', () => {
    setOnboardingStep(onboardingCurrentStep + 1);
  });
  elements.onboardingFinishButton.addEventListener('click', () => {
    completeOnboarding('finish');
  });
  elements.onboardingApplyRecommendedButton.addEventListener('click', () => {
    applyRecommendedSettings();
  });
  elements.onboardingOpenOptionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Click outside modal-content closes onboarding (acts like skip)
  elements.onboardingModal.addEventListener('click', (event) => {
    if (event.target === elements.onboardingModal) {
      completeOnboarding('skip');
    }
  });

  // Escape closes onboarding (acts like skip)
  document.addEventListener('keydown', (event) => {
    if (!isOnboardingOpen) return;
    if (event.key === 'Escape') {
      completeOnboarding('skip');
    }
  });
}

/**
 * Handle form submission (prevent default)
 */
function setupFormHandler() {
  const form = document.getElementById('settings-form') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
    });
  }
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNavigation() {
  // Allow Enter/Space to toggle radio and checkbox options
  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement;

    if (
      ((event.key === 'Enter' || event.key === ' ') && target.classList.contains('radio-option')) ||
      target.classList.contains('checkbox-option')
    ) {
      const input = target.querySelector('input') as HTMLInputElement;
      if (input) {
        input.click();
        event.preventDefault();
      }
    }
  });
}

/**
 * Add accessibility attributes
 */
function setupAccessibility() {
  // Add ARIA labels and roles where needed
  const radioOptions = document.querySelectorAll('.radio-option');
  radioOptions.forEach((option, index) => {
    option.setAttribute('role', 'radio');
    option.setAttribute('tabindex', index === 0 ? '0' : '-1');
  });

  const checkboxOptions = document.querySelectorAll('.checkbox-option');
  checkboxOptions.forEach((option) => {
    option.setAttribute('role', 'checkbox');
    option.setAttribute('tabindex', '0');
  });
}

/**
 * Initialize the popup
 */
async function initialize() {
  try {
    console.debug('Initializing popup...');

    // Get DOM elements
    elements = getElements();
    void recordTelemetryEvent('popup_opened');
    void markFirstPopupOpened().catch((error) => {
      console.warn('Failed to mark first popup opened:', error);
    });

    // @ts-ignore: 环境变量在构建时注入
    const isDevBuild =
      process.env.NODE_ENV !== 'production' || process.env.BUILD_TARGET !== 'production';
    if (isDevBuild) {
      elements.devBadge.hidden = false;
    }

    // Set version number
    const manifest = chrome.runtime.getManifest();
    if (manifest.version) {
      elements.versionDisplay.textContent = `V${manifest.version}`;
    }

    // 彩蛋功能：三次点击版本号打开测试运行器（仅开发环境）
    // @ts-ignore: 环境变量在构建时注入
    if (process.env.NODE_ENV !== 'production' || process.env.BUILD_TARGET !== 'production') {
      let clickCount = 0;
      let clickTimer: number | null = null;
      elements.versionDisplay.addEventListener('click', () => {
        clickCount++;
        if (clickTimer) {
          clearTimeout(clickTimer);
        }
        clickTimer = window.setTimeout(() => {
          clickCount = 0;
        }, 1000);

        if (clickCount === 3) {
          clickCount = 0;
          clearTimeout(clickTimer);
          chrome.tabs.create({ url: chrome.runtime.getURL('test/index.html') });
        }
      });
    }

    // Localize UI
    localizeUI();

    // Load and display current settings
    await loadSettings();

    // Setup event handlers
    setupEventListeners();
    setupFormHandler();
    setupKeyboardNavigation();
    setupAccessibility();

    const shouldForceShowOnboarding = window.location.hash === '#onboarding';

    // Deeplink: force show onboarding (manual re-open), ignoring completed state.
    if (shouldForceShowOnboarding) {
      openOnboardingModal('manual');
    } else if (shouldAutoShowOnboarding(currentSettings)) {
      // Auto show onboarding for new users (zero-disturb: only when not completed)
      openOnboardingModal('auto');
    }

    // Evaluate one-time rating prompt (non-blocking, based on local growth stats)
    await maybeShowRatingPrompt();

    // Evaluate pro waitlist prompt (low-disturb, based on local growth stats)
    await maybeShowProWaitlistPrompt();

    console.debug('Popup initialized successfully');
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
