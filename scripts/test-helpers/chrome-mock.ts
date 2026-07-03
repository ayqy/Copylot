import fs from 'node:fs';
import path from 'node:path';

type StorageNamespace = 'sync' | 'local' | 'managed' | 'session';

type StorageChanges = Record<string, { oldValue?: unknown; newValue?: unknown }>;

type StorageChangeListener = (changes: StorageChanges, areaName: StorageNamespace) => void;
type RuntimeMessageListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => void | boolean;

type ChromeLocaleMessage = Readonly<{
  message?: string;
  placeholders?: Record<string, { content?: string }>;
}>;

type ChromeLocaleMessages = Readonly<Record<string, ChromeLocaleMessage>>;

export interface ChromeMockOptions {
  extensionId?: string;
  manifestVersion?: string;
  activeTabId?: number;
  syncData?: Record<string, unknown>;
  localData?: Record<string, unknown>;
  commands?: Array<{ name?: string; shortcut?: string }>;
  uiLanguage?: string;
}

export interface ChromeMockLogs {
  createdTabs: Array<{ url?: string }>;
  queriedTabs: Array<chrome.tabs.QueryInfo>;
  sentTabMessages: Array<{ tabId: number; message: unknown }>;
  runtimeMessages: unknown[];
  openedOptionsPageCount: number;
  badgeText: string[];
  actionPopupOpenCount: number;
  updatedTabs: Array<{ tabId: number; properties: chrome.tabs.UpdateProperties }>;
  updatedWindows: Array<{ windowId: number; updateInfo: chrome.windows.UpdateInfo }>;
  devtoolsSidebarPages: string[];
  devtoolsSelectionChangedListenerCount: number;
  devtoolsEvalExpressions: string[];
}

class StorageAreaMock {
  private data: Map<string, unknown>;
  private readonly areaName: StorageNamespace;
  private readonly emit: (changes: StorageChanges, areaName: StorageNamespace) => void;

  constructor(
    areaName: StorageNamespace,
    initialData: Record<string, unknown>,
    emit: (changes: StorageChanges, areaName: StorageNamespace) => void
  ) {
    this.areaName = areaName;
    this.emit = emit;
    this.data = new Map(Object.entries(initialData));
  }

  async get(
    keys?: string | string[] | Record<string, unknown> | null
  ): Promise<Record<string, unknown>> {
    if (keys == null) {
      return Object.fromEntries(this.data.entries());
    }

    if (typeof keys === 'string') {
      return { [keys]: this.data.get(keys) };
    }

    if (Array.isArray(keys)) {
      return Object.fromEntries(keys.map((key) => [key, this.data.get(key)]));
    }

    const result: Record<string, unknown> = {};
    for (const [key, fallback] of Object.entries(keys)) {
      result[key] = this.data.has(key) ? this.data.get(key) : fallback;
    }
    return result;
  }

  async set(items: Record<string, unknown>): Promise<void> {
    const changes: StorageChanges = {};
    for (const [key, value] of Object.entries(items)) {
      const oldValue = this.data.get(key);
      this.data.set(key, value);
      changes[key] = { oldValue, newValue: value };
    }
    this.emit(changes, this.areaName);
  }

  async remove(keys: string | string[]): Promise<void> {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const changes: StorageChanges = {};
    for (const key of keyList) {
      const oldValue = this.data.get(key);
      this.data.delete(key);
      changes[key] = { oldValue, newValue: undefined };
    }
    this.emit(changes, this.areaName);
  }

  async clear(): Promise<void> {
    const changes: StorageChanges = {};
    for (const [key, oldValue] of this.data.entries()) {
      changes[key] = { oldValue, newValue: undefined };
    }
    this.data.clear();
    this.emit(changes, this.areaName);
  }

  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.data.entries());
  }
}

export interface ChromeMockController {
  chrome: typeof chrome;
  logs: ChromeMockLogs;
  storage: {
    sync: StorageAreaMock;
    local: StorageAreaMock;
  };
  dispatchRuntimeMessage(message: unknown): Promise<unknown[]>;
}

const DEFAULT_I18N_MESSAGES: Record<string, string> = {
  convertButton: 'Copy to AI',
  quickActionSelectionFirst:
    'Selection first. Falls back to the full page when nothing is selected.',
  expandMoreSettings: 'Expand more settings',
  collapseMoreSettings: 'Collapse more settings',
  shortcutSettingsTitle: 'Shortcut Settings',
  openShortcutSettings: 'Go to settings',
  shortcutCurrent: 'Current',
  shortcutRecommended: 'Recommended',
  shortcutCustomize: 'Customizable',
  shortcutNotSet: 'Not set',
  quickPromptSlot1: 'Quick Prompt 1',
  quickPromptSlot2: 'Quick Prompt 2',
  quickPromptSlot3: 'Quick Prompt 3',
  quickPromptSetupSlot1: 'Bind a prompt to quick slot 1 in Options',
  quickPromptSetupSlot2: 'Bind a prompt to quick slot 2 in Options',
  quickPromptSetupSlot3: 'Bind a prompt to quick slot 3 in Options',
  shortcutPromptUnassigned: 'No Prompt Bound',
  managePrompts: 'Manage Prompts',
  copied: 'Copied!'
};

function loadLocaleMessages(locale: string): ChromeLocaleMessages {
  const filePath = path.resolve(process.cwd(), `_locales/${locale}/messages.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ChromeLocaleMessages;
}

function buildLocaleGetMessage(messages: ChromeLocaleMessages) {
  return (key: string, substitutions?: string | string[]) => {
    const entry = messages[key];
    if (!entry?.message) {
      return '';
    }

    const subs = Array.isArray(substitutions)
      ? substitutions
      : substitutions != null
        ? [substitutions]
        : [];
    let text = String(entry.message);

    for (const [name, value] of Object.entries(entry.placeholders ?? {})) {
      const placeholder = String(value?.content ?? '');
      const match = placeholder.match(/^\$(\d+)$/);
      const replacement = match ? String(subs[Number(match[1]) - 1] ?? '') : '';
      text = text.replaceAll(`$${name}$`, replacement);
    }

    return text.replace(/\$(\d+)/g, (_match, index) => String(subs[Number(index) - 1] ?? ''));
  };
}

export function createChromeMock(options: ChromeMockOptions = {}): ChromeMockController {
  const logs: ChromeMockLogs = {
    createdTabs: [],
    queriedTabs: [],
    sentTabMessages: [],
    runtimeMessages: [],
    openedOptionsPageCount: 0,
    badgeText: [],
    actionPopupOpenCount: 0,
    updatedTabs: [],
    updatedWindows: [],
    devtoolsSidebarPages: [],
    devtoolsSelectionChangedListenerCount: 0,
    devtoolsEvalExpressions: []
  };

  const storageListeners = new Set<StorageChangeListener>();
  const runtimeMessageListeners = new Set<RuntimeMessageListener>();
  const devtoolsSelectionChangedListeners = new Set<() => void>();

  const emitStorageChanges = (changes: StorageChanges, areaName: StorageNamespace) => {
    if (Object.keys(changes).length === 0) return;
    for (const listener of storageListeners) {
      listener(changes, areaName);
    }
  };

  const sync = new StorageAreaMock('sync', options.syncData ?? {}, emitStorageChanges);
  const local = new StorageAreaMock('local', options.localData ?? {}, emitStorageChanges);

  const extensionId = options.extensionId ?? 'ehfglnbhoefcdedpkcdnainiifpflbic';
  const manifestVersion =
    options.manifestVersion ??
    JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'manifest.json'), 'utf-8')).version;
  const uiLanguage = options.uiLanguage ?? 'en';
  const localeMessages = loadLocaleMessages(uiLanguage);
  const localeGetMessage = buildLocaleGetMessage(localeMessages);
  const activeTabId = options.activeTabId ?? 101;
  const activeTab: chrome.tabs.Tab = {
    id: activeTabId,
    active: true,
    windowId: 1,
    url: 'https://example.com/'
  } as chrome.tabs.Tab;

  const chromeMock = {
    action: {
      async setBadgeText(details: { text: string }) {
        logs.badgeText.push(details.text);
      },
      async getBadgeText() {
        return logs.badgeText.at(-1) ?? '';
      },
      async openPopup() {
        logs.actionPopupOpenCount += 1;
      }
    },
    contextMenus: {
      create() {
        return undefined;
      },
      async removeAll() {
        return undefined;
      }
    },
    commands: {
      async getAll() {
        return (options.commands ?? [
          { name: 'quick-convert', shortcut: 'Alt+C' },
          { name: 'quick-prompt-slot-1', shortcut: 'Alt+1' },
          { name: 'quick-prompt-slot-2', shortcut: 'Alt+2' },
          { name: 'quick-prompt-slot-3', shortcut: 'Alt+3' }
        ]) as chrome.commands.Command[];
      },
      onCommand: {
        addListener() {
          return undefined;
        },
        removeListener() {
          return undefined;
        }
      }
    },
    i18n: {
      getMessage(key: string, substitutions?: string | string[]) {
        const localizedMessage = localeGetMessage(key, substitutions);
        if (localizedMessage) {
          return localizedMessage;
        }
        if (DEFAULT_I18N_MESSAGES[key]) {
          return DEFAULT_I18N_MESSAGES[key];
        }
        if (Array.isArray(substitutions) && substitutions.length > 0) {
          return `${key}:${substitutions.join('|')}`;
        }
        if (typeof substitutions === 'string') {
          return `${key}:${substitutions}`;
        }
        return key;
      },
      getUILanguage() {
        return uiLanguage;
      }
    },
    devtools: {
      panels: {
        elements: {
          createSidebarPane(
            title: string,
            callback: (sidebar: { setPage(path: string): void }) => void
          ) {
            void title;
            callback({
              setPage(path: string) {
                logs.devtoolsSidebarPages.push(path);
              }
            });
          },
          onSelectionChanged: {
            addListener(listener: () => void) {
              devtoolsSelectionChangedListeners.add(listener);
              logs.devtoolsSelectionChangedListenerCount = devtoolsSelectionChangedListeners.size;
            },
            removeListener(listener: () => void) {
              devtoolsSelectionChangedListeners.delete(listener);
              logs.devtoolsSelectionChangedListenerCount = devtoolsSelectionChangedListeners.size;
            }
          }
        }
      },
      inspectedWindow: {
        eval(expression: string, callback?: (result: unknown, isException: boolean) => void) {
          logs.devtoolsEvalExpressions.push(expression);
          callback?.(
            {
              tagName: 'div',
              attributes: { id: 'inspected-node' },
              innerText: 'Mocked inspected node',
              selectors: {
                xpath: 'id("inspected-node")',
                css: '#inspected-node',
                stable: '#inspected-node'
              },
              children: []
            },
            false
          );
        }
      }
    },
    runtime: {
      id: extensionId,
      lastError: undefined as chrome.runtime.LastError | undefined,
      getManifest() {
        return { version: manifestVersion } as chrome.runtime.Manifest;
      },
      getURL(path: string) {
        return `chrome-extension://${extensionId}/${path}`;
      },
      onInstalled: {
        addListener() {
          return undefined;
        }
      },
      onStartup: {
        addListener() {
          return undefined;
        }
      },
      onMessage: {
        addListener(listener: RuntimeMessageListener) {
          runtimeMessageListeners.add(listener);
        },
        removeListener(listener: RuntimeMessageListener) {
          runtimeMessageListeners.delete(listener);
        }
      },
      async openOptionsPage() {
        logs.openedOptionsPageCount += 1;
      },
      async sendMessage(message: unknown) {
        logs.runtimeMessages.push(message);
        const responses: unknown[] = [];
        for (const listener of runtimeMessageListeners) {
          const maybeAsync = listener(
            message,
            {} as chrome.runtime.MessageSender,
            (response?: unknown) => {
              responses.push(response);
            }
          );
          if (
            maybeAsync &&
            typeof (maybeAsync as unknown as PromiseLike<unknown>).then === 'function'
          ) {
            await maybeAsync;
          }
        }
        return responses.at(-1);
      }
    },
    storage: {
      sync: {
        get: sync.get.bind(sync),
        set: sync.set.bind(sync),
        remove: sync.remove.bind(sync),
        clear: sync.clear.bind(sync)
      },
      local: {
        get: local.get.bind(local),
        set: local.set.bind(local),
        remove: local.remove.bind(local),
        clear: local.clear.bind(local)
      },
      onChanged: {
        addListener(listener: StorageChangeListener) {
          storageListeners.add(listener);
        },
        removeListener(listener: StorageChangeListener) {
          storageListeners.delete(listener);
        }
      }
    },
    windows: {
      async update(windowId: number, updateInfo: chrome.windows.UpdateInfo) {
        logs.updatedWindows.push({ windowId, updateInfo });
        return { id: windowId, focused: updateInfo.focused } as chrome.windows.Window;
      }
    },
    tabs: {
      create(details: { url?: string }, callback?: (tab: chrome.tabs.Tab) => void) {
        logs.createdTabs.push(details);
        const createdTab = { ...activeTab, url: details.url } as chrome.tabs.Tab;
        callback?.(createdTab);
        return Promise.resolve(createdTab);
      },
      query(queryInfo: chrome.tabs.QueryInfo, callback?: (tabs: chrome.tabs.Tab[]) => void) {
        logs.queriedTabs.push(queryInfo);
        const tabs = [{ ...activeTab } as chrome.tabs.Tab];
        callback?.(tabs);
        return Promise.resolve(tabs);
      },
      async get(tabId: number) {
        return { ...activeTab, id: tabId } as chrome.tabs.Tab;
      },
      async update(tabId: number, properties: chrome.tabs.UpdateProperties) {
        logs.updatedTabs.push({ tabId, properties });
        return { ...activeTab, id: tabId, ...properties } as chrome.tabs.Tab;
      },
      sendMessage(
        tabId: number,
        message: unknown,
        callback?: (response: { success: boolean }) => void
      ) {
        logs.sentTabMessages.push({ tabId, message });
        callback?.({ success: true });
        return Promise.resolve({ success: true });
      }
    }
  } as unknown as typeof chrome;

  return {
    chrome: chromeMock,
    logs,
    storage: { sync, local },
    async dispatchRuntimeMessage(message: unknown) {
      const responses: unknown[] = [];
      for (const listener of runtimeMessageListeners) {
        const maybeAsync = listener(
          message,
          {} as chrome.runtime.MessageSender,
          (response?: unknown) => {
            responses.push(response);
          }
        );
        if (
          maybeAsync &&
          typeof (maybeAsync as unknown as PromiseLike<unknown>).then === 'function'
        ) {
          await maybeAsync;
        }
      }
      return responses;
    }
  };
}
