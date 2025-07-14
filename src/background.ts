import { getSettings } from './shared/settings-manager';

// Extension lifecycle events
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('AI Copilot extension installed/updated:', details.reason);

  try {
    // Create context menu for one-click conversion
    chrome.contextMenus.create({
      id: 'convert-page-to-ai-friendly-format',
      title: chrome.i18n.getMessage('convertPage') || 'Convert Page to AI-Friendly Format',
      contexts: ['page']
    });

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
  } catch (error) {
    console.error('Error during extension initialization:', error);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('AI Copilot extension started');
});

// Handle messages from content scripts (for future features)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.debug('Background received message:', message, 'from', sender);

  // Handle different message types
  switch (message.type) {
    case 'copy-to-clipboard':
      {
        const { text } = message;
        // Forward the message to the content script in the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'copy-to-clipboard-from-background',
              text: text
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('Error sending message to content script:', chrome.runtime.lastError.message);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
              } else {
                sendResponse(response);
              }
            });
          } else {
            console.error('No active tab found to send the message to.');
            sendResponse({ success: false, error: 'No active tab found.' });
          }
        });
        return true; // Indicate that the response is asynchronous
      }

    case 'ping':
      sendResponse({ success: true, message: 'pong' });
      break;

    case 'error-report':
      // Future: handle error reporting
      console.error('Error reported from content script:', message.error);
      sendResponse({ success: true });
      break;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Handle storage changes (for debugging)
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.debug('Storage changed:', changes, 'in namespace:', namespace);

  if (changes.copilot_settings) {
    console.debug('Settings updated:', changes.copilot_settings.newValue);
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'convert-page-to-ai-friendly-format' && tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'CONVERT_PAGE'
    });
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
