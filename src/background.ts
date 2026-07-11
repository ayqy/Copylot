import { getActivePrompts, getSettings, saveSettings, type Prompt, type ChatService } from './shared/settings-manager';
import { buildPromptContextMenuItems } from './shared/context-menu-model';
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

async function updateContextMenu() {
  try {
    e2eContextMenuSnapshot = [];
    // 完全清除所有菜单项
    await chrome.contextMenus.removeAll();
    
    // 等待一小段时间确保清除完成
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create the main "Convert Page" item
    chrome.contextMenus.create({
      id: 'convert-page-to-ai-friendly-format',
      title: chrome.i18n.getMessage('convertPage') || 'Copy to AI',
      contexts: ['page']
    });
    e2eContextMenuSnapshot.push({
      id: 'convert-page-to-ai-friendly-format',
      title: chrome.i18n.getMessage('convertPage') || 'Copy to AI',
      contexts: ['page']
    });

    const { userPrompts } = await getSettings();
    const activePrompts = getActivePrompts(userPrompts);

    if (activePrompts.length > 0) {
      buildPromptContextMenuItems({
        prompts: activePrompts
      }).forEach((item) => {
        try {
          const createProperties: chrome.contextMenus.CreateProperties = {
            id: item.id,
            title: item.title,
            contexts: item.contexts
          };
          if (item.parentId) {
            createProperties.parentId = item.parentId;
          }

          chrome.contextMenus.create(createProperties);
          e2eContextMenuSnapshot.push({
            id: item.id,
            title: item.title,
            parentId: item.parentId,
            contexts: [...item.contexts]
          });
        } catch (error) {
          console.warn(`Failed to create menu item for prompt ${item.id}:`, error);
        }
      });
    }
  } catch (error) {
    console.error('Error updating context menu:', error);
  }
}

let clipboardStack: string[] = [];

async function handleConvertPageContextMenu(tabId: number) {
  return chrome.tabs.sendMessage(tabId, {
    type: 'CONVERT_PAGE_WITH_SELECTION'
  });
}

async function runPromptAction(
  tabId: number,
  promptId: string,
  selectionText?: string,
  audit?: { source?: ReuseEntrySource; slot?: ReuseEntrySlot }
) {
  const settings = await getSettings();
  const prompt = getActivePrompts(settings.userPrompts).find((item: Prompt) => item.id === promptId);
  if (!prompt) {
    return;
  }

  prompt.usageCount = (prompt.usageCount || 0) + 1;
  prompt.lastUsedAt = Date.now();

  try {
    await saveSettings({ userPrompts: settings.userPrompts });
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
      return chrome.tabs.sendMessage(tabId, {
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

  return chrome.tabs.sendMessage(tabId, {
    type: 'PROCESS_SELECTION_OR_PAGE_WITH_PROMPT',
    promptTemplate: prompt.template,
    selectionText: normalizedSelection,
    auditSource: audit?.source,
    quickPromptSlot: audit?.slot
  });
}

async function handleContextMenuClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
  if (!tab?.id) {
    return;
  }

  if (info.menuItemId === 'convert-page-to-ai-friendly-format') {
    await handleConvertPageContextMenu(tab.id);
    return;
  }

  const settings = await getSettings();
  const promptExists = getActivePrompts(settings.userPrompts).some((prompt) => prompt.id === info.menuItemId);
  if (promptExists) {
    await runPromptAction(tab.id, String(info.menuItemId), typeof info.selectionText === 'string' ? info.selectionText : undefined);
  }
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

async function invokeContextMenuFromBridge(message: { tabId?: number; info: Partial<chrome.contextMenus.OnClickData> }) {
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

  await handleContextMenuClick(clickInfo, tab);
}

async function executeQuickActionCommand(
  command: string,
  explicitTabId?: number,
  audit?: { source?: ReuseEntrySource; slot?: ReuseEntrySlot }
) {
  let tab: chrome.tabs.Tab | null = null;

  if (typeof explicitTabId === 'number') {
    tab = await chrome.tabs.get(explicitTabId);
  } else {
    const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    tab = activeTabs[0] || null;
  }

  if (!tab?.id) {
    throw new Error(chrome.i18n.getMessage('noActiveTabFound') || 'No active tab found.');
  }

  if (command === QUICK_CONVERT_COMMAND) {
    await handleConvertPageContextMenu(tab.id);
    return;
  }

  const slot = getQuickPromptSlotFromCommand(command);
  if (!slot) {
    throw new Error(chrome.i18n.getMessage('unknownMessageType') || 'Unknown message type');
  }

  const settings = await getSettings();
  const prompt = getQuickPromptBySlot(getActivePrompts(settings.userPrompts), slot);
  if (!prompt) {
    throw new Error(chrome.i18n.getMessage('promptNotFound') || 'Prompt not found');
  }

  await runPromptAction(tab.id, prompt.id, undefined, {
    source: audit?.source,
    slot: audit?.slot ?? slot
  });
}

chrome.commands?.onCommand.addListener((command) => {
  void executeQuickActionCommand(command).catch((error) => {
    console.error('Failed to execute command:', command, error);
  });
});

// Extension lifecycle events
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('AI Copilot extension installed/updated:', details.reason);
  await updateContextMenu();

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
  await updateContextMenu();
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
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            let textToSend: string;
            
            if (isShiftPressed) {
              // Append mode: add to clipboard stack and combine with existing content
              clipboardStack.push(text);
              chrome.action.setBadgeText({ text: clipboardStack.length.toString() });
              textToSend = clipboardStack.join('\n\n---\n\n');
            } else {
              // Normal mode: clear the stack and copy just the current text
              clipboardStack = [text];
              chrome.action.setBadgeText({ text: '' });
              textToSend = text;
            }
            
            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                type: 'copy-to-clipboard-from-background',
                text: textToSend
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.warn('Could not send message to content script:', chrome.runtime.lastError.message);
                  sendResponse({ success: true, warning: chrome.i18n.getMessage('contentScriptUnavailable') || 'Content script not available.' });
                } else {
                  sendResponse({ 
                    success: response.success, 
                    action: isShiftPressed ? 'appended' : 'copied',
                    error: response.error 
                  });
                }
              }
            );
          } else {
            console.error('No active tab found to send the message to.');
            sendResponse({ success: false, error: chrome.i18n.getMessage('noActiveTabFound') || 'No active tab found.' });
          }
        });
        return true; // Indicate that the response is asynchronous
      }

    case 'ping':
      sendResponse({ success: true, message: 'pong' });
      break;

    case 'update-context-menu':
      updateContextMenu();
      sendResponse({ success: true });
      break;

    case 'run-quick-action':
      (async () => {
        try {
          const source = isReuseEntrySource(message.source) ? message.source : undefined;
          const command = typeof message.command === 'string' ? message.command : '';
          const slot = getQuickPromptSlotFromCommand(command) || undefined;
          await executeQuickActionCommand(
            command,
            typeof message.tabId === 'number' ? message.tabId : undefined,
            { source, slot }
          );
          sendResponse({ success: true });
        } catch (error) {
          console.error('Failed to run quick action:', error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      break;

    case 'update-prompt-usage':
      // 处理从content script发来的使用次数更新请求
      (async () => {
        const { promptId, usageCount, lastUsedAt } = message;
        try {
          const settings = await getSettings();
          const prompt = getActivePrompts(settings.userPrompts).find((p: Prompt) => p.id === promptId);
          if (prompt) {
            prompt.usageCount = usageCount;
            prompt.lastUsedAt = lastUsedAt;
            await saveSettings({ userPrompts: settings.userPrompts });
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

    case 'clear-clipboard-stack':
      clipboardStack = [];
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ success: true });
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
          await invokeContextMenuFromBridge(message as { tabId?: number; info: Partial<chrome.contextMenus.OnClickData> });
          sendResponse({ success: true });
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
          await executeQuickActionCommand(
            typeof message.command === 'string' ? message.command : '',
            typeof message.tabId === 'number' ? message.tabId : undefined
          );
          sendResponse({ success: true });
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
    updateContextMenu();
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  await handleContextMenuClick(info, tab);
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
