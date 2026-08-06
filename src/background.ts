import {
  getActivePrompts,
  getSettings,
  mutateSettings,
  saveSettings,
  type Prompt,
  type ChatService,
  type Settings
} from './shared/settings-manager';
import {
  buildPromptContextMenuItems,
  createSerializedContextMenuUpdater
} from './shared/context-menu-model';
import {
  QUICK_CONVERT_COMMAND,
  getQuickPromptBySlot,
  getQuickPromptSlotFromCommand
} from './shared/prompt-shortcuts';
import {
  ensureGrowthStatsInitialized,
  getGrowthStats,
  incrementSuccessfulCopyCount,
  markRatingPromptShown,
  setRatingPromptAction,
  type RatingPromptAction,
  type ReuseEntrySlot,
  type ReuseEntrySource
} from './shared/growth-stats';
import {
  buildAppendSessionAudit,
  clearAppendSessionState,
  recordAppendSessionClip
} from './shared/append-session';
import {
  createCopyActionFailure,
  isCopyActionResult,
  type CopyActionResult
} from './shared/copy-action-result';

const isE2EBuild = process.env.BUILD_TARGET === 'e2e';
const E2E_LAST_COPIED_TEXT_KEY = 'copilot_e2e_last_copied_text';
const E2E_OPENED_URLS_KEY = 'copilot_e2e_opened_urls';
let e2ePopupTabId: number | null = null;
type E2EContextMenuSnapshotItem = {
  id: string;
  title: string;
  parentId?: string;
  contexts: chrome.contextMenus.ContextType[];
};
let e2eContextMenuSnapshot: E2EContextMenuSnapshotItem[] = [];

function isReuseEntrySource(value: unknown): value is ReuseEntrySource {
  return value === 'popup' || value === 'onboarding';
}

function isReuseEntrySlot(value: unknown): value is ReuseEntrySlot {
  return value === 1 || value === 2 || value === 3;
}

async function setE2ELastCopiedText(text: string) {
  if (!isE2EBuild) {
    return;
  }

  await chrome.storage.local.set({
    [E2E_LAST_COPIED_TEXT_KEY]: text
  });
}

async function getE2ELastCopiedText(): Promise<string> {
  if (!isE2EBuild) {
    return '';
  }

  const result = await chrome.storage.local.get(E2E_LAST_COPIED_TEXT_KEY);
  return typeof result[E2E_LAST_COPIED_TEXT_KEY] === 'string' ? result[E2E_LAST_COPIED_TEXT_KEY] : '';
}

async function reportE2EOpenedUrl(url: string) {
  if (!isE2EBuild) {
    return;
  }

  const result = await chrome.storage.local.get(E2E_OPENED_URLS_KEY);
  const existing = Array.isArray(result[E2E_OPENED_URLS_KEY])
    ? (result[E2E_OPENED_URLS_KEY] as unknown[]).filter((item): item is string => typeof item === 'string')
    : [];

  existing.push(url);
  await chrome.storage.local.set({
    [E2E_OPENED_URLS_KEY]: existing.slice(-20)
  });
}

async function getE2EOpenedUrls(): Promise<string[]> {
  if (!isE2EBuild) {
    return [];
  }

  const result = await chrome.storage.local.get(E2E_OPENED_URLS_KEY);
  return Array.isArray(result[E2E_OPENED_URLS_KEY])
    ? (result[E2E_OPENED_URLS_KEY] as unknown[]).filter((item): item is string => typeof item === 'string')
    : [];
}

function createContextMenuItem(
  properties: chrome.contextMenus.CreateProperties
): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.create(properties, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message || `Failed to create context menu item ${String(properties.id)}`));
        return;
      }
      resolve();
    });
  });
}

async function rebuildContextMenu() {
  e2eContextMenuSnapshot = [];
  await chrome.contextMenus.removeAll();

  const convertTitle = chrome.i18n.getMessage('convertPage') || 'Copy to AI';
  await createContextMenuItem({
    id: 'convert-page-to-ai-friendly-format',
    title: convertTitle,
    contexts: ['page']
  });
  e2eContextMenuSnapshot.push({
    id: 'convert-page-to-ai-friendly-format',
    title: convertTitle,
    contexts: ['page']
  });

  const { userPrompts } = await getSettings();
  const activePrompts = getActivePrompts(userPrompts);

  for (const item of buildPromptContextMenuItems({ prompts: activePrompts })) {
    const createProperties: chrome.contextMenus.CreateProperties = {
      id: item.id,
      title: item.title,
      contexts: item.contexts
    };
    if (item.parentId) {
      createProperties.parentId = item.parentId;
    }

    await createContextMenuItem(createProperties);
    e2eContextMenuSnapshot.push({
      id: item.id,
      title: item.title,
      parentId: item.parentId,
      contexts: [...item.contexts]
    });
  }
}

const enqueueContextMenuUpdate = createSerializedContextMenuUpdater(rebuildContextMenu);

async function updateContextMenu() {
  await enqueueContextMenuUpdate();
}

let clipboardStack: string[] = [];

function getCopyActionMessage(key: string): string {
  return chrome.i18n.getMessage(key) || chrome.i18n.getMessage('failedCopyClipboard');
}

async function sendCopyActionMessage(
  tabId: number,
  message: Record<string, unknown>
): Promise<CopyActionResult> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    if (isCopyActionResult(response)) {
      return response;
    }
    return createCopyActionFailure(
      'UNKNOWN',
      getCopyActionMessage('copyErrorUnknown')
    );
  } catch (error) {
    console.warn('Could not reach the Copylot content script:', error);
    return createCopyActionFailure(
      'CONTENT_SCRIPT_UNAVAILABLE',
      getCopyActionMessage(
        'copyErrorPageUnavailable'
      )
    );
  }
}

async function handleConvertPageContextMenu(tabId: number): Promise<CopyActionResult> {
  return sendCopyActionMessage(tabId, {
    type: 'CONVERT_PAGE_WITH_SELECTION'
  });
}

async function runPromptAction(
  tabId: number,
  promptId: string,
  selectionText?: string,
  audit?: { source?: ReuseEntrySource; slot?: ReuseEntrySlot }
): Promise<CopyActionResult> {
  let settings = await getSettings();
  let prompt = getActivePrompts(settings.userPrompts).find((item: Prompt) => item.id === promptId);
  if (!prompt) {
    return createCopyActionFailure(
      'UNKNOWN',
      chrome.i18n.getMessage('promptNotFound') || 'Prompt not found'
    );
  }

  try {
    const updated = await mutateSettings<{
      settings: Settings;
      prompt: Prompt;
    } | null>((current) => {
      const currentPrompt = getActivePrompts(current.userPrompts).find(
        (item: Prompt) => item.id === promptId
      );
      if (!currentPrompt) {
        return { result: null };
      }

      currentPrompt.usageCount = (currentPrompt.usageCount || 0) + 1;
      currentPrompt.lastUsedAt = Date.now();
      return {
        patch: { userPrompts: current.userPrompts },
        result: { settings: current, prompt: { ...currentPrompt } }
      };
    });
    if (!updated) {
      return createCopyActionFailure(
        'UNKNOWN',
        chrome.i18n.getMessage('promptNotFound') || 'Prompt not found'
      );
    }
    settings = updated.settings;
    prompt = updated.prompt;
    console.debug(`Updated usage count for prompt "${prompt.title}": ${prompt.usageCount}`);
  } catch (error) {
    console.error('Failed to update prompt usage:', error);
  }

  const shouldOpenChat = prompt.autoOpenChat !== undefined ? prompt.autoOpenChat : settings.defaultAutoOpenChat;
  const targetChatId = prompt.targetChatId || settings.defaultChatServiceId;

  const normalizedSelection = typeof selectionText === 'string' ? selectionText.trim() : '';
  if (shouldOpenChat && targetChatId) {
    const chatService = settings.chatServices.find((service: ChatService) => service.id === targetChatId && service.enabled);
    if (chatService) {
      return sendCopyActionMessage(tabId, {
        type: 'PROCESS_SELECTION_OR_PAGE_WITH_PROMPT',
        promptTemplate: prompt.template,
        chatServiceUrl: chatService.url,
        chatServiceName: chatService.name,
        selectionText: normalizedSelection,
        auditSource: audit?.source,
        quickPromptSlot: audit?.slot
      });
    }
  }

  return sendCopyActionMessage(tabId, {
    type: 'PROCESS_SELECTION_OR_PAGE_WITH_PROMPT',
    promptTemplate: prompt.template,
    selectionText: normalizedSelection,
    auditSource: audit?.source,
    quickPromptSlot: audit?.slot
  });
}

async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<CopyActionResult> {
  if (!tab?.id) {
    return createCopyActionFailure(
      'NO_ACTIVE_TAB',
      getCopyActionMessage('copyErrorNoActiveTab')
    );
  }

  if (info.menuItemId === 'convert-page-to-ai-friendly-format') {
    return handleConvertPageContextMenu(tab.id);
  }

  const settings = await getSettings();
  const promptExists = getActivePrompts(settings.userPrompts).some((prompt) => prompt.id === info.menuItemId);
  if (promptExists) {
    return runPromptAction(
      tab.id,
      String(info.menuItemId),
      typeof info.selectionText === 'string' ? info.selectionText : undefined
    );
  }

  return createCopyActionFailure(
    'UNKNOWN',
    getCopyActionMessage('copyErrorUnknown')
  );
}

async function resetE2EState() {
  clipboardStack = [];
  e2ePopupTabId = null;
  await chrome.storage.sync.clear();
  await chrome.storage.local.clear();
  await chrome.action.setBadgeText({ text: '' });
  await getSettings();
  await ensureGrowthStatsInitialized();
  await setE2ELastCopiedText('');
  await updateContextMenu();
}

async function openPopupForTab(tabId?: number) {
  if (typeof tabId === 'number') {
    e2ePopupTabId = tabId;
    const tab = await chrome.tabs.get(tabId);
    if (tab.windowId !== undefined) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    await chrome.tabs.update(tabId, { active: true });
  } else {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    e2ePopupTabId = tabs[0]?.id ?? null;
  }

  await chrome.action.openPopup();
}

async function invokeContextMenuFromBridge(
  message: { tabId?: number; info: Partial<chrome.contextMenus.OnClickData> }
): Promise<CopyActionResult> {
  let tab: chrome.tabs.Tab | null = null;

  if (typeof message.tabId === 'number') {
    tab = await chrome.tabs.get(message.tabId);
  } else {
    const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    tab = activeTabs[0] || null;
  }

  if (!tab?.id) {
    throw new Error(chrome.i18n.getMessage('e2eContextMenuTabResolveFailed'));
  }

  const clickInfo = {
    menuItemId: message.info.menuItemId || '',
    parentMenuItemId: message.info.parentMenuItemId,
    selectionText: message.info.selectionText,
    pageUrl: message.info.pageUrl,
    editable: message.info.editable ?? false,
    mediaType: message.info.mediaType,
    linkUrl: message.info.linkUrl,
    srcUrl: message.info.srcUrl,
    frameUrl: message.info.frameUrl,
    frameId: message.info.frameId,
    wasChecked: message.info.wasChecked,
    checked: message.info.checked
  } as chrome.contextMenus.OnClickData;

  return handleContextMenuClick(clickInfo, tab);
}

async function executeQuickActionCommand(
  command: string,
  explicitTabId?: number,
  audit?: { source?: ReuseEntrySource; slot?: ReuseEntrySlot }
): Promise<CopyActionResult> {
  let tab: chrome.tabs.Tab | null = null;

  if (typeof explicitTabId === 'number') {
    tab = await chrome.tabs.get(explicitTabId);
  } else {
    const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    tab = activeTabs[0] || null;
  }

  if (!tab?.id) {
    return createCopyActionFailure(
      'NO_ACTIVE_TAB',
      getCopyActionMessage('copyErrorNoActiveTab')
    );
  }

  if (command === QUICK_CONVERT_COMMAND) {
    return handleConvertPageContextMenu(tab.id);
  }

  const slot = getQuickPromptSlotFromCommand(command);
  if (!slot) {
    return createCopyActionFailure(
      'UNKNOWN',
      getCopyActionMessage('copyErrorUnknown')
    );
  }

  const settings = await getSettings();
  const prompt = getQuickPromptBySlot(getActivePrompts(settings.userPrompts), slot);
  if (!prompt) {
    return createCopyActionFailure(
      'UNKNOWN',
      chrome.i18n.getMessage('promptNotFound') || 'Prompt not found'
    );
  }

  return runPromptAction(tab.id, prompt.id, undefined, {
    source: audit?.source,
    slot: audit?.slot ?? slot
  });
}

chrome.commands?.onCommand.addListener((command) => {
  void executeQuickActionCommand(command)
    .then((result) => {
      if (!result.success) {
        console.warn('Copylot command did not complete:', command, result.code, result.error);
      }
    })
    .catch((error) => {
      console.error('Failed to execute command:', command, error);
    });
});

// Extension lifecycle events
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('AI Copilot extension installed/updated:', details.reason);
  try {
    await updateContextMenu();
  } catch (error) {
    console.error('Failed to initialize the context menu:', error);
  }

  // Initialize growth stats (local only, auditable, privacy-safe)
  try {
    await ensureGrowthStatsInitialized();
  } catch (error) {
    console.error('Failed to initialize growth stats:', error);
  }

  // Initialize settings on first install
  if (details.reason === 'install') {
    console.log('First install - initializing settings...');
    await getSettings(); // This will create default settings
    console.log('Settings initialized successfully');
  }

  // Handle updates
  if (details.reason === 'update') {
    const previousVersion = details.previousVersion;
    console.log(`Updated from version ${previousVersion}`);

    // Ensure settings are compatible with new version
    await getSettings(); // This will merge with defaults if needed
    console.log('Settings migrated successfully');
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('AI Copilot extension started');
  try {
    await updateContextMenu();
  } catch (error) {
    console.error('Failed to refresh the context menu on startup:', error);
  }
});

// Handle messages from content scripts (for future features)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.debug('Background received message:', message, 'from', sender);

  // Handle different message types
  switch (message.type) {
    case 'growth-stats-get':
      (async () => {
        try {
          const stats = await getGrowthStats();
          sendResponse({ success: true, stats });
        } catch (error) {
          console.error('Failed to get growth stats:', error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'growth-stats-increment-successful-copy':
      (async () => {
        try {
          const isPromptUsed = message.isPromptUsed === true;
          const reuseSource = isReuseEntrySource(message.reuseSource) ? message.reuseSource : undefined;
          const quickPromptSlot = isReuseEntrySlot(message.quickPromptSlot)
            ? message.quickPromptSlot
            : undefined;
          const stats = await incrementSuccessfulCopyCount({
            isPromptUsed,
            reuseSource,
            quickPromptSlot
          });
          sendResponse({ success: true, stats });
        } catch (error) {
          console.error('Failed to increment successfulCopyCount:', error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'growth-stats-mark-rating-prompt-shown':
      (async () => {
        try {
          const shownAt = typeof message.shownAt === 'number' ? message.shownAt : Date.now();
          const stats = await markRatingPromptShown(shownAt);
          sendResponse({ success: true, stats });
        } catch (error) {
          console.error('Failed to mark rating prompt shown:', error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'growth-stats-set-rating-prompt-action':
      (async () => {
        try {
          const action = message.action as RatingPromptAction;
          if (action !== 'rate' && action !== 'later' && action !== 'never') {
            sendResponse({
              success: false,
              error: chrome.i18n.getMessage('unknownMessageType') || 'Unknown message type'
            });
            return;
          }

          const actionAt = typeof message.actionAt === 'number' ? message.actionAt : Date.now();
          const stats = await setRatingPromptAction(action, actionAt);
          sendResponse({ success: true, stats });
        } catch (error) {
          console.error('Failed to set rating prompt action:', error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'copy-to-clipboard':
      {
        const { text, isShiftPressed } = message;
        
        // Forward the message to the content script in the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          if (tabs[0] && tabs[0].id) {
            let textToSend: string;
            const actionAt = Date.now();
            let appendAudit: ReturnType<typeof buildAppendSessionAudit> | null = null;
            
            if (isShiftPressed) {
              if (clipboardStack.length === 0) {
                await clearAppendSessionState(actionAt, 'single_copy');
              }
              // Append mode: add to clipboard stack and combine with existing content
              clipboardStack.push(text);
              chrome.action.setBadgeText({ text: clipboardStack.length.toString() });
              textToSend = clipboardStack.join('\n\n---\n\n');
              appendAudit = buildAppendSessionAudit(await recordAppendSessionClip(actionAt));
            } else {
              // Normal mode: clear the stack and copy just the current text
              await clearAppendSessionState(actionAt, 'single_copy');
              clipboardStack = [text];
              chrome.action.setBadgeText({ text: '' });
              textToSend = text;
            }
            
            const result = await sendCopyActionMessage(tabs[0].id, {
              type: 'copy-to-clipboard-from-background',
              text: textToSend
            });
            if (result.success && isShiftPressed && appendAudit) {
              sendResponse({
                ...result,
                action: 'appended',
                appendSession: appendAudit
              });
              return;
            }

            sendResponse({
              ...result,
              action: isShiftPressed ? 'appended' : 'copied'
            });
          } else {
            console.error('No active tab found to send the message to.');
            sendResponse(
              createCopyActionFailure(
                'NO_ACTIVE_TAB',
                getCopyActionMessage('copyErrorNoActiveTab')
              )
            );
          }
        });
        return true; // Indicate that the response is asynchronous
      }

    case 'clear-append-session':
      (async () => {
        try {
          clipboardStack = [];
          await chrome.action.setBadgeText({ text: '' });
          const state = await clearAppendSessionState(
            typeof message.clearedAt === 'number' ? message.clearedAt : Date.now(),
            'clear'
          );
          sendResponse({ success: true, state });
        } catch (error) {
          console.error('Failed to clear append session:', error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      return true;

    case 'ping':
      sendResponse({ success: true, message: 'pong' });
      break;

    case 'update-context-menu':
      (async () => {
        try {
          await updateContextMenu();
          sendResponse({ success: true });
        } catch (error) {
          console.error('Failed to refresh the context menu on request:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      })();
      return true;

    case 'save-settings-patch':
      (async () => {
        try {
          if (!message.settings || typeof message.settings !== 'object' || Array.isArray(message.settings)) {
            throw new Error(chrome.i18n.getMessage('savingFailed'));
          }

          const incoming = message.settings as Partial<Settings>;
          if (Array.isArray(incoming.userPrompts)) {
            await mutateSettings<void>((current) => {
              const currentPrompts = new Map(
                current.userPrompts.map((item) => [item.id, item])
              );
              const userPrompts = incoming.userPrompts!.map((item) => {
                const currentPrompt = currentPrompts.get(item.id);
                if (!currentPrompt) {
                  return { ...item };
                }
                return {
                  ...item,
                  usageCount: Math.max(item.usageCount || 0, currentPrompt.usageCount || 0),
                  lastUsedAt: Math.max(item.lastUsedAt || 0, currentPrompt.lastUsedAt || 0) || undefined
                };
              });
              return {
                patch: { ...incoming, userPrompts },
                result: undefined
              };
            });
          } else {
            await saveSettings(incoming);
          }
          sendResponse({ handled: true, success: true });
        } catch (error) {
          sendResponse({
            handled: true,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      })();
      return true;

    case 'run-quick-action':
      (async () => {
        try {
          const source = isReuseEntrySource(message.source) ? message.source : undefined;
          const command = typeof message.command === 'string' ? message.command : '';
          const slot = getQuickPromptSlotFromCommand(command) || undefined;
          const result = await executeQuickActionCommand(
            command,
            typeof message.tabId === 'number' ? message.tabId : undefined,
            { source, slot }
          );
          sendResponse(result);
        } catch (error) {
          console.error('Failed to run quick action:', error);
          sendResponse(
            createCopyActionFailure(
              'UNKNOWN',
              getCopyActionMessage('copyErrorUnknown')
            )
          );
        }
      })();
      return true;

    case 'update-prompt-usage':
      // 处理从content script发来的使用次数更新请求
      (async () => {
        const { promptId, lastUsedAt } = message;
        try {
          const updated = await mutateSettings<boolean>((current) => {
            const currentPrompt = getActivePrompts(current.userPrompts).find(
              (item: Prompt) => item.id === promptId
            );
            if (!currentPrompt) {
              return { result: false };
            }

            currentPrompt.usageCount = (currentPrompt.usageCount || 0) + 1;
            currentPrompt.lastUsedAt = lastUsedAt;
            return {
              patch: { userPrompts: current.userPrompts },
              result: true
            };
          });
          if (updated) {
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: chrome.i18n.getMessage('promptNotFound') || 'Prompt not found' });
          }
        } catch (error) {
          console.error('Failed to save prompt usage update:', error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:reset-state':
      (async () => {
        try {
          await resetE2EState();
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:seed-sync-storage':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          await chrome.storage.sync.set(message.data || {});
          await updateContextMenu();
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:seed-local-storage':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          await chrome.storage.local.set(message.data || {});
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:get-storage-snapshot':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          const [sync, local] = await Promise.all([chrome.storage.sync.get(null), chrome.storage.local.get(null)]);
          sendResponse({ success: true, sync, local });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:get-context-menu-items':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          sendResponse({
            success: true,
            items: e2eContextMenuSnapshot.map((item) => ({
              id: item.id,
              title: item.title,
              parentId: item.parentId,
              contexts: [...item.contexts]
            }))
          });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:report-copied-text':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          await setE2ELastCopiedText(typeof message.text === 'string' ? message.text : '');
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:clear-last-copied-text':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          await setE2ELastCopiedText('');
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:get-last-copied-text':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          const text = await getE2ELastCopiedText();
          sendResponse({ success: true, text });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:report-opened-url':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          await reportE2EOpenedUrl(typeof message.url === 'string' ? message.url : '');
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:get-opened-urls':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          const urls = await getE2EOpenedUrls();
          sendResponse({ success: true, urls });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:open-popup':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          await openPopupForTab(typeof message.tabId === 'number' ? message.tabId : undefined);
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:invoke-context-menu':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          const result = await invokeContextMenuFromBridge(
            message as { tabId?: number; info: Partial<chrome.contextMenus.OnClickData> }
          );
          sendResponse(result);
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:get-popup-tab-id':
      sendResponse({ success: true, tabId: e2ePopupTabId });
      break;

    case 'e2e:get-active-tab-id':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
          const tab = tabs[0] || null;
          sendResponse({ success: true, tabId: tab?.id ?? null });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:get-badge-text':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          const text = await chrome.action.getBadgeText({});
          sendResponse({ success: true, text });
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'e2e:trigger-command':
      (async () => {
        try {
          if (!isE2EBuild) throw new Error(chrome.i18n.getMessage('e2eBridgeUnavailable'));
          const result = await executeQuickActionCommand(
            typeof message.command === 'string' ? message.command : '',
            typeof message.tabId === 'number' ? message.tabId : undefined
          );
          sendResponse(result);
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'error-report':
      // Future: handle error reporting
      console.error('Error reported from content script:', message.error);
      sendResponse({ success: true });
      break;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: chrome.i18n.getMessage('unknownMessageType') || 'Unknown message type' });
  }

  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Handle storage changes for cross-device sync
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.copilot_settings && namespace === 'sync') {
    console.debug('Settings synced from another device, rebuilding context menu...');
    void updateContextMenu().catch((error) => {
      console.error('Failed to rebuild the context menu after settings changed:', error);
    });
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const result = await handleContextMenuClick(info, tab);
  if (!result.success) {
    console.warn('Copylot context-menu action did not complete:', result.code, result.error);
  }
});

// Performance monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  // Monitor performance and log any issues
  let performanceBuffer: unknown[] = [];

  setInterval(() => {
    if (performanceBuffer.length > 0) {
      console.debug('Performance metrics:', performanceBuffer);
      performanceBuffer = [];
    }
  }, 30000); // Log every 30 seconds
}

console.log('AI Copilot background script loaded');
