type DriverRequest =
  | { type: 'ping' }
  | { type: 'reset-state' }
  | { type: 'seed-sync-storage'; data: Record<string, unknown> }
  | { type: 'seed-local-storage'; data: Record<string, unknown> }
  | { type: 'get-storage-snapshot' }
  | { type: 'get-context-menu-items' }
  | { type: 'report-copied-text'; text: string }
  | { type: 'clear-last-copied-text' }
  | { type: 'get-last-copied-text' }
  | { type: 'report-opened-url'; url: string }
  | { type: 'get-opened-urls' }
  | { type: 'open-popup'; tabId?: number }
  | {
      type: 'invoke-context-menu';
      tabId?: number;
      info: {
        menuItemId: string;
        parentMenuItemId?: string;
        selectionText?: string;
        pageUrl?: string;
      };
    }
  | { type: 'get-badge-text' }
  | { type: 'get-popup-tab-id' }
  | { type: 'get-active-tab-id' };

interface DriverResponse {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

async function callBackground(message: Record<string, unknown>): Promise<DriverResponse> {
  const response = (await chrome.runtime.sendMessage(message)) as DriverResponse;
  if (!response?.success) {
    throw new Error(response?.error || chrome.i18n.getMessage('e2eDriverUnknownError'));
  }
  return response;
}

async function runDriverRequest(request: DriverRequest): Promise<DriverResponse> {
  switch (request.type) {
    case 'ping':
      return callBackground({ type: 'ping' });
    case 'reset-state':
      return callBackground({ type: 'e2e:reset-state' });
    case 'seed-sync-storage':
      return callBackground({ type: 'e2e:seed-sync-storage', data: request.data });
    case 'seed-local-storage':
      return callBackground({ type: 'e2e:seed-local-storage', data: request.data });
    case 'get-storage-snapshot':
      return callBackground({ type: 'e2e:get-storage-snapshot' });
    case 'get-context-menu-items':
      return callBackground({ type: 'e2e:get-context-menu-items' });
    case 'report-copied-text':
      return callBackground({ type: 'e2e:report-copied-text', text: request.text });
    case 'clear-last-copied-text':
      return callBackground({ type: 'e2e:clear-last-copied-text' });
    case 'get-last-copied-text':
      return callBackground({ type: 'e2e:get-last-copied-text' });
    case 'report-opened-url':
      return callBackground({ type: 'e2e:report-opened-url', url: request.url });
    case 'get-opened-urls':
      return callBackground({ type: 'e2e:get-opened-urls' });
    case 'open-popup':
      return callBackground({ type: 'e2e:open-popup', tabId: request.tabId });
    case 'invoke-context-menu':
      return callBackground({
        type: 'e2e:invoke-context-menu',
        tabId: request.tabId,
        info: request.info
      });
    case 'get-badge-text':
      return callBackground({ type: 'e2e:get-badge-text' });
    case 'get-popup-tab-id':
      return callBackground({ type: 'e2e:get-popup-tab-id' });
    case 'get-active-tab-id':
      return callBackground({ type: 'e2e:get-active-tab-id' });
    default:
      throw new Error(chrome.i18n.getMessage('e2eDriverUnsupportedRequest'));
  }
}

declare global {
  interface Window {
    copylotE2E: {
      run(request: DriverRequest): Promise<DriverResponse>;
    };
  }
}

window.copylotE2E = {
  run: runDriverRequest
};
