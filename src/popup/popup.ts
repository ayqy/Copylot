// @ts-ignore: CSS import for build process
import './popup.css';
import {
  getActivePrompts,
  getSettings,
  saveSettings,
  type Settings,
  FORCE_UI_LANGUAGE
} from '../shared/settings-manager';
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
  markQuickPromptSlotClicked,
  markQuickPromptSlotShown,
  type ReuseEntrySlot,
  type ReuseEntrySource,
  type GrowthFunnelSummary
} from '../shared/growth-stats';
import {
  buildAppendSessionAudit,
  getAppendSessionState,
  type AppendSessionAudit
} from '../shared/append-session';
import {
  recordTelemetryEvent,
  sanitizeTelemetryEvents,
  TELEMETRY_EVENTS_KEY
} from '../shared/telemetry';
import { buildProIntentAttribution } from '../shared/pro-intent-attribution';

interface PopupElements {
  versionDisplay: HTMLElement;
  devBadge: HTMLElement;
  popupContent: HTMLElement;
  firstCopyStatus: HTMLElement;
  firstCopyHint: HTMLElement;
  reusePrimaryCard: HTMLElement;
  reusePrimaryTitle: HTMLElement;
  reusePrimaryDescription: HTMLElement;
  reusePrimaryButton: HTMLButtonElement;
  reusePrimaryButtonLabel: HTMLElement;
  reusePrimaryButtonShortcut: HTMLElement;
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
  womStatusHint: HTMLElement;
  upgradeProEntry: HTMLButtonElement;
  onboardingReopenButton: HTMLButtonElement;
  onboardingModal: HTMLElement;
  onboardingProgress: HTMLElement;
  onboardingSkipButton: HTMLButtonElement;
  onboardingPrevButton: HTMLButtonElement;
  onboardingNextButton: HTMLButtonElement;
  onboardingStep1: HTMLElement;
  onboardingStep2: HTMLElement;
  onboardingStep3: HTMLElement;
  onboardingStep3Action: HTMLButtonElement;
}

interface QuickActionElements {
  button: HTMLButtonElement;
  title: HTMLElement;
  shortcut: HTMLElement;
}

interface ReuseQuickActionTarget {
  slot: ReuseEntrySlot;
  promptId: string;
  title: string;
  shortcut: string;
}

let elements: PopupElements;
let currentSettings: Settings;
let currentCommandShortcuts = new Map<string, string>();
let currentGrowthSummary: GrowthFunnelSummary | null = null;
let currentReuseQuickActionTarget: ReuseQuickActionTarget | null = null;

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
  return (
    chrome.i18n.getMessage(key, substitutions as Parameters<typeof chrome.i18n.getMessage>[1]) ||
    key
  );
}

function getElements(): PopupElements {
  return {
    versionDisplay: document.getElementById('version-display') as HTMLElement,
    devBadge: document.getElementById('dev-badge') as HTMLElement,
    popupContent: document.getElementById('popup-content') as HTMLElement,
    firstCopyStatus: document.getElementById('first-copy-status') as HTMLElement,
    firstCopyHint: document.getElementById('first-copy-hint') as HTMLElement,
    reusePrimaryCard: document.getElementById('reuse-primary-card') as HTMLElement,
    reusePrimaryTitle: document.getElementById('reuse-primary-title') as HTMLElement,
    reusePrimaryDescription: document.getElementById('reuse-primary-description') as HTMLElement,
    reusePrimaryButton: document.getElementById('reuse-primary-button') as HTMLButtonElement,
    reusePrimaryButtonLabel: document.getElementById('reuse-primary-button-label') as HTMLElement,
    reusePrimaryButtonShortcut: document.getElementById('reuse-primary-button-shortcut') as HTMLElement,
    appendSessionCard: document.getElementById('append-session-card') as HTMLElement,
    appendSessionTitle: document.getElementById('append-session-title') as HTMLElement,
    appendSessionDescription: document.getElementById('append-session-description') as HTMLElement,
    appendSessionResetButton: document.getElementById('append-session-reset-button') as HTMLButtonElement,
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
    tableFormatMarkdown: document.getElementById('table-format-markdown') as HTMLInputElement,
    tableFormatCsv: document.getElementById('table-format-csv') as HTMLInputElement,
    attachTitle: document.getElementById('attach-title') as HTMLInputElement,
    attachURL: document.getElementById('attach-url') as HTMLInputElement,
    convertButton: document.getElementById('convert-button') as HTMLButtonElement,
    openShortcutSettingsButton: document.getElementById(
      'open-shortcut-settings-button'
    ) as HTMLButtonElement,
    shortcutSettingsFeedback: document.getElementById('shortcut-settings-feedback') as HTMLElement,
    addPromptButton: document.getElementById('add-prompt-button') as HTMLButtonElement,
    toggleMoreSettingsButton: document.getElementById('toggle-more-settings') as HTMLButtonElement,
    toggleMoreSettingsLabel: document.getElementById('toggle-more-settings-label') as HTMLElement,
    moreSettingsPanel: document.getElementById('more-settings-panel') as HTMLElement,
    feedbackLink: document.getElementById('feedback-link') as HTMLAnchorElement,
    shareLink: document.getElementById('share-link') as HTMLAnchorElement,
    copyShareButton: document.getElementById('copy-share-button') as HTMLButtonElement,
    rateLink: document.getElementById('rate-link') as HTMLAnchorElement,
    womStatusHint: document.getElementById('wom-status-hint') as HTMLElement,
    upgradeProEntry: document.getElementById('upgrade-pro-entry') as HTMLButtonElement,
    onboardingReopenButton: document.getElementById('popup-onboarding-reopen') as HTMLButtonElement,
    onboardingModal: document.getElementById('popup-onboarding-modal') as HTMLElement,
    onboardingProgress: document.getElementById('popup-onboarding-progress') as HTMLElement,
    onboardingSkipButton: document.getElementById('popup-onboarding-skip') as HTMLButtonElement,
    onboardingPrevButton: document.getElementById('popup-onboarding-prev') as HTMLButtonElement,
    onboardingNextButton: document.getElementById('popup-onboarding-next') as HTMLButtonElement,
    onboardingStep1: document.getElementById('popup-onboarding-step-1') as HTMLElement,
    onboardingStep2: document.getElementById('popup-onboarding-step-2') as HTMLElement,
    onboardingStep3: document.getElementById('popup-onboarding-step-3') as HTMLElement,
    onboardingStep3Action: document.getElementById(
      'popup-onboarding-step-3-action'
    ) as HTMLButtonElement
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
  if (currentGrowthSummary?.isActivated && currentReuseQuickActionTarget) {
    void markQuickPromptSlotShown().catch((error) => {
      console.warn('Failed to mark onboarding quick prompt slot shown:', error);
    });
    void recordTelemetryEvent('quick_prompt_slot_shown', {
      source: 'onboarding',
      slot: currentReuseQuickActionTarget.slot
    });
  }
  isOnboardingOpen = true;
  setOnboardingStep(currentGrowthSummary?.isActivated ? 3 : 1);
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

async function runQuickAction(command: string, source?: ReuseEntrySource, slot?: ReuseEntrySlot) {
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
      if (source && slot) {
        void markQuickPromptSlotClicked({ source, slot }).catch((error) => {
          console.warn('Failed to mark quick prompt slot clicked:', error);
        });
        void recordTelemetryEvent('quick_prompt_slot_clicked', { source, slot });
      }
      await chrome.runtime.sendMessage({
        type: 'run-quick-action',
        command,
        tabId: tab.id,
        source
      });
    }

    window.close();
  } catch (error) {
    console.error('Failed to run quick action from popup:', error);
  }
}

function getQuickPromptCandidates(settings: Settings, summary: GrowthFunnelSummary | null) {
  const activePrompts = getActivePrompts(settings.userPrompts);
  if (summary?.isActivated) {
    return activePrompts;
  }
  return activePrompts.filter((prompt) => !prompt.builtIn);
}

function renderQuickPromptButtons(
  settings: Settings,
  summary: GrowthFunnelSummary | null
): ReuseQuickActionTarget | null {
  const activePrompts = getQuickPromptCandidates(settings, summary);
  let firstVisibleTarget: ReuseQuickActionTarget | null = null;
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
      const shortcut = getCommandShortcutLabel(
        commandName,
        getFallbackPromptShortcut(slot)
      );
      quickAction.shortcut.textContent = shortcut;
      if (!firstVisibleTarget) {
        firstVisibleTarget = {
          slot,
          promptId: prompt.id,
          title: prompt.title,
          shortcut
        };
      }
    } else {
      quickAction.button.hidden = true;
      quickAction.button.disabled = false;
      quickAction.button.dataset.promptId = '';
      quickAction.title.textContent = '';
      quickAction.shortcut.textContent = '';
    }
    quickAction.button.classList.remove('quick-action-primary');
  });

  elements.convertButton.classList.add('quick-action-primary');
  if (summary?.isActivated && firstVisibleTarget) {
    const activeTarget = firstVisibleTarget as ReuseQuickActionTarget;
    elements.convertButton.classList.remove('quick-action-primary');
    getQuickActionElements(activeTarget.slot).button.classList.add('quick-action-primary');
  }

  return firstVisibleTarget;
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
  currentReuseQuickActionTarget = renderQuickPromptButtons(settings, currentGrowthSummary);
}

function renderFirstCopySummary(summary: GrowthFunnelSummary) {
  currentGrowthSummary = summary;
  const isActivated = summary.isActivated;
  elements.firstCopyStatus.textContent = isActivated
    ? getMessage('popupFirstCopyStatusDone')
    : getMessage('popupFirstCopyStatusPending');
  elements.firstCopyStatus.dataset.state = isActivated ? 'done' : 'pending';
  elements.firstCopyHint.textContent = isActivated
    ? getMessage('popupFirstCopyHintDone')
    : getMessage('popupFirstCopyHintPending');
  currentReuseQuickActionTarget = renderQuickPromptButtons(currentSettings, summary);
  syncReusePrimaryExperience(summary, currentReuseQuickActionTarget);
  syncWomActionAvailability(summary);
}

function renderAppendSessionExperience(audit: AppendSessionAudit | null) {
  const clipCount = audit?.clipCount || 0;
  const shouldShowCard = clipCount > 0;
  elements.appendSessionCard.hidden = !shouldShowCard;

  if (!shouldShowCard) {
    elements.appendSessionResetButton.disabled = true;
    elements.appendSessionTitle.textContent = '';
    elements.appendSessionDescription.textContent = '';
    return;
  }

  elements.appendSessionResetButton.disabled = false;
  elements.appendSessionTitle.textContent = getMessage('popupAppendSessionTitle', [String(clipCount)]);
  elements.appendSessionDescription.textContent =
    clipCount > 1
      ? getMessage('popupAppendSessionHintReady', [String(clipCount)])
      : getMessage('popupAppendSessionHintSingle');
}

function syncWomActionAvailability(summary: GrowthFunnelSummary) {
  const eligible = summary.isEligibleForWomActions;
  const lockedHint = getMessage('womActionsLockedHint', [String(summary.remainingSuccessfulCopiesForWomActions)]);
  elements.shareLink.classList.toggle('footer-link-disabled', !eligible);
  elements.shareLink.setAttribute('aria-disabled', String(!eligible));
  elements.shareLink.tabIndex = eligible ? 0 : -1;
  elements.rateLink.classList.toggle('footer-link-disabled', !eligible);
  elements.rateLink.setAttribute('aria-disabled', String(!eligible));
  elements.rateLink.tabIndex = eligible ? 0 : -1;
  elements.copyShareButton.disabled = !eligible;
  elements.womStatusHint.hidden = eligible;
  elements.womStatusHint.textContent = eligible ? '' : lockedHint;
}

function canUseWomActions(): boolean {
  return Boolean(currentGrowthSummary?.isEligibleForWomActions);
}

function syncReusePrimaryExperience(
  summary: GrowthFunnelSummary,
  target: ReuseQuickActionTarget | null
) {
  const shouldShowReuseCard = summary.isActivated && Boolean(target);
  elements.reusePrimaryCard.hidden = !shouldShowReuseCard;

  if (!shouldShowReuseCard || !target) {
    elements.reusePrimaryButton.disabled = true;
    elements.reusePrimaryButton.dataset.slot = '';
    elements.onboardingStep3Action.hidden = true;
    elements.onboardingStep3Action.disabled = true;
    return;
  }

  elements.reusePrimaryTitle.textContent = getMessage('popupReuseTitle');
  elements.reusePrimaryDescription.textContent = getMessage('popupReuseDescription');
  elements.reusePrimaryButtonLabel.textContent = getMessage('popupReuseButtonLabel', target.title);
  elements.reusePrimaryButtonShortcut.textContent = target.shortcut;
  elements.reusePrimaryButton.disabled = false;
  elements.reusePrimaryButton.dataset.slot = String(target.slot);
  elements.onboardingStep3Action.hidden = false;
  elements.onboardingStep3Action.disabled = false;
  elements.onboardingStep3Action.textContent = getMessage('popupOnboardingStep3Action', target.title);
}

async function loadFirstCopySummary() {
  try {
    const stats = await getGrowthStats();
    const summary = buildGrowthFunnelSummary(stats, Date.now());
    renderFirstCopySummary(summary);
    if (summary.isActivated && currentReuseQuickActionTarget) {
      void markQuickPromptSlotShown().catch((error) => {
        console.warn('Failed to mark quick prompt slot shown:', error);
      });
      void recordTelemetryEvent('quick_prompt_slot_shown', {
        source: 'popup',
        slot: currentReuseQuickActionTarget.slot
      });
    }
  } catch (error) {
    console.warn('Failed to load first clean copy summary:', error);
    renderFirstCopySummary(
      buildGrowthFunnelSummary(
        {
          installedAt: Date.now(),
          successfulCopyCount: 0
        },
        Date.now()
      )
    );
  }
}

async function loadAppendSessionSummary() {
  try {
    const state = await getAppendSessionState();
    renderAppendSessionExperience(buildAppendSessionAudit(state));
  } catch (error) {
    console.warn('Failed to load append session summary:', error);
    renderAppendSessionExperience(buildAppendSessionAudit({ clipCount: 0 }));
  }
}

async function loadSettingsAndCommands() {
  try {
    const [settings] = await Promise.all([getSettings(), loadCommandShortcuts()]);
    currentSettings = settings;
    updateUIFromSettings(currentSettings);
    await Promise.all([loadFirstCopySummary(), loadAppendSessionSummary()]);
  } catch (error) {
    console.error('Error loading popup settings:', error);
  }
}

async function clearAppendSessionFromPopup() {
  elements.appendSessionResetButton.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'clear-append-session',
      clearedAt: Date.now()
    });
    if (!response?.success) {
      throw new Error(response?.error || getMessage('appendWorkflowClearFailed'));
    }
    await loadAppendSessionSummary();
  } catch (error) {
    console.warn(getMessage('appendWorkflowClearFailed'), error);
    elements.appendSessionResetButton.disabled = false;
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
        getQuickPromptCandidates(currentSettings, currentGrowthSummary),
        slot
      );
      if (!prompt) {
        chrome.runtime.openOptionsPage();
        window.close();
        return;
      }
      void runQuickAction(getQuickPromptSlotCommandName(slot), 'popup', slot);
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
  elements.appendSessionResetButton.addEventListener('click', () => {
    void clearAppendSessionFromPopup();
  });
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

  elements.reusePrimaryButton.addEventListener('click', () => {
    if (!currentReuseQuickActionTarget) {
      return;
    }
    void runQuickAction(
      getQuickPromptSlotCommandName(currentReuseQuickActionTarget.slot),
      'popup',
      currentReuseQuickActionTarget.slot
    );
  });

  elements.onboardingStep3Action.addEventListener('click', () => {
    if (!currentReuseQuickActionTarget) {
      return;
    }
    void runQuickAction(
      getQuickPromptSlotCommandName(currentReuseQuickActionTarget.slot),
      'onboarding',
      currentReuseQuickActionTarget.slot
    );
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
    if (!canUseWomActions()) {
      return;
    }
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
    if (!canUseWomActions()) {
      return;
    }
    void (async () => {
      await recordTelemetryEvent('wom_rate_opened', { source: 'popup' });
      const reviewsUrl = buildChromeWebStoreReviewsUrl(
        chrome.runtime.id,
        buildWomUtmParams('popup')
      );
      await reportE2EOpenedUrl(reviewsUrl);
      chrome.tabs.create({ url: reviewsUrl });
      window.close();
    })();
  });

  elements.copyShareButton.addEventListener('click', async () => {
    if (!canUseWomActions()) {
      return;
    }
    const storeUrl = buildChromeWebStoreDetailUrl(chrome.runtime.id, buildWomUtmParams('popup'));
    const shareText = buildShareCopyText(i18nGetMessage, storeUrl);
    const originalText = elements.copyShareButton.textContent || '';

    try {
      await writeTextToClipboard(shareText);
      void recordTelemetryEvent('wom_share_copied', { source: 'popup' });
      elements.copyShareButton.textContent = chrome.i18n.getMessage('copied') || originalText;
      window.setTimeout(() => {
        elements.copyShareButton.textContent =
          chrome.i18n.getMessage('copyShareText') || originalText;
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
    const isDevBuild =
      process.env.NODE_ENV !== 'production' || process.env.BUILD_TARGET !== 'production';
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
