type StorageNamespace = 'sync' | 'local' | 'managed' | 'session';

type StorageChanges = Record<string, { oldValue?: unknown; newValue?: unknown }>;

type StorageChangeListener = (changes: StorageChanges, areaName: StorageNamespace) => void;
type RuntimeMessageListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => void | boolean;

export interface ChromeMockOptions {
  extensionId?: string;
  manifestVersion?: string;
  activeTabId?: number;
  syncData?: Record<string, unknown>;
  localData?: Record<string, unknown>;
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

  async get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>> {
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
  const manifestVersion = options.manifestVersion ?? '1.1.28';
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
    i18n: {
      getMessage(key: string, substitutions?: string | string[]) {
        if (Array.isArray(substitutions) && substitutions.length > 0) {
          return `${key}:${substitutions.join('|')}`;
        }
        if (typeof substitutions === 'string') {
          return `${key}:${substitutions}`;
        }
        return key;
      },
      getUILanguage() {
        return 'en';
      }
    },
    devtools: {
      panels: {
        elements: {
          createSidebarPane(title: string, callback: (sidebar: { setPage(path: string): void }) => void) {
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
          if (maybeAsync && typeof ((maybeAsync as unknown) as PromiseLike<unknown>).then === 'function') {
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
      sendMessage(tabId: number, message: unknown, callback?: (response: { success: boolean }) => void) {
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
        if (maybeAsync && typeof ((maybeAsync as unknown) as PromiseLike<unknown>).then === 'function') {
          await maybeAsync;
        }
      }
      return responses;
    }
  };
}
