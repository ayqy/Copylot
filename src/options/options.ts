// @ts-ignore: CSS import for build process
import './options.css';
import {
  getActivePrompts,
  getSettings,
  saveSettings,
  type Settings,
  type Prompt,
  type ChatService,
  FORCE_UI_LANGUAGE
} from '../shared/settings-manager';
import {
  clearTelemetryEvents,
  recordTelemetryEvent,
  sanitizeTelemetryEvents,
  TELEMETRY_EVENTS_KEY,
  type TelemetryEvent,
  type TelemetryPropPrimitive
} from '../shared/telemetry';
import {
  buildGrowthFunnelSummary,
  getGrowthStats,
  setGrowthStats,
  type GrowthFunnelSummary,
  type GrowthStats
} from '../shared/growth-stats';
import {
  buildAppendSessionAudit,
  getAppendSessionState,
  type AppendSessionAudit
} from '../shared/append-session';
import {
  buildChromeWebStoreDetailUrl,
  buildChromeWebStoreReviewsUrl,
  buildWomUtmParams,
  buildFeedbackIssueUrl,
  buildFeedbackSettingsSnapshot,
  buildShareCopyText
} from '../shared/word-of-mouth';
import {
  buildChromeWebStoreUrl,
  buildOfficialSiteUrl,
  buildPrivacyPolicyUrl,
  buildProRoadmapUrl
} from '../shared/external-links';
import {
  buildProWaitlistRecruitCopyText,
  buildProDistributionPackMarkdown,
  computeProWaitlistDistributionState
} from '../shared/pro-waitlist-distribution';
import {
  buildProValidationBriefMarkdown,
  buildProValidationChecklistMarkdown,
  buildProValidationRouteUrl,
  getProValidationTrack,
  type ProValidationAssetAction,
  type ProValidationTrackId
} from '../shared/pro-route-validation';
import {
  buildProRouteValidationComparisonSummary,
  formatProRouteValidationComparisonMarkdown,
  PRO_ROUTE_VALIDATION_COMPARISON_FILES,
  type ProRouteValidationComparisonSummary
} from '../shared/pro-route-validation-comparison';
import {
  buildProRouteValidationWritebackPack,
  formatProRouteValidationWritebackMarkdown,
  PRO_ROUTE_VALIDATION_WRITEBACK_FILES,
  type ProRouteValidationWritebackPack
} from '../shared/pro-route-validation-writeback';
import {
  buildProRouteValidationStabilitySummary,
  formatProRouteValidationStabilityMarkdown,
  PRO_ROUTE_VALIDATION_STABILITY_FILES,
  type ProRouteValidationStabilitySummary
} from '../shared/pro-route-validation-stability';
import {
  buildProRouteValidationVerdictPack,
  formatProRouteValidationVerdictMarkdown,
  PRO_ROUTE_VALIDATION_VERDICT_FILES,
  type ProRouteValidationVerdictPack
} from '../shared/pro-route-validation-verdict';
import {
  buildProFunnelEvidencePack,
  buildProFunnelSummary,
  type ProFunnelEvidencePack,
  type ProFunnelSummary
} from '../shared/pro-funnel';
import {
  buildProIntentWeeklyDigestSummary,
  formatProIntentWeeklyDigestMarkdown,
  type ProIntentWeeklyDigestEnvInfo
} from '../shared/pro-intent-weekly-digest';
import {
  buildProIntentEventsCsv,
  formatProIntentEvents7dCsvFilename
} from '../shared/pro-intent-events-csv';
import {
  buildProIntentByCampaignCsv,
  formatProIntentByCampaign7dCsvFilename
} from '../shared/pro-intent-by-campaign-csv';
import {
  buildProDistributionByCampaignCsv,
  formatProDistributionByCampaign7dCsvFilename
} from '../shared/pro-distribution-by-campaign-csv';
import {
  buildProAcquisitionEfficiencyByCampaignCsv,
  formatProAcquisitionEfficiencyByCampaign7dCsvFilename
} from '../shared/pro-acquisition-efficiency-by-campaign-csv';
import {
  buildProAcquisitionEfficiencyByCampaignWeeklyReportSummary,
  formatProAcquisitionEfficiencyByCampaignWeeklyReportMarkdown,
  type ProAcquisitionEfficiencyByCampaignWeeklyReportEnvInfo
} from '../shared/pro-acquisition-efficiency-by-campaign-weekly-report';
import {
  buildProAcquisitionEfficiencyByCampaignEvidencePack,
  formatProAcquisitionEfficiencyByCampaignEvidencePackAsJson,
  type ProAcquisitionEfficiencyByCampaignEvidencePack
} from '../shared/pro-acquisition-efficiency-by-campaign-evidence-pack';
import { formatProAcquisitionEfficiencyByCampaignEvidencePackJsonFilename } from '../shared/pro-acquisition-efficiency-by-campaign-evidence-pack-filename';
import {
  buildProWeeklyChannelOpsEvidencePack,
  formatProWeeklyChannelOpsEvidencePackAsJson,
  type ProWeeklyChannelOpsEvidencePack
} from '../shared/pro-weekly-channel-ops-evidence-pack';
import { formatProWeeklyChannelOpsEvidencePackJsonFilename } from '../shared/pro-weekly-channel-ops-evidence-pack-filename';
import {
  buildProIntentRunEvidencePack,
  formatProIntentRunEvidencePackAsJson,
  formatProIntentRunEvidencePackJsonFilename,
  type ProIntentRunEvidencePack
} from '../shared/pro-intent-run-evidence-pack';
import {
  buildProWaitlistSurveyIntentDistribution
} from '../shared/pro-waitlist-survey-intent-distribution';
import {
  buildProIntentByCampaignWeeklyReportSummary,
  formatProIntentByCampaignWeeklyReportMarkdown,
  type ProIntentByCampaignWeeklyReportEnvInfo
} from '../shared/pro-intent-by-campaign-weekly-report';
import {
  buildProIntentDecisionPackFromDistribution,
  formatProIntentDecisionPackMarkdown,
  PRO_INTENT_DECISION_SUMMARY_FILES,
  type ProIntentDecisionPackSummary
} from '../shared/pro-intent-decision-pack';
import { sanitizeCampaign } from '../shared/campaign';
import {
  buildWomEvidencePack,
  buildWomSummary,
  type WomEvidencePack,
  type WomSummary
} from '../shared/wom-summary';
import { parsePromptSortMode, sortPrompts, type PromptSortMode } from '../shared/prompt-sort';
import {
  buildProIntentAttribution,
  type ProIntentContent,
  type ProIntentSource
} from '../shared/pro-intent-attribution';
import {
  buildProIntentV1_100Summary,
  formatProIntentV1_100Csv,
  type ProIntentV1_100Summary
} from '../shared/pro-intent-funnel-v1-100';
import {
  assignQuickPromptSlot,
  getQuickCommandDefaultShortcut,
  getQuickPromptSlotCommandName,
  isQuickPromptSlot,
  QUICK_CONVERT_COMMAND,
  type QuickCommandName,
  type QuickPromptSlot
} from '../shared/prompt-shortcuts';

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type MessageSubstitutions = Parameters<typeof chrome.i18n.getMessage>[1];
const isE2EBuild = process.env.BUILD_TARGET === 'e2e';

// Helper function to get localized messages
function getMessage(key: string, substitutions?: MessageSubstitutions): string {
  return chrome.i18n.getMessage(key, substitutions);
}

function getPromptSlotCommandName(slot: QuickPromptSlot): QuickCommandName {
  return getQuickPromptSlotCommandName(slot);
}

function isMacPlatform(): boolean {
  return /mac/i.test(navigator.platform || '') || /mac/i.test(navigator.userAgent || '');
}

function getShortcutPlatform() {
  return isMacPlatform() ? 'mac' : 'default';
}

function getConvertShortcutLabel(): string {
  const resolved = currentCommandShortcuts.get(QUICK_CONVERT_COMMAND)?.trim();
  if (resolved) {
    return resolved;
  }

  if (!currentCommandShortcuts.has(QUICK_CONVERT_COMMAND)) {
    return getQuickCommandDefaultShortcut(QUICK_CONVERT_COMMAND, getShortcutPlatform());
  }

  return getMessage('shortcutNotSet');
}

function formatPromptSlotShortcut(slot: QuickPromptSlot | undefined): string | null {
  if (!slot) {
    return null;
  }

  const commandName = getPromptSlotCommandName(slot);
  const resolved = currentCommandShortcuts.get(commandName)?.trim();
  if (resolved) {
    return resolved;
  }

  if (!currentCommandShortcuts.has(commandName)) {
    return getQuickCommandDefaultShortcut(commandName, getShortcutPlatform());
  }

  return getMessage('shortcutNotSet');
}

async function loadCommandShortcuts() {
  if (!chrome.commands?.getAll) {
    currentCommandShortcuts = new Map();
    return;
  }

  const commands = await chrome.commands.getAll();
  currentCommandShortcuts = new Map<string, string>(
    commands
      .filter((command) => typeof command.name === 'string' && command.name.length > 0)
      .map((command) => [command.name as string, command.shortcut || ''])
  );
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
    console.warn('Failed to report options copied text for E2E:', error);
  }
}

async function reportE2EOpenedUrl(url: string): Promise<void> {
  if (!isE2EBuild) {
    return;
  }

  try {
    const result = await chrome.storage.local.get(E2E_OPENED_URLS_KEY);
    const existing = Array.isArray(result[E2E_OPENED_URLS_KEY])
      ? (result[E2E_OPENED_URLS_KEY] as unknown[]).filter(
          (item): item is string => typeof item === 'string'
        )
      : [];
    existing.push(url);
    await chrome.storage.local.set({
      [E2E_OPENED_URLS_KEY]: existing.slice(-20)
    });
  } catch (error) {
    console.warn('Failed to report options opened url for E2E:', error);
  }
}

async function writeTextToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
  await reportE2ECopiedText(text);
}

// DOM元素接口
interface OptionsElements {
  searchInput: HTMLInputElement;
  categoryFilter: HTMLSelectElement;
  promptSortSelect: HTMLSelectElement;
  addPromptBtn: HTMLButtonElement;
  batchActionBtn: HTMLButtonElement;
  promptsGrid: HTMLElement;
  emptyState: HTMLElement;
  createFirstPromptBtn: HTMLButtonElement;
  mobileAddBtn: HTMLButtonElement;

  // Modal elements
  promptEditorModal: HTMLElement;
  modalTitle: HTMLElement;
  closeModalBtn: HTMLButtonElement;
  promptForm: HTMLFormElement;
  promptId: HTMLInputElement;
  promptTitle: HTMLInputElement;
  promptCategory: HTMLSelectElement;
  promptTemplate: HTMLTextAreaElement;
  promptTargetChat: HTMLSelectElement;
  promptAutoOpenChat: HTMLInputElement;
  promptQuickAccessSlot: HTMLSelectElement;
  insertContentPlaceholder: HTMLButtonElement;
  previewPrompt: HTMLButtonElement;
  cancelBtn: HTMLButtonElement;
  saveBtn: HTMLButtonElement;

  // Import/Export elements
  importExportBtn: HTMLButtonElement;
  importExportModal: HTMLElement;

  // Preview elements
  previewModal: HTMLElement;
  previewSample: HTMLTextAreaElement;
  previewResult: HTMLElement;

  // Usage instructions
  usageInstructions: HTMLElement;
  hideInstructionsBtn: HTMLButtonElement;

  // Sync status
  syncStatusBtn: HTMLButtonElement;
  syncStatusText: HTMLElement;

  // Options onboarding entry
  onboardingPanel: HTMLElement;
  onboardingOpenButton: HTMLButtonElement;
  openShortcutSettingsButton: HTMLButtonElement;
  shortcutCurrentConvert: HTMLElement;
  shortcutCurrentSlot1: HTMLElement;
  shortcutCurrentSlot2: HTMLElement;
  shortcutCurrentSlot3: HTMLElement;
  shortcutSlot1PromptName: HTMLElement;
  shortcutSlot2PromptName: HTMLElement;
  shortcutSlot3PromptName: HTMLElement;
  shortcutSettingsFeedback: HTMLElement;

  // Privacy / Observability
  anonymousUsageDataSwitch: HTMLInputElement;
  telemetryEventsPanel: HTMLDetailsElement;
  telemetryEventsCount: HTMLElement;
  telemetryEventsView: HTMLTextAreaElement;
  telemetryEventsRefreshButton: HTMLButtonElement;
  telemetryEventsCopyButton: HTMLButtonElement;
  telemetryEventsClearButton: HTMLButtonElement;
  proFunnelPanel: HTMLDetailsElement;
  proFunnelView: HTMLTextAreaElement;
  proFunnelDisabledNotice: HTMLElement;
  proFunnelRefreshButton: HTMLButtonElement;
  proFunnelCopyButton: HTMLButtonElement;
  proFunnelEvidencePackCopyButton: HTMLButtonElement;
  downloadProIntentRunEvidencePackButton: HTMLButtonElement;
  exportProIntentEvents7dCsvButton: HTMLButtonElement;
  exportProIntentByCampaign7dCsvButton: HTMLButtonElement;
  exportProDistributionByCampaign7dCsvButton: HTMLButtonElement;
  exportProAcquisitionEfficiencyByCampaign7dCsvButton: HTMLButtonElement;
  proAcqEffByCampaignWeeklyReportCopyButton: HTMLButtonElement;
  proAcqEffByCampaignEvidencePackCopyButton: HTMLButtonElement;
  proAcqEffByCampaignEvidencePackDownloadButton: HTMLButtonElement;
  proWeeklyChannelOpsEvidencePackDownloadButton: HTMLButtonElement;
  proIntentWeeklyDigestCopyButton: HTMLButtonElement;
  proIntentByCampaignWeeklyReportCopyButton: HTMLButtonElement;
  womSummaryPanel: HTMLDetailsElement;
  womSummaryView: HTMLTextAreaElement;
  womSummaryDisabledNotice: HTMLElement;
  womSummaryRefreshButton: HTMLButtonElement;
  womSummaryCopyButton: HTMLButtonElement;
  womSummaryEvidencePackCopyButton: HTMLButtonElement;
  growthFunnelPanel: HTMLDetailsElement;
  growthFunnelView: HTMLTextAreaElement;
  growthFunnelRefreshButton: HTMLButtonElement;
  growthFunnelCopyButton: HTMLButtonElement;
  appendWorkflowPanel: HTMLDetailsElement;
  appendWorkflowView: HTMLTextAreaElement;
  appendWorkflowRefreshButton: HTMLButtonElement;
  appendWorkflowCopyButton: HTMLButtonElement;
  appendWorkflowClearButton: HTMLButtonElement;
  growthStatsPanel: HTMLDetailsElement;
  growthStatsView: HTMLTextAreaElement;
  growthStatsRefreshButton: HTMLButtonElement;
  growthStatsCopyButton: HTMLButtonElement;
  growthStatsResetButton: HTMLButtonElement;

  // Pro / Monetization
  proIntentCampaignInput: HTMLInputElement;
  proValidationAdvancedOpenButton: HTMLButtonElement;
  proValidationAdvancedRouteCopyButton: HTMLButtonElement;
  proValidationAdvancedBriefCopyButton: HTMLButtonElement;
  proValidationAdvancedChecklistCopyButton: HTMLButtonElement;
  proValidationBulkOpenButton: HTMLButtonElement;
  proValidationBulkRouteCopyButton: HTMLButtonElement;
  proValidationBulkBriefCopyButton: HTMLButtonElement;
  proValidationBulkChecklistCopyButton: HTMLButtonElement;
  proValidationStructuredOpenButton: HTMLButtonElement;
  proValidationStructuredRouteCopyButton: HTMLButtonElement;
  proValidationStructuredBriefCopyButton: HTMLButtonElement;
  proValidationStructuredChecklistCopyButton: HTMLButtonElement;
  proRouteValidationComparisonCopyButton: HTMLButtonElement;
  downloadProRouteValidationComparisonJsonButton: HTMLButtonElement;
  proRouteValidationWritebackCopyButton: HTMLButtonElement;
  downloadProRouteValidationWritebackJsonButton: HTMLButtonElement;
  proRouteValidationStabilityCopyButton: HTMLButtonElement;
  downloadProRouteValidationStabilityJsonButton: HTMLButtonElement;
  proIntentDecisionSummaryCopyButton: HTMLButtonElement;
  downloadProIntentDecisionSummaryJsonButton: HTMLButtonElement;
  proRouteValidationVerdictCopyButton: HTMLButtonElement;
  downloadProRouteValidationVerdictJsonButton: HTMLButtonElement;
  proWaitlistButton: HTMLButtonElement;
  proWaitlistUrlCopyButton: HTMLButtonElement;
  proWaitlistRecruitCopyButton: HTMLButtonElement;
  proStoreUrlCopyButton: HTMLButtonElement;
  proDistributionPackCopyButton: HTMLButtonElement;
  proWaitlistDistributionCampaignRequiredHint: HTMLElement;
  downloadProIntentV1_100SummaryJsonButton: HTMLButtonElement;
  downloadProIntentV1_100SummaryCsvButton: HTMLButtonElement;

  // WOM actions (Pro Tab)
  womActionsStatusHint: HTMLElement;
  womShareOpenButton: HTMLButtonElement;
  womShareCopyButton: HTMLButtonElement;
  womRateOpenButton: HTMLButtonElement;
  womFeedbackOpenButton: HTMLButtonElement;

  // Chat Services elements
  defaultChatService: HTMLSelectElement;
  defaultAutoOpenChat: HTMLInputElement;
  addCustomChatBtn: HTMLButtonElement;
  chatServicesGrid: HTMLElement;
  chatServiceEditorModal: HTMLElement;
  chatServiceModalTitle: HTMLElement;
  closeChatServiceModalBtn: HTMLButtonElement;
  chatServiceForm: HTMLFormElement;
  chatServiceId: HTMLInputElement;
  chatServiceName: HTMLInputElement;
  chatServiceUrl: HTMLInputElement;
  cancelChatServiceBtn: HTMLButtonElement;
  saveChatServiceBtn: HTMLButtonElement;
}

let elements: OptionsElements;
let currentSettings: Settings;
let allPrompts: Prompt[] = [];
let filteredPrompts: Prompt[] = [];
let promptSortMode: PromptSortMode = 'default';
let selectedPrompts: Set<string> = new Set();
let editingPromptId: string | null = null;
let editingChatServiceId: string | null = null;
let currentCommandShortcuts = new Map<string, string>();

const PROMPT_SORT_MODE_STORAGE_KEY = 'copylot_prompt_sort_mode';
const E2E_OPENED_URLS_KEY = 'copilot_e2e_opened_urls';
const EXPORT_PRO_ACQ_EFF_BY_CAMPAIGN_7D_CSV_BUTTON_ID =
  'export-pro-acquisition-' + 'efficiency-by-campaign-' + '7d-csv';
const COPY_PRO_ACQ_EFF_BY_CAMPAIGN_WEEKLY_REPORT_BUTTON_ID =
  'copy-pro-acquisition-efficiency-' + 'by-campaign-weekly-report';
const COPY_PRO_ACQ_EFF_BY_CAMPAIGN_EVIDENCE_PACK_BUTTON_ID =
  'copy-pro-acquisition-efficiency-' + 'by-campaign-evidence-pack';
const DOWNLOAD_PRO_ACQ_EFF_BY_CAMPAIGN_EVIDENCE_PACK_BUTTON_ID =
  'download-pro-acquisition-efficiency-' + 'by-campaign-evidence-pack';
const DOWNLOAD_PRO_WEEKLY_CHANNEL_OPS_EVIDENCE_PACK_BUTTON_ID =
  'download-pro-weekly-channel-' + 'ops-evidence-pack';
const DOWNLOAD_PRO_INTENT_V1_100_SUMMARY_JSON_BUTTON_ID = 'download-pro-intent-v1-100-summary-json';
const DOWNLOAD_PRO_INTENT_V1_100_SUMMARY_CSV_BUTTON_ID = 'download-pro-intent-v1-100-summary-csv';
const PRO_INTENT_V1_100_SUMMARY_JSON_FILENAME = 'intent-funnel-summary-v1-100.json';
const PRO_INTENT_V1_100_SUMMARY_CSV_FILENAME = 'intent-funnel-v1-100.csv';

/**
 * 获取所有DOM元素
 */
function getElements(): OptionsElements {
  return {
    searchInput: document.getElementById('search-input') as HTMLInputElement,
    categoryFilter: document.getElementById('category-filter') as HTMLSelectElement,
    promptSortSelect: document.getElementById('prompt-sort-select') as HTMLSelectElement,
    addPromptBtn: document.getElementById('add-prompt-btn') as HTMLButtonElement,
    batchActionBtn: document.getElementById('batch-action-btn') as HTMLButtonElement,
    promptsGrid: document.getElementById('prompts-grid') as HTMLElement,
    emptyState: document.getElementById('empty-state') as HTMLElement,
    createFirstPromptBtn: document.getElementById('create-first-prompt-btn') as HTMLButtonElement,
    mobileAddBtn: document.getElementById('mobile-add-btn') as HTMLButtonElement,

    promptEditorModal: document.getElementById('prompt-editor-modal') as HTMLElement,
    modalTitle: document.getElementById('modal-title') as HTMLElement,
    closeModalBtn: document.getElementById('close-modal-btn') as HTMLButtonElement,
    promptForm: document.getElementById('prompt-form') as HTMLFormElement,
    promptId: document.getElementById('prompt-id') as HTMLInputElement,
    promptTitle: document.getElementById('prompt-title') as HTMLInputElement,
    promptCategory: document.getElementById('prompt-category') as HTMLSelectElement,
    promptTemplate: document.getElementById('prompt-template') as HTMLTextAreaElement,
    promptTargetChat: document.getElementById('prompt-target-chat') as HTMLSelectElement,
    promptAutoOpenChat: document.getElementById('prompt-auto-open-chat') as HTMLInputElement,
    promptQuickAccessSlot: document.getElementById('prompt-quick-access-slot') as HTMLSelectElement,
    insertContentPlaceholder: document.getElementById(
      'insert-content-placeholder'
    ) as HTMLButtonElement,
    previewPrompt: document.getElementById('preview-prompt') as HTMLButtonElement,
    cancelBtn: document.getElementById('cancel-btn') as HTMLButtonElement,
    saveBtn: document.getElementById('save-btn') as HTMLButtonElement,

    importExportBtn: document.getElementById('import-export-btn') as HTMLButtonElement,
    importExportModal: document.getElementById('import-export-modal') as HTMLElement,

    previewModal: document.getElementById('preview-modal') as HTMLElement,
    previewSample: document.getElementById('preview-sample') as HTMLTextAreaElement,
    previewResult: document.getElementById('preview-result') as HTMLElement,

    usageInstructions: document.getElementById('usage-instructions') as HTMLElement,
    hideInstructionsBtn: document.getElementById('hide-instructions-btn') as HTMLButtonElement,

    syncStatusBtn: document.getElementById('sync-status-btn') as HTMLButtonElement,
    syncStatusText: document.getElementById('sync-status-text') as HTMLElement,

    onboardingPanel: document.getElementById('options-onboarding-panel') as HTMLElement,
    onboardingOpenButton: document.getElementById('options-onboarding-open') as HTMLButtonElement,
    openShortcutSettingsButton: document.getElementById(
      'options-open-shortcut-settings'
    ) as HTMLButtonElement,
    shortcutCurrentConvert: document.getElementById(
      'options-shortcut-current-convert'
    ) as HTMLElement,
    shortcutCurrentSlot1: document.getElementById('options-shortcut-current-slot-1') as HTMLElement,
    shortcutCurrentSlot2: document.getElementById('options-shortcut-current-slot-2') as HTMLElement,
    shortcutCurrentSlot3: document.getElementById('options-shortcut-current-slot-3') as HTMLElement,
    shortcutSlot1PromptName: document.getElementById(
      'options-shortcut-slot-1-prompt-name'
    ) as HTMLElement,
    shortcutSlot2PromptName: document.getElementById(
      'options-shortcut-slot-2-prompt-name'
    ) as HTMLElement,
    shortcutSlot3PromptName: document.getElementById(
      'options-shortcut-slot-3-prompt-name'
    ) as HTMLElement,
    shortcutSettingsFeedback: document.getElementById(
      'options-shortcut-settings-feedback'
    ) as HTMLElement,

    anonymousUsageDataSwitch: document.getElementById(
      'anonymous-usage-data-switch'
    ) as HTMLInputElement,
    telemetryEventsPanel: (document.getElementById('telemetry-events-panel') ||
      document.createElement('details')) as HTMLDetailsElement,
    telemetryEventsCount: document.getElementById('telemetry-events-count') as HTMLElement,
    telemetryEventsView: (document.getElementById('telemetry-events-view') ||
      document.createElement('textarea')) as HTMLTextAreaElement,
    telemetryEventsRefreshButton: (document.getElementById('telemetry-events-refresh') ||
      document.createElement('button')) as HTMLButtonElement,
    telemetryEventsCopyButton: (document.getElementById('telemetry-events-copy') ||
      document.createElement('button')) as HTMLButtonElement,
    telemetryEventsClearButton: (document.getElementById('telemetry-events-clear') ||
      document.createElement('button')) as HTMLButtonElement,
    proFunnelPanel: (document.getElementById('pro-funnel-panel') ||
      document.createElement('details')) as HTMLDetailsElement,
    proFunnelView: (document.getElementById('pro-funnel-view') ||
      document.createElement('textarea')) as HTMLTextAreaElement,
    proFunnelDisabledNotice: document.getElementById('pro-funnel-disabled-notice') as HTMLElement,
    proFunnelRefreshButton: (document.getElementById('pro-funnel-refresh') ||
      document.createElement('button')) as HTMLButtonElement,
    proFunnelCopyButton: (document.getElementById('pro-funnel-copy') ||
      document.createElement('button')) as HTMLButtonElement,
    proFunnelEvidencePackCopyButton: (document.getElementById('pro-funnel-evidence-pack-copy') ||
      document.createElement('button')) as HTMLButtonElement,
    downloadProIntentRunEvidencePackButton: (document.getElementById(
      'download-pro-intent-run-evidence-pack'
    ) || document.createElement('button')) as HTMLButtonElement,
    exportProIntentEvents7dCsvButton: (document.getElementById('export-pro-intent-events-7d-csv') ||
      document.createElement('button')) as HTMLButtonElement,
    exportProIntentByCampaign7dCsvButton: (document.getElementById(
      'export-pro-intent-by-campaign-7d-csv'
    ) || document.createElement('button')) as HTMLButtonElement,
    exportProDistributionByCampaign7dCsvButton: (document.getElementById(
      'export-pro-distribution-by-campaign-7d-csv'
    ) || document.createElement('button')) as HTMLButtonElement,
    exportProAcquisitionEfficiencyByCampaign7dCsvButton: (document.getElementById(
      EXPORT_PRO_ACQ_EFF_BY_CAMPAIGN_7D_CSV_BUTTON_ID
    ) || document.createElement('button')) as HTMLButtonElement,
    proAcqEffByCampaignWeeklyReportCopyButton: (document.getElementById(
      COPY_PRO_ACQ_EFF_BY_CAMPAIGN_WEEKLY_REPORT_BUTTON_ID
    ) || document.createElement('button')) as HTMLButtonElement,
    proAcqEffByCampaignEvidencePackCopyButton: (document.getElementById(
      COPY_PRO_ACQ_EFF_BY_CAMPAIGN_EVIDENCE_PACK_BUTTON_ID
    ) || document.createElement('button')) as HTMLButtonElement,
    proAcqEffByCampaignEvidencePackDownloadButton: (document.getElementById(
      DOWNLOAD_PRO_ACQ_EFF_BY_CAMPAIGN_EVIDENCE_PACK_BUTTON_ID
    ) || document.createElement('button')) as HTMLButtonElement,
    proWeeklyChannelOpsEvidencePackDownloadButton: (document.getElementById(
      DOWNLOAD_PRO_WEEKLY_CHANNEL_OPS_EVIDENCE_PACK_BUTTON_ID
    ) || document.createElement('button')) as HTMLButtonElement,
    proIntentWeeklyDigestCopyButton: (document.getElementById('copy-pro-intent-weekly-digest') ||
      document.createElement('button')) as HTMLButtonElement,
    proIntentByCampaignWeeklyReportCopyButton: (document.getElementById(
      'copy-pro-intent-by-campaign-weekly-report'
    ) || document.createElement('button')) as HTMLButtonElement,
    womSummaryPanel: (document.getElementById('wom-summary-panel') ||
      document.createElement('details')) as HTMLDetailsElement,
    womSummaryView: (document.getElementById('wom-summary-view') ||
      document.createElement('textarea')) as HTMLTextAreaElement,
    womSummaryDisabledNotice: document.getElementById('wom-summary-disabled-notice') as HTMLElement,
    womSummaryRefreshButton: (document.getElementById('wom-summary-refresh') ||
      document.createElement('button')) as HTMLButtonElement,
    womSummaryCopyButton: (document.getElementById('wom-summary-copy') ||
      document.createElement('button')) as HTMLButtonElement,
    womSummaryEvidencePackCopyButton: (document.getElementById('wom-summary-evidence-pack-copy') ||
      document.createElement('button')) as HTMLButtonElement,
    growthFunnelPanel: (document.getElementById('growth-funnel-panel') ||
      document.createElement('details')) as HTMLDetailsElement,
    growthFunnelView: (document.getElementById('growth-funnel-view') ||
      document.createElement('textarea')) as HTMLTextAreaElement,
    growthFunnelRefreshButton: (document.getElementById('growth-funnel-refresh') ||
      document.createElement('button')) as HTMLButtonElement,
    growthFunnelCopyButton: (document.getElementById('growth-funnel-copy') ||
      document.createElement('button')) as HTMLButtonElement,
    appendWorkflowPanel: (document.getElementById('append-workflow-panel') ||
      document.createElement('details')) as HTMLDetailsElement,
    appendWorkflowView: (document.getElementById('append-workflow-view') ||
      document.createElement('textarea')) as HTMLTextAreaElement,
    appendWorkflowRefreshButton: (document.getElementById('append-workflow-refresh') ||
      document.createElement('button')) as HTMLButtonElement,
    appendWorkflowCopyButton: (document.getElementById('append-workflow-copy') ||
      document.createElement('button')) as HTMLButtonElement,
    appendWorkflowClearButton: (document.getElementById('append-workflow-clear') ||
      document.createElement('button')) as HTMLButtonElement,
    growthStatsPanel: (document.getElementById('growth-stats-panel') ||
      document.createElement('details')) as HTMLDetailsElement,
    growthStatsView: (document.getElementById('growth-stats-view') ||
      document.createElement('textarea')) as HTMLTextAreaElement,
    growthStatsRefreshButton: (document.getElementById('growth-stats-refresh') ||
      document.createElement('button')) as HTMLButtonElement,
    growthStatsCopyButton: (document.getElementById('growth-stats-copy') ||
      document.createElement('button')) as HTMLButtonElement,
    growthStatsResetButton: (document.getElementById('growth-stats-reset') ||
      document.createElement('button')) as HTMLButtonElement,

    proIntentCampaignInput: document.getElementById('pro-intent-campaign') as HTMLInputElement,
    proValidationAdvancedOpenButton: document.getElementById(
      'pro-validation-advanced-open'
    ) as HTMLButtonElement,
    proValidationAdvancedRouteCopyButton: document.getElementById(
      'pro-validation-advanced-route-copy'
    ) as HTMLButtonElement,
    proValidationAdvancedBriefCopyButton: document.getElementById(
      'pro-validation-advanced-brief-copy'
    ) as HTMLButtonElement,
    proValidationAdvancedChecklistCopyButton: document.getElementById(
      'pro-validation-advanced-checklist-copy'
    ) as HTMLButtonElement,
    proValidationBulkOpenButton: document.getElementById(
      'pro-validation-bulk-open'
    ) as HTMLButtonElement,
    proValidationBulkRouteCopyButton: document.getElementById(
      'pro-validation-bulk-route-copy'
    ) as HTMLButtonElement,
    proValidationBulkBriefCopyButton: document.getElementById(
      'pro-validation-bulk-brief-copy'
    ) as HTMLButtonElement,
    proValidationBulkChecklistCopyButton: document.getElementById(
      'pro-validation-bulk-checklist-copy'
    ) as HTMLButtonElement,
    proValidationStructuredOpenButton: document.getElementById(
      'pro-validation-structured-open'
    ) as HTMLButtonElement,
    proValidationStructuredRouteCopyButton: document.getElementById(
      'pro-validation-structured-route-copy'
    ) as HTMLButtonElement,
    proValidationStructuredBriefCopyButton: document.getElementById(
      'pro-validation-structured-brief-copy'
    ) as HTMLButtonElement,
    proValidationStructuredChecklistCopyButton: document.getElementById(
      'pro-validation-structured-checklist-copy'
    ) as HTMLButtonElement,
    proRouteValidationComparisonCopyButton: (document.getElementById(
      'copy-pro-route-validation-comparison-summary'
    ) || document.createElement('button')) as HTMLButtonElement,
    downloadProRouteValidationComparisonJsonButton: (document.getElementById(
      'download-pro-route-validation-comparison-json'
    ) || document.createElement('button')) as HTMLButtonElement,
    proRouteValidationWritebackCopyButton: (document.getElementById(
      'copy-pro-route-validation-writeback-summary'
    ) || document.createElement('button')) as HTMLButtonElement,
    downloadProRouteValidationWritebackJsonButton: (document.getElementById(
      'download-pro-route-validation-writeback-json'
    ) || document.createElement('button')) as HTMLButtonElement,
    proRouteValidationStabilityCopyButton: (document.getElementById(
      'copy-pro-route-validation-stability-summary'
    ) || document.createElement('button')) as HTMLButtonElement,
    downloadProRouteValidationStabilityJsonButton: (document.getElementById(
      'download-pro-route-validation-stability-json'
    ) || document.createElement('button')) as HTMLButtonElement,
    proIntentDecisionSummaryCopyButton: (document.getElementById(
      'copy-pro-intent-decision-summary'
    ) || document.createElement('button')) as HTMLButtonElement,
    downloadProIntentDecisionSummaryJsonButton: (document.getElementById(
      'download-pro-intent-decision-summary-json'
    ) || document.createElement('button')) as HTMLButtonElement,
    proRouteValidationVerdictCopyButton: (document.getElementById(
      'copy-pro-route-validation-verdict-summary'
    ) || document.createElement('button')) as HTMLButtonElement,
    downloadProRouteValidationVerdictJsonButton: (document.getElementById(
      'download-pro-route-validation-verdict-json'
    ) || document.createElement('button')) as HTMLButtonElement,
    proWaitlistButton: (document.getElementById('pro-waitlist-button') ||
      document.createElement('button')) as HTMLButtonElement,
    proWaitlistUrlCopyButton: document.getElementById('pro-waitlist-url-copy') as HTMLButtonElement,
    proWaitlistRecruitCopyButton: document.getElementById(
      'pro-waitlist-recruit-copy'
    ) as HTMLButtonElement,
    proStoreUrlCopyButton: document.getElementById('pro-store-url-copy') as HTMLButtonElement,
    proDistributionPackCopyButton: document.getElementById(
      'pro-distribution-pack-copy'
    ) as HTMLButtonElement,
    proWaitlistDistributionCampaignRequiredHint: document.getElementById(
      'pro-waitlist-distribution-campaign-required'
    ) as HTMLElement,
    downloadProIntentV1_100SummaryJsonButton: (document.getElementById(
      DOWNLOAD_PRO_INTENT_V1_100_SUMMARY_JSON_BUTTON_ID
    ) || document.createElement('button')) as HTMLButtonElement,
    downloadProIntentV1_100SummaryCsvButton: (document.getElementById(
      DOWNLOAD_PRO_INTENT_V1_100_SUMMARY_CSV_BUTTON_ID
    ) || document.createElement('button')) as HTMLButtonElement,

    womActionsStatusHint: document.getElementById('wom-actions-status') as HTMLElement,
    womShareOpenButton: document.getElementById('wom-share-open') as HTMLButtonElement,
    womShareCopyButton: document.getElementById('wom-share-copy') as HTMLButtonElement,
    womRateOpenButton: document.getElementById('wom-rate-open') as HTMLButtonElement,
    womFeedbackOpenButton: document.getElementById('wom-feedback-open') as HTMLButtonElement,

    // Chat Services elements
    defaultChatService: document.getElementById('default-chat-service') as HTMLSelectElement,
    defaultAutoOpenChat: document.getElementById('default-auto-open-chat') as HTMLInputElement,
    addCustomChatBtn: document.getElementById('add-custom-chat-btn') as HTMLButtonElement,
    chatServicesGrid: document.getElementById('chat-services-grid') as HTMLElement,
    chatServiceEditorModal: document.getElementById('chat-service-editor-modal') as HTMLElement,
    chatServiceModalTitle: document.getElementById('chat-service-modal-title') as HTMLElement,
    closeChatServiceModalBtn: document.getElementById(
      'close-chat-service-modal-btn'
    ) as HTMLButtonElement,
    chatServiceForm: document.getElementById('chat-service-form') as HTMLFormElement,
    chatServiceId: document.getElementById('chat-service-id') as HTMLInputElement,
    chatServiceName: document.getElementById('chat-service-name') as HTMLInputElement,
    chatServiceUrl: document.getElementById('chat-service-url') as HTMLInputElement,
    cancelChatServiceBtn: document.getElementById('cancel-chat-service-btn') as HTMLButtonElement,
    saveChatServiceBtn: document.getElementById('save-chat-service-btn') as HTMLButtonElement
  };
}

/**
 * 本地化UI
 */
function localizeUI() {
  if (FORCE_UI_LANGUAGE) {
    document.documentElement.lang = FORCE_UI_LANGUAGE;
  }

  const i18nElements = document.querySelectorAll('[data-i18n]');
  i18nElements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      const message = getMessage(key);
      if (message) {
        element.textContent = message;
      }
    }
  });

  const i18nPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
  i18nPlaceholders.forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (key) {
      const message = getMessage(key);
      if (message) {
        (element as HTMLInputElement).placeholder = message;
      }
    }
  });

  document.title = getMessage('optionsTitle') || 'Prompt Manager - Copylot';
}

function syncOptionsOnboardingPanelVisibility(settings: Settings): void {
  if (!elements?.onboardingPanel) return;
  elements.onboardingPanel.hidden =
    settings.popupOnboardingCompletedVersion >= settings.popupOnboardingVersion;
}

function setShortcutSettingsFeedback(messageKey: string | null): void {
  if (!elements?.shortcutSettingsFeedback) return;

  if (!messageKey) {
    elements.shortcutSettingsFeedback.hidden = true;
    elements.shortcutSettingsFeedback.textContent = '';
    return;
  }

  elements.shortcutSettingsFeedback.hidden = false;
  elements.shortcutSettingsFeedback.textContent = getMessage(messageKey);
}

async function openShortcutSettingsPage(): Promise<void> {
  try {
    await reportE2EOpenedUrl('chrome://extensions/shortcuts');
    await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    setShortcutSettingsFeedback(null);
  } catch (error) {
    console.warn('Failed to open shortcut settings page:', error);
    setShortcutSettingsFeedback('shortcutSettingsManualOpenHint');
  }
}

function setupShortcutCommandCardInteractions(): void {
  document.querySelectorAll<HTMLElement>('[data-shortcut-command-card]').forEach((card) => {
    card.addEventListener('click', () => {
      void openShortcutSettingsPage();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      void openShortcutSettingsPage();
    });
  });
}

function renderShortcutSettingsPanel(): void {
  const activePrompts = getActivePrompts(allPrompts);
  const platform = getShortcutPlatform();

  elements.shortcutCurrentConvert.textContent = getConvertShortcutLabel();

  const currentMap: Record<QuickPromptSlot, HTMLElement> = {
    1: elements.shortcutCurrentSlot1,
    2: elements.shortcutCurrentSlot2,
    3: elements.shortcutCurrentSlot3
  };
  const promptNameMap: Record<QuickPromptSlot, HTMLElement> = {
    1: elements.shortcutSlot1PromptName,
    2: elements.shortcutSlot2PromptName,
    3: elements.shortcutSlot3PromptName
  };

  for (const slot of [1, 2, 3] as QuickPromptSlot[]) {
    const command = getQuickPromptSlotCommandName(slot);
    const prompt = activePrompts.find((item) => item.quickAccessSlot === slot);
    const currentShortcut = currentCommandShortcuts.get(command)?.trim();
    currentMap[slot].textContent =
      currentShortcut ||
      (!currentCommandShortcuts.has(command)
        ? getQuickCommandDefaultShortcut(command, platform)
        : getMessage('shortcutNotSet'));
    promptNameMap[slot].textContent = prompt?.title || getMessage('shortcutPromptUnassigned');
  }
}

/**
 * 加载设置
 */
async function loadSettings() {
  try {
    currentSettings = await getSettings();
    await loadCommandShortcuts();
    allPrompts = [...currentSettings.userPrompts];
    if (elements?.anonymousUsageDataSwitch) {
      elements.anonymousUsageDataSwitch.checked = Boolean(
        currentSettings.isAnonymousUsageDataEnabled
      );
    }
    if (elements?.proIntentCampaignInput) {
      elements.proIntentCampaignInput.value = currentSettings.proIntentCampaign || '';
    }
    updateProWaitlistDistributionToolkitState();
    updateProIntentEvents7dCsvExportButtonState(
      Boolean(currentSettings.isAnonymousUsageDataEnabled)
    );
    updateProIntentByCampaign7dCsvExportButtonState(
      Boolean(currentSettings.isAnonymousUsageDataEnabled)
    );
    updateProDistributionByCampaign7dCsvExportButtonState(
      Boolean(currentSettings.isAnonymousUsageDataEnabled)
    );
    updateProAcquisitionEfficiencyByCampaign7dCsvExportButtonState(
      Boolean(currentSettings.isAnonymousUsageDataEnabled)
    );
    syncOptionsOnboardingPanelVisibility(currentSettings);
    filterAndRenderPrompts();
    renderShortcutSettingsPanel();
    updateSyncStatus();
    console.debug('Settings loaded:', currentSettings);
  } catch (error) {
    console.error('Error loading settings:', error);
    showNotification(getMessage('loadingSettingsFailed'), 'error');
  }
}

/**
 * 更新同步状态
 */
function updateSyncStatus() {
  // 检查Chrome storage API状态
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
    elements.syncStatusText.textContent = getMessage('syncStatusUnavailable');
    elements.syncStatusBtn.style.color = 'var(--error-color)';
    return;
  }

  elements.syncStatusText.textContent = getMessage('syncStatusConnected');
  elements.syncStatusBtn.style.color = 'var(--success-color)';
}

/**
 * 手动触发同步
 */
async function manualSync() {
  try {
    elements.syncStatusText.textContent = getMessage('syncStatusSyncing');
    elements.syncStatusBtn.style.color = 'var(--warning-color)';

    // 重新保存设置以触发同步
    await saveSettings({ userPrompts: allPrompts });

    elements.syncStatusText.textContent = getMessage('syncStatusConnected');
    elements.syncStatusBtn.style.color = 'var(--success-color)';
    showNotification(getMessage('syncSuccess'), 'success');
  } catch (error) {
    console.error('Manual sync failed:', error);
    elements.syncStatusText.textContent = getMessage('syncStatusFailed');
    elements.syncStatusBtn.style.color = 'var(--error-color)';
    const errorMessage = (error as Error).message;
    showNotification(getMessage('syncFailure', [errorMessage]), 'error');
  }
}

async function setAnonymousUsageDataEnabled(enabled: boolean): Promise<void> {
  try {
    await saveSettings({ isAnonymousUsageDataEnabled: enabled });
    currentSettings = { ...currentSettings, isAnonymousUsageDataEnabled: enabled };
    if (elements?.anonymousUsageDataSwitch) {
      elements.anonymousUsageDataSwitch.checked = enabled;
    }
    updateProIntentEvents7dCsvExportButtonState(enabled);
    updateProIntentByCampaign7dCsvExportButtonState(enabled);
    updateProDistributionByCampaign7dCsvExportButtonState(enabled);
    updateProAcquisitionEfficiencyByCampaign7dCsvExportButtonState(enabled);
    await Promise.allSettled([
      refreshTelemetryEventsPanel(),
      refreshProFunnelPanel(),
      refreshWomSummaryPanel()
    ]);
  } catch (error) {
    console.error('Failed to update anonymous usage data toggle:', error);
    if (elements?.anonymousUsageDataSwitch) {
      elements.anonymousUsageDataSwitch.checked = Boolean(
        currentSettings?.isAnonymousUsageDataEnabled
      );
    }
    showNotification(getMessage('savingFailed'), 'error');
  }
}

function loadPromptSortMode(): void {
  let stored: unknown = null;
  try {
    stored = localStorage.getItem(PROMPT_SORT_MODE_STORAGE_KEY);
  } catch (error) {
    console.debug('Failed to read prompt sort mode from localStorage:', error);
  }

  promptSortMode = parsePromptSortMode(stored);
  elements.promptSortSelect.value = promptSortMode;
}

function persistPromptSortMode(mode: PromptSortMode): void {
  try {
    localStorage.setItem(PROMPT_SORT_MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.debug('Failed to persist prompt sort mode to localStorage:', error);
  }
}

function setPromptSortMode(value: unknown): void {
  const mode = parsePromptSortMode(value);
  promptSortMode = mode;
  elements.promptSortSelect.value = mode;
  persistPromptSortMode(mode);
}

/**
 * 过滤和渲染prompts
 */
function filterAndRenderPrompts() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const categoryFilter = elements.categoryFilter.value;
  const activePrompts = getActivePrompts(allPrompts);

  filteredPrompts = activePrompts.filter((prompt) => {
    const matchesSearch =
      !searchTerm ||
      prompt.title.toLowerCase().includes(searchTerm) ||
      prompt.template.toLowerCase().includes(searchTerm);

    const matchesCategory =
      categoryFilter === 'all' || getCategoryFromPrompt(prompt) === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const promptsToRender = sortPrompts(filteredPrompts, promptSortMode);

  renderPrompts(promptsToRender);
  updateUI();
}

/**
 * 从prompt获取分类
 */
function getCategoryFromPrompt(prompt: Prompt): string {
  // 优先使用保存的category字段
  if (prompt.category) {
    return prompt.category;
  }

  // 回退到基于preset ID或内容推断分类（用于旧数据兼容性）
  if (prompt.id.includes('summary')) return 'summary';
  if (prompt.id.includes('translate')) return 'translate';
  if (prompt.id.includes('code')) return 'coding';
  if (prompt.id.includes('polish') || prompt.id.includes('expand')) return 'writing';
  return 'custom';
}

/**
 * 渲染prompts网格
 */
function renderPrompts(prompts: Prompt[]) {
  elements.promptsGrid.innerHTML = '';

  if (prompts.length === 0) {
    elements.emptyState.style.display = 'block';
    return;
  }

  elements.emptyState.style.display = 'none';

  prompts.forEach((prompt) => {
    const card = createPromptCard(prompt);
    elements.promptsGrid.appendChild(card);
  });
}

/**
 * 创建prompt卡片
 */
function createPromptCard(prompt: Prompt): HTMLElement {
  const card = document.createElement('div');
  card.className = 'prompt-card';
  card.setAttribute('data-id', prompt.id);

  const category = getCategoryFromPrompt(prompt);
  const categoryText = getCategoryDisplayName(category);
  const shortcutLabel = isQuickPromptSlot(prompt.quickAccessSlot)
    ? formatPromptSlotShortcut(prompt.quickAccessSlot)
    : null;
  const quickSlotText =
    isQuickPromptSlot(prompt.quickAccessSlot) && shortcutLabel
      ? `${getMessage(`quickPromptSlot${prompt.quickAccessSlot}`)} · ${shortcutLabel}`
      : null;
  const lastUsedText =
    typeof prompt.lastUsedAt === 'number' &&
    Number.isFinite(prompt.lastUsedAt) &&
    prompt.lastUsedAt > 0
      ? formatTimeAgo(prompt.lastUsedAt)
      : getMessage('promptNeverUsed');

  // 为内置prompt添加特殊样式类
  if (prompt.builtIn) {
    card.classList.add('builtin-prompt');
  }

  card.innerHTML = `
    <input type="checkbox" class="prompt-card-checkbox" data-id="${prompt.id}">
    <div class="prompt-card-header">
      <h3 class="prompt-card-title">${escapeHtml(prompt.title)}${prompt.builtIn ? ' <span class="builtin-badge">内置</span>' : ''}</h3>
      <div class="prompt-card-actions">
        <button class="action-btn edit-btn" title="${getMessage('editPrompt')}" data-id="${prompt.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="action-btn duplicate-btn" title="${getMessage('copy')}" data-id="${prompt.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button class="action-btn delete-btn" title="${getMessage('deleteSelected')}" data-id="${prompt.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="prompt-card-category">${categoryText}${quickSlotText ? ` <span class="prompt-shortcut-badge">${escapeHtml(quickSlotText)}</span>` : ''}</div>
    
    <div class="prompt-card-content">
      ${escapeHtml(prompt.template)}
    </div>
    
    <div class="prompt-card-footer">
      <span class="usage-count">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        ${formatUsageCount(prompt.usageCount)}
      </span>
      <span class="last-used">${lastUsedText}</span>
    </div>
  `;

  return card;
}

/**
 * 获取分类显示名称
 */
function getCategoryDisplayName(category: string): string {
  const key = `category${category.charAt(0).toUpperCase() + category.slice(1)}`;
  return getMessage(key) || getMessage('categoryCustom');
}

/**
 * 预定义的图标背景色数组，用于区分不同的服务
 */
const ICON_COLORS = [
  '#4F46E5', // 靛紫色 - ChatGPT
  '#D97F42', // 橙棕色 - Claude
  '#4285F4', // 蓝色 - Gemini
  '#295FFF', // 深蓝色 - 文心一言
  '#FF6400', // 橙色 - 通义千问
  '#7C3AED', // 紫色 - Kimi
  '#00BB70', // 绿色 - 豆包
  '#EF4444', // 红色
  '#10B981', // 翠绿色
  '#F59E0B', // 黄色
  '#8B5CF6', // 薰衣草紫
  '#06B6D4', // 青色
  '#EC4899', // 粉色
  '#84CC16', // 柠檬绿
  '#F97316', // 橙红色
  '#6366F1' // 蓝紫色
];

/**
 * 根据服务ID获取对应的背景色
 */
function getServiceIconColor(serviceId: string): string {
  // 对于内置服务，使用预定义的颜色映射
  const builtInColors: Record<string, string> = {
    chatgpt: ICON_COLORS[0],
    claude: ICON_COLORS[1],
    gemini: ICON_COLORS[2],
    yiyan: ICON_COLORS[3],
    tongyi: ICON_COLORS[4],
    kimi: ICON_COLORS[5],
    doubao: ICON_COLORS[6],
    deepseek: ICON_COLORS[7],
    poe: ICON_COLORS[8],
    glm: ICON_COLORS[9],
    'openai-playground': ICON_COLORS[10],
    perplexity: ICON_COLORS[11],
    grok: ICON_COLORS[12],
    lmarena: ICON_COLORS[13]
  };

  if (builtInColors[serviceId]) {
    return builtInColors[serviceId];
  }

  // 对于自定义服务，使用简单的哈希算法分配颜色
  let hash = 0;
  for (let i = 0; i < serviceId.length; i++) {
    const char = serviceId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为32位整数
  }
  const colorIndex = Math.abs(hash) % ICON_COLORS.length;
  return ICON_COLORS[colorIndex];
}

/**
 * 获取chat服务的文字图标信息
 */
function getServiceIconInfo(service: ChatService): { text: string; color: string } {
  const serviceName = service.name;

  if (!serviceName) {
    return { text: '?', color: ICON_COLORS[0] };
  }

  // 获取第一个字符并转换为大写
  const firstChar = serviceName.charAt(0).toUpperCase();

  let iconText: string;
  // 如果是中文字符，直接返回
  if (/[\u4e00-\u9fff]/.test(firstChar)) {
    iconText = firstChar;
  }
  // 如果是英文字符，返回大写字母
  else if (/[A-Za-z]/.test(firstChar)) {
    iconText = firstChar;
  }
  // 其他情况返回问号
  else {
    iconText = '?';
  }

  return {
    text: iconText,
    color: getServiceIconColor(service.id)
  };
}

/**
 * HTML转义
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 格式化时间为友好显示
 */
function formatTimeAgo(timestamp?: number): string {
  if (!timestamp) return getMessage('justCreated');

  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return getMessage('justNow');
  if (diffMin < 60) return getMessage('minutesAgo', [diffMin.toString()]);
  if (diffHour < 24) return getMessage('hoursAgo', [diffHour.toString()]);
  if (diffDay < 7) return getMessage('daysAgo', [diffDay.toString()]);

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 格式化使用次数
 */
function formatUsageCount(count?: number): string {
  return getMessage('usageCount', [(count || 0).toString()]);
}

/**
 * 更新UI状态
 */
function updateUI() {
  // 批量操作按钮总是可用，但文本会根据选择状态变化
  elements.batchActionBtn.disabled = false;

  // 更新复选框状态
  document.querySelectorAll('.prompt-card-checkbox').forEach((checkbox) => {
    const promptId = (checkbox as HTMLInputElement).getAttribute('data-id');
    if (promptId) {
      (checkbox as HTMLInputElement).checked = selectedPrompts.has(promptId);
    }
  });
}

/**
 * 切换prompt选择状态
 */
function togglePromptSelection(promptId: string) {
  if (selectedPrompts.has(promptId)) {
    selectedPrompts.delete(promptId);
  } else {
    selectedPrompts.add(promptId);
  }
  updateUI();
}

/**
 * 全选prompts
 */
function selectAllPrompts() {
  filteredPrompts.forEach((prompt) => {
    selectedPrompts.add(prompt.id);
  });
  updateUI();
}

/**
 * 取消全选prompts
 */
function deselectAllPrompts() {
  selectedPrompts.clear();
  updateUI();
}

/**
 * 批量删除选中的prompts
 */
async function deleteSelectedPrompts() {
  if (selectedPrompts.size === 0) {
    showNotification(getMessage('errorNoPromptsSelected'), 'error');
    return;
  }

  const count = selectedPrompts.size;
  if (confirm(getMessage('confirmDeleteSelectedMessage', [count.toString()]))) {
    // 处理批量删除，对内置prompt标记删除，对用户prompt直接删除
    allPrompts.forEach((prompt) => {
      if (selectedPrompts.has(prompt.id)) {
        if (prompt.builtIn) {
          prompt.deleted = true;
        }
      }
    });
    // 删除非内置的用户prompt
    allPrompts = allPrompts.filter((p) => !(selectedPrompts.has(p.id) && !p.builtIn));
    selectedPrompts.clear();
    await savePrompts();
    showNotification(getMessage('deleteSuccessMessage', [count.toString()]), 'success');
  }
}

/**
 * 打开prompt编辑器
 */
function openPromptEditor(prompt?: Prompt) {
  editingPromptId = prompt?.id || null;

  // 更新chat服务选择框
  updateChatServiceOptions();

  if (prompt) {
    elements.modalTitle.textContent = getMessage('editPrompt');
    elements.promptId.value = prompt.id;
    elements.promptTitle.value = prompt.title;
    elements.promptCategory.value = prompt.category || getCategoryFromPrompt(prompt);
    elements.promptTemplate.value = prompt.template;
    elements.promptTargetChat.value = prompt.targetChatId || '';
    elements.promptAutoOpenChat.checked =
      prompt.autoOpenChat !== undefined ? prompt.autoOpenChat : currentSettings.defaultAutoOpenChat;
    elements.promptQuickAccessSlot.value = isQuickPromptSlot(prompt.quickAccessSlot)
      ? String(prompt.quickAccessSlot)
      : '';
  } else {
    elements.modalTitle.textContent = getMessage('newPromptTitle');
    elements.promptForm.reset();
    elements.promptId.value = '';
    elements.promptTargetChat.value = '';
    elements.promptAutoOpenChat.checked = currentSettings.defaultAutoOpenChat;
    elements.promptQuickAccessSlot.value = '';
  }

  elements.promptEditorModal.style.display = 'flex';
  elements.promptTitle.focus();
}

/**
 * 关闭prompt编辑器
 */
function closePromptEditor() {
  elements.promptEditorModal.style.display = 'none';
  editingPromptId = null;
}

/**
 * 打开预览模态框
 */
function openPreviewModal(template: string) {
  elements.previewModal.style.display = 'flex';

  // 设置示例内容
  const sampleText = elements.previewSample.value || getMessage('previewSampleText');
  elements.previewSample.value = sampleText;

  // 生成预览结果
  updatePreviewResult(template, sampleText);

  // 监听示例内容变化
  elements.previewSample.oninput = () => {
    updatePreviewResult(template, elements.previewSample.value);
  };
}

/**
 * 关闭预览模态框
 */
function closePreviewModal() {
  elements.previewModal.style.display = 'none';
  elements.previewSample.oninput = null;
}

/**
 * 更新预览结果
 */
function updatePreviewResult(template: string, sampleContent: string) {
  const result = template.replace(/\{content\}/g, sampleContent);
  elements.previewResult.textContent = result;
}

/**
 * 显示使用说明
 */
function showUsageInstructions() {
  elements.usageInstructions.style.display = 'block';
}

/**
 * 隐藏使用说明
 */
function hideUsageInstructions() {
  elements.usageInstructions.style.display = 'none';
}

/**
 * 编辑prompt
 */
function editPrompt(promptId: string) {
  const prompt = allPrompts.find((p) => p.id === promptId);
  if (prompt) {
    openPromptEditor(prompt);
  }
}

/**
 * 复制prompt
 */
async function duplicatePrompt(promptId: string) {
  const prompt = allPrompts.find((p) => p.id === promptId);
  if (prompt) {
    const newPrompt: Prompt = {
      id: generateUUID(),
      title: `${prompt.title}${getMessage('duplicateSuffix')}`,
      template: prompt.template,
      category: prompt.category,
      usageCount: 0,
      createdAt: Date.now()
    };

    allPrompts.push(newPrompt);
    await savePrompts();
    showNotification(getMessage('duplicateSuccessMessage'), 'success');
  }
}

/**
 * 删除prompt
 */
async function deletePrompt(promptId: string) {
  if (confirm(getMessage('confirmDeleteSingleMessage'))) {
    const prompt = allPrompts.find((p) => p.id === promptId);
    if (prompt && prompt.builtIn) {
      // 对于内置prompt，标记为已删除而不是真正删除
      prompt.deleted = true;
    } else {
      // 对于用户创建的prompt，直接删除
      allPrompts = allPrompts.filter((p) => p.id !== promptId);
    }
    await savePrompts();
    showNotification(getMessage('deleteSingleSuccessMessage'), 'success');
  }
}

/**
 * 保存prompts到设置
 */
async function savePrompts() {
  try {
    const wasEmpty = getActivePrompts(allPrompts).length === 0;

    // 显示同步中状态
    elements.syncStatusText.textContent = getMessage('syncStatusSyncing');
    elements.syncStatusBtn.style.color = 'var(--warning-color)';

    await saveSettings({ userPrompts: allPrompts });
    currentSettings.userPrompts = [...allPrompts];
    filterAndRenderPrompts();
    renderShortcutSettingsPanel();

    // 同步成功
    elements.syncStatusText.textContent = getMessage('syncStatusConnected');
    elements.syncStatusBtn.style.color = 'var(--success-color)';

    // 如果是第一次创建prompt，显示使用说明
    if (wasEmpty && getActivePrompts(allPrompts).length === 1) {
      showUsageInstructions();
    }

    // 通知background script更新菜单
    chrome.runtime.sendMessage({ type: 'update-context-menu' });
  } catch (error) {
    console.error('Error saving prompts:', error);

    // 同步失败
    elements.syncStatusText.textContent = getMessage('syncStatusFailed');
    elements.syncStatusBtn.style.color = 'var(--error-color)';
    const errorMessage = (error as Error).message;
    showNotification(getMessage('savingFailed', [errorMessage]), 'error');
  }
}

/**
 * 保存prompt表单
 */
async function savePromptForm(event: Event) {
  event.preventDefault();

  const title = elements.promptTitle.value.trim();
  const template = elements.promptTemplate.value.trim();

  if (!title || !template) {
    showNotification(getMessage('errorFillInTitleAndTemplate'), 'error');
    return;
  }

  const category = elements.promptCategory.value;

  const targetChatId = elements.promptTargetChat.value || undefined;
  const autoOpenChat = elements.promptAutoOpenChat.checked;
  const quickAccessSlotValue = elements.promptQuickAccessSlot.value.trim();
  const quickAccessSlot = isQuickPromptSlot(Number.parseInt(quickAccessSlotValue, 10))
    ? (Number.parseInt(quickAccessSlotValue, 10) as QuickPromptSlot)
    : null;

  if (editingPromptId) {
    allPrompts = assignQuickPromptSlot(allPrompts, editingPromptId, quickAccessSlot);
    const prompt = allPrompts.find((p) => p.id === editingPromptId);
    if (prompt) {
      prompt.title = title;
      prompt.template = template;
      prompt.category = category;
      prompt.targetChatId = targetChatId;
      prompt.autoOpenChat = autoOpenChat;
    }
  } else {
    const newPromptId = generateUUID();
    allPrompts = assignQuickPromptSlot(allPrompts, newPromptId, quickAccessSlot);
    // 新建prompt
    const newPrompt: Prompt = {
      id: newPromptId,
      title,
      template,
      category,
      targetChatId,
      autoOpenChat,
      quickAccessSlot: quickAccessSlot ?? undefined,
      usageCount: 0,
      createdAt: Date.now()
    };
    allPrompts.push(newPrompt);
  }

  const isNewPrompt = !editingPromptId;

  await savePrompts();
  closePromptEditor();

  if (isNewPrompt) {
    showNotification(getMessage('saveSuccessNewPromptMessage'), 'success');
  } else {
    showNotification(getMessage('saveSuccessMessage'), 'success');
  }
}

/**
 * 插入内容占位符
 */
function insertContentPlaceholder() {
  const textarea = elements.promptTemplate;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  textarea.value = text.substring(0, start) + '{content}' + text.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + '{content}'.length;
  textarea.focus();
}

/**
 * 预览prompt
 */
function previewPrompt() {
  const template = elements.promptTemplate.value;
  if (!template) {
    showNotification(getMessage('errorTemplateNeeded'), 'error');
    return;
  }

  // 打开预览模态框
  openPreviewModal(template);
}

/**
 * 导出数据格式定义
 */
interface ExportData {
  version: string;
  exportDate: string;
  prompts: Prompt[];
}

/**
 * 导出所有prompts
 */
function handleExportPrompts() {
  try {
    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      prompts: allPrompts
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `magic-copy-prompts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification(getMessage('exportSuccessMessage'), 'success');
    closeImportExportModal();
  } catch (error) {
    console.error('Export failed:', error);
    const errorMessage = (error as Error).message;
    showNotification(getMessage('exportFailedMessage', [errorMessage]), 'error');
  }
}

/**
 * 处理文件导入
 */
function handleImportPrompts() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);

      if (!validateImportData(data)) {
        showNotification(getMessage('errorInvalidImportFile'), 'error');
        return;
      }

      const importedPrompts = data.prompts;
      const duplicateCount = importedPrompts.filter((imported) =>
        allPrompts.some((existing) => existing.id === imported.id)
      ).length;

      if (duplicateCount > 0) {
        if (!confirm(getMessage('confirmImportWithDuplicates', [duplicateCount.toString()]))) {
          return;
        }
      }

      // 过滤重复的prompts
      const newPrompts = importedPrompts.filter(
        (imported) => !allPrompts.some((existing) => existing.id === imported.id)
      );

      // 为导入的prompts设置默认值
      newPrompts.forEach((prompt) => {
        if (!prompt.usageCount) prompt.usageCount = 0;
        if (!prompt.createdAt) prompt.createdAt = Date.now();
      });

      allPrompts.push(...newPrompts);
      await savePrompts();

      showNotification(
        getMessage('importSuccessMessage', [newPrompts.length.toString()]),
        'success'
      );
      closeImportExportModal();
    } catch (error) {
      console.error('Import failed:', error);
      const errorMessage = (error as Error).message;
      showNotification(getMessage('importFailedMessage', [errorMessage]), 'error');
    }
  };

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

/**
 * 验证导入数据格式
 */
type UnknownRecord = Record<string, unknown>;

function isPromptLike(value: unknown): value is Prompt {
  if (!value || typeof value !== 'object') return false;
  const record = value as UnknownRecord;
  if (
    typeof record.id !== 'string' ||
    typeof record.title !== 'string' ||
    typeof record.template !== 'string'
  ) {
    return false;
  }
  if (record.usageCount !== undefined && typeof record.usageCount !== 'number') return false;
  if (record.createdAt !== undefined && typeof record.createdAt !== 'number') return false;
  if (record.lastUsedAt !== undefined && typeof record.lastUsedAt !== 'number') return false;
  if (record.targetChatId !== undefined && typeof record.targetChatId !== 'string') return false;
  if (record.autoOpenChat !== undefined && typeof record.autoOpenChat !== 'boolean') return false;
  if (
    record.quickAccessSlot !== undefined &&
    record.quickAccessSlot !== null &&
    !isQuickPromptSlot(record.quickAccessSlot)
  ) {
    return false;
  }
  if (record.builtIn !== undefined && typeof record.builtIn !== 'boolean') return false;
  if (record.deleted !== undefined && typeof record.deleted !== 'boolean') return false;
  if (record.templateVersion !== undefined && typeof record.templateVersion !== 'number')
    return false;
  return true;
}

function validateImportData(data: unknown): data is { prompts: Prompt[] } {
  if (!data || typeof data !== 'object') return false;
  const payload = data as UnknownRecord;
  if (!Array.isArray(payload.prompts)) return false;
  return payload.prompts.every(isPromptLike);
}

/**
 * 显示导入导出模态框
 */
function showImportExportModal() {
  elements.importExportModal.style.display = 'flex';
}

/**
 * 关闭导入导出模态框
 */
function closeImportExportModal() {
  elements.importExportModal.style.display = 'none';
}

/**
 * 显示通知
 */
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // 创建简单的通知
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 3000;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    transform: translateX(100%);
  `;

  document.body.appendChild(notification);

  // 动画显示
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);

  // 自动移除
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function sortTelemetryEventsForDisplay(events: TelemetryEvent[]): TelemetryEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => b.event.ts - a.event.ts || a.index - b.index)
    .map(({ event }) => event);
}

function formatTelemetryEventsAsJson(events: TelemetryEvent[]): string {
  return `${JSON.stringify(events, null, 2)}\n`;
}

async function readTelemetryEventsForDisplay(): Promise<TelemetryEvent[]> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return [];

  try {
    const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
    return sanitizeTelemetryEvents(result[TELEMETRY_EVENTS_KEY]);
  } catch (error) {
    console.warn('Failed to read telemetry events:', error);
    return [];
  }
}

async function refreshTelemetryEventsPanel(): Promise<TelemetryEvent[]> {
  if (!elements?.telemetryEventsCount || !elements?.telemetryEventsView) return [];

  const events = sortTelemetryEventsForDisplay(await readTelemetryEventsForDisplay());
  elements.telemetryEventsCount.textContent = String(events.length);
  elements.telemetryEventsView.value = JSON.stringify(events, null, 2);
  return events;
}

function fallbackCopyText(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch (error) {
    console.warn('Fallback copy failed:', error);
    return false;
  }
}

async function fallbackCopyTextForE2E(text: string, copied: boolean): Promise<boolean> {
  if (copied) {
    await reportE2ECopiedText(text);
  }
  return copied;
}

async function copyTelemetryEventsToClipboard(): Promise<void> {
  const events = sortTelemetryEventsForDisplay(await readTelemetryEventsForDisplay());
  const text = formatTelemetryEventsAsJson(events);

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('telemetryEventsCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy telemetry events:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('telemetryEventsCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('telemetryEventsCopyFailed'), 'error');
  }
}

async function clearTelemetryEventsAndRefresh(): Promise<void> {
  try {
    await clearTelemetryEvents();
    const events = (await refreshTelemetryEventsPanel()) ?? [];
    showNotification(
      events.length === 0
        ? getMessage('telemetryEventsClearSuccess')
        : getMessage('telemetryEventsClearFailed'),
      events.length === 0 ? 'success' : 'error'
    );
  } catch (error) {
    console.warn('Failed to clear telemetry events:', error);
    showNotification(getMessage('telemetryEventsClearFailed'), 'error');
  }
}

function formatProFunnelSummaryAsJson(summary: ProFunnelSummary): string {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

function formatProFunnelEvidencePackAsJson(pack: ProFunnelEvidencePack): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}

function updateProIntentEvents7dCsvExportButtonState(enabled: boolean): void {
  if (!elements?.exportProIntentEvents7dCsvButton) return;
  elements.exportProIntentEvents7dCsvButton.disabled = !enabled;
}

function updateProIntentByCampaign7dCsvExportButtonState(enabled: boolean): void {
  if (!elements?.exportProIntentByCampaign7dCsvButton) return;
  elements.exportProIntentByCampaign7dCsvButton.disabled = !enabled;
}

function updateProDistributionByCampaign7dCsvExportButtonState(enabled: boolean): void {
  if (!elements?.exportProDistributionByCampaign7dCsvButton) return;
  elements.exportProDistributionByCampaign7dCsvButton.disabled = !enabled;
}

function updateProAcquisitionEfficiencyByCampaign7dCsvExportButtonState(enabled: boolean): void {
  if (!elements?.exportProAcquisitionEfficiencyByCampaign7dCsvButton) return;
  elements.exportProAcquisitionEfficiencyByCampaign7dCsvButton.disabled = !enabled;
}

function getProIntentCampaign(): string | undefined {
  const value = elements?.proIntentCampaignInput
    ? elements.proIntentCampaignInput.value
    : currentSettings?.proIntentCampaign || '';
  const sanitized = sanitizeCampaign(value);
  return sanitized || undefined;
}

const ADVANCED_CLEANING_VALIDATION_TRACK_ID = 'advanced_cleaning' as const;
const BULK_COLLECTION_VALIDATION_TRACK_ID = 'bulk_collection' as const;
const STRUCTURED_EXPORT_VALIDATION_TRACK_ID = 'structured_export' as const;

function updateProWaitlistDistributionToolkitState(): void {
  if (
    !elements?.proIntentCampaignInput ||
    !elements?.proValidationAdvancedRouteCopyButton ||
    !elements?.proValidationAdvancedBriefCopyButton ||
    !elements?.proValidationAdvancedChecklistCopyButton ||
    !elements?.proValidationBulkRouteCopyButton ||
    !elements?.proValidationBulkBriefCopyButton ||
    !elements?.proValidationBulkChecklistCopyButton ||
    !elements?.proValidationStructuredRouteCopyButton ||
    !elements?.proValidationStructuredBriefCopyButton ||
    !elements?.proValidationStructuredChecklistCopyButton ||
    !elements?.proWaitlistUrlCopyButton ||
    !elements?.proWaitlistRecruitCopyButton ||
    !elements?.proStoreUrlCopyButton ||
    !elements?.proDistributionPackCopyButton ||
    !elements?.proWaitlistDistributionCampaignRequiredHint
  ) {
    return;
  }

  const state = computeProWaitlistDistributionState(elements.proIntentCampaignInput.value);
  const disabled = !state.enabled;
  elements.proValidationAdvancedRouteCopyButton.disabled = disabled;
  elements.proValidationAdvancedBriefCopyButton.disabled = disabled;
  elements.proValidationAdvancedChecklistCopyButton.disabled = disabled;
  elements.proValidationBulkRouteCopyButton.disabled = disabled;
  elements.proValidationBulkBriefCopyButton.disabled = disabled;
  elements.proValidationBulkChecklistCopyButton.disabled = disabled;
  elements.proValidationStructuredRouteCopyButton.disabled = disabled;
  elements.proValidationStructuredBriefCopyButton.disabled = disabled;
  elements.proValidationStructuredChecklistCopyButton.disabled = disabled;
  elements.proWaitlistUrlCopyButton.disabled = disabled;
  elements.proWaitlistRecruitCopyButton.disabled = disabled;
  elements.proStoreUrlCopyButton.disabled = disabled;
  elements.proDistributionPackCopyButton.disabled = disabled;
  elements.proWaitlistDistributionCampaignRequiredHint.hidden = state.enabled;

  const tooltip = disabled ? getMessage('proWaitlistDistributionCampaignRequired') || '' : '';
  elements.proValidationAdvancedRouteCopyButton.title = tooltip;
  elements.proValidationAdvancedBriefCopyButton.title = tooltip;
  elements.proValidationAdvancedChecklistCopyButton.title = tooltip;
  elements.proValidationBulkRouteCopyButton.title = tooltip;
  elements.proValidationBulkBriefCopyButton.title = tooltip;
  elements.proValidationBulkChecklistCopyButton.title = tooltip;
  elements.proValidationStructuredRouteCopyButton.title = tooltip;
  elements.proValidationStructuredBriefCopyButton.title = tooltip;
  elements.proValidationStructuredChecklistCopyButton.title = tooltip;
  elements.proWaitlistUrlCopyButton.title = tooltip;
  elements.proWaitlistRecruitCopyButton.title = tooltip;
  elements.proStoreUrlCopyButton.title = tooltip;
  elements.proDistributionPackCopyButton.title = tooltip;
}

async function readProFunnelSummaryForDisplay(): Promise<ProFunnelSummary> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return buildProFunnelSummary({
      enabled: Boolean(currentSettings?.isAnonymousUsageDataEnabled),
      telemetryEvents: []
    });
  }

  try {
    const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
    return buildProFunnelSummary({
      enabled: Boolean(currentSettings?.isAnonymousUsageDataEnabled),
      telemetryEvents: result[TELEMETRY_EVENTS_KEY]
    });
  } catch (error) {
    console.warn('Failed to read telemetry events for pro funnel summary:', error);
    return buildProFunnelSummary({
      enabled: Boolean(currentSettings?.isAnonymousUsageDataEnabled),
      telemetryEvents: []
    });
  }
}

async function refreshProFunnelPanel(): Promise<ProFunnelSummary | null> {
  if (!elements?.proFunnelView) return null;

  try {
    const summary = await readProFunnelSummaryForDisplay();
    elements.proFunnelView.value = formatProFunnelSummaryAsJson(summary);
    if (elements?.proFunnelDisabledNotice) {
      elements.proFunnelDisabledNotice.hidden = summary.enabled;
    }
    return summary;
  } catch (error) {
    console.warn('Failed to refresh pro funnel summary:', error);
    showNotification(getMessage('proFunnelRefreshFailed'), 'error');
    return null;
  }
}

async function copyProFunnelSummaryToClipboard(): Promise<void> {
  let summary: ProFunnelSummary;
  let text: string;

  try {
    summary = await readProFunnelSummaryForDisplay();
    text = formatProFunnelSummaryAsJson(summary);
  } catch (error) {
    console.warn('Failed to read pro funnel summary:', error);
    showNotification(getMessage('proFunnelCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proFunnelCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy pro funnel summary:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proFunnelCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proFunnelCopyFailed'), 'error');
  }
}

async function buildProFunnelEvidencePackForClipboard(): Promise<ProFunnelEvidencePack> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn('Failed to read extension version for pro funnel evidence pack:', error);
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return buildProFunnelEvidencePack({
      exportedAt,
      extensionVersion,
      settings: currentSettings,
      telemetryEvents: []
    });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  return buildProFunnelEvidencePack({
    exportedAt,
    extensionVersion,
    settings: currentSettings,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY]
  });
}

async function copyProFunnelEvidencePackToClipboard(): Promise<void> {
  let pack: ProFunnelEvidencePack;
  let text: string;

  try {
    pack = await buildProFunnelEvidencePackForClipboard();
    text = formatProFunnelEvidencePackAsJson(pack);
  } catch (error) {
    console.warn('Failed to build pro funnel evidence pack:', error);
    showNotification(getMessage('proFunnelEvidencePackCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proFunnelEvidencePackCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy pro funnel evidence pack:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proFunnelEvidencePackCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proFunnelEvidencePackCopyFailed'), 'error');
  }
}

async function buildProIntentDecisionSummaryForExport(): Promise<ProIntentDecisionPackSummary> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn('Failed to read extension version for pro intent decision summary:', error);
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);
  if (!enabled) {
    const distribution = buildProWaitlistSurveyIntentDistribution({
      enabled: false,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      lookbackDays: 7
    });
    return buildProIntentDecisionPackFromDistribution({ distribution, getMessage });
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    const distribution = buildProWaitlistSurveyIntentDistribution({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      lookbackDays: 7
    });
    return buildProIntentDecisionPackFromDistribution({ distribution, getMessage });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  const distribution = buildProWaitlistSurveyIntentDistribution({
    enabled: true,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY],
    now: exportedAt,
    extensionVersion,
    lookbackDays: 7
  });
  return buildProIntentDecisionPackFromDistribution({ distribution, getMessage });
}

async function buildProRouteValidationComparisonSummaryForExport(): Promise<ProRouteValidationComparisonSummary> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn('Failed to read extension version for route validation comparison summary:', error);
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return buildProRouteValidationComparisonSummary({
      enabled,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      getMessage,
      lookbackDays: 7
    });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  return buildProRouteValidationComparisonSummary({
    enabled,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY],
    now: exportedAt,
    extensionVersion,
    getMessage,
    lookbackDays: 7
  });
}

async function copyProRouteValidationComparisonSummaryToClipboard(): Promise<void> {
  let summary: ProRouteValidationComparisonSummary;
  let text: string;

  try {
    summary = await buildProRouteValidationComparisonSummaryForExport();
    text = formatProRouteValidationComparisonMarkdown(summary, getMessage);
  } catch (error) {
    console.warn('Failed to build pro route validation comparison markdown:', error);
    showNotification(getMessage('proRouteValidationComparisonCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proRouteValidationComparisonCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy pro route validation comparison markdown:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proRouteValidationComparisonCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proRouteValidationComparisonCopyFailed'), 'error');
  }
}

async function downloadProRouteValidationComparisonJson(): Promise<void> {
  try {
    const summary = await buildProRouteValidationComparisonSummaryForExport();
    downloadTextFile(
      PRO_ROUTE_VALIDATION_COMPARISON_FILES.summaryJson,
      `${JSON.stringify(summary, null, 2)}\n`,
      'application/json'
    );
    showNotification(getMessage('proRouteValidationComparisonDownloadSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to download pro route validation comparison json:', error);
    showNotification(getMessage('proRouteValidationComparisonDownloadFailed'), 'error');
  }
}

async function buildProRouteValidationWritebackPackForExport(): Promise<ProRouteValidationWritebackPack> {
  const summary = await buildProRouteValidationComparisonSummaryForExport();
  return buildProRouteValidationWritebackPack(summary, getMessage);
}

async function buildProRouteValidationStabilitySummaryForExport(): Promise<ProRouteValidationStabilitySummary> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn('Failed to read extension version for route validation stability summary:', error);
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return buildProRouteValidationStabilitySummary({
      enabled,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      getMessage
    });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  return buildProRouteValidationStabilitySummary({
    enabled,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY],
    now: exportedAt,
    extensionVersion,
    getMessage
  });
}

async function copyProRouteValidationWritebackToClipboard(): Promise<void> {
  let pack: ProRouteValidationWritebackPack;
  let text: string;

  try {
    pack = await buildProRouteValidationWritebackPackForExport();
    text = formatProRouteValidationWritebackMarkdown(pack, getMessage);
  } catch (error) {
    console.warn('Failed to build pro route validation writeback markdown:', error);
    showNotification(getMessage('proRouteValidationWritebackCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proRouteValidationWritebackCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy pro route validation writeback markdown:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proRouteValidationWritebackCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proRouteValidationWritebackCopyFailed'), 'error');
  }
}

async function downloadProRouteValidationWritebackJson(): Promise<void> {
  try {
    const pack = await buildProRouteValidationWritebackPackForExport();
    downloadTextFile(
      PRO_ROUTE_VALIDATION_WRITEBACK_FILES.summaryJson,
      `${JSON.stringify(pack, null, 2)}\n`,
      'application/json'
    );
    showNotification(getMessage('proRouteValidationWritebackDownloadSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to download pro route validation writeback json:', error);
    showNotification(getMessage('proRouteValidationWritebackDownloadFailed'), 'error');
  }
}

async function copyProRouteValidationStabilitySummaryToClipboard(): Promise<void> {
  let summary: ProRouteValidationStabilitySummary;
  let text: string;

  try {
    summary = await buildProRouteValidationStabilitySummaryForExport();
    text = formatProRouteValidationStabilityMarkdown(summary, getMessage);
  } catch (error) {
    console.warn('Failed to build pro route validation stability markdown:', error);
    showNotification(getMessage('proRouteValidationStabilityCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proRouteValidationStabilityCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy pro route validation stability markdown:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proRouteValidationStabilityCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proRouteValidationStabilityCopyFailed'), 'error');
  }
}

async function downloadProRouteValidationStabilityJson(): Promise<void> {
  try {
    const summary = await buildProRouteValidationStabilitySummaryForExport();
    downloadTextFile(
      PRO_ROUTE_VALIDATION_STABILITY_FILES.summaryJson,
      `${JSON.stringify(summary, null, 2)}\n`,
      'application/json'
    );
    showNotification(getMessage('proRouteValidationStabilityDownloadSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to download pro route validation stability json:', error);
    showNotification(getMessage('proRouteValidationStabilityDownloadFailed'), 'error');
  }
}

async function copyProIntentDecisionSummaryToClipboard(): Promise<void> {
  let summary: ProIntentDecisionPackSummary;
  let text: string;

  try {
    summary = await buildProIntentDecisionSummaryForExport();
    text = formatProIntentDecisionPackMarkdown(summary, getMessage);
  } catch (error) {
    console.warn('Failed to build pro intent decision summary markdown:', error);
    showNotification(getMessage('proIntentDecisionSummaryCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proIntentDecisionSummaryCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy pro intent decision summary markdown:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proIntentDecisionSummaryCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proIntentDecisionSummaryCopyFailed'), 'error');
  }
}

async function downloadProIntentDecisionSummaryJson(): Promise<void> {
  try {
    const summary = await buildProIntentDecisionSummaryForExport();
    downloadTextFile(
      PRO_INTENT_DECISION_SUMMARY_FILES.summaryJson,
      `${JSON.stringify(summary, null, 2)}\n`,
      'application/json'
    );
    showNotification(getMessage('proIntentDecisionSummaryDownloadSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to download pro intent decision summary json:', error);
    showNotification(getMessage('proIntentDecisionSummaryDownloadFailed'), 'error');
  }
}

async function buildProRouteValidationVerdictPackForExport(): Promise<ProRouteValidationVerdictPack> {
  const comparison = await buildProRouteValidationComparisonSummaryForExport();
  const writeback = buildProRouteValidationWritebackPack(comparison, getMessage);
  const stability = await buildProRouteValidationStabilitySummaryForExport();
  const decision = await buildProIntentDecisionSummaryForExport();
  return buildProRouteValidationVerdictPack({
    comparison,
    writeback,
    stability,
    decision,
    getMessage
  });
}

async function copyProRouteValidationVerdictSummaryToClipboard(): Promise<void> {
  let pack: ProRouteValidationVerdictPack;
  let text: string;

  try {
    pack = await buildProRouteValidationVerdictPackForExport();
    text = formatProRouteValidationVerdictMarkdown(pack, getMessage);
  } catch (error) {
    console.warn('Failed to build pro route validation verdict markdown:', error);
    showNotification(getMessage('proRouteValidationVerdictCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proRouteValidationVerdictCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy pro route validation verdict markdown:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proRouteValidationVerdictCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proRouteValidationVerdictCopyFailed'), 'error');
  }
}

async function downloadProRouteValidationVerdictJson(): Promise<void> {
  try {
    const pack = await buildProRouteValidationVerdictPackForExport();
    downloadTextFile(
      PRO_ROUTE_VALIDATION_VERDICT_FILES.summaryJson,
      `${JSON.stringify(pack, null, 2)}\n`,
      'application/json'
    );
    showNotification(getMessage('proRouteValidationVerdictDownloadSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to download pro route validation verdict json:', error);
    showNotification(getMessage('proRouteValidationVerdictDownloadFailed'), 'error');
  }
}

async function buildProIntentWeeklyDigestMarkdownForClipboard(): Promise<string> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn('Failed to read extension version for pro intent weekly digest:', error);
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);
  const env: ProIntentWeeklyDigestEnvInfo = {
    extensionVersion,
    exportedAt,
    isAnonymousUsageDataEnabled: enabled
  };

  // Anonymous usage data OFF: do not read / infer any history.
  if (!enabled) {
    const summary = buildProIntentWeeklyDigestSummary({
      enabled: false,
      telemetryEvents: [],
      now: exportedAt,
      lookbackDays: 7
    });
    return formatProIntentWeeklyDigestMarkdown({ summary, env, getMessage });
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    const summary = buildProIntentWeeklyDigestSummary({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      lookbackDays: 7
    });
    return formatProIntentWeeklyDigestMarkdown({ summary, env, getMessage });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  const summary = buildProIntentWeeklyDigestSummary({
    enabled: true,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY],
    now: exportedAt,
    lookbackDays: 7
  });
  return formatProIntentWeeklyDigestMarkdown({ summary, env, getMessage });
}

async function copyProIntentWeeklyDigestToClipboard(): Promise<void> {
  let text: string;

  try {
    text = await buildProIntentWeeklyDigestMarkdownForClipboard();
  } catch (error) {
    console.warn('Failed to build pro intent weekly digest markdown:', error);
    showNotification(getMessage('proIntentWeeklyDigestCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proIntentWeeklyDigestCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy pro intent weekly digest markdown:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proIntentWeeklyDigestCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proIntentWeeklyDigestCopyFailed'), 'error');
  }
}

async function buildProIntentByCampaignWeeklyReportMarkdownForClipboard(): Promise<string> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn(
      'Failed to read extension version for pro intent by campaign weekly report:',
      error
    );
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);
  const env: ProIntentByCampaignWeeklyReportEnvInfo = {
    extensionVersion,
    exportedAt,
    isAnonymousUsageDataEnabled: enabled
  };

  const emptyCampaignBucketLabel = getMessage('proIntentByCampaign7dCsvEmptyBucket') || 'N/A';

  // Anonymous usage data OFF: do not read / infer any history.
  if (!enabled) {
    const summary = buildProIntentByCampaignWeeklyReportSummary({
      enabled: false,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7
    });
    return formatProIntentByCampaignWeeklyReportMarkdown({ summary, env, getMessage });
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    const summary = buildProIntentByCampaignWeeklyReportSummary({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7
    });
    return formatProIntentByCampaignWeeklyReportMarkdown({ summary, env, getMessage });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  const summary = buildProIntentByCampaignWeeklyReportSummary({
    enabled: true,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY],
    now: exportedAt,
    extensionVersion,
    emptyCampaignBucketLabel,
    lookbackDays: 7
  });
  return formatProIntentByCampaignWeeklyReportMarkdown({ summary, env, getMessage });
}

async function copyProIntentByCampaignWeeklyReportToClipboard(): Promise<void> {
  let text: string;

  try {
    text = await buildProIntentByCampaignWeeklyReportMarkdownForClipboard();
  } catch (error) {
    console.warn('Failed to build pro intent by campaign weekly report markdown:', error);
    showNotification(getMessage('proIntentByCampaignWeeklyReportCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proIntentByCampaignWeeklyReportCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy pro intent by campaign weekly report markdown:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proIntentByCampaignWeeklyReportCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proIntentByCampaignWeeklyReportCopyFailed'), 'error');
  }
}

async function buildProAcquisitionEfficiencyByCampaignWeeklyReportMarkdownForClipboard(): Promise<string> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn(
      'Failed to read extension version for pro acquisition efficiency by campaign weekly report:',
      error
    );
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);
  const env: ProAcquisitionEfficiencyByCampaignWeeklyReportEnvInfo = {
    extensionVersion,
    exportedAt,
    isAnonymousUsageDataEnabled: enabled
  };

  const emptyCampaignBucketLabel =
    getMessage('proAcqEffByCampaign7dCsvEmptyBucket') ||
    getMessage('proIntentByCampaign7dCsvEmptyBucket') ||
    getMessage('proDistributionByCampaign7dCsvEmptyBucket') ||
    'N/A';

  // Anonymous usage data OFF: do not read / infer any history.
  if (!enabled) {
    const summary = buildProAcquisitionEfficiencyByCampaignWeeklyReportSummary({
      enabled: false,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7
    });
    return formatProAcquisitionEfficiencyByCampaignWeeklyReportMarkdown({
      summary,
      env,
      getMessage
    });
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    const summary = buildProAcquisitionEfficiencyByCampaignWeeklyReportSummary({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7
    });
    return formatProAcquisitionEfficiencyByCampaignWeeklyReportMarkdown({
      summary,
      env,
      getMessage
    });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  const summary = buildProAcquisitionEfficiencyByCampaignWeeklyReportSummary({
    enabled: true,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY],
    now: exportedAt,
    extensionVersion,
    emptyCampaignBucketLabel,
    lookbackDays: 7
  });
  return formatProAcquisitionEfficiencyByCampaignWeeklyReportMarkdown({ summary, env, getMessage });
}

async function copyProAcquisitionEfficiencyByCampaignWeeklyReportToClipboard(): Promise<void> {
  let text: string;

  try {
    text = await buildProAcquisitionEfficiencyByCampaignWeeklyReportMarkdownForClipboard();
  } catch (error) {
    console.warn(
      'Failed to build pro acquisition efficiency by campaign weekly report markdown:',
      error
    );
    showNotification(getMessage('proAcqEffByCampaignWeeklyReportCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proAcqEffByCampaignWeeklyReportCopySuccess'), 'success');
  } catch (error) {
    console.warn(
      'Failed to copy pro acquisition efficiency by campaign weekly report markdown:',
      error
    );
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proAcqEffByCampaignWeeklyReportCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proAcqEffByCampaignWeeklyReportCopyFailed'), 'error');
  }
}

async function buildProAcquisitionEfficiencyByCampaignEvidencePackForClipboard(): Promise<ProAcquisitionEfficiencyByCampaignEvidencePack> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn(
      'Failed to read extension version for pro acquisition efficiency by campaign evidence pack:',
      error
    );
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);

  const emptyCampaignBucketLabel =
    getMessage('proAcqEffByCampaign7dCsvEmptyBucket') ||
    getMessage('proIntentByCampaign7dCsvEmptyBucket') ||
    getMessage('proDistributionByCampaign7dCsvEmptyBucket') ||
    'N/A';

  // Anonymous usage data OFF: do not read / infer any history (including storage reads).
  if (!enabled) {
    return buildProAcquisitionEfficiencyByCampaignEvidencePack({
      enabled: false,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7,
      getMessage
    });
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return buildProAcquisitionEfficiencyByCampaignEvidencePack({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7,
      getMessage
    });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  return buildProAcquisitionEfficiencyByCampaignEvidencePack({
    enabled: true,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY],
    now: exportedAt,
    extensionVersion,
    emptyCampaignBucketLabel,
    lookbackDays: 7,
    getMessage
  });
}

async function copyProAcquisitionEfficiencyByCampaignEvidencePackToClipboard(): Promise<void> {
  let pack: ProAcquisitionEfficiencyByCampaignEvidencePack;
  let text: string;

  try {
    pack = await buildProAcquisitionEfficiencyByCampaignEvidencePackForClipboard();
    text = formatProAcquisitionEfficiencyByCampaignEvidencePackAsJson(pack);
  } catch (error) {
    console.warn('Failed to build pro acquisition efficiency by campaign evidence pack:', error);
    showNotification(getMessage('proAcqEffByCampaignEvidencePackCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('proAcqEffByCampaignEvidencePackCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy pro acquisition efficiency by campaign evidence pack:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('proAcqEffByCampaignEvidencePackCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('proAcqEffByCampaignEvidencePackCopyFailed'), 'error');
  }
}

async function downloadProAcquisitionEfficiencyByCampaignEvidencePackJson(): Promise<void> {
  let pack: ProAcquisitionEfficiencyByCampaignEvidencePack;
  let text: string;
  let filename: string;

  try {
    pack = await buildProAcquisitionEfficiencyByCampaignEvidencePackForClipboard();
    text = formatProAcquisitionEfficiencyByCampaignEvidencePackAsJson(pack);
    filename = formatProAcquisitionEfficiencyByCampaignEvidencePackJsonFilename(
      pack.env?.exportedAt ?? Date.now(),
      Boolean(pack.env?.isAnonymousUsageDataEnabled)
    );
  } catch (error) {
    console.warn(
      'Failed to build pro acquisition efficiency by campaign evidence pack for download:',
      error
    );
    showNotification(getMessage('proAcqEffByCampaignEvidencePackDownloadFailed'), 'error');
    return;
  }

  try {
    downloadTextFile(filename, text, 'application/json');
    showNotification(getMessage('proAcqEffByCampaignEvidencePackDownloadSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to download pro acquisition efficiency by campaign evidence pack:', error);
    showNotification(getMessage('proAcqEffByCampaignEvidencePackDownloadFailed'), 'error');
  }
}

async function buildProWeeklyChannelOpsEvidencePackForDownload(): Promise<ProWeeklyChannelOpsEvidencePack> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn(
      'Failed to read extension version for pro weekly channel ops evidence pack:',
      error
    );
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);

  const emptyCampaignBucketLabel =
    getMessage('proAcqEffByCampaign7dCsvEmptyBucket') ||
    getMessage('proIntentByCampaign7dCsvEmptyBucket') ||
    getMessage('proDistributionByCampaign7dCsvEmptyBucket') ||
    'N/A';

  // Anonymous usage data OFF: allow download, but do not read / infer any history (including storage reads).
  if (!enabled) {
    return buildProWeeklyChannelOpsEvidencePack({
      enabled: false,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7,
      getMessage
    });
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return buildProWeeklyChannelOpsEvidencePack({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7,
      getMessage
    });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  return buildProWeeklyChannelOpsEvidencePack({
    enabled: true,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY],
    now: exportedAt,
    extensionVersion,
    emptyCampaignBucketLabel,
    lookbackDays: 7,
    getMessage
  });
}

async function downloadProWeeklyChannelOpsEvidencePackJson(): Promise<void> {
  let pack: ProWeeklyChannelOpsEvidencePack;
  let text: string;
  let filename: string;

  try {
    pack = await buildProWeeklyChannelOpsEvidencePackForDownload();
    text = formatProWeeklyChannelOpsEvidencePackAsJson(pack);
    filename = formatProWeeklyChannelOpsEvidencePackJsonFilename(
      pack.env?.exportedAt ?? Date.now(),
      Boolean(pack.env?.isAnonymousUsageDataEnabled)
    );
  } catch (error) {
    console.warn('Failed to build pro weekly channel ops evidence pack for download:', error);
    showNotification(getMessage('proWeeklyChannelOpsEvidencePackDownloadFailed'), 'error');
    return;
  }

  try {
    downloadTextFile(filename, text, 'application/json');
    showNotification(getMessage('proWeeklyChannelOpsEvidencePackDownloadSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to download pro weekly channel ops evidence pack:', error);
    showNotification(getMessage('proWeeklyChannelOpsEvidencePackDownloadFailed'), 'error');
  }
}

async function buildProIntentRunEvidencePackForDownload(): Promise<ProIntentRunEvidencePack> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn('Failed to read extension version for pro intent run evidence pack:', error);
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);

  // Anonymous usage data OFF: allow download, but do not read / infer any history (including storage reads).
  if (!enabled) {
    return buildProIntentRunEvidencePack({
      enabled: false,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      lookbackDays: 7,
      getMessage
    });
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return buildProIntentRunEvidencePack({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      lookbackDays: 7,
      getMessage
    });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  return buildProIntentRunEvidencePack({
    enabled: true,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY],
    now: exportedAt,
    extensionVersion,
    lookbackDays: 7,
    getMessage
  });
}

async function downloadProIntentRunEvidencePackJson(): Promise<void> {
  let pack: ProIntentRunEvidencePack;
  let text: string;
  let filename: string;

  try {
    pack = await buildProIntentRunEvidencePackForDownload();
    text = formatProIntentRunEvidencePackAsJson(pack);
    filename = formatProIntentRunEvidencePackJsonFilename(
      pack.env?.exportedAt ?? Date.now(),
      Boolean(pack.env?.isAnonymousUsageDataEnabled)
    );
  } catch (error) {
    console.warn('Failed to build pro intent run evidence pack for download:', error);
    showNotification(getMessage('proIntentRunEvidencePackDownloadFailed'), 'error');
    return;
  }

  try {
    downloadTextFile(filename, text, 'application/json');
    if (pack.enabled) {
      showNotification(getMessage('proIntentRunEvidencePackDownloadSuccess'), 'success');
    } else {
      showNotification(getMessage('proIntentRunEvidencePackDownloadTelemetryOffNotice'), 'info');
    }
  } catch (error) {
    console.warn('Failed to download pro intent run evidence pack:', error);
    showNotification(getMessage('proIntentRunEvidencePackDownloadFailed'), 'error');
  }
}

function downloadTextFile(filename: string, text: string, mimeType: string): void {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCsvFile(filename: string, csv: string): void {
  downloadTextFile(filename, csv, 'text/csv');
}

function toProIntentTelemetryProps(attrs: {
  source: ProIntentSource;
  medium: ProIntentSource;
  content: ProIntentContent;
  campaign?: string;
}): Record<string, TelemetryPropPrimitive> {
  const record: Record<string, TelemetryPropPrimitive> = {
    source: attrs.source,
    medium: attrs.medium,
    content: attrs.content
  };
  if (attrs.campaign) record.campaign = attrs.campaign;
  return record;
}

function buildOptionsProIntentAttribution(
  content: ProIntentContent,
  source: ProIntentSource = 'options'
): Record<string, TelemetryPropPrimitive> {
  const attrs = buildProIntentAttribution({
    source,
    content,
    campaign: getProIntentCampaign()
  });
  return toProIntentTelemetryProps(attrs);
}

async function buildProIntentV1_100SummaryForDownload(): Promise<ProIntentV1_100Summary> {
  const now = Date.now();
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return buildProIntentV1_100Summary({
      enabled: Boolean(currentSettings?.isAnonymousUsageDataEnabled),
      telemetryEvents: [],
      now,
      lookbackDays: 30
    });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  return buildProIntentV1_100Summary({
    enabled: Boolean(currentSettings?.isAnonymousUsageDataEnabled),
    telemetryEvents: result[TELEMETRY_EVENTS_KEY],
    now,
    lookbackDays: 30
  });
}

async function downloadProIntentV1_100SummaryJson(): Promise<void> {
  try {
    const summary = await buildProIntentV1_100SummaryForDownload();
    downloadTextFile(
      PRO_INTENT_V1_100_SUMMARY_JSON_FILENAME,
      `${JSON.stringify(summary, null, 2)}\n`,
      'application/json'
    );
    showNotification(getMessage('proIntentV1100SummaryExportSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to download v1-100 summary json:', error);
    showNotification(getMessage('proIntentV1100SummaryExportFailed'), 'error');
  }
}

async function downloadProIntentV1_100SummaryCsv(): Promise<void> {
  try {
    const summary = await buildProIntentV1_100SummaryForDownload();
    downloadCsvFile(PRO_INTENT_V1_100_SUMMARY_CSV_FILENAME, formatProIntentV1_100Csv(summary));
    showNotification(getMessage('proIntentV1100FunnelExportSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to download v1-100 summary csv:', error);
    showNotification(getMessage('proIntentV1100FunnelExportFailed'), 'error');
  }
}

async function exportProIntentEvents7dCsv(): Promise<void> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn('Failed to read extension version for pro intent events csv export:', error);
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);
  if (!enabled) {
    showNotification(getMessage('proIntentEvents7dCsvExportTelemetryOff'), 'info');
    return;
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    const result = buildProIntentEventsCsv({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      lookbackDays: 7
    });
    const filename = formatProIntentEvents7dCsvFilename(exportedAt);
    downloadCsvFile(filename, result.csv);
    showNotification(
      getMessage('proIntentEvents7dCsvExportSuccess', [String(result.rows.length)]),
      'success'
    );
    return;
  }

  let stored: unknown;
  try {
    const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
    stored = result[TELEMETRY_EVENTS_KEY];
  } catch (error) {
    console.warn('Failed to read telemetry events for pro intent events csv export:', error);
    showNotification(getMessage('proIntentEvents7dCsvExportFailed'), 'error');
    return;
  }

  const built = buildProIntentEventsCsv({
    enabled: true,
    telemetryEvents: stored,
    now: exportedAt,
    extensionVersion,
    lookbackDays: 7
  });

  const filename = formatProIntentEvents7dCsvFilename(exportedAt);
  downloadCsvFile(filename, built.csv);
  showNotification(
    getMessage('proIntentEvents7dCsvExportSuccess', [String(built.rows.length)]),
    'success'
  );
}

async function exportProIntentByCampaign7dCsv(): Promise<void> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn('Failed to read extension version for pro intent by campaign csv export:', error);
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);
  if (!enabled) {
    showNotification(getMessage('proIntentByCampaign7dCsvExportTelemetryOff'), 'info');
    return;
  }

  const emptyCampaignBucketLabel = getMessage('proIntentByCampaign7dCsvEmptyBucket') || 'N/A';

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    const result = buildProIntentByCampaignCsv({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7
    });
    const filename = formatProIntentByCampaign7dCsvFilename(exportedAt);
    downloadCsvFile(filename, result.csv);
    showNotification(
      getMessage('proIntentByCampaign7dCsvExportSuccess', [String(result.rows.length)]),
      'success'
    );
    return;
  }

  let stored: unknown;
  try {
    const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
    stored = result[TELEMETRY_EVENTS_KEY];
  } catch (error) {
    console.warn('Failed to read telemetry events for pro intent by campaign csv export:', error);
    showNotification(getMessage('proIntentByCampaign7dCsvExportFailed'), 'error');
    return;
  }

  const built = buildProIntentByCampaignCsv({
    enabled: true,
    telemetryEvents: stored,
    now: exportedAt,
    extensionVersion,
    emptyCampaignBucketLabel,
    lookbackDays: 7
  });

  const filename = formatProIntentByCampaign7dCsvFilename(exportedAt);
  downloadCsvFile(filename, built.csv);
  showNotification(
    getMessage('proIntentByCampaign7dCsvExportSuccess', [String(built.rows.length)]),
    'success'
  );
}

async function exportProDistributionByCampaign7dCsv(): Promise<void> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn(
      'Failed to read extension version for pro distribution by campaign csv export:',
      error
    );
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);
  if (!enabled) {
    showNotification(getMessage('proDistributionByCampaign7dCsvExportTelemetryOff'), 'info');
    return;
  }

  const emptyCampaignBucketLabel =
    getMessage('proDistributionByCampaign7dCsvEmptyBucket') ||
    getMessage('proIntentByCampaign7dCsvEmptyBucket');

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    const result = buildProDistributionByCampaignCsv({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7
    });
    const filename = formatProDistributionByCampaign7dCsvFilename(exportedAt);
    downloadCsvFile(filename, result.csv);
    showNotification(
      getMessage('proDistributionByCampaign7dCsvExportSuccess', [String(result.rows.length)]),
      'success'
    );
    return;
  }

  let stored: unknown;
  try {
    const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
    stored = result[TELEMETRY_EVENTS_KEY];
  } catch (error) {
    console.warn(
      'Failed to read telemetry events for pro distribution by campaign csv export:',
      error
    );
    showNotification(getMessage('proDistributionByCampaign7dCsvExportFailed'), 'error');
    return;
  }

  const built = buildProDistributionByCampaignCsv({
    enabled: true,
    telemetryEvents: stored,
    now: exportedAt,
    extensionVersion,
    emptyCampaignBucketLabel,
    lookbackDays: 7
  });

  const filename = formatProDistributionByCampaign7dCsvFilename(exportedAt);
  downloadCsvFile(filename, built.csv);
  showNotification(
    getMessage('proDistributionByCampaign7dCsvExportSuccess', [String(built.rows.length)]),
    'success'
  );
}

async function exportProAcquisitionEfficiencyByCampaign7dCsv(): Promise<void> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn(
      'Failed to read extension version for pro acquisition efficiency by campaign csv export:',
      error
    );
  }

  const enabled = Boolean(currentSettings?.isAnonymousUsageDataEnabled);
  if (!enabled) {
    showNotification(getMessage('proAcqEffByCampaign7dCsvExportTelemetryOff'), 'info');
    return;
  }

  const emptyCampaignBucketLabel =
    getMessage('proAcqEffByCampaign7dCsvEmptyBucket') ||
    getMessage('proIntentByCampaign7dCsvEmptyBucket') ||
    getMessage('proDistributionByCampaign7dCsvEmptyBucket') ||
    'N/A';

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    const result = buildProAcquisitionEfficiencyByCampaignCsv({
      enabled: true,
      telemetryEvents: [],
      now: exportedAt,
      extensionVersion,
      emptyCampaignBucketLabel,
      lookbackDays: 7
    });
    const filename = formatProAcquisitionEfficiencyByCampaign7dCsvFilename(exportedAt);
    downloadCsvFile(filename, result.csv);
    showNotification(
      getMessage('proAcqEffByCampaign7dCsvExportSuccess', [String(result.rows.length)]),
      'success'
    );
    return;
  }

  let stored: unknown;
  try {
    const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
    stored = result[TELEMETRY_EVENTS_KEY];
  } catch (error) {
    console.warn(
      'Failed to read telemetry events for pro acquisition efficiency by campaign csv export:',
      error
    );
    showNotification(getMessage('proAcqEffByCampaign7dCsvExportFailed'), 'error');
    return;
  }

  const built = buildProAcquisitionEfficiencyByCampaignCsv({
    enabled: true,
    telemetryEvents: stored,
    now: exportedAt,
    extensionVersion,
    emptyCampaignBucketLabel,
    lookbackDays: 7
  });

  const filename = formatProAcquisitionEfficiencyByCampaign7dCsvFilename(exportedAt);
  downloadCsvFile(filename, built.csv);
  showNotification(
    getMessage('proAcqEffByCampaign7dCsvExportSuccess', [String(built.rows.length)]),
    'success'
  );
}

function formatWomSummaryAsJson(summary: WomSummary): string {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

function formatWomEvidencePackAsJson(pack: WomEvidencePack): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}

async function readWomSummaryForDisplay(): Promise<WomSummary> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return buildWomSummary({
      enabled: Boolean(currentSettings?.isAnonymousUsageDataEnabled),
      telemetryEvents: []
    });
  }

  try {
    const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
    return buildWomSummary({
      enabled: Boolean(currentSettings?.isAnonymousUsageDataEnabled),
      telemetryEvents: result[TELEMETRY_EVENTS_KEY]
    });
  } catch (error) {
    console.warn('Failed to read telemetry events for wom summary:', error);
    return buildWomSummary({
      enabled: Boolean(currentSettings?.isAnonymousUsageDataEnabled),
      telemetryEvents: []
    });
  }
}

async function refreshWomSummaryPanel(): Promise<WomSummary | null> {
  if (!elements?.womSummaryView) return null;

  try {
    const summary = await readWomSummaryForDisplay();
    elements.womSummaryView.value = formatWomSummaryAsJson(summary);
    if (elements?.womSummaryDisabledNotice) {
      elements.womSummaryDisabledNotice.hidden = summary.enabled;
    }
    return summary;
  } catch (error) {
    console.warn('Failed to refresh wom summary:', error);
    showNotification(getMessage('womSummaryRefreshFailed'), 'error');
    return null;
  }
}

async function copyWomSummaryToClipboard(): Promise<void> {
  let summary: WomSummary;
  let text: string;

  try {
    summary = await readWomSummaryForDisplay();
    text = formatWomSummaryAsJson(summary);
  } catch (error) {
    console.warn('Failed to read wom summary:', error);
    showNotification(getMessage('womSummaryCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('womSummaryCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy wom summary:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('womSummaryCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('womSummaryCopyFailed'), 'error');
  }
}

async function buildWomEvidencePackForClipboard(): Promise<WomEvidencePack> {
  const exportedAt = Date.now();
  let extensionVersion = '';
  let growthStats: GrowthStats = { installedAt: exportedAt, successfulCopyCount: 0 };
  try {
    extensionVersion = chrome.runtime.getManifest().version || '';
  } catch (error) {
    console.warn('Failed to read extension version for wom evidence pack:', error);
  }
  try {
    growthStats = await getGrowthStats();
  } catch (error) {
    console.warn('Failed to read growth stats for wom evidence pack:', error);
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return buildWomEvidencePack({
      exportedAt,
      extensionVersion,
      settings: currentSettings,
      growthStats,
      telemetryEvents: []
    });
  }

  const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
  return buildWomEvidencePack({
    exportedAt,
    extensionVersion,
    settings: currentSettings,
    growthStats,
    telemetryEvents: result[TELEMETRY_EVENTS_KEY]
  });
}

async function copyWomEvidencePackToClipboard(): Promise<void> {
  let pack: WomEvidencePack;
  let text: string;

  try {
    pack = await buildWomEvidencePackForClipboard();
    text = formatWomEvidencePackAsJson(pack);
  } catch (error) {
    console.warn('Failed to build wom evidence pack:', error);
    showNotification(getMessage('womSummaryEvidencePackCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('womSummaryEvidencePackCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy wom evidence pack:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('womSummaryEvidencePackCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('womSummaryEvidencePackCopyFailed'), 'error');
  }
}

interface GrowthFunnelExportSummary {
  growthFunnel: GrowthFunnelSummary;
  secondOpenReuseAudit: {
    firstSuccessfulCopyAt?: number;
    secondSuccessfulCopyAt?: number;
    firstQuickPromptSlotShownAt?: number;
    quickPromptSlotShownCount: number;
    firstQuickPromptSlotClickedAt?: number;
    quickPromptSlotClickedCount: number;
    lastQuickPromptSlotClickedSource?: string;
    lastQuickPromptSlotClickedSlot?: number;
    firstQuickPromptSlotUsedAt?: number;
    quickPromptSlotUsedCount: number;
    lastQuickPromptSlotUsedSource?: string;
    lastQuickPromptSlotUsedSlot?: number;
    telemetryCounts: Record<string, number>;
    isPrivacySafe: true;
  };
  appendWorkflowAudit: AppendSessionAudit;
}

function buildGrowthFunnelExportSummary(
  summary: GrowthFunnelSummary,
  telemetryEvents: TelemetryEvent[],
  appendWorkflowAudit: AppendSessionAudit
): GrowthFunnelExportSummary {
  const telemetryCounts = telemetryEvents.reduce<Record<string, number>>((acc, event) => {
    if (
      event.name === 'quick_prompt_slot_shown' ||
      event.name === 'quick_prompt_slot_clicked' ||
      event.name === 'quick_prompt_slot_used' ||
      event.name === 'copy_success' ||
      event.name === 'prompt_used'
    ) {
      acc[event.name] = (acc[event.name] || 0) + 1;
    }
    return acc;
  }, {});

  return {
    growthFunnel: summary,
    secondOpenReuseAudit: {
      firstSuccessfulCopyAt: summary.firstSuccessfulCopyAt,
      secondSuccessfulCopyAt: summary.secondSuccessfulCopyAt,
      firstQuickPromptSlotShownAt: summary.firstQuickPromptSlotShownAt,
      quickPromptSlotShownCount: summary.quickPromptSlotShownCount || 0,
      firstQuickPromptSlotClickedAt: summary.firstQuickPromptSlotClickedAt,
      quickPromptSlotClickedCount: summary.quickPromptSlotClickedCount || 0,
      lastQuickPromptSlotClickedSource: summary.lastQuickPromptSlotClickedSource,
      lastQuickPromptSlotClickedSlot: summary.lastQuickPromptSlotClickedSlot,
      firstQuickPromptSlotUsedAt: summary.firstQuickPromptSlotUsedAt,
      quickPromptSlotUsedCount: summary.quickPromptSlotUsedCount || 0,
      lastQuickPromptSlotUsedSource: summary.lastQuickPromptSlotUsedSource,
      lastQuickPromptSlotUsedSlot: summary.lastQuickPromptSlotUsedSlot,
      telemetryCounts,
      isPrivacySafe: true
    },
    appendWorkflowAudit
  };
}

function formatGrowthFunnelSummaryAsJson(summary: GrowthFunnelExportSummary): string {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

async function readGrowthFunnelSummaryForDisplay(): Promise<GrowthFunnelExportSummary> {
  const [stats, telemetryEvents, appendSession] = await Promise.all([
    getGrowthStats(),
    readTelemetryEventsForDisplay(),
    getAppendSessionState()
  ]);
  return buildGrowthFunnelExportSummary(
    buildGrowthFunnelSummary(stats, Date.now()),
    telemetryEvents,
    buildAppendSessionAudit(appendSession)
  );
}

async function refreshGrowthFunnelPanel(): Promise<GrowthFunnelExportSummary | null> {
  if (!elements?.growthFunnelView) return null;

  try {
    const summary = await readGrowthFunnelSummaryForDisplay();
    elements.growthFunnelView.value = formatGrowthFunnelSummaryAsJson(summary);
    syncWomActionButtons(summary.growthFunnel);
    return summary;
  } catch (error) {
    console.warn('Failed to refresh growth funnel summary:', error);
    showNotification(getMessage('growthFunnelRefreshFailed'), 'error');
    return null;
  }
}

async function copyGrowthFunnelSummaryToClipboard(): Promise<void> {
  let summary: GrowthFunnelExportSummary;
  let text: string;

  try {
    summary = await readGrowthFunnelSummaryForDisplay();
    text = formatGrowthFunnelSummaryAsJson(summary);
  } catch (error) {
    console.warn('Failed to read growth funnel summary:', error);
    showNotification(getMessage('growthFunnelCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('growthFunnelCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy growth funnel summary:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('growthFunnelCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('growthFunnelCopyFailed'), 'error');
  }
}

function formatAppendWorkflowAuditAsJson(audit: AppendSessionAudit): string {
  return `${JSON.stringify(audit, null, 2)}\n`;
}

async function readAppendWorkflowAuditForDisplay(): Promise<AppendSessionAudit> {
  const appendSession = await getAppendSessionState();
  return buildAppendSessionAudit(appendSession);
}

async function refreshAppendWorkflowPanel(): Promise<AppendSessionAudit | null> {
  if (!elements?.appendWorkflowView) return null;

  try {
    const audit = await readAppendWorkflowAuditForDisplay();
    elements.appendWorkflowView.value = formatAppendWorkflowAuditAsJson(audit);
    return audit;
  } catch (error) {
    console.warn('Failed to refresh append workflow panel:', error);
    showNotification(getMessage('appendWorkflowRefreshFailed'), 'error');
    return null;
  }
}

async function copyAppendWorkflowAuditToClipboard(): Promise<void> {
  let audit: AppendSessionAudit;
  let text: string;

  try {
    audit = await readAppendWorkflowAuditForDisplay();
    text = formatAppendWorkflowAuditAsJson(audit);
  } catch (error) {
    console.warn('Failed to read append workflow audit:', error);
    showNotification(getMessage('appendWorkflowCopyFailed'), 'error');
    return;
  }

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('appendWorkflowCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy append workflow audit:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('appendWorkflowCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('appendWorkflowCopyFailed'), 'error');
  }
}

async function clearAppendWorkflowAndRefresh(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: 'clear-append-session',
      clearedAt: Date.now()
    });
    await refreshAppendWorkflowPanel();
    showNotification(getMessage('appendWorkflowClearSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to clear append workflow:', error);
    showNotification(getMessage('appendWorkflowClearFailed'), 'error');
  }
}

function formatGrowthStatsAsJson(stats: GrowthStats): string {
  return `${JSON.stringify(stats, null, 2)}\n`;
}

function syncWomActionButtons(summary: GrowthFunnelSummary): void {
  const eligible = summary.isEligibleForWomActions;
  elements.womShareOpenButton.disabled = !eligible;
  elements.womShareCopyButton.disabled = !eligible;
  elements.womRateOpenButton.disabled = !eligible;
  elements.womActionsStatusHint.hidden = eligible;
  elements.womActionsStatusHint.textContent = eligible
    ? ''
    : getMessage('womActionsLockedHint', [String(summary.remainingSuccessfulCopiesForWomActions)]);
}

async function readGrowthStatsForDisplay(): Promise<GrowthStats> {
  try {
    return await getGrowthStats();
  } catch (error) {
    console.warn('Failed to read growth stats:', error);
    return { installedAt: Date.now(), successfulCopyCount: 0 };
  }
}

async function refreshGrowthStatsPanel(): Promise<GrowthStats | null> {
  if (!elements?.growthStatsView) return null;

  const stats = await readGrowthStatsForDisplay();
  elements.growthStatsView.value = formatGrowthStatsAsJson(stats);
  syncWomActionButtons(buildGrowthFunnelSummary(stats, Date.now()));
  return stats;
}

async function copyGrowthStatsToClipboard(): Promise<void> {
  const stats = await readGrowthStatsForDisplay();
  const text = formatGrowthStatsAsJson(stats);

  try {
    await writeTextToClipboard(text);
    showNotification(getMessage('growthStatsCopySuccess'), 'success');
  } catch (error) {
    console.warn('Failed to copy growth stats:', error);
    const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
    if (ok) {
      showNotification(getMessage('growthStatsCopySuccess'), 'success');
      return;
    }
    showNotification(getMessage('growthStatsCopyFailed'), 'error');
  }
}

async function resetGrowthStatsAndRefresh(): Promise<void> {
  try {
    const now = Date.now();
    await setGrowthStats({ installedAt: now, successfulCopyCount: 0 });
    await refreshGrowthStatsPanel();
    showNotification(getMessage('growthStatsResetSuccess'), 'success');
  } catch (error) {
    console.warn('Failed to reset growth stats:', error);
    showNotification(getMessage('growthStatsResetFailed'), 'error');
  }
}

function openPopupOnboardingInNewTab() {
  const url = `${chrome.runtime.getURL('src/popup/popup.html')}#onboarding`;

  try {
    chrome.tabs.create({ url }, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.error('Failed to open onboarding popup tab:', err);
        try {
          window.open(url, '_blank');
        } catch (fallbackError) {
          console.error('Fallback window.open failed:', fallbackError);
        }
      }
    });
  } catch (error) {
    console.error('Failed to open onboarding popup tab:', error);
    try {
      window.open(url, '_blank');
    } catch (fallbackError) {
      console.error('Fallback window.open failed:', fallbackError);
    }
  }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 监听 storage 变化以实时更新使用次数
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.copilot_settings && namespace === 'sync') {
      console.debug('Settings changed, reloading data...');
      loadSettings();
    }
  });
  // 搜索和过滤
  elements.searchInput.addEventListener('input', filterAndRenderPrompts);
  elements.categoryFilter.addEventListener('change', filterAndRenderPrompts);
  elements.promptSortSelect.addEventListener('change', () => {
    setPromptSortMode(elements.promptSortSelect.value);
    filterAndRenderPrompts();
  });

  // 添加prompt按钮
  elements.addPromptBtn.addEventListener('click', () => openPromptEditor());
  elements.createFirstPromptBtn.addEventListener('click', () => openPromptEditor());
  elements.mobileAddBtn.addEventListener('click', () => openPromptEditor());

  // 模态框控制
  elements.closeModalBtn.addEventListener('click', closePromptEditor);
  elements.cancelBtn.addEventListener('click', closePromptEditor);
  elements.promptForm.addEventListener('submit', savePromptForm);

  // 编辑器工具
  elements.insertContentPlaceholder.addEventListener('click', insertContentPlaceholder);
  elements.previewPrompt.addEventListener('click', previewPrompt);

  // 模态框背景点击关闭
  elements.promptEditorModal.addEventListener('click', (e) => {
    if (e.target === elements.promptEditorModal) {
      closePromptEditor();
    }
  });

  // 预览模态框事件
  elements.previewModal.addEventListener('click', (e) => {
    if (e.target === elements.previewModal) {
      closePreviewModal();
    }
  });

  // 预览模态框关闭按钮（从HTML中查找）
  const previewCloseBtn = elements.previewModal.querySelector('.close-btn');
  if (previewCloseBtn) {
    previewCloseBtn.addEventListener('click', closePreviewModal);
  }

  // 隐藏使用说明按钮
  elements.hideInstructionsBtn.addEventListener('click', hideUsageInstructions);

  // Options onboarding entry
  elements.onboardingOpenButton.addEventListener('click', () => {
    openPopupOnboardingInNewTab();
  });
  elements.openShortcutSettingsButton.addEventListener('click', () => {
    void openShortcutSettingsPage();
  });
  setupShortcutCommandCardInteractions();

  // 同步状态按钮
  elements.syncStatusBtn.addEventListener('click', manualSync);

  // 导入导出按钮
  elements.importExportBtn.addEventListener('click', showImportExportModal);

  // 本地匿名事件日志面板
  elements.telemetryEventsRefreshButton.addEventListener('click', () => {
    void refreshTelemetryEventsPanel();
  });
  elements.anonymousUsageDataSwitch.addEventListener('change', () => {
    void setAnonymousUsageDataEnabled(elements.anonymousUsageDataSwitch.checked);
  });
  elements.telemetryEventsCopyButton.addEventListener('click', () => {
    void copyTelemetryEventsToClipboard();
  });
  elements.telemetryEventsClearButton.addEventListener('click', () => {
    void clearTelemetryEventsAndRefresh();
  });

  // Pro 意向漏斗摘要面板
  elements.proFunnelRefreshButton.addEventListener('click', () => {
    void refreshProFunnelPanel();
  });
  elements.proFunnelCopyButton.addEventListener('click', () => {
    void copyProFunnelSummaryToClipboard();
  });
  elements.proFunnelEvidencePackCopyButton.addEventListener('click', () => {
    void copyProFunnelEvidencePackToClipboard();
  });
  elements.proRouteValidationComparisonCopyButton.addEventListener('click', () => {
    void copyProRouteValidationComparisonSummaryToClipboard();
  });
  elements.downloadProRouteValidationComparisonJsonButton.addEventListener('click', () => {
    void downloadProRouteValidationComparisonJson();
  });
  elements.proRouteValidationWritebackCopyButton.addEventListener('click', () => {
    void copyProRouteValidationWritebackToClipboard();
  });
  elements.downloadProRouteValidationWritebackJsonButton.addEventListener('click', () => {
    void downloadProRouteValidationWritebackJson();
  });
  elements.proRouteValidationStabilityCopyButton.addEventListener('click', () => {
    void copyProRouteValidationStabilitySummaryToClipboard();
  });
  elements.downloadProRouteValidationStabilityJsonButton.addEventListener('click', () => {
    void downloadProRouteValidationStabilityJson();
  });
  elements.proIntentDecisionSummaryCopyButton.addEventListener('click', () => {
    void copyProIntentDecisionSummaryToClipboard();
  });
  elements.downloadProIntentDecisionSummaryJsonButton.addEventListener('click', () => {
    void downloadProIntentDecisionSummaryJson();
  });
  elements.proRouteValidationVerdictCopyButton.addEventListener('click', () => {
    void copyProRouteValidationVerdictSummaryToClipboard();
  });
  elements.downloadProRouteValidationVerdictJsonButton.addEventListener('click', () => {
    void downloadProRouteValidationVerdictJson();
  });
  elements.downloadProIntentV1_100SummaryJsonButton.addEventListener('click', () => {
    void downloadProIntentV1_100SummaryJson();
  });
  elements.downloadProIntentV1_100SummaryCsvButton.addEventListener('click', () => {
    void downloadProIntentV1_100SummaryCsv();
  });
  elements.downloadProIntentRunEvidencePackButton.addEventListener('click', () => {
    void downloadProIntentRunEvidencePackJson();
  });
  elements.exportProIntentEvents7dCsvButton.addEventListener('click', () => {
    void exportProIntentEvents7dCsv();
  });
  elements.exportProIntentByCampaign7dCsvButton.addEventListener('click', () => {
    void exportProIntentByCampaign7dCsv();
  });
  elements.exportProDistributionByCampaign7dCsvButton.addEventListener('click', () => {
    void exportProDistributionByCampaign7dCsv();
  });
  elements.exportProAcquisitionEfficiencyByCampaign7dCsvButton.addEventListener('click', () => {
    void exportProAcquisitionEfficiencyByCampaign7dCsv();
  });
  elements.proAcqEffByCampaignWeeklyReportCopyButton.addEventListener('click', () => {
    void copyProAcquisitionEfficiencyByCampaignWeeklyReportToClipboard();
  });
  elements.proAcqEffByCampaignEvidencePackCopyButton.addEventListener('click', () => {
    void copyProAcquisitionEfficiencyByCampaignEvidencePackToClipboard();
  });
  elements.proAcqEffByCampaignEvidencePackDownloadButton.addEventListener('click', () => {
    void downloadProAcquisitionEfficiencyByCampaignEvidencePackJson();
  });
  elements.proWeeklyChannelOpsEvidencePackDownloadButton.addEventListener('click', () => {
    void downloadProWeeklyChannelOpsEvidencePackJson();
  });
  elements.proIntentWeeklyDigestCopyButton.addEventListener('click', () => {
    void copyProIntentWeeklyDigestToClipboard();
  });
  elements.proIntentByCampaignWeeklyReportCopyButton.addEventListener('click', () => {
    void copyProIntentByCampaignWeeklyReportToClipboard();
  });

  // WOM 摘要面板
  elements.womSummaryRefreshButton.addEventListener('click', () => {
    void refreshWomSummaryPanel();
  });
  elements.womSummaryCopyButton.addEventListener('click', () => {
    void copyWomSummaryToClipboard();
  });
  elements.womSummaryEvidencePackCopyButton.addEventListener('click', () => {
    void copyWomEvidencePackToClipboard();
  });

  // 本地漏斗摘要面板
  elements.growthFunnelRefreshButton.addEventListener('click', () => {
    void refreshGrowthFunnelPanel();
  });
  elements.growthFunnelCopyButton.addEventListener('click', () => {
    void copyGrowthFunnelSummaryToClipboard();
  });

  elements.appendWorkflowRefreshButton.addEventListener('click', () => {
    void refreshAppendWorkflowPanel();
  });
  elements.appendWorkflowCopyButton.addEventListener('click', () => {
    void copyAppendWorkflowAuditToClipboard();
  });
  elements.appendWorkflowClearButton.addEventListener('click', () => {
    void clearAppendWorkflowAndRefresh();
  });

  // 本地增长统计面板
  elements.growthStatsRefreshButton.addEventListener('click', () => {
    void refreshGrowthStatsPanel();
  });
  elements.growthStatsCopyButton.addEventListener('click', () => {
    void copyGrowthStatsToClipboard();
  });
  elements.growthStatsResetButton.addEventListener('click', () => {
    void resetGrowthStatsAndRefresh();
  });

  // 导入导出模态框事件
  elements.importExportModal.addEventListener('click', (e) => {
    if (e.target === elements.importExportModal) {
      closeImportExportModal();
    }
  });

  // 导入导出模态框关闭按钮
  const closeImportExportBtn = document.getElementById('close-import-export-btn');
  if (closeImportExportBtn) {
    closeImportExportBtn.addEventListener('click', closeImportExportModal);
  }

  // 预览模态框关闭按钮
  const closePreviewBtn = document.getElementById('close-preview-btn');
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', closePreviewModal);
  }

  // 导入导出模态框内的按钮事件
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const mainTabBtns = document.querySelectorAll('.tabs-nav .tab-btn');
  const importExportTabBtns = document.querySelectorAll('.import-export-tabs .tab-btn');

  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportPrompts);
  }

  if (importBtn) {
    importBtn.addEventListener('click', handleImportPrompts);
  }

  function setActiveMainTab(tabName: string) {
    const target = document.querySelector(
      `.tabs-nav .tab-btn[data-tab="${tabName}"]`
    ) as HTMLButtonElement | null;
    if (!target) return;

    mainTabBtns.forEach((b) => b.classList.remove('active'));
    target.classList.add('active');

    document.querySelectorAll('main.main-content > .tab-content').forEach((content) => {
      content.classList.remove('active');
    });

    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
      tabContent.classList.add('active');
    }

    if (tabName === 'pro') {
      void recordTelemetryEvent(
        'pro_entry_opened',
        buildOptionsProIntentAttribution('options_waitlist_cta')
      );
    }
  }

  // Main tab switch
  mainTabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const tabName = target.getAttribute('data-tab');
      if (!tabName) return;
      setActiveMainTab(tabName);
    });
  });

  // Import/Export modal tab switch
  function setActiveImportExportTab(tabName: string) {
    const target = elements.importExportModal.querySelector(
      `.import-export-tabs .tab-btn[data-tab="${tabName}"]`
    ) as HTMLButtonElement | null;
    if (!target) return;

    importExportTabBtns.forEach((b) => b.classList.remove('active'));
    target.classList.add('active');

    elements.importExportModal.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.remove('active');
    });

    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
      tabContent.classList.add('active');
    }
  }

  importExportTabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const tabName = target.getAttribute('data-tab');
      if (!tabName) return;
      setActiveImportExportTab(tabName);
    });
  });

  // Hash定位：src/options/options.html#pro -> 默认激活 Pro Tab
  if (window.location.hash === '#pro') {
    setActiveMainTab('pro');
  }

  elements.proIntentCampaignInput.addEventListener('input', () => {
    updateProWaitlistDistributionToolkitState();
  });

  elements.proIntentCampaignInput.addEventListener('change', async () => {
    const raw = elements.proIntentCampaignInput.value || '';
    const trimmed = raw.trim();

    // Empty is allowed (campaign is optional).
    if (!trimmed) {
      try {
        await saveSettings({ proIntentCampaign: '' });
        currentSettings = { ...currentSettings, proIntentCampaign: '' };
      } catch (error) {
        console.warn('Failed to save pro intent campaign:', error);
        showNotification(getMessage('savingFailed'), 'error');
      }
      updateProWaitlistDistributionToolkitState();
      return;
    }

    const sanitized = sanitizeCampaign(raw);
    if (!sanitized) {
      elements.proIntentCampaignInput.value = '';
      try {
        await saveSettings({ proIntentCampaign: '' });
        currentSettings = { ...currentSettings, proIntentCampaign: '' };
      } catch (error) {
        console.warn('Failed to save pro intent campaign:', error);
        showNotification(getMessage('savingFailed'), 'error');
      }
      showNotification(getMessage('proIntentCampaignInvalid'), 'info');
      updateProWaitlistDistributionToolkitState();
      return;
    }

    elements.proIntentCampaignInput.value = sanitized;
    try {
      await saveSettings({ proIntentCampaign: sanitized });
      currentSettings = { ...currentSettings, proIntentCampaign: sanitized };
    } catch (error) {
      console.warn('Failed to save pro intent campaign:', error);
      showNotification(getMessage('savingFailed'), 'error');
    }
    updateProWaitlistDistributionToolkitState();
  });

  function buildProRouteUrl(campaign?: string | null): string {
    return buildProRoadmapUrl({
      medium: 'distribution_toolkit',
      campaign: campaign || undefined
    });
  }

  function buildWaitlistUrl(): string {
    return buildProRouteUrl(getProIntentCampaign());
  }

  function buildWaitlistDistributionUrl(campaign: string): string {
    return buildProRouteUrl(campaign);
  }

  function buildProPrivacyUrlForDistributionToolkit(campaign: string): string {
    return buildPrivacyPolicyUrl({ medium: 'distribution_toolkit', campaign });
  }

  function buildWaitlistRecruitCopy(campaign: string): string {
    const waitlistUrl = buildWaitlistDistributionUrl(campaign);
    const storeUrl = buildProStoreUrlForDistributionToolkit(campaign);
    const privacyUrl = buildProPrivacyUrlForDistributionToolkit(campaign);
    return buildProWaitlistRecruitCopyText({
      getMessage,
      waitlistUrl,
      storeUrl,
      privacyUrl,
      campaign
    });
  }

  function buildProStoreUrlForDistributionToolkit(campaign: string): string {
    return buildChromeWebStoreUrl({ medium: 'distribution_toolkit', campaign });
  }

  function buildProDistributionPackForDistributionToolkit(campaign: string): string {
    const officialSiteUrl = buildOfficialSiteUrl({ medium: 'distribution_toolkit', campaign });
    const storeUrl = buildProStoreUrlForDistributionToolkit(campaign);
    const privacyUrl = buildProPrivacyUrlForDistributionToolkit(campaign);
    const waitlistUrl = buildWaitlistDistributionUrl(campaign);
    const recruitCopy = buildWaitlistRecruitCopy(campaign);
    return buildProDistributionPackMarkdown({
      getMessage,
      campaign,
      officialSiteUrl,
      storeUrl,
      privacyUrl,
      waitlistUrl,
      recruitCopy
    });
  }

  function buildValidationRouteUrlForOptions(trackId: ProValidationTrackId): string {
    return buildProValidationRouteUrl({
      trackId,
      medium: 'options',
      campaign: getProIntentCampaign() || null
    });
  }

  function buildValidationRouteUrlForDistributionToolkit(trackId: ProValidationTrackId, campaign: string): string {
    return buildProValidationRouteUrl({
      trackId,
      medium: 'distribution_toolkit',
      campaign
    });
  }

  function buildValidationBrief(trackId: ProValidationTrackId, campaign: string): string {
    return buildProValidationBriefMarkdown({
      trackId,
      campaign,
      getMessage
    });
  }

  function buildValidationChecklist(trackId: ProValidationTrackId, campaign: string): string {
    return buildProValidationChecklistMarkdown({
      trackId,
      campaign,
      getMessage
    });
  }

  async function copyValidationAsset(params: {
    button: HTMLButtonElement;
    trackId: ProValidationTrackId;
    action: ProValidationAssetAction;
    buildText: (campaign: string) => string;
    restoreLabelKey: string;
  }): Promise<void> {
    const originalText = params.button.textContent || '';
    const state = computeProWaitlistDistributionState(elements.proIntentCampaignInput.value);
    if (!state.enabled || !state.campaign) {
      showNotification(getMessage('proWaitlistDistributionCampaignRequired'), 'info');
      updateProWaitlistDistributionToolkitState();
      return;
    }

    const track = getProValidationTrack(params.trackId);
    const text = params.buildText(state.campaign);

    try {
      await writeTextToClipboard(text);
      void recordTelemetryEvent('pro_distribution_asset_copied', {
        source: 'options',
        campaign: state.campaign,
        action: params.action,
        content: track.attributionContent
      });
      params.button.textContent = getMessage('copied') || originalText;
      window.setTimeout(() => {
        params.button.textContent = getMessage(params.restoreLabelKey) || originalText;
      }, 1200);
    } catch (error) {
      console.warn('Failed to copy validation asset:', error);
      const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
      if (ok) {
        void recordTelemetryEvent('pro_distribution_asset_copied', {
          source: 'options',
          campaign: state.campaign,
          action: params.action,
          content: track.attributionContent
        });
        params.button.textContent = getMessage('copied') || originalText;
        window.setTimeout(() => {
          params.button.textContent = getMessage(params.restoreLabelKey) || originalText;
        }, 1200);
        return;
      }
      showNotification(getMessage('failedCopyClipboard'), 'error');
      params.button.textContent = originalText;
    }
  }

  function buildWomStoreUrl(): string {
    return buildChromeWebStoreDetailUrl(chrome.runtime.id, buildWomUtmParams('options'));
  }

  async function buildWomFeedbackUrl(): Promise<string> {
    const settingsSnapshot = buildFeedbackSettingsSnapshot(currentSettings);

    let growthStatsSnapshot: GrowthStats | undefined;
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

    let telemetryEventsSnapshot: TelemetryEvent[] | undefined;
    try {
      if (settingsSnapshot.isAnonymousUsageDataEnabled && chrome.storage?.local) {
        const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
        telemetryEventsSnapshot = sanitizeTelemetryEvents(result[TELEMETRY_EVENTS_KEY]);
      }
    } catch (error) {
      console.warn('Failed to read telemetry events for feedback template:', error);
    }

    return buildFeedbackIssueUrl({
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
  }

  elements.proWaitlistButton.addEventListener('click', async () => {
    const url = buildWaitlistUrl();
    await recordTelemetryEvent(
      'pro_waitlist_opened',
      buildOptionsProIntentAttribution('options_waitlist_cta')
    );
    await reportE2EOpenedUrl(url);
    chrome.tabs.create({ url });
  });

  elements.proValidationAdvancedOpenButton.addEventListener('click', async () => {
    const url = buildValidationRouteUrlForOptions(ADVANCED_CLEANING_VALIDATION_TRACK_ID);
    const track = getProValidationTrack(ADVANCED_CLEANING_VALIDATION_TRACK_ID);
    await recordTelemetryEvent('pro_waitlist_opened', buildOptionsProIntentAttribution(track.attributionContent));
    await reportE2EOpenedUrl(url);
    chrome.tabs.create({ url });
  });

  elements.proValidationAdvancedRouteCopyButton.addEventListener('click', () => {
    void copyValidationAsset({
      button: elements.proValidationAdvancedRouteCopyButton,
      trackId: ADVANCED_CLEANING_VALIDATION_TRACK_ID,
      action: 'validation_route',
      buildText: (campaign) =>
        buildValidationRouteUrlForDistributionToolkit(ADVANCED_CLEANING_VALIDATION_TRACK_ID, campaign),
      restoreLabelKey: 'proValidationAdvancedRouteCopyButton'
    });
  });

  elements.proValidationAdvancedBriefCopyButton.addEventListener('click', () => {
    void copyValidationAsset({
      button: elements.proValidationAdvancedBriefCopyButton,
      trackId: ADVANCED_CLEANING_VALIDATION_TRACK_ID,
      action: 'validation_brief',
      buildText: (campaign) => buildValidationBrief(ADVANCED_CLEANING_VALIDATION_TRACK_ID, campaign),
      restoreLabelKey: 'proValidationAdvancedBriefCopyButton'
    });
  });

  elements.proValidationAdvancedChecklistCopyButton.addEventListener('click', () => {
    void copyValidationAsset({
      button: elements.proValidationAdvancedChecklistCopyButton,
      trackId: ADVANCED_CLEANING_VALIDATION_TRACK_ID,
      action: 'validation_checklist',
      buildText: (campaign) =>
        buildValidationChecklist(ADVANCED_CLEANING_VALIDATION_TRACK_ID, campaign),
      restoreLabelKey: 'proValidationAdvancedChecklistCopyButton'
    });
  });

  elements.proValidationBulkOpenButton.addEventListener('click', async () => {
    const url = buildValidationRouteUrlForOptions(BULK_COLLECTION_VALIDATION_TRACK_ID);
    const track = getProValidationTrack(BULK_COLLECTION_VALIDATION_TRACK_ID);
    await recordTelemetryEvent('pro_waitlist_opened', buildOptionsProIntentAttribution(track.attributionContent));
    await reportE2EOpenedUrl(url);
    chrome.tabs.create({ url });
  });

  elements.proValidationBulkRouteCopyButton.addEventListener('click', () => {
    void copyValidationAsset({
      button: elements.proValidationBulkRouteCopyButton,
      trackId: BULK_COLLECTION_VALIDATION_TRACK_ID,
      action: 'validation_route',
      buildText: (campaign) =>
        buildValidationRouteUrlForDistributionToolkit(BULK_COLLECTION_VALIDATION_TRACK_ID, campaign),
      restoreLabelKey: 'proValidationBulkRouteCopyButton'
    });
  });

  elements.proValidationBulkBriefCopyButton.addEventListener('click', () => {
    void copyValidationAsset({
      button: elements.proValidationBulkBriefCopyButton,
      trackId: BULK_COLLECTION_VALIDATION_TRACK_ID,
      action: 'validation_brief',
      buildText: (campaign) => buildValidationBrief(BULK_COLLECTION_VALIDATION_TRACK_ID, campaign),
      restoreLabelKey: 'proValidationBulkBriefCopyButton'
    });
  });

  elements.proValidationBulkChecklistCopyButton.addEventListener('click', () => {
    void copyValidationAsset({
      button: elements.proValidationBulkChecklistCopyButton,
      trackId: BULK_COLLECTION_VALIDATION_TRACK_ID,
      action: 'validation_checklist',
      buildText: (campaign) => buildValidationChecklist(BULK_COLLECTION_VALIDATION_TRACK_ID, campaign),
      restoreLabelKey: 'proValidationBulkChecklistCopyButton'
    });
  });

  elements.proValidationStructuredOpenButton.addEventListener('click', async () => {
    const url = buildValidationRouteUrlForOptions(STRUCTURED_EXPORT_VALIDATION_TRACK_ID);
    const track = getProValidationTrack(STRUCTURED_EXPORT_VALIDATION_TRACK_ID);
    await recordTelemetryEvent('pro_waitlist_opened', buildOptionsProIntentAttribution(track.attributionContent));
    await reportE2EOpenedUrl(url);
    chrome.tabs.create({ url });
  });

  elements.proValidationStructuredRouteCopyButton.addEventListener('click', () => {
    void copyValidationAsset({
      button: elements.proValidationStructuredRouteCopyButton,
      trackId: STRUCTURED_EXPORT_VALIDATION_TRACK_ID,
      action: 'validation_route',
      buildText: (campaign) =>
        buildValidationRouteUrlForDistributionToolkit(STRUCTURED_EXPORT_VALIDATION_TRACK_ID, campaign),
      restoreLabelKey: 'proValidationStructuredExportRouteCopyButton'
    });
  });

  elements.proValidationStructuredBriefCopyButton.addEventListener('click', () => {
    void copyValidationAsset({
      button: elements.proValidationStructuredBriefCopyButton,
      trackId: STRUCTURED_EXPORT_VALIDATION_TRACK_ID,
      action: 'validation_brief',
      buildText: (campaign) => buildValidationBrief(STRUCTURED_EXPORT_VALIDATION_TRACK_ID, campaign),
      restoreLabelKey: 'proValidationStructuredExportBriefCopyButton'
    });
  });

  elements.proValidationStructuredChecklistCopyButton.addEventListener('click', () => {
    void copyValidationAsset({
      button: elements.proValidationStructuredChecklistCopyButton,
      trackId: STRUCTURED_EXPORT_VALIDATION_TRACK_ID,
      action: 'validation_checklist',
      buildText: (campaign) =>
        buildValidationChecklist(STRUCTURED_EXPORT_VALIDATION_TRACK_ID, campaign),
      restoreLabelKey: 'proValidationStructuredExportChecklistCopyButton'
    });
  });

  elements.proWaitlistUrlCopyButton.addEventListener('click', async () => {
    const originalText = elements.proWaitlistUrlCopyButton.textContent || '';
    const state = computeProWaitlistDistributionState(elements.proIntentCampaignInput.value);
    if (!state.enabled || !state.campaign) {
      showNotification(getMessage('proWaitlistDistributionCampaignRequired'), 'info');
      updateProWaitlistDistributionToolkitState();
      return;
    }

    const url = buildWaitlistDistributionUrl(state.campaign);
    try {
      await writeTextToClipboard(url);
      void recordTelemetryEvent('pro_distribution_asset_copied', {
        source: 'options',
        campaign: state.campaign,
        action: 'waitlist_url'
      });
      elements.proWaitlistUrlCopyButton.textContent = getMessage('copied') || originalText;
      window.setTimeout(() => {
        elements.proWaitlistUrlCopyButton.textContent =
          getMessage('proWaitlistUrlCopyButton') || originalText;
      }, 1200);
    } catch (error) {
      console.warn('Failed to copy waitlist url via navigator.clipboard:', error);
      const ok = await fallbackCopyTextForE2E(url, fallbackCopyText(url));
      if (ok) {
        void recordTelemetryEvent('pro_distribution_asset_copied', {
          source: 'options',
          campaign: state.campaign,
          action: 'waitlist_url'
        });
        elements.proWaitlistUrlCopyButton.textContent = getMessage('copied') || originalText;
        window.setTimeout(() => {
          elements.proWaitlistUrlCopyButton.textContent =
            getMessage('proWaitlistUrlCopyButton') || originalText;
        }, 1200);
        return;
      }
      showNotification(getMessage('failedCopyClipboard'), 'error');
      elements.proWaitlistUrlCopyButton.textContent = originalText;
    }
  });

  elements.proWaitlistRecruitCopyButton.addEventListener('click', async () => {
    const originalText = elements.proWaitlistRecruitCopyButton.textContent || '';
    const state = computeProWaitlistDistributionState(elements.proIntentCampaignInput.value);
    if (!state.enabled || !state.campaign) {
      showNotification(getMessage('proWaitlistDistributionCampaignRequired'), 'info');
      updateProWaitlistDistributionToolkitState();
      return;
    }

    const text = buildWaitlistRecruitCopy(state.campaign);
    try {
      await writeTextToClipboard(text);
      void recordTelemetryEvent('pro_distribution_asset_copied', {
        source: 'options',
        campaign: state.campaign,
        action: 'recruit_copy'
      });
      elements.proWaitlistRecruitCopyButton.textContent = getMessage('copied') || originalText;
      window.setTimeout(() => {
        elements.proWaitlistRecruitCopyButton.textContent =
          getMessage('proWaitlistRecruitCopyButton') || originalText;
      }, 1200);
    } catch (error) {
      console.warn('Failed to copy recruit copy via navigator.clipboard:', error);
      const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
      if (ok) {
        void recordTelemetryEvent('pro_distribution_asset_copied', {
          source: 'options',
          campaign: state.campaign,
          action: 'recruit_copy'
        });
        elements.proWaitlistRecruitCopyButton.textContent = getMessage('copied') || originalText;
        window.setTimeout(() => {
          elements.proWaitlistRecruitCopyButton.textContent =
            getMessage('proWaitlistRecruitCopyButton') || originalText;
        }, 1200);
        return;
      }
      showNotification(getMessage('failedCopyClipboard'), 'error');
      elements.proWaitlistRecruitCopyButton.textContent = originalText;
    }
  });

  elements.proStoreUrlCopyButton.addEventListener('click', async () => {
    const originalText = elements.proStoreUrlCopyButton.textContent || '';
    const state = computeProWaitlistDistributionState(elements.proIntentCampaignInput.value);
    if (!state.enabled || !state.campaign) {
      showNotification(getMessage('proWaitlistDistributionCampaignRequired'), 'info');
      updateProWaitlistDistributionToolkitState();
      return;
    }

    const url = buildProStoreUrlForDistributionToolkit(state.campaign);
    try {
      await writeTextToClipboard(url);
      void recordTelemetryEvent('pro_distribution_asset_copied', {
        source: 'options',
        campaign: state.campaign,
        action: 'store_url'
      });
      elements.proStoreUrlCopyButton.textContent = getMessage('copied') || originalText;
      window.setTimeout(() => {
        elements.proStoreUrlCopyButton.textContent =
          getMessage('proStoreUrlCopyButton') || originalText;
      }, 1200);
    } catch (error) {
      console.warn('Failed to copy store url via navigator.clipboard:', error);
      const ok = await fallbackCopyTextForE2E(url, fallbackCopyText(url));
      if (ok) {
        void recordTelemetryEvent('pro_distribution_asset_copied', {
          source: 'options',
          campaign: state.campaign,
          action: 'store_url'
        });
        elements.proStoreUrlCopyButton.textContent = getMessage('copied') || originalText;
        window.setTimeout(() => {
          elements.proStoreUrlCopyButton.textContent =
            getMessage('proStoreUrlCopyButton') || originalText;
        }, 1200);
        return;
      }
      showNotification(getMessage('failedCopyClipboard'), 'error');
      elements.proStoreUrlCopyButton.textContent = originalText;
    }
  });

  elements.proDistributionPackCopyButton.addEventListener('click', async () => {
    const originalText = elements.proDistributionPackCopyButton.textContent || '';
    const state = computeProWaitlistDistributionState(elements.proIntentCampaignInput.value);
    if (!state.enabled || !state.campaign) {
      showNotification(getMessage('proWaitlistDistributionCampaignRequired'), 'info');
      updateProWaitlistDistributionToolkitState();
      return;
    }

    const text = buildProDistributionPackForDistributionToolkit(state.campaign);
    try {
      await writeTextToClipboard(text);
      void recordTelemetryEvent('pro_distribution_asset_copied', {
        source: 'options',
        campaign: state.campaign,
        action: 'distribution_pack'
      });
      elements.proDistributionPackCopyButton.textContent = getMessage('copied') || originalText;
      window.setTimeout(() => {
        elements.proDistributionPackCopyButton.textContent =
          getMessage('proDistributionPackCopyButton') || originalText;
      }, 1200);
    } catch (error) {
      console.warn('Failed to copy distribution pack via navigator.clipboard:', error);
      const ok = await fallbackCopyTextForE2E(text, fallbackCopyText(text));
      if (ok) {
        void recordTelemetryEvent('pro_distribution_asset_copied', {
          source: 'options',
          campaign: state.campaign,
          action: 'distribution_pack'
        });
        elements.proDistributionPackCopyButton.textContent = getMessage('copied') || originalText;
        window.setTimeout(() => {
          elements.proDistributionPackCopyButton.textContent =
            getMessage('proDistributionPackCopyButton') || originalText;
        }, 1200);
        return;
      }
      showNotification(getMessage('failedCopyClipboard'), 'error');
      elements.proDistributionPackCopyButton.textContent = originalText;
    }
  });

  elements.womShareOpenButton.addEventListener('click', () => {
    void recordTelemetryEvent('wom_share_opened', { source: 'options' });
    const url = buildWomStoreUrl();
    chrome.tabs.create({ url });
  });

  elements.womRateOpenButton.addEventListener('click', () => {
    void recordTelemetryEvent('wom_rate_opened', { source: 'options' });
    const url = buildChromeWebStoreReviewsUrl(chrome.runtime.id, buildWomUtmParams('options'));
    chrome.tabs.create({ url });
  });

  elements.womFeedbackOpenButton.addEventListener('click', () => {
    void recordTelemetryEvent('wom_feedback_opened', { source: 'options' });
    void (async () => {
      const url = await buildWomFeedbackUrl();
      chrome.tabs.create({ url });
    })();
  });

  elements.womShareCopyButton.addEventListener('click', async () => {
    const storeUrl = buildWomStoreUrl();
    const shareText = buildShareCopyText(getMessage, storeUrl);
    const originalText = elements.womShareCopyButton.textContent || '';

    try {
      await writeTextToClipboard(shareText);
      void recordTelemetryEvent('wom_share_copied', { source: 'options' });
      elements.womShareCopyButton.textContent = getMessage('copied') || originalText;
      window.setTimeout(() => {
        elements.womShareCopyButton.textContent = getMessage('copyShareText') || originalText;
      }, 1200);
    } catch (error) {
      console.error('Failed to copy share text:', error);
      const ok = await fallbackCopyTextForE2E(shareText, fallbackCopyText(shareText));
      if (ok) {
        void recordTelemetryEvent('wom_share_copied', { source: 'options' });
        elements.womShareCopyButton.textContent = getMessage('copied') || originalText;
        window.setTimeout(() => {
          elements.womShareCopyButton.textContent = getMessage('copyShareText') || originalText;
        }, 1200);
        return;
      }
      showNotification(getMessage('failedCopyClipboard'), 'error');
      elements.womShareCopyButton.textContent = originalText;
    }
  });

  // Chat服务相关事件监听器
  elements.addCustomChatBtn.addEventListener('click', () => openChatServiceEditor());
  elements.chatServiceForm.addEventListener('submit', saveChatService);
  elements.cancelChatServiceBtn.addEventListener('click', closeChatServiceEditor);
  elements.closeChatServiceModalBtn.addEventListener('click', closeChatServiceEditor);

  // 默认设置事件监听器
  elements.defaultChatService.addEventListener('change', async () => {
    currentSettings.defaultChatServiceId = elements.defaultChatService.value || undefined;
    await saveChatSettings();
  });

  elements.defaultAutoOpenChat.addEventListener('change', async () => {
    currentSettings.defaultAutoOpenChat = elements.defaultAutoOpenChat.checked;
    await saveChatSettings();
  });

  // Chat服务卡片事件委托
  elements.chatServicesGrid.addEventListener('click', (e) => {
    const target = e.target as Element;

    const openBtn = target.closest('.open-service-btn') as HTMLButtonElement;
    if (openBtn) {
      const url = openBtn.getAttribute('data-url');
      if (url) {
        chrome.tabs.create({ url: url });
      }
      return;
    }

    const editBtn = target.closest('.edit-service-btn') as HTMLButtonElement;
    if (editBtn) {
      const serviceId = editBtn.getAttribute('data-id');
      if (serviceId) {
        const service = currentSettings.chatServices.find((s) => s.id === serviceId);
        if (service) {
          openChatServiceEditor(service);
        }
      }
      return;
    }

    const deleteBtn = target.closest('.delete-service-btn') as HTMLButtonElement;
    if (deleteBtn) {
      const serviceId = deleteBtn.getAttribute('data-id');
      if (serviceId) {
        deleteChatService(serviceId);
      }
      return;
    }
  });

  // Chat服务启用状态切换
  elements.chatServicesGrid.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.classList.contains('service-enabled-toggle')) {
      const serviceId = target.getAttribute('data-id');
      if (serviceId) {
        toggleChatServiceEnabled(serviceId, target.checked);
      }
    }
  });

  // Chat服务模态框背景点击关闭
  elements.chatServiceEditorModal.addEventListener('click', (e) => {
    if (e.target === elements.chatServiceEditorModal) {
      closeChatServiceEditor();
    }
  });

  // 批量操作菜单项事件
  const batchMenuItems = document.querySelectorAll('.batch-menu-item');
  batchMenuItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = (e.target as HTMLElement)
        .closest('.batch-menu-item')
        ?.getAttribute('data-action');

      switch (action) {
        case 'select-all':
          selectAllPrompts();
          break;
        case 'deselect-all':
          deselectAllPrompts();
          break;
        case 'delete-selected':
          deleteSelectedPrompts();
          break;
      }
    });
  });

  // 动态绑定prompt卡片事件
  elements.promptsGrid.addEventListener('click', (e) => {
    const target = e.target as Element;

    // 处理复选框点击
    if (target.classList.contains('prompt-card-checkbox')) {
      const checkbox = target as HTMLInputElement;
      const promptId = checkbox.getAttribute('data-id');
      if (promptId) {
        e.stopPropagation();
        togglePromptSelection(promptId);
      }
      return;
    }

    // 处理操作按钮点击
    const btn = target.closest('.action-btn') as HTMLButtonElement;
    if (btn) {
      const promptId = btn.getAttribute('data-id');
      if (!promptId) return;

      e.stopPropagation();

      if (btn.classList.contains('edit-btn')) {
        editPrompt(promptId);
      } else if (btn.classList.contains('duplicate-btn')) {
        duplicatePrompt(promptId);
      } else if (btn.classList.contains('delete-btn')) {
        deletePrompt(promptId);
      }
      return;
    }

    // 处理卡片点击（编辑）
    const card = target.closest('.prompt-card') as HTMLElement;
    if (card) {
      const promptId = card.getAttribute('data-id');
      if (promptId) {
        editPrompt(promptId);
      }
    }
  });

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'n') {
        e.preventDefault();
        openPromptEditor();
      } else if (e.key === 'f') {
        e.preventDefault();
        elements.searchInput.focus();
      }
    }

    if (e.key === 'Escape') {
      if (elements.promptEditorModal.style.display === 'flex') {
        closePromptEditor();
      } else if (elements.previewModal.style.display === 'flex') {
        closePreviewModal();
      }
    }
  });
}

/**
 * 初始化应用
 */
async function initialize() {
  try {
    console.debug('Initializing options page...');

    elements = getElements();
    localizeUI();
    loadPromptSortMode();
    await loadSettings();
    await refreshTelemetryEventsPanel();
    await refreshProFunnelPanel();
    await refreshWomSummaryPanel();
    await refreshGrowthFunnelPanel();
    await refreshAppendWorkflowPanel();
    await refreshGrowthStatsPanel();
    renderChatServices();
    updateChatServiceOptions();
    setupEventListeners();

    console.debug('Options page initialized successfully');
  } catch (error) {
    console.error('Error initializing options page:', error);
    showNotification(getMessage('initializationFailed'), 'error');
  }
}

// 全局函数已移除，现在使用事件监听器代替内联事件处理器

/**
 * 更新chat服务选择框选项
 */
function updateChatServiceOptions() {
  const chatServices = currentSettings.chatServices.filter((service) => service.enabled);

  // 更新prompt编辑器中的选择框
  elements.promptTargetChat.innerHTML = `<option value="" data-i18n="useDefault">${getMessage('useDefault')}</option>`;
  chatServices.forEach((service) => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = service.name;
    elements.promptTargetChat.appendChild(option);
  });

  // 更新默认chat服务选择框
  elements.defaultChatService.innerHTML = `<option value="" data-i18n="noDefault">${getMessage('noDefault')}</option>`;
  chatServices.forEach((service) => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = service.name;
    elements.defaultChatService.appendChild(option);
  });

  // 设置当前值
  elements.defaultChatService.value = currentSettings.defaultChatServiceId || '';
  elements.defaultAutoOpenChat.checked = currentSettings.defaultAutoOpenChat;
}

/**
 * 渲染chat服务卡片
 */
function renderChatServices() {
  elements.chatServicesGrid.innerHTML = '';

  currentSettings.chatServices.forEach((service) => {
    const card = createChatServiceCard(service);
    elements.chatServicesGrid.appendChild(card);
  });
}

/**
 * 创建chat服务卡片
 */
function createChatServiceCard(service: ChatService): HTMLElement {
  const card = document.createElement('div');
  card.className = 'chat-service-card';
  card.setAttribute('data-id', service.id);

  // 获取服务图标信息（文字和颜色）
  const iconInfo = getServiceIconInfo(service);

  card.innerHTML = `
    <div class="chat-service-header">
      <div class="chat-service-info">
        <div class="chat-service-icon-text" style="background-color: ${iconInfo.color}">${iconInfo.text}</div>
        <div class="chat-service-details">
          <h4 class="chat-service-name">${escapeHtml(service.name)}</h4>
          <p class="chat-service-url">${escapeHtml(service.url)}</p>
        </div>
      </div>
      <div class="chat-service-actions">
        <button class="action-btn open-service-btn" title="${getMessage('openService')}" data-id="${service.id}" data-url="${service.url}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15,3 21,3 21,9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
        ${
          !service.builtIn
            ? `
          <button class="action-btn edit-service-btn" title="${getMessage('editService')}" data-id="${service.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn delete-service-btn" title="${getMessage('deleteService')}" data-id="${service.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        `
            : ''
        }
      </div>
    </div>
    <div class="chat-service-toggle">
      <label class="switch-label">
        <span>${service.description || ''}</span>
        <label class="switch">
          <input type="checkbox" class="service-enabled-toggle" data-id="${service.id}" ${service.enabled ? 'checked' : ''} />
          <span class="slider round"></span>
        </label>
      </label>
    </div>
  `;

  return card;
}

/**
 * 打开chat服务编辑器
 */
function openChatServiceEditor(service?: ChatService) {
  editingChatServiceId = service?.id || null;

  if (service) {
    elements.chatServiceModalTitle.textContent = getMessage('editChatService');
    elements.chatServiceId.value = service.id;
    elements.chatServiceName.value = service.name;
    elements.chatServiceUrl.value = service.url;
  } else {
    elements.chatServiceModalTitle.textContent = getMessage('addChatService');
    elements.chatServiceForm.reset();
    elements.chatServiceId.value = '';
  }

  elements.chatServiceEditorModal.style.display = 'flex';
  elements.chatServiceName.focus();
}

/**
 * 关闭chat服务编辑器
 */
function closeChatServiceEditor() {
  elements.chatServiceEditorModal.style.display = 'none';
  editingChatServiceId = null;
}

/**
 * 保存chat服务
 */
async function saveChatService(event: Event) {
  event.preventDefault();

  const name = elements.chatServiceName.value.trim();
  const url = elements.chatServiceUrl.value.trim();
  if (!name || !url) {
    showNotification(getMessage('errorFillInTitleAndTemplate'), 'error');
    return;
  }

  if (editingChatServiceId) {
    // 编辑现有服务
    const service = currentSettings.chatServices.find((s) => s.id === editingChatServiceId);
    if (service) {
      service.name = name;
      service.url = url;
    }
  } else {
    // 新建服务
    const newService: ChatService = {
      id: generateUUID(),
      name,
      url,
      enabled: true,
      builtIn: false
    };
    currentSettings.chatServices.push(newService);
  }

  await saveChatSettings();
  closeChatServiceEditor();
  showNotification(getMessage('saveSuccessMessage'), 'success');
}

/**
 * 删除chat服务
 */
async function deleteChatService(serviceId: string) {
  if (confirm(getMessage('confirmDeleteService'))) {
    currentSettings.chatServices = currentSettings.chatServices.filter((s) => s.id !== serviceId);

    // 如果删除的是默认服务，清除默认设置
    if (currentSettings.defaultChatServiceId === serviceId) {
      currentSettings.defaultChatServiceId = undefined;
    }

    // 清理使用此服务的prompts
    allPrompts.forEach((prompt) => {
      if (prompt.targetChatId === serviceId) {
        prompt.targetChatId = undefined;
      }
    });

    await saveChatSettings();
    showNotification(getMessage('deleteSingleSuccessMessage'), 'success');
  }
}

/**
 * 切换chat服务启用状态
 */
async function toggleChatServiceEnabled(serviceId: string, enabled: boolean) {
  const service = currentSettings.chatServices.find((s) => s.id === serviceId);
  if (service) {
    service.enabled = enabled;

    // 如果禁用的是默认服务，清除默认设置
    if (!enabled && currentSettings.defaultChatServiceId === serviceId) {
      currentSettings.defaultChatServiceId = undefined;
    }

    await saveChatSettings();
  }
}

/**
 * 保存chat服务设置
 */
async function saveChatSettings() {
  try {
    await saveSettings({
      chatServices: currentSettings.chatServices,
      defaultChatServiceId: currentSettings.defaultChatServiceId,
      defaultAutoOpenChat: currentSettings.defaultAutoOpenChat,
      userPrompts: allPrompts
    });

    renderChatServices();
    updateChatServiceOptions();
  } catch (error) {
    console.error('Error saving chat settings:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const quotaWarning =
      errorMessage.includes('QUOTA_BYTES') || errorMessage.toLowerCase().includes('quota');
    const message = quotaWarning
      ? getMessage('storageQuotaExceeded') || 'storageQuotaExceeded'
      : getMessage('savingFailed');
    showNotification(message, 'error');
  }
}

// 当DOM加载完成时初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
