import { getSettings } from './shared/settings-manager';

// Extension lifecycle events
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('AI Copilot extension installed/updated:', details.reason);

  try {
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
